import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// index.css @theme의 글자 크기 토큰. 알려 주지 않으면 tailwind-merge가 text-title을 글자색으로 여겨
// 함께 쓴 text-gray 같은 색 클래스가 글자 크기를 지운다. index.css의 토큰을 바꾸면 여기도 고친다
const FONT_SIZE_TOKENS = [
  'timer',
  'timer-tablet',
  'timer-mobile',
  'timer-sm',
  'headline',
  'title',
  'title-sm',
  'body-lg',
  'body',
  'body-sm',
  'caption',
  'book-title',
  'book-toc',
  'book-body',
  'book-list',
  'book-caption',
];

// Tailwind v4는 클래스 순서와 상관없이 leading-*를 글자 크기 토큰의 줄 간격보다 나중에 적용한다.
// tailwind-merge 기본값은 글자 크기가 앞의 leading-*를 지우므로 그 충돌을 끈다
const twMerge = extendTailwindMerge({
  extend: { theme: { text: FONT_SIZE_TOKENS } },
  override: { conflictingClassGroups: { 'font-size': [] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
