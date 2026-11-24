import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { HttpLoggerMiddleware } from '../../../src/common/middleware/http-logger.middleware';

function createRequest(participantId?: string): Request {
  return {
    method: 'POST',
    originalUrl: '/feedbacks',
    ip: '203.0.113.7',
    session: participantId ? { participantId } : {},
  } as unknown as Request;
}

function createResponse(): Response {
  return Object.assign(new EventEmitter(), {
    statusCode: 204,
  }) as unknown as Response;
}

describe('HttpLoggerMiddleware', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('use', () => {
    it('세션이 있는 요청은 START 로그에 IP와 참여자 ID가 함께 남는다', () => {
      // given
      const logSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => {});
      const req = createRequest('participant-1');
      const next: NextFunction = jest.fn();

      // when
      new HttpLoggerMiddleware().use(req, createResponse(), next);

      // then
      const expectedStartLog =
        'ip=203.0.113.7 participantId=participant-1 method=POST url=/feedbacks START';
      expect(logSpy).toHaveBeenCalledWith(expectedStartLog);
    });

    it('세션이 없던 요청은 START에 none, 요청 중에 생긴 참여자 ID는 END 로그에 남는다', () => {
      // given
      const logSpy = jest
        .spyOn(Logger.prototype, 'log')
        .mockImplementation(() => {});
      const req = createRequest();
      const res = createResponse();
      new HttpLoggerMiddleware().use(req, res, jest.fn());
      req.session.participantId = 'participant-new';

      // when
      res.emit('finish');

      // then
      const expectedStartLog =
        'ip=203.0.113.7 participantId=none method=POST url=/feedbacks START';
      const expectedEndLogPattern =
        /^participantId=participant-new status=204 duration=\d+ms END$/;
      expect(logSpy).toHaveBeenNthCalledWith(1, expectedStartLog);
      expect(logSpy).toHaveBeenNthCalledWith(
        2,
        expect.stringMatching(expectedEndLogPattern),
      );
    });
  });
});
