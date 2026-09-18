import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // dev 환경이 아닐 때 NestJS 기본 로거를 winston으로 설정
  if (configService.get('NODE_ENV') !== 'dev') {
    app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  }
  await app.listen(configService.get('PORT') ?? 3000);
}
void bootstrap();
