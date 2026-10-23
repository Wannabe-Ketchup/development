---
paths:
  - 'apps/web/**'
---

# 프론트엔드 코드 컨벤션 (apps/web)

`apps/web`의 코드를 작성하거나 수정할 때는 이 컨벤션을 반드시 따른다.

좋은 코드란 **변경하기 쉬운 코드**다. 이를 4가지 기준으로 판단한다.

| 기준        | 질문                                                                         |
| ----------- | ---------------------------------------------------------------------------- |
| 가독성      | 읽는 사람이 한 번에 고려할 맥락이 적은가? 위에서 아래로 자연스럽게 읽히는가? |
| 예측 가능성 | 이름·파라미터·반환 타입만 보고 동작을 예측할 수 있는가?                      |
| 응집도      | 함께 수정되어야 할 코드가 함께 수정되는 구조인가?                            |
| 결합도      | 코드를 수정했을 때 영향 범위가 좁고 예측 가능한가?                           |

---

## 1. 가독성

### 1-1. 같이 실행되지 않는 코드는 분리한다

권한, 상태 등에 따라 **동시에 실행되지 않는 분기**가 한 컴포넌트 안에 섞여 있으면 각 분기를 별도 컴포넌트로 나눈다. 분기는 상위 한 곳에서만 한다.

```tsx
// ❌ useEffect와 JSX 양쪽에 isViewer 분기가 흩어져 있음
function SubmitButton() {
  const isViewer = useRole() === 'viewer';
  useEffect(() => {
    if (isViewer) return;
    showButtonAnimation();
  }, [isViewer]);
  return isViewer ? (
    <TextButton disabled>Submit</TextButton>
  ) : (
    <Button type="submit">Submit</Button>
  );
}

// ✅ 분기는 한 곳, 각 컴포넌트는 하나의 경우만 담당
function SubmitButton() {
  const isViewer = useRole() === 'viewer';
  return isViewer ? <ViewerSubmitButton /> : <AdminSubmitButton />;
}

function ViewerSubmitButton() {
  return <TextButton disabled>Submit</TextButton>;
}

function AdminSubmitButton() {
  useEffect(() => {
    showButtonAnimation();
  }, []);
  return <Button type="submit">Submit</Button>;
}
```

### 1-2. 구현 상세는 이름 있는 단위로 추상화한다

- 화면의 주된 목적과 관계없는 로직(로그인 체크 후 리다이렉트, 권한 가드 등)은 `AuthGuard` 같은 래퍼 컴포넌트나 `withAuthGuard` 같은 HOC로 감싼다.
- 버튼과 그 클릭 로직(확인 다이얼로그, API 호출 등)처럼 **함께 다뤄지는 UI와 로직**은 하나의 컴포넌트(`InviteButton`)로 묶어 서로 가까이 둔다.
- 한 컴포넌트에서 읽는 사람이 추적해야 할 맥락은 6~7개 이내로 유지한다.

### 1-3. 로직 종류가 아니라 책임 단위로 쪼갠다

"페이지의 모든 쿼리 파라미터", "페이지의 모든 상태"처럼 **로직의 종류**로 묶은 거대한 Hook/함수를 만들지 않는다. 책임 하나당 Hook 하나를 만든다.

```ts
// ❌ 책임이 무한히 커지고, cardId만 쓰는 컴포넌트도 dateFrom 변경에 리렌더링됨
export function usePageState() {
  /* cardId, statementId, dateFrom, dateTo, statusList ... */
}

// ✅
export function useCardIdQueryParam() {
  const [cardId, _setCardId] = useQueryParam('cardId', NumberParam);
  const setCardId = useCallback(
    (cardId: number) => {
      _setCardId({ cardId }, 'replaceIn');
    },
    [_setCardId],
  );
  return [cardId ?? undefined, setCardId] as const;
}
```

### 1-4. 복잡한 조건에는 이름을 붙인다

여러 줄에 걸치거나 중첩된 조건은 `is`/`has`/`can`/`should` 접두사를 가진 변수나 함수로 이름 붙인다.

```ts
// ✅
const matchedProducts = products.filter((product) => {
  return product.categories.some((category) => {
    const isSameCategory = category.id === targetCategory.id;
    const isPriceInRange = product.prices.some(
      (price) => minPrice <= price && price <= maxPrice,
    );
    return isSameCategory && isPriceInRange;
  });
});
```

단, `arr.map((x) => x * 2)`처럼 단순하고 한 번만 쓰는 로직에는 굳이 이름을 붙이지 않는다.

