---
paths:
  - 'apps/api/**'
---

# 백엔드 코드 컨벤션 (apps/api)

`apps/api`의 프로덕션 코드를 작성하거나 수정할 때는 이 컨벤션을 반드시 따른다.
테스트 코드는 `.claude/rules/backend-testing.md`를 함께 따른다.

좋은 코드란 **비즈니스 규칙이 도메인 객체 안에 있고, 외부 기술을 쉽게 갈아 끼울 수 있는 코드**다.

> 이 규칙은 새로 작성하거나 수정하는 코드에 적용한다. 규칙 이전에 작성된 코드(예: 여러 메서드를 가진 `RoomQueryService`, 서비스 안의 `new Date()`·`Math.random()`)는 작업 범위 밖에서 고치지 않는다.

---

## 1. 디렉토리와 계층

도메인(모듈) 단위로 나누고, 그 안을 계층으로 나눈다.

```
apps/api/src/
├── common/              # 전역 공용 (filter/, middleware/, logger/, ALS, Clock·IdGenerator 등 공용 포트)
├── health/              # 계층이 필요 없는 단순 모듈은 module + controller만 둔다
└── pomodoro/            # 모듈은 src 바로 아래에 둔다 (modules/ 폴더를 만들지 않는다)
    ├── pomodoro.module.ts
    ├── controller/      # Controller
    ├── dto/             # @pomodoro/shared 요청·응답 인터페이스를 구현한 클래스
    ├── service/         # 서비스(유스케이스), 커맨드, 외부 시스템 포트(abstract class)
    ├── repository/      # Repository 포트(abstract class)와 구현, 영속화 매퍼, 외부 API·메일·큐 어댑터
    ├── domain/          # 엔티티, VO, 도메인 서비스
    └── config/          # (필요할 때) 외부 SDK 클라이언트 provider, 부트스트랩 설정 클래스. 예: music/config/s3-client.provider.ts, auth/config/session.config.ts
```

- `config/`의 provider는 SDK 클라이언트를 만들어 DI에 등록하는 일만 한다. 이 클라이언트는 `repository`의 어댑터만 주입받는다.
- `config/`의 부트스트랩 설정 클래스

의존 방향은 **위 → 아래** 한 방향만 허용하고, 모든 계층은 `domain`을 쓸 수 있다.

```
controller → service → repository
    │   └───────────┴──────────┴──→ domain
    └──→ dto
```

- `domain`은 다른 계층을 import하지 않는다. ORM, HTTP, 다른 모듈의 내부 파일도 금지한다. **유일한 예외로 `@nestjs/common`의 내장 HTTP 예외 클래스만 import할 수 있다**(8절). 그 밖의 NestJS 기능(데코레이터, DI 등)은 쓰지 않는다. `@pomodoro/shared`의 타입과 상수(`ROOM_MODE`, `FOCUS_DURATION_SECONDS` 등)는 import할 수 있다.
- `service`는 Repository와 외부 시스템을 구현 클래스가 아니라 **포트(abstract class)**로 주입받는다(3절).
- `repository`는 `repository`에 정의된 Repository 포트와 `service`에 정의된 외부 시스템 포트를 **구현**한다.
- `controller`는 `repository`에 접근하지 않고 항상 `service`를 거친다.
- `dto`는 `controller`만 쓴다. `service`와 `repository`는 `dto`를 import하지 않는다(6절).
- 다른 모듈의 기능이 필요하면 그 모듈이 `exports`한 서비스를 주입받는다. 다른 모듈의 `domain`이나 `repository` 파일을 직접 import하지 않는다.

## 2. SOLID

| 원칙                  | 이 프로젝트에서의 적용                                                                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **S** 단일 책임       | 클래스가 바뀌는 이유는 하나여야 한다. 서비스 클래스 하나에는 **유스케이스 하나만** 둔다(`CreateOrderService`, `CancelOrderService`). 생성 로직이 바뀌어도 취소 서비스는 바뀌지 않아야 한다(6절). |
| **O** 개방-폐쇄       | 결제 수단, 할인 정책처럼 종류가 늘어날 것은 `if/switch`를 덧붙이지 않고 인터페이스와 구현체를 추가하는 방식으로 확장한다.                                                                        |
| **L** 리스코프 치환   | 구현체는 인터페이스의 계약(입력 조건, 반환, 예외)을 그대로 지킨다. 특정 구현체만 지원하지 않는 메서드(`throw new Error('not supported')`)를 만들지 않는다.                                       |
| **I** 인터페이스 분리 | 쓰지 않는 메서드에 의존하지 않도록 인터페이스를 작게 나눈다. 예: `OrderReader`와 `OrderWriter`를 분리                                                                                            |
| **D** 의존 역전       | 서비스와 도메인은 구현체가 아니라 인터페이스에 의존한다(3절).                                                                                                                                    |

