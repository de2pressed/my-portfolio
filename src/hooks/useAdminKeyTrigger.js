import { useEffect, useRef } from 'react';

const TARGET_SEQUENCE = 'de2pressed';

export default function useAdminKeyTrigger(onTrigger) {
  const sequenceRef = useRef('');
  const callbackRef = useRef(onTrigger);

  useEffect(() => {
    callbackRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const tagName = target?.tagName;
      const isEditable =
        target?.isContentEditable ||
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT';

      if (isEditable || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      sequenceRef.current = `${sequenceRef.current}${event.key.toLowerCase()}`
        .slice(-TARGET_SEQUENCE.length)
        .trim();

      if (sequenceRef.current === TARGET_SEQUENCE) {
        sequenceRef.current = '';
        callbackRef.current?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
