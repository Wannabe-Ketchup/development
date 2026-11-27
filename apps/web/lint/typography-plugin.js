// 글자 크기는 index.css @theme의 역할 토큰(text-title, text-caption 등)만 쓴다.
// Tailwind 기본 크기는 @theme에서 지워 두어 써도 CSS가 생기지 않고 조용히 무시되므로, 린트에서 막는다.

// text-sm, md:text-2xl 처럼 앞뒤가 다른 클래스 이름에 붙어 있지 않은 것만 잡는다
const DEFAULT_SIZE_PATTERN =
  /(?<![\w-])text-(xs|sm|base|lg|xl|[2-9]xl)(?![\w-])/;
// text-[18px], text-[1.2rem] 같은 임의 크기. text-[#4a4743] 같은 임의 색은 허용한다
const ARBITRARY_SIZE_PATTERN = /(?<![\w-])text-\[\d+(\.\d+)?(px|rem|em)\]/;

function findRawFontSize(text) {
  return (
    text.match(DEFAULT_SIZE_PATTERN)?.[0] ??
    text.match(ARBITRARY_SIZE_PATTERN)?.[0] ??
    null
  );
}

const noRawFontSize = {
  meta: {
    type: 'problem',
    docs: {
      description: '글자 크기는 @theme의 역할 토큰만 쓴다',
    },
    messages: {
      rawFontSize:
        '"{{className}}" 대신 글자 크기 토큰(text-title, text-body-sm, text-caption 등)을 쓰세요. 목록은 apps/web/src/index.css @theme에 있습니다.',
    },
    schema: [],
  },
  create(context) {
    const check = (node, text) => {
      if (typeof text !== 'string') return;
      const className = findRawFontSize(text);
      if (className) {
        context.report({ node, messageId: 'rawFontSize', data: { className } });
      }
    };
    return {
      Literal(node) {
        check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked);
      },
    };
  },
};

export default {
  meta: { name: 'typography' },
  rules: { 'no-raw-font-size': noRawFontSize },
};