## 3. 외부 모듈은 인터페이스로 감싼다

DB, 외부 API, 메일, 메시지 큐, 파일 저장소, 시각·난수 등 **우리가 통제하지 않는 것**은 사용하는 쪽에 포트를 정의하고, 구현체(어댑터)는 `repository`에 둔다. Repository 포트는 `repository`에, 외부 시스템 포트는 `service`에 정의한다.

- 포트 이름은 **역할**로 짓는다(`RoomRepository`, `MailSender`). 기술 이름은 구현체에만 쓴다(`InMemoryRoomRepository`, `SesMailSender`).
- 포트의 메서드·타입에 외부 라이브러리 타입이 드러나지 않게 한다. 라이브러리 응답은 어댑터 안에서 우리 타입으로 바꾼다.
- 포트는 **`abstract class` + `abstract` 메서드**로 선언한다. 클래스는 런타임에 남으므로 그 자체가 DI 토큰이 된다. `Symbol` 토큰과 `@Inject(토큰)`은 쓰지 않는다(기존 `RoomRepository`, `MusicRepository` 방식).
- 구현체는 포트를 `extends`하고, 모듈에서 `{ provide: 포트, useClass: 구현체 }`로 등록한다.
- 테스트에서는 고정값 구현으로 교체한다(backend-testing 5절).

```ts
// service/payment-gateway.ts
export abstract class PaymentGateway {
  abstract approve(command: PaymentApproveCommand): Promise<PaymentResult>;
}

// repository/toss.payment-gateway.ts
@Injectable()
export class TossPaymentGateway extends PaymentGateway {
  async approve(command: PaymentApproveCommand): Promise<PaymentResult> {
    const response = await this.tossClient.confirm(/* ... */);
    return PaymentResult.from(response); // 외부 타입 → 우리 타입
  }
}

// pomodoro.module.ts
providers: [{ provide: PaymentGateway, useClass: TossPaymentGateway }]

// service/pay-order.service.ts
constructor(private readonly paymentGateway: PaymentGateway) {}
```

## 4. 객체 생성: 생성자 대신 정적 팩터리 메서드

도메인 객체(엔티티, VO, 도메인 이벤트)와 DTO는 생성자를 `private`(상속이 필요하면 `protected`)으로 막고, **이름 있는 정적 팩터리 메서드**로만 만든다.

| 메서드         | 용도                                                                                            | 검증하는 도메인 규칙                                  |
| -------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `create(...)`  | **새로** 만든다. 초기 상태(상태값, 생성 시각 등)를 객체가 정한다.                               | 생성 시점 규칙 + 불변식                               |
| `of(...)`      | 모든 값을 받아 **주어진 상태 그대로** 조립한다. VO 생성(`Money.of(1000)`), `create` 내부의 조립 | 불변식                                                |
| `from(source)` | **다른 타입에서 변환**한다. 엔티티 → 응답 DTO, 외부 응답 → 우리 타입                            | 결과가 도메인 객체면 내부에서 `of`를 거쳐 불변식 검증 |
| `restore(...)` | 저장된 상태를 **검증 없이** 되살린다. DB에서 읽은 객체 복원, 테스트의 given 준비 전용           | 없음                                                  |

`of`도 도메인 규칙을 검증한다. 차이는 **어떤 규칙을 검증하느냐**이다.

- **불변식**: 객체가 어떤 상태든 항상 참이어야 하는 규칙. 예: 금액은 음수일 수 없다, 주문 상품은 1개 이상이다, 배송 중인 주문에는 배송지가 있다. `of`와 `create` 모두 검증한다.
- **생성 시점 규칙**: 새로 만드는 순간에만 따지는 규칙. 예: 영업시간에만 주문을 생성할 수 있다, 1인당 쿠폰은 하나만 발급된다. `create`에서만 검증한다. `of`는 이미 정해진 상태를 조립하는 용도이므로 생성 시점 규칙을 두지 않는다.
- 중복을 막기 위해 `create`는 생성 시점 규칙을 검사한 뒤 초기 상태를 정해 `of`를 호출한다. 불변식 검증은 `of` 한 곳에만 둔다.

