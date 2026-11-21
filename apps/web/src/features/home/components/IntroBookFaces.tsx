// 설명 글의 유일한 출처다. 앱(IntroBook)과 빌드 시 프리렌더가 함께 쓰므로
// 상태·훅·브라우저 API·@squiggle-line을 쓰지 않는다(빌드 시 프리렌더에서 그대로 렌더된다)
import type { ReactNode } from 'react';
import TomatoSvg from '@/assets/tomato.svg?react';
import { BOOK_ARTWORK, STEP_NUMBER_PATH } from '../lib/intro-book-artwork';

export interface IntroBookFace {
  id: string;
  // 왼쪽 면(홀수 쪽)의 제목. 장이 바뀔 때 화면 낭독기로 알리고, 책갈피로 왔을 때 포커스를 둔다
  heading?: string;
  content: ReactNode;
}

// 본문 글꼴(그리운 프롬솔)에 없는 글자("챱")가 있어 제목은 류뚱체로 쓴다
const H2_CLASS_NAME = 'mb-4.5 text-[32px] font-normal font-ongleipryudung';
const P_CLASS_NAME = 'mb-3.5 text-[19px] leading-[1.75] break-keep';
const HIGHLIGHT_CLASS_NAME =
  'bg-[linear-gradient(transparent_58%,rgba(243,102,115,0.35)_58%)] px-0.5';
const CENTER_CLASS_NAME =
  'flex h-full flex-col items-center justify-center text-center';
const FAQ_LIST_CLASS_NAME = 'm-0';
const FAQ_QUESTION_CLASS_NAME =
  "mb-2 text-xl before:text-tomato-body-4 before:content-['Q._']";
const FAQ_ANSWER_CLASS_NAME =
  'mb-7 ml-0 text-lg leading-[1.65] break-keep text-[#4a4743]';
const STEP_ITEM_CLASS_NAME = 'mb-6.5 flex gap-4';
// list-none 목록은 Safari VoiceOver가 목록으로 읽지 않아 ul·ol에 role="list"를 함께 둔다
const FEATURE_LIST_CLASS_NAME = 'm-0 mb-3 list-none p-0';
const FEATURE_ITEM_CLASS_NAME =
  "relative mb-2 pl-4 text-[17px] leading-[1.6] break-keep before:absolute before:top-[0.7em] before:left-0.5 before:size-1.5 before:rounded-full before:bg-tomato-body-4 before:content-['']";
const TOC_ITEM_CLASS_NAME = 'mb-4.5 flex items-baseline gap-2.5 text-[21px]';
const TOC_DOTS_CLASS_NAME =
  '-translate-y-1.25 flex-1 border-b-2 border-dotted border-gray';

const TOC_ITEMS = [
  { title: '뽀모도로란?', page: 3, chipClassName: 'bg-tomato-body-1' },
  { title: '혼자도 함께도', page: 5, chipClassName: 'bg-tomato-body-2' },
  { title: '사용법', page: 7, chipClassName: 'bg-tomato-body-3' },
  { title: '자주 묻는 질문', page: 9, chipClassName: 'bg-tomato-body-4' },
] as const;

const TOMATO_STAGE_CLASS_NAMES = [
  'text-tomato-body-1',
  'text-tomato-body-2',
  'text-tomato-body-3',
  'text-tomato-body-4',
] as const;

interface StepNumberProps {
  number: number;
}

// 손그림 동그라미 안의 단계 번호. 목록 번호는 ol이 읽어 주므로 화면 낭독기에서는 숨긴다
function StepNumber({ number }: StepNumberProps) {
  return (
    <span
      aria-hidden="true"
      className="relative grid size-10 flex-none place-items-center text-xl"
    >
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 54 54"
      >
        <path
          d={STEP_NUMBER_PATH}
          className="fill-tomato-body-2"
          stroke={BOOK_ARTWORK.inkColor}
          strokeWidth="3"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="relative">{number}</span>
    </span>
  );
}

