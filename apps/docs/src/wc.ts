import { useCallback, useRef } from 'react';

/** A kit event as a ref: React doesn't listen for custom events on custom elements. */
export function useEvent(type: string, fn: (el: any, detail: any) => void) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback((el: any) => {
    if (!el) return;
    const h = (e: Event) => fnRef.current(el, (e as CustomEvent).detail);
    el.addEventListener(type, h);
    return () => el.removeEventListener(type, h);
  }, [type]);
}