`restore`는 도메인 규칙을 **하나도 실행하지 않는다**.

- DB의 데이터는 저장할 때 이미 검증되었다. 규칙이 바뀐 뒤에도 과거 데이터를 읽을 수 있어야 하고, 영업시간 밖에 어제 주문을 읽는 것처럼 복원 시점에 규칙이 걸리면 안 된다.
- 테스트의 given이 도메인 로직을 실행하지 않아야 실패 원인이 given인지 when인지 구분된다(backend-testing 6절).
- 검증을 건너뛰는 경로이므로 **`repository`(영속화 매퍼)와 테스트 코드에서만** 호출한다. `domain`, `service`, `controller`에서 호출하지 않는다.
- 엔티티뿐 아니라 테스트 given에서 만들어야 하는 VO에도 `restore`를 둔다.

- 인자가 3개를 넘으면 객체 하나(`props`)로 받는다.
- 현재 시각, ID처럼 실행 시점에 따라 달라지는 값은 팩터리의 인자로 받는다. 팩터리 안에서 `new Date()`나 `randomUUID()`를 호출하지 않는다.
- **예외**: 요청 DTO는 ValidationPipe가 요청 본문으로 생성하므로 팩터리 메서드를 두지 않는다. NestJS DI가 생성하는 클래스(Controller, Service, Repository 구현체, 어댑터)는 생성자 주입을 쓴다. 이 클래스들을 직접 `new` 하지 않는다. NestJS 내장 예외는 `new`로 생성한다.

## 5. 객체지향: 풍부한 도메인 모델

- **비즈니스 규칙은 도메인 객체 안에 둔다.** 서비스는 객체를 불러오고, 도메인 메서드를 호출하고, 저장하는 흐름만 조율한다.
- **묻지 말고 시킨다.** 상태를 꺼내 바깥에서 판단하지 않고 객체에게 행위를 요청한다.

  ```ts
  // ❌ 서비스가 상태를 꺼내 판단하고 바꾼다
  if (order.status === OrderStatus.PAID) order.status = OrderStatus.CANCELED;

  // ✅ 판단과 변경은 객체가 한다
  order.cancel();
  ```

- **public setter를 두지 않는다.** 상태 변경은 의도가 드러나는 메서드(`cancel`, `changeAddress`)로만 한다. 필드는 `private`이나 `readonly`로 막고, 읽기가 필요하면 getter를 둔다.
- **원시값을 포장한다.** 규칙이 있는 값(금액, 이메일, 수량)은 VO로 만든다. VO는 불변형태이다.
- **일급 컬렉션**: 컬렉션에 규칙(합계, 중복 금지, 최대 개수)이 있으면 전용 클래스로 감싼다(`OrderItems`).
- 상속보다 조합을 쓴다. 상속은 진짜 is-a 관계일 때 쓴다.
- 여러 엔티티에 걸친 규칙처럼 한 엔티티에 두기 어색한 규칙은 도메인 서비스(`domain/` 안, 내장 예외 외 Nest 의존 없음)에 둔다.

## 6. 서비스

- **서비스 클래스 하나 = 유스케이스 하나.** 한 클래스에 생성·수정·삭제·조회를 함께 두지 않는다. `OrderService`처럼 대상 이름만 붙인 서비스를 만들지 않는다.
  - 클래스 이름은 `동작 + 대상 + Service`로 비즈니스 행위를 드러낸다(`CreateOrderService`, `CancelOrderService`, `SearchOrdersService`). 파일은 `create-order.service.ts`. 동사는 아래 **유스케이스 동사** 규칙을 따른다.
  - public 메서드는 하나만 두고, 이름은 클래스명의 유스케이스 동사로 짓는다(`CancelOrderService.cancelOrder`). `execute`, `run`, `handle`처럼 무엇을 하는지 드러나지 않는 이름은 쓰지 않는다. 흐름을 나누는 private 메서드는 둘 수 있다.
  - 생성자 주입은 그 유스케이스가 실제로 쓰는 의존성만 받는다.
  - 여러 유스케이스가 같은 조회·검증을 반복하면 서비스끼리 호출해라. (`RoomQueryService.findExistingRoom`)

### 유스케이스 동사

이름만 보고 **무슨 행위인지, 무엇을 반환하는지, 없으면 어떻게 되는지** 알 수 있어야 한다. 여러 행위를 담는 CRUD 동사(`Get`, `Update`, `Modify`, `Edit`, `Process`, `Handle`, `Manage`)로 뭉뚱그리지 않는다.

