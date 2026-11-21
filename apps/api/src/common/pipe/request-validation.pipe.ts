import {
  BadRequestException,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';

// 요청 DTO의 class-validator 규칙을 검사한다. 쓰는 엔드포인트의 @Body()에 건다.
// 실패하면 필드별 메시지 배열 대신 문자열 하나로 400을 응답해 다른 예외와 본문 형식을 맞춘다
@Injectable()
export class RequestValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      transform: true,
      exceptionFactory: () =>
        new BadRequestException('요청 형식이 올바르지 않습니다.'),
    });
  }
}
