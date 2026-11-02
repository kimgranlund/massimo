// Shared plumbing for elements that own <ui-option> children.
import { signal } from '../../core/index.ts';
import { uid } from '../../dom/index.ts';
import type { UIOption } from './option.element.ts';

/** Reactive view of the <ui-option> children of `container`, refreshed on DOM changes. */
export function optionList(container: () => Element | undefined) {
  const version = signal(0);
  let mo: MutationObserver | undefined;
  return {
    get options(): UIOption[] {
      void version.value;
      const c = container();
      return c ? ([...c.children].filter((el) => el.localName === 'ui-option') as UIOption[]) : [];
    },
    observe(target: Element) {
      mo?.disconnect();
      mo = new MutationObserver(() => version.value++);
      mo.observe(target, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['value', 'disabled'] });
      version.value++;
    },
    disconnect() { mo?.disconnect(); },
  };
}

export const ensureId = (el: Element, prefix = 'opt') => el.id || (el.id = uid(prefix));
