// Headless text entry on a contenteditable element: single-line, or multiline for ui-textarea.
import type { Attrs } from './attrs.ts';

export type TextType = 'text' | 'email' | 'password' | 'search' | 'tel' | 'url';

export interface TextEntryState {
  type: TextType;
  placeholder?: string;
  editable: boolean;
  /** Enter adds a line and pastes keep theirs. Default: single line. */
  multiline?: boolean;
}

const INPUT_MODE: Partial<Record<TextType, string>> = { email: 'email', tel: 'tel', url: 'url', search: 'search' };

export function textEntryAttrs(s: TextEntryState): Attrs {
  const literal = s.type === 'password' || s.type === 'email' || s.type === 'url';
  return {
    contenteditable: s.editable ? 'plaintext-only' : 'false',
    'aria-multiline': s.multiline ? 'true' : 'false',
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

/** Multiline: every line break is a newline, as in a native textarea's value. */
export const toMultiline = (text: string) => text.replace(/\r\n?/g, '\n');

/**
 * A multiline editor's value. To show an empty last line, an editor keeps one extra break after it:
 * browsers store it differently, but innerText has it as a trailing newline in all three engines.
 */
export function readMultiline(editor: HTMLElement) {
  const text = toMultiline(editor.innerText ?? editor.textContent ?? '');
  return text === '\n' ? '' : text.endsWith('\n\n') ? text.slice(0, -1) : text;
}
/** The text that makes an editor read back as `value`: an empty last line needs its extra break. */
export const multilineText = (value: string) => (value.endsWith('\n') ? `${value}\n` : value);

/**
 * beforeinput policy: Enter submits instead of adding a line, pasted/dropped text is
 * flattened to one line. Returns 'submit' when the caller should submit its form. Multiline text has
 * no policy: the browser's own line breaks and pastes stand.
 */
export function onTextBeforeInput(e: InputEvent, multiline = false): 'submit' | void {
  if (multiline) return;
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
