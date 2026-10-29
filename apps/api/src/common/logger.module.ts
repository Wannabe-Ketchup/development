import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { format } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { AsyncLocalStorage } from 'node:async_hooks';
import { AlsModule } from './als.module';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [AlsModule],
      inject: [AsyncLocalStorage],
      useFactory: (als: AsyncLocalStorage<string>) => {
        // 로그에 traceId 필드 추가
        const traceIdFormat = format((log) => {
          const traceId = als.getStore();
          if (traceId) {
            log.traceId = traceId;
          }
          return log;
        });

        // 파일에 저장될 JSON 포맷
        const fileFormat = format.combine(
          traceIdFormat(),
          format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          format.json(),
        );

        return {
          transports: [
            new DailyRotateFile({
              filename: 'logs/wannabe-ketchup-%DATE%.log',
              datePattern: 'YYYY-MM-DD',
              maxSize: '20m',
              maxFiles: '30d',
              format: fileFormat,
            }),
          ],
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