### 1-5. 매직 넘버에는 이름을 붙인다

의미가 드러나지 않는 숫자·문자열 리터럴은 `UPPER_SNAKE_CASE` 상수로 선언한다. 단위가 있으면 이름에 포함한다(`_MS`, `_PX`, `_SECONDS`).

```ts
// ❌ await delay(300);
// ✅
const ANIMATION_DELAY_MS = 300;
await delay(ANIMATION_DELAY_MS);
```

### 1-6. 시점 이동을 줄인다

- 단순한 로직을 여러 함수·상수·파일로 쪼개 읽는 사람이 위아래로 오가게 만들지 않는다.
- 권한별 버튼 상태처럼 단순한 정책은 별도 파일의 정책 맵 대신 **컴포넌트 안에서** `switch`로 펼치거나, 컴포넌트 안의 객체 하나로 한눈에 보이게 둔다.
- 추상화는 실제로 복잡도가 있을 때만 도입한다.

### 1-7. 삼항 연산자는 단순하게 쓴다

삼항 연산자를 중첩하지 않는다. 분기가 3개 이상이면 `if` 조기 반환(필요하면 IIFE)이나 별도 함수로 쓴다.

```ts
// ❌
const status = isA && isB ? 'BOTH' : isA || isB ? (isA ? 'A' : 'B') : 'NONE';

// ✅
const status = (() => {
  if (isA && isB) return 'BOTH';
  if (isA) return 'A';
  if (isB) return 'B';
  return 'NONE';
})();
```

JSX 조건부 렌더링도 같다. 중첩 삼항 대신 하위 컴포넌트로 분리하거나 조기 반환한다.

### 1-8. 범위 비교는 왼쪽에서 오른쪽으로 읽히게 쓴다

범위 조건은 수학 부등식처럼 `시작 <= 값 && 값 <= 끝` 순서로 쓴다.

```ts
// ❌ if (score >= 80 && score <= 100)
// ✅ if (80 <= score && score <= 100)
```

---

## 2. 예측 가능성

### 2-1. 이름이 겹치지 않게 관리한다

- 라이브러리나 기존 모듈과 **같은 이름**으로 다르게 동작하는 래퍼를 만들지 않는다.
- 추가 동작이 있으면 이름에 드러낸다. 예: 인증 토큰을 붙이는 래퍼는 `http.get`이 아니라 `httpService.getWithAuth`.

### 2-2. 같은 종류의 함수는 반환 타입을 통일한다

- 서버 상태 Hook은 같은 모양을 반환한다. (현재 React Query는 쓰지 않고 `api/`의 `fetch` 함수를 직접 호출한다. 도입하면 `useXxx` + `useQuery` Hook은 **모두 Query 객체 전체**를 반환한다.) 어떤 Hook은 `data`만, 어떤 Hook은 Query 객체를 반환하는 식으로 섞지 않는다.
- 검증 함수는 모두 같은 결과 타입을 반환한다. 일부만 `boolean`, 일부는 객체로 반환하지 않는다(객체는 항상 truthy라 `if (validate(x))` 버그가 생긴다).
- 성공/실패 결과는 **discriminated union**으로 정의해 컴파일러가 잘못된 접근을 막게 한다.

```ts
type ValidationResult = { ok: true } | { ok: false; reason: string };

function checkIsNameValid(name: string): ValidationResult {
  if (name.length === 0)
    return { ok: false, reason: '이름은 빈 값일 수 없어요.' };
  if (name.length >= 20)
    return { ok: false, reason: '이름은 20자 이상 입력할 수 없어요.' };
  return { ok: true };
}
```

### 2-3. 숨은 로직을 만들지 않는다

함수·컴포넌트는 **이름, 파라미터, 반환 타입으로 드러나는 일만** 한다. 로깅, 토스트, 리다이렉트, 전역 상태 변경 같은 부수 효과를 몰래 끼워 넣지 않고 호출하는 쪽에 드러낸다.

```tsx
// ❌ fetchBalance 내부에서 logging.log('balance_fetched') 호출
// ✅
async function fetchBalance(): Promise<number> {
  return http.get<number>('...');
}

<Button
  onClick={async () => {
    const balance = await fetchBalance();
    logging.log('balance_fetched');
    await syncBalance(balance);
  }}
>
  계좌 잔액 갱신하기
</Button>;
```

---

## 3. 응집도

### 3-1. 함께 수정되는 파일은 같은 디렉토리에 둔다

파일 종류(components, hooks, utils)가 아니라 **도메인 기준**으로 배치한다. 프로젝트 전체에서 쓰는 것만 최상위에 둔다.

