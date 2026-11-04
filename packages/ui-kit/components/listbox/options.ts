// Shared plumbing for elements that own <ui-option> children.
import { signal } from '../../core/signals.ts';
import { uid } from '../../dom/attrs.ts';
import type { UIOption } from './option.element.ts';

/** Reactive view of the <ui-option> children of `container`, refreshed on DOM changes. */
export function optionList(container: () => Element | undefined) {
  const version = signal(0);
  let mo: MutationObserver | undefined;
  return {
    get options(): UIOption[] {
      void version.value;
      const c = container();
      // Options sit in the container or one level down in a group (Base UI Combobox.Group: [data-part=group]).
      return c ? ([...c.querySelectorAll(':scope > ui-option, :scope > [data-part=group] > ui-option')] as UIOption[]) : [];
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
