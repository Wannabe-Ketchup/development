import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // dev 환경이 아닐 때 NestJS 기본 로거를 winston으로 설정
  if (process.env.NODE_ENV !== 'dev') {
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  }
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