```
apps/web/src/
├── api/               # 서버 API 호출 함수 (리소스별 파일: room.ts, timer.ts, sse.ts)
├── assets/            # svg·이미지. svg 컴포넌트는 '@/assets/xxx.svg?react'로 가져온다
├── lib/               # 공용 유틸 (cn.ts 등)
├── components/        # (필요할 때) 여러 feature에서 쓰는 공용 컴포넌트
├── hooks/             # (필요할 때) 여러 feature에서 쓰는 공용 Hook
└── features/
    ├── home/
    │   ├── page.tsx         # 화면 진입점 (default export)
    │   ├── components/
    │   └── hooks/
    └── pomodoro/
        ├── page.tsx
        ├── components/
        ├── hooks/
        └── lib/             # 이 feature 전용 순수 함수 (room-id.ts, seat-layout.ts)
```

- 한 도메인에서만 쓰는 코드는 해당 `features/<도메인>/` 안에 둔다.
- import는 `@/` 별칭(`@/api/room`, `@/lib/cn`)을 쓰고, 같은 feature 안에서는 상대 경로를 써도 된다.
- 다른 도메인 폴더의 내부 파일을 직접 import하지 않는다. 여러 도메인에서 필요해지면 최상위 공용 폴더로 올린다.
- 기능을 삭제할 때 디렉토리 하나만 지우면 되는 구조를 유지한다.

### 3-2. 매직 넘버를 없애 함께 수정될 값을 한곳에 모은다

애니메이션 시간, 페이지 크기, 브레이크포인트처럼 **다른 코드와 함께 바뀌어야 하는 값**은 상수로 선언하고, 그 값을 사용하는 쪽(예: 애니메이션 정의)과 같은 곳에서 관리한다.

### 3-3. 폼은 변경 단위에 맞춰 응집도를 설계한다

(react-hook-form·zod는 아직 의존성에 없다. 폼이 복잡해져 도입할 때 아래 기준을 쓴다.)

| 필드 단위 (`register`의 `validate`)                               | 폼 전체 단위 (zod 스키마 + `zodResolver`)                |
| ----------------------------------------------------------------- | -------------------------------------------------------- |
| 필드가 독립적이거나 비동기 검증이 필요할 때 (아이디 중복 확인 등) | 모든 필드가 하나의 기능을 이룰 때 (결제·배송 정보 등)    |
| 필드를 다른 폼에서 재사용할 때                                    | 단계별(Wizard) 폼일 때                                   |
|                                                                   | 필드끼리 서로 영향을 줄 때 (비밀번호 확인, 총액 계산 등) |

변경이 **필드 단위**로 일어나는지 **폼 전체 단위**로 일어나는지를 기준으로 선택한다.

---

## 4. 결합도

### 4-1. 책임을 하나씩 관리한다

하나의 Hook/컴포넌트/함수가 여러 책임을 지지 않게 한다. 많은 곳이 의존하는 거대한 모듈은 수정 시 영향 범위가 커진다(1-3과 같은 원칙).

### 4-2. 중복 코드를 허용한다

- 비슷해 보이는 코드를 성급하게 공통화하지 않는다.
- 페이지마다 동작(로깅 값, 닫힘 동작, 문구·이미지 등)이 **달라질 여지가 있으면** 중복을 허용한다.
- 동작이 같고 앞으로도 같을 것이 확실할 때만 공통 Hook/컴포넌트로 만든다.
- 공통 코드에 옵션 인자가 계속 늘어난다면 공통화가 잘못되었다는 신호다.

### 4-3. Props Drilling을 없앤다

다음 순서로 해결한다.

1. **의도가 드러나는 props는 그대로 둔다.** 컴포넌트가 실제로 쓰는 값은 props가 맞다.
2. **값을 전달만 하는 중간 컴포넌트가 있으면 조합(Composition) 패턴**으로 `children`을 받아 깊이를 줄인다.
3. 그래도 깊게 전달된다면 **마지막 수단으로 Context API**를 쓴다.

```tsx
// ✅ ItemEditBody는 자신이 쓰는 props만 받고, 리스트는 children으로 받는다
function ItemEditModal({
  open,
  items,
  recommendedItems,
  onConfirm,
  onClose,
}: ItemEditModalProps) {
  const [keyword, setKeyword] = useState('');
  return (
    <Modal open={open} onClose={onClose}>
      <ItemEditBody
        keyword={keyword}
        onKeywordChange={setKeyword}
        onClose={onClose}
      >
        <ItemEditList
          keyword={keyword}
          items={items}
          recommendedItems={recommendedItems}
          onConfirm={onConfirm}
        />
      </ItemEditBody>
    </Modal>
  );
}
```

