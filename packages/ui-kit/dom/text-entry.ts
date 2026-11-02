// Headless single-line text entry on a contenteditable element.
import type { Attrs } from './attrs.ts';

export type TextType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

export interface TextEntryState {
  type: TextType;
  placeholder?: string;
  editable: boolean;
}

const INPUT_MODE: Partial<Record<TextType, string>> = { email: 'email', tel: 'tel', url: 'url', search: 'search' };

export function textEntryAttrs(s: TextEntryState): Attrs {
  const literal = s.type === 'password' || s.type === 'email' || s.type === 'url';
  return {
    contenteditable: s.editable ? 'plaintext-only' : 'false',
    'aria-multiline': 'false',
    'aria-placeholder': s.placeholder || undefined,
    'data-placeholder': s.placeholder || undefined,
    'data-secret': s.type === 'password' || undefined,
    inputmode: INPUT_MODE[s.type],
    spellcheck: literal ? 'false' : undefined,
    autocapitalize: literal ? 'off' : undefined,
    autocorrect: literal ? 'off' : undefined,
  };
}

/** Single line: newlines become spaces. */
export const toSingleLine = (text: string) => text.replace(/\s*[\r\n]+\s*/g, ' ');

/**
 * beforeinput policy: Enter submits instead of adding a line, pasted/dropped text is
 * flattened to one line. Returns 'submit' when the caller should submit its form.
 */
export function onTextBeforeInput(e: InputEvent): 'submit' | void {
  if (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak') {
    e.preventDefault();
    return 'submit';
  }
  if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop') {
    const text = e.dataTransfer?.getData('text/plain') ?? e.data ?? '';
    if (/[\r\n]/.test(text)) {
      e.preventDefault();
      document.execCommand('insertText', false, toSingleLine(text));
    }
  }
}