// 길이 10. i번째 면이 i+1쪽이다. 홀수 쪽은 왼쪽 면, 짝수 쪽은 오른쪽 면이다
export const INTRO_BOOK_FACES: readonly IntroBookFace[] = [
  {
    id: 'toc',
    heading: '차례',
    content: (
      <>
        <h2 className={H2_CLASS_NAME}>차례</h2>
        <ul role="list" className="mt-2 list-none p-0">
          {TOC_ITEMS.map((item) => (
            <li key={item.title} className={TOC_ITEM_CLASS_NAME}>
              <span
                aria-hidden="true"
                className={`size-3.5 flex-none translate-y-px rounded-full border-2 border-black ${item.chipClassName}`}
              />
              {item.title}
              <span aria-hidden="true" className={TOC_DOTS_CLASS_NAME} />
              {item.page}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: 'intro',
    content: (
      <div className={CENTER_CLASS_NAME}>
        <TomatoSvg
          aria-hidden="true"
          className="mb-5.5 h-auto w-37.5 text-tomato-body-4"
        />
        <h1 className={H2_CLASS_NAME}>
          혼자도 함께도,
          <br />
          뽀모도로 타이머
        </h1>
        <p className={P_CLASS_NAME}>
          가입·설치 없이 브라우저에서 바로 시작해요.
          <br />
          혼자 집중해도, 링크 하나로
          <br />
          친구와 함께해도 좋아요.
        </p>
      </div>
    ),
  },
  {
    id: 'pomodoro',
    heading: '뽀모도로란?',
    content: (
      <>
        <h2 className={H2_CLASS_NAME}>뽀모도로란?</h2>
        <p className={P_CLASS_NAME}>
          뽀모도로 기법은{' '}
          <span className={HIGHLIGHT_CLASS_NAME}>
            25분 집중하고 5분 쉬는 것
          </span>
          을 반복하는 시간 관리법이에요.
        </p>
        <p className={P_CLASS_NAME}>
          이름은 이탈리아어로 '토마토'예요. 토마토 모양 주방 타이머로 시간을
          재던 데서 왔어요.
        </p>
        <p className={P_CLASS_NAME}>
          시간이 정해져 있어서, 미루던 일도 "25분만"이라는 마음으로 시작하기
          쉬워요.
        </p>
        <p className={P_CLASS_NAME}>
          집중한 만큼 꼭 쉬어서, 오래 공부해도 덜 지치고 집중이 오래 가요.
        </p>
      </>
    ),
  },
  {
    id: 'timer',
    content: (
      <>
        <h2 className={H2_CLASS_NAME}>워너비케챱은?</h2>
        <p className={P_CLASS_NAME}>
          이 뽀모도로 공부법을 혼자서도, 친구와 함께도 할 수 있는 온라인
          공부방이에요.
        </p>
        <ul role="list" className={FEATURE_LIST_CLASS_NAME}>
          <li className={FEATURE_ITEM_CLASS_NAME}>
            기본은 집중 25분 + 휴식 5분이 한 회차이고, 4회차 총 120분 동안
            이어져요.
          </li>
          <li className={FEATURE_ITEM_CLASS_NAME}>
            세션이 끝나면 다음 세션이 알아서 시작되고, 바뀔 때마다 소리로 알려
            줘요.
          </li>
          <li className={FEATURE_ITEM_CLASS_NAME}>
            잠깐 멈추고 싶으면 일시정지했다가 이어서 할 수 있어요.
          </li>
          <li className={FEATURE_ITEM_CLASS_NAME}>
            집중과 휴식을 한 바퀴 마칠 때마다 내 토마토가 한 단계씩 익어요.
          </li>
        </ul>
        <div aria-hidden="true" className="flex items-end gap-3.5">
          {TOMATO_STAGE_CLASS_NAMES.map((colorClassName) => (
            <TomatoSvg
              key={colorClassName}
              className={`h-auto w-11 ${colorClassName}`}
            />
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'solo',
    heading: '혼자서도',
    content: (
      <>
        <h2 className={H2_CLASS_NAME}>혼자서도</h2>
        <p className={P_CLASS_NAME}>
          방을 하나 만들면 혼자서도 바로 타이머를 쓸 수 있어요. 혼자 시작한
          방에서도 언제든 원하면 친구를 부를 수 있어요.
        </p>
        <p className={P_CLASS_NAME}>
          친구가 중간에 들어와도 지금 흐르고 있는 타이머를 그대로 같이 봐요.
        </p>
      </>
    ),
  },
  {
    id: 'together',
    content: (
      <>
        <h2 className={H2_CLASS_NAME}>친구와 함께</h2>
        <p className={P_CLASS_NAME}>
          방 링크나{' '}
          <span className={HIGHLIGHT_CLASS_NAME}>초대 코드 6자리</span>를 보내면
          친구가 들어와요. 한 방에{' '}
          <span className={HIGHLIGHT_CLASS_NAME}>최대 4명</span>까지예요.
        </p>
        <p className={P_CLASS_NAME}>
          모두 같은 타이머를 봐요. 누구나 시작하고 멈출 수 있고, 바로 모두에게
          반영돼요.
        </p>
        <p className={P_CLASS_NAME}>
          카메라·마이크 없이, 닉네임과 짧은 상태 메시지로 서로를 확인해요.
        </p>
      </>
    ),
  },
  {
    id: 'how-to-1',
    heading: '사용법',
    content: (
      <>
        <h2 className={H2_CLASS_NAME}>사용법</h2>
        <ol role="list" className="m-0 list-none p-0">
          <li className={STEP_ITEM_CLASS_NAME}>
            <StepNumber number={1} />
            <p className={`${P_CLASS_NAME} m-0`}>
              소파에서 자는 토마토를
              <br />
              테이블로 옮겨요.
            </p>
          </li>
          <li className={STEP_ITEM_CLASS_NAME}>
            <StepNumber number={2} />
            <p className={`${P_CLASS_NAME} m-0`}>
              <b>새로운 방 만들기</b>를 고르거나,
              <br />
              받은 <b>초대 코드</b>를 입력해요.
            </p>
          </li>
          <li className={STEP_ITEM_CLASS_NAME}>
            <StepNumber number={3} />
            <p className={`${P_CLASS_NAME} m-0`}>
              방에서 <b>시작</b>을 누르면
              <br />
              집중 시간(기본 25분)이 시작돼요.
            </p>
          </li>
        </ol>
      </>
    ),
  },
  {
    id: 'how-to-2',
    content: (
      <>
        {/* 왼쪽 면 제목과 줄을 맞추는 빈 자리 */}
        <div aria-hidden="true" className="mb-4.5 h-12" />
        <ol role="list" start={4} className="m-0 list-none p-0">
          <li className={STEP_ITEM_CLASS_NAME}>
            <StepNumber number={4} />
            <p className={`${P_CLASS_NAME} m-0`}>
              함께하고 싶다면 방의 초대 코드를
              <br />
              복사해 친구에게 보내요.
            </p>
          </li>
          <li className={STEP_ITEM_CLASS_NAME}>
            <StepNumber number={5} />
            <p className={`${P_CLASS_NAME} m-0`}>
              <b>수정</b> 버튼으로 닉네임과 상태 메시지를
              <br />
              바꿔요. 오늘 할 일을 나누면
              <br />
              함께한다는 소속감이 생겨요.
            </p>
          </li>
          <li className={STEP_ITEM_CLASS_NAME}>
            <StepNumber number={6} />
            <p className={`${P_CLASS_NAME} m-0`}>
              <b>LP</b>로 음악을 틀고, <b>조명</b>으로
              <br />
              다크·라이트 모드를 바꿔요.
              <br />
              원하는 분위기로 꾸며 보세요.
            </p>
          </li>
        </ol>
      </>
    ),
  },
  {
    id: 'faq-1',
    heading: '자주 묻는 질문',
    content: (
      <>
        <h2 className={H2_CLASS_NAME}>자주 묻는 질문</h2>
        <dl className={FAQ_LIST_CLASS_NAME}>
          <dt className={FAQ_QUESTION_CLASS_NAME}>
            가입이나 설치가 필요한가요?
          </dt>
          <dd className={FAQ_ANSWER_CLASS_NAME}>
            아니요. 브라우저에서 바로 쓰고, 무료예요.
          </dd>
          <dt className={FAQ_QUESTION_CLASS_NAME}>
            몇 명까지 함께할 수 있나요?
          </dt>
          <dd className={FAQ_ANSWER_CLASS_NAME}>한 방에 최대 4명이에요.</dd>
          <dt className={FAQ_QUESTION_CLASS_NAME}>방은 언제 사라지나요?</dt>
          <dd className={FAQ_ANSWER_CLASS_NAME}>
            모두 나가고 30분이 지나면 사라져요.
          </dd>
        </dl>
      </>
    ),
  },
  {
    id: 'faq-2',
    content: (
      <dl className={`${FAQ_LIST_CLASS_NAME} mt-1`}>
        <dt className={FAQ_QUESTION_CLASS_NAME}>
          카메라나 마이크가 필요한가요?
        </dt>
        <dd className={FAQ_ANSWER_CLASS_NAME}>
          아니요. 닉네임과 상태 메시지만 보여요.
        </dd>
        <dt className={FAQ_QUESTION_CLASS_NAME}>시간을 바꿀 수 있나요?</dt>
        <dd className={FAQ_ANSWER_CLASS_NAME}>
          {/* '분 단위'가 두 줄로 갈리지 않게 붙여 쓴다 */}
          네. 타이머를 시작하기 전에 집중·휴식 시간을 분{'\u00a0'}단위로 정할 수
          있어요.
        </dd>
        <dt className={FAQ_QUESTION_CLASS_NAME}>휴대폰에서도 되나요?</dt>
        <dd className={FAQ_ANSWER_CLASS_NAME}>
          지금은 PC나 태블릿 가로 화면에서 이용할 수 있어요.
        </dd>
      </dl>
    ),
  },
];

// 프리렌더용 평면 목록. 면마다 <section>을 하나씩 나열한다
export function IntroBookArticle() {
  return (
    <article aria-label="워너비케챱 사용 설명서">
      {INTRO_BOOK_FACES.map((face) => (
        <section key={face.id}>{face.content}</section>
      ))}
    </article>
  );
}