---

## 5. 기준이 충돌할 때

4가지 기준을 동시에 모두 만족할 수는 없다. 다음 기준으로 판단한다.

- **가독성 vs 응집도**: 함께 수정하지 않으면 **오류가 나는** 코드라면 공통화해서 응집도를 우선한다. 위험이 낮다면 중복을 두고 가독성을 우선한다.
- **결합도 vs 응집도**: 공통화하면 응집도는 오르지만 영향 범위(결합도)도 커진다. 앞으로 각자 다르게 바뀔 가능성이 있으면 중복을 허용한다.
- 판단이 애매하면 현재 상황에서 **장기적으로 변경하기 쉬운 쪽**을 선택하고, 그 이유를 PR 설명에 남긴다.

---

## 6. TypeScript 규칙

- `any`를 쓰지 않는다. 타입을 알 수 없으면 `unknown`을 쓰고 좁혀서 사용한다.
- 컴포넌트 props는 `컴포넌트명Props` 이름의 `interface`/`type`으로 선언한다.
- 상태·결과처럼 경우가 나뉘는 값은 optional 필드 나열 대신 **discriminated union**으로 표현한다.
- 문자열 상수 집합은 `enum` 대신 `as const` 객체 또는 문자열 리터럴 유니온으로 정의한다.
- 타입 단언(`as`)과 non-null 단언(`!`)은 근거가 명확할 때만 쓴다.
- 타입만 가져올 때는 `import type`을 쓴다.
- API 요청/응답 타입처럼 백엔드(`apps/api`)와 공유하는 타입은 `@pomodoro/shared`(`packages/shared`)에 정의하고 거기서 가져온다. web 안에서 중복 정의하지 않는다. (기존 `api/room.ts`의 `JoinRoomResponse`처럼 web에 정의된 타입은 해당 API를 수정할 때 shared로 옮긴다.)

## 7. 네이밍

| 대상                      | 규칙                             | 예                                            |
| ------------------------- | -------------------------------- | --------------------------------------------- |
| 컴포넌트, 타입            | PascalCase                       | `SubmitButton`, `ItemEditModalProps`          |
| 함수, 변수                | camelCase                        | `fetchBalance`, `matchedProducts`             |
| Hook                      | `use` 접두사                     | `useCardIdQueryParam`                         |
| boolean                   | `is`/`has`/`can`/`should` 접두사 | `isViewer`, `canInvite`                       |
| 상수                      | UPPER_SNAKE_CASE, 단위 포함      | `ANIMATION_DELAY_MS`                          |
| 이벤트 핸들러 prop / 구현 | `on*` / `handle*`                | `onConfirm` / `handleConfirm`                 |
| 컴포넌트 파일             | 컴포넌트명과 동일                | `SubmitButton.tsx`, `RoomTimer.tsx`           |
| 화면 진입 파일            | `features/<도메인>/page.tsx`     | `features/pomodoro/page.tsx`                  |
| Hook 파일                 | Hook 이름과 동일 (camelCase)     | `useRoomSSE.ts`, `useMusicPlayer.ts`          |
| 그 밖의 `.ts` 파일        | kebab-case                       | `room-id.ts`, `seat-layout.ts`                |
| API 함수, 서버 상태 Hook  | api 유스케이스와 같은 행위 동사  | `enterRoom`, `cancelOrder` (❌ `updateOrder`) |

## 8. 테스트

- 러너는 Vitest(`globals`, `jsdom`)와 Testing Library다. `pnpm --filter @pomodoro/web test`로 실행한다.
- 테스트 파일은 **대상 파일 옆**에 `<대상>.test.ts(x)`로 둔다(`lib/room-id.ts` → `lib/room-id.test.ts`, `page.tsx` → `page.test.tsx`).
- `lib/`의 순수 함수처럼 판단이 있는 로직을 우선 테스트하고, 컴포넌트는 사용자가 보는 결과(렌더링, 상호작용 후 상태)로 검증한다.
- `describe`·`it`은 한국어 문장으로, 행위와 결과를 함께 쓴다(`쿼리 문자열에 roomId가 없으면 null을 반환한다`). 본문은 가능하면 `// given`, `// when`, `// then`으로 나눈다.
- API·SSE 등 경계는 `vi.mock('@/api/room')`처럼 모듈 단위로 mock한다.
