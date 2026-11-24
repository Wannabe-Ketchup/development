import { Injectable, OnModuleInit } from '@nestjs/common';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const FEEDBACK_UPLOAD_DIRECTORY = join(tmpdir(), 'pomodoro-feedback');

// 발송 도중 서버가 죽어 남은 임시 파일을 시작할 때 치운다
@Injectable()
export class FeedbackUploadDirectory implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await rm(FEEDBACK_UPLOAD_DIRECTORY, { recursive: true, force: true });
    await mkdir(FEEDBACK_UPLOAD_DIRECTORY, { recursive: true });
  }
}
