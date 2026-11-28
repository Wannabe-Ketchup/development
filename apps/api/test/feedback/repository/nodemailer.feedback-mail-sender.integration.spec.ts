import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createServer, type Server, type Socket } from 'net';
import { createTransport } from 'nodemailer';
import { Attachment } from '../../../src/feedback/domain/attachment';
import { Attachments } from '../../../src/feedback/domain/attachments';
import { Feedback } from '../../../src/feedback/domain/feedback.entity';
import { FeedbackContent } from '../../../src/feedback/domain/feedback-content';
import { FeedbackMailTransport } from '../../../src/feedback/config/mail-transport.provider';
import { NodemailerFeedbackMailSender } from '../../../src/feedback/repository/nodemailer.feedback-mail-sender';

const MAIL_ADDRESS = 'feedback-box@example.com';

function createFeedback(): Feedback {
  return Feedback.restore({
    content: FeedbackContent.restore('<b>좋아요</b>\n다음 줄'),
    attachments: Attachments.restore([
      Attachment.restore({
        fileName: '화면.png',
        mimeType: 'image/png',
        path: '/tmp/upload-1',
        size: 1_000,
      }),
    ]),
    ip: '203.0.113.7',
    participantId: 'participant-1',
    userAgent: 'test-agent',
    submittedAt: new Date('2026-11-23T03:00:00.000Z'),
  });
}

function createConfigService(): ConfigService {
  return new ConfigService({ FEEDBACK_MAIL_USER: MAIL_ADDRESS });
}

function createSender(
  sendMail: jest.Mock,
  sendTimeoutMs = 50_000,
): NodemailerFeedbackMailSender {
  return new NodemailerFeedbackMailSender(
    new FeedbackMailTransport({ sendMail }),
    createConfigService(),
    sendTimeoutMs,
  );
}

const CRLF = '\r\n';

function createSlowSmtpServer(deliveryDelayMs: number) {
  const state = { delivered: false, sockets: [] as Socket[] };
  const closed: Promise<void>[] = [];
  const server: Server = createServer((socket) => {
    state.sockets.push(socket);
    closed.push(new Promise((resolve) => socket.on('close', () => resolve())));
    let inData = false;
    let pending = '';
    socket.on('error', () => undefined);
    socket.write(`220 slow.example.com ESMTP${CRLF}`);
    socket.on('data', (chunk) => {
      pending += chunk.toString('latin1');
      if (inData) {
        if (!pending.endsWith(`${CRLF}.${CRLF}`)) return;
        setTimeout(() => {
          if (socket.destroyed) return;
          state.delivered = true;
          socket.write(`250 queued${CRLF}`);
        }, deliveryDelayMs);
        return;
      }
      const command = pending.trim();
      pending = '';
      if (command.startsWith('EHLO')) {
        socket.write(`250 slow.example.com${CRLF}`);
      } else if (command === 'DATA') {
        inData = true;
        socket.write(`354 go${CRLF}`);
      } else {
        socket.write(`250 ok${CRLF}`);
      }
    });
  });
  return {
    state,
    closed,
    listen: () =>
      new Promise<number>((resolve) =>
        server.listen(0, '127.0.0.1', () =>
          resolve((server.address() as { port: number }).port),
        ),
      ),
    stop: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

describe('NodemailerFeedbackMailSender', () => {
  describe('send', () => {
    it('피드백은 고정 제목과 접수 정보·내용을 담은 text 메일로 첨부와 함께 자기 자신에게 발송된다', async () => {
      // given
      const sendMail = jest.fn().mockResolvedValue({});
      const sender = createSender(sendMail);

      // when
      await sender.send(createFeedback());

      // then
      expect(sendMail).toHaveBeenCalledWith({
        from: MAIL_ADDRESS,
        to: MAIL_ADDRESS,
        subject: '[뽀모도로] 사용자 피드백',
        text: [
          '접수 시각: 2026-11-23 12:00:00 (KST)',
          'IP: 203.0.113.7',
          '참여자 ID: participant-1',
          'UA: test-agent',
          '',
          '<b>좋아요</b>\n다음 줄',
        ].join('\n'),
        textEncoding: 'base64',
        signal: expect.any(AbortSignal) as AbortSignal,
        attachments: [
          {
            filename: '화면.png',
            contentType: 'image/png',
            path: '/tmp/upload-1',
          },
        ],
      });
    });

    it('메일 발송에 실패하면 내부 오류 내용 없이 503으로 알린다', async () => {
      // given
      const sendMail = jest.fn().mockRejectedValue(
        Object.assign(new Error('Invalid login'), {
          response: '535 secret-detail',
          command: 'AUTH PLAIN',
        }),
      );
      const sender = createSender(sendMail);

      // when
      const sending = sender.send(createFeedback());

      // then
      await expect(sending).rejects.toThrow(ServiceUnavailableException);
      await expect(sending).rejects.toMatchObject({
        message: '피드백을 보내지 못했습니다.',
      });
    });

    it('발송이 기한을 넘기면 SMTP 연결을 끊고 503으로 알리며 메일은 발송되지 않는다', async () => {
      // given
      const smtp = createSlowSmtpServer(1_000);
      const port = await smtp.listen();
      const transport = createTransport({
        host: '127.0.0.1',
        port,
        secure: false,
        ignoreTLS: true,
        socketCloseTimeout: 0,
      });
      const sender = new NodemailerFeedbackMailSender(
        new FeedbackMailTransport(transport),
        createConfigService(),
        300,
      );
      const feedback = Feedback.restore({
        content: FeedbackContent.restore('내용'),
        attachments: Attachments.restore([]),
        ip: '203.0.113.7',
        participantId: 'participant-1',
        userAgent: 'test-agent',
        submittedAt: new Date('2026-11-23T03:00:00.000Z'),
      });

      try {
        // when
        const sending = sender.send(feedback);

        // then
        await expect(sending).rejects.toThrow(ServiceUnavailableException);
        await Promise.all(smtp.closed);
        await new Promise((resolve) => setTimeout(resolve, 1_300));
        expect(smtp.state.delivered).toBe(false);
      } finally {
        transport.close();
        smtp.state.sockets.forEach((socket) => socket.destroy());
        await smtp.stop();
      }
    });
  });
});