- **상태 변경에는 `Update`를 쓰지 않고, 도메인 문서(`docs/domain/<도메인>.md`)의 행위 동사를 쓴다.** 예: `CancelOrder`, `ChangeShippingAddress`, `ConfirmPayment`.
  - 여러 필드를 한꺼번에 받는 "수정" 유스케이스가 생기려 하면, 서로 다른 행위가 섞여 있다는 신호다. 행위별 유스케이스로 나누고 API도 행위별로 나눈다(SRP).
  - 도메인 문서에 없는 행위라면 문서에 행위와 규칙을 먼저 적고 그 용어로 이름을 짓는다.
  - 엔티티 메서드, 요청 DTO, `@pomodoro/shared` 요청 타입, Controller 메서드도 같은 동사를 쓴다(`ChangeShippingAddressService` ↔ `order.changeShippingAddress()` ↔ `ChangeShippingAddressRequest`).

  ```ts
  // ❌ 배송지 규칙이 바뀌어도, 취소 규칙이 바뀌어도 UpdateOrderService가 바뀐다
  //    address?, status? 중 무엇이 오는지 이름으로 알 수 없다
  class UpdateOrderService {
    updateOrder(
      orderId: string,
      changes: { address?: Address; status?: OrderStatus },
    ): Order {}
  }

  // ✅ 행위마다 유스케이스를 나눈다
  class ChangeShippingAddressService {
    changeShippingAddress(orderId: string, address: Address): Order {}
  }
  class CancelOrderService {
    cancelOrder(orderId: string): Order {}
  }
  ```

- 트랜잭션 경계는 서비스 메서드다. Controller나 Repository에서 트랜잭션을 열지 않는다.
- 입력은 Controller의 요청 DTO를 그대로 받지 않고 서비스용 커맨드(`CancelOrderCommand`) 또는 원시값으로 받는다. 서비스가 HTTP 계층을 몰라야 한다.
- 다른 모듈의 Repository를 직접 주입받지 않고 그 모듈의 서비스를 통한다.

## 7. Controller와 DTO

- Controller는 요청 검증, 커맨드 변환, 서비스 호출, 응답 변환만 한다. 비즈니스 분기를 두지 않는다.
- 엔티티를 응답으로 그대로 반환하지 않는다. 항상 응답 DTO(`XxxResponse.from(entity)`)로 바꾼다.
- **DTO의 형태(인터페이스)는 `@pomodoro/shared`에만 정의한다.** web은 이 인터페이스를 그대로 쓴다.
  - 위치: 요청·응답 인터페이스는 `packages/shared/src/dto/request|response/<이름>.dto.ts`, 여러 곳에서 쓰는 모델 타입은 `src/types/<이름>.ts`, 공유 상수는 `src/constants/<이름>.ts`. 새 파일은 `src/index.ts`에서 `export *` 한다.
  - shared 내부 상대 import는 `.js` 확장자를 붙인다(`import type { Timer } from './timer.js'`).
- api는 모듈의 `dto/`에 **shared 인터페이스를 `implements`한 클래스**를 만들어 쓴다. api 안에서 요청·응답 형태를 따로 정의하지 않는다.
  - 요청 DTO: `class-validator` 데코레이터로 검증 규칙을 붙인다. 이름은 `XxxDto`(`CreateOrderDto implements CreateOrderRequest`). `class-validator`·`ValidationPipe`는 아직 설정되어 있지 않으므로, 처음 도입하는 작업에서 설계 문서 `의존성 변경`에 적고 승인받는다.
  - 응답 DTO: 생성자를 막고 `from(entity)`로 만든다. 이름은 `XxxResponse`이며, shared 타입과 이름이 겹치면 shared 쪽을 별칭으로 가져온다. (기존 `RoomDto.fromEntity`는 이 규칙 이전 코드다.)

- 요청 값은 Controller 경계에서 검증한다(ValidationPipe 등). 검증을 통과한 값만 안쪽 계층으로 넘긴다.
- URL은 복수형 명사와 kebab-case를 쓴다(`/orders/:orderId/cancel-requests`).
- 상태 변경 API는 유스케이스와 1:1로 나눈다. 여러 필드를 선택적으로 받는 범용 `PATCH /orders/:id`를 만들지 않는다. 멱등인 행위는 하위 리소스에 `PUT`/`DELETE`를 쓴다(`PUT /orders/:orderId/shipping-address`).

## 8. 예외 처리

