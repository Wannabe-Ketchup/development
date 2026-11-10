import { useCallback, useEffect, useRef, useState } from 'react';

export type CopyStatus = 'idle' | 'copied' | 'failed';

const COPY_FEEDBACK_DURATION_MS = 1500;

// 텍스트를 클립보드에 복사하고, 결과를 COPY_FEEDBACK_DURATION_MS 동안 copyStatus로 알려 준다
export function useCopyToClipboard() {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const copy = useCallback(async (text: string) => {
    try {
      // 보안 컨텍스트가 아니면 navigator.clipboard가 없어 여기서 throw된다
      await navigator.clipboard.writeText(text);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(
      () => setCopyStatus('idle'),
      COPY_FEEDBACK_DURATION_MS,
    );
  }, []);

  return { copyStatus, copy };
}
