import { useEffect } from 'react';

type HandlerMap = Record<string, (e: KeyboardEvent) => void>;

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
}

/** Register hotkeys. Keys in editable targets only fire if allowInInput is true on that key. */
export function useHotkeys(
  handlers: HandlerMap,
  deps: unknown[] = [],
  options?: { allowInInputKeys?: string[] },
) {
  useEffect(() => {
    const allow = new Set(options?.allowInInputKeys ?? []);
    const onKeyDown = (e: KeyboardEvent) => {
      const key = [
        e.metaKey || e.ctrlKey ? 'mod' : '',
        e.shiftKey ? 'shift' : '',
        e.altKey ? 'alt' : '',
        e.key.length === 1 ? e.key.toLowerCase() : e.key,
      ]
        .filter(Boolean)
        .join('+');

      const handler = handlers[key] ?? handlers[e.key];
      if (!handler) return;

      if (isEditableTarget(e.target) && !allow.has(key) && !allow.has(e.key)) {
        // Still allow mod+s in inputs
        if (!(key === 'mod+s' || key === 'mod+Enter')) return;
      }

      handler(e);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