- 예외는 **NestJS 내장 HTTP 예외**(`@nestjs/common`)를 모든 계층에서 그대로 던진다. 커스텀 예외 클래스를 만들거나 `DomainException` 같은 공통 부모를 상속하지 않고, status 매핑용 전역 예외 필터도 두지 않는다.
  - 이미 등록된 `common/filter/http-exception-logger.filter.ts`는 **로깅만** 하고 `BaseExceptionFilter`에 처리를 넘기므로 허용된다. 이 필터에 응답 변환이나 status 매핑을 추가하지 않는다.
- `throw new Error('...')`를 쓰지 않는다.
- 상황에 맞는 내장 예외를 고른다.
- `InternalServerErrorException`을 의도적으로 던지지 않는다. 예상하지 못한 오류는 Nest 기본 처리에 맡긴다.
- 예외에는 사람이 읽을 메시지 **문자열**만 넘긴다. 응답 본문은 Nest 기본 형식인 `{ statusCode, message, error }`가 된다. (web에서 본문 타입이 필요해지면 `@pomodoro/shared`에 `ErrorResponse`를 추가한다.) 객체를 넘기면 본문 형식이 바뀌어 이 계약이 깨지므로 넘기지 않는다.

  ```ts
  throw new ConflictException('취소할 수 없는 상태의 주문입니다.');
  ```

- 메시지에 개인정보나 내부 구현 정보(SQL, 스택)를 넣지 않는다.
- 예외를 잡아서 무시하거나 로그만 남기고 삼키지 않는다. 잡았다면 복구하거나 의미 있는 예외로 바꿔 다시 던진다.
- 조회 결과가 없을 때 `null`을 바깥으로 흘리지 않는다. 필수 조회는 `getById`(없으면 `NotFoundException`), 선택 조회는 `findById`(`T | undefined`, 기존 Repository와 같은 방식)로 이름에 드러낸다.

## 9. 설정과 비밀값

- `process.env`를 직접 읽지 않는다. `@nestjs/config`의 `ConfigService`를 주입받아 읽고, 필수 값은 `getOrThrow`를 쓴다(`music/config/s3-client.provider.ts` 참고).
- 비밀값을 코드, 테스트, 픽스처에 하드코딩하지 않는다. `.env.example`에는 더미 값만 둔다.
- 로그에 개인정보, 토큰, 비밀번호를 남기지 않는다

## 10. TypeScript와 네이밍

- `any`를 쓰지 않는다. 근거 없는 `as`, `!`를 쓰지 않는다.
- 바뀌지 않는 필드는 `readonly`로 선언한다.
- 문자열 상수 집합은 `enum` 대신 `as const` 객체와 리터럴 유니온으로 정의한다.
- 타입만 가져올 때는 `import type`을 쓴다. 단, DI에 쓰는 클래스 import는 런타임에 필요하므로 예외다.

| 대상             | 규칙                                          | 예                                                                                                                  |
| ---------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| 파일             | kebab-case + 역할 접미사                      | `create-order.service.ts`, `order.controller.ts`, `create-order.dto.ts`, `order-response.dto.ts`, `order-status.ts` |
| 엔티티 파일      | 대상 + `.entity.ts`                           | `room.entity.ts`, `participant.entity.ts`                                                                           |
| 포트 구현체 파일 | 기술 + `.` + 포트 파일 이름                   | `in-memory.room.repository.ts`, `toss.payment-gateway.ts`                                                           |
| 서비스 클래스    | 동작 + 대상 + `Service`                       | `CreateOrderService`, `CancelOrderService` (❌ `OrderService`, `GetOrdersService`, `UpdateOrderService`, 6절)       |
| 요청 DTO 클래스  | 동작 + 대상 + `Dto`                           | `CreateOrderDto`                                                                                                    |
| 응답 DTO 클래스  | 동적 + 대상 + `Response`                      | `CreateOrderResponse`                                                                                               |
| 클래스           | PascalCase + 역할 접미사                      | `OrderController`, `InMemoryRoomRepository`                                                                         |
| 포트             | 역할 이름의 `abstract class`, `I` 접두사 금지 | `RoomRepository`, `PaymentGateway` (클래스 자체가 DI 토큰)                                                          |
| boolean          | `is`/`has`/`can` 접두사                       | `isCancelable`                                                                                                      |
| 상수             | UPPER_SNAKE_CASE, 단위 포함                   | `MAX_ORDER_ITEMS`, `PAYMENT_TIMEOUT_MS`                                                                             |
