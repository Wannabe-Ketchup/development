import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  UploadedFiles,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { open } from 'node:fs/promises';
import {
  FEEDBACK_ATTACHMENT_MAX_COUNT,
  FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES,
  FEEDBACK_ATTACHMENTS_FIELD,
  FEEDBACK_CONTENT_MAX_LENGTH,
} from '@pomodoro/shared';
import { ParticipantId } from '../../auth/decorator/participant-id.decorator';
import { FEEDBACK_UPLOAD_DIRECTORY } from '../config/feedback-upload-directory';
import { ATTACHMENT_HEADER_BYTES } from '../domain/attachment-type';
import { SubmitFeedbackDto } from '../dto/submit-feedback.dto';
import { SubmitFeedbackService } from '../service/submit-feedback.service';
import { AttachmentCountLimitInterceptor } from './attachment-count-limit.interceptor';
import { RemoveUploadedFilesInterceptor } from './remove-uploaded-files.interceptor';

async function readHeader(path: string): Promise<Uint8Array> {
  const file = await open(path, 'r');
  try {
    const buffer = Buffer.alloc(ATTACHMENT_HEADER_BYTES);
    const { bytesRead } = await file.read(buffer, 0, buffer.length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await file.close();
  }
}

// multer가 원본 이름을 latin1로 읽으므로 UTF-8 바이트로 되읽는다
function decodeOriginalName(name: string): string {
  return [...name].every((character) => character.charCodeAt(0) <= 0xff)
    ? Buffer.from(name, 'latin1').toString('utf8')
    : name;
}

@Controller('feedbacks')
export class FeedbackController {
  constructor(private readonly submitFeedbackService: SubmitFeedbackService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(
    AttachmentCountLimitInterceptor,
    FilesInterceptor(
      FEEDBACK_ATTACHMENTS_FIELD,
      FEEDBACK_ATTACHMENT_MAX_COUNT,
      {
        storage: diskStorage({ destination: FEEDBACK_UPLOAD_DIRECTORY }),
        limits: {
          fileSize: FEEDBACK_ATTACHMENT_MAX_TOTAL_BYTES,
          files: FEEDBACK_ATTACHMENT_MAX_COUNT,
          fields: 1,
          fieldSize: FEEDBACK_CONTENT_MAX_LENGTH * 3,
        },
      },
    ),
    RemoveUploadedFilesInterceptor,
  )
  async submitFeedback(
    @Body(new ValidationPipe()) dto: SubmitFeedbackDto,
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Ip() ip: string,
    @ParticipantId() participantId: string,
    @Headers('user-agent') userAgent = '',
  ): Promise<void> {
    const attachments = await Promise.all(
      files.map(async (file) => ({
        originalName: decodeOriginalName(file.originalname),
        header: await readHeader(file.path),
        path: file.path,
        size: file.size,
      })),
    );
    await this.submitFeedbackService.submitFeedback({
      content: dto.content,
      attachments,
      ip,
      participantId,
      userAgent,
    });
  }
}
