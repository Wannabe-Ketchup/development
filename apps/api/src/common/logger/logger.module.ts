import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// 파일에 저장될 JSON 포맷
const fileFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.json(),
);

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new DailyRotateFile({
          filename: 'logs/wannabe-ketchup-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: fileFormat,
        }),
      ],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
