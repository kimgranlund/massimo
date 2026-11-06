// Headless key notation for <ui-kbd> and the React Kbd: "mod+shift+p" as caps and a spoken name, for
// the viewer's platform. `mod` is Command on a Mac and Control elsewhere. It only describes keys:
// nothing here listens for them.
export type KbdPlatform = 'mac' | 'other';
export interface KeyCap { glyph: string; spoken: string }

const KEYS: Record<string, { mac: string; other: string; spoken?: string; macSpoken?: string }> = {
  mod: { mac: '⌘', other: 'Ctrl', macSpoken: 'Command', spoken: 'Control' },
  cmd: { mac: '⌘', other: 'Cmd', spoken: 'Command' },
  command: { mac: '⌘', other: 'Cmd', spoken: 'Command' },
  ctrl: { mac: '⌃', other: 'Ctrl', spoken: 'Control' },
  control: { mac: '⌃', other: 'Ctrl', spoken: 'Control' },
  alt: { mac: '⌥', other: 'Alt', macSpoken: 'Option', spoken: 'Alt' },
  option: { mac: '⌥', other: 'Alt', macSpoken: 'Option', spoken: 'Alt' },
  shift: { mac: '⇧', other: 'Shift', spoken: 'Shift' },
  enter: { mac: '↵', other: 'Enter', spoken: 'Enter' },
  return: { mac: '↵', other: 'Enter', spoken: 'Return' },
  esc: { mac: 'Esc', other: 'Esc', spoken: 'Escape' },
  escape: { mac: 'Esc', other: 'Esc', spoken: 'Escape' },
  tab: { mac: '⇥', other: 'Tab', spoken: 'Tab' },
  backspace: { mac: '⌫', other: 'Backspace', spoken: 'Backspace' },
  delete: { mac: '⌦', other: 'Del', spoken: 'Delete' },
  space: { mac: 'Space', other: 'Space', spoken: 'Space' },
  up: { mac: '↑', other: '↑', spoken: 'Up' },
  down: { mac: '↓', other: '↓', spoken: 'Down' },
  left: { mac: '←', other: '←', spoken: 'Left' },
  right: { mac: '→', other: '→', spoken: 'Right' },
};

/** Parse "mod+shift+p". A key the table doesn't name shows as written, a single letter in capitals. */
export function parseKeys(keys: string, platform: KbdPlatform): KeyCap[] {
  return keys.split('+').map((k) => k.trim()).filter(Boolean).map((key) => {
    const known = KEYS[key.toLowerCase()];
    if (known) return { glyph: known[platform], spoken: (platform === 'mac' && known.macSpoken) || known.spoken || key };
    const shown = key.length === 1 ? key.toUpperCase() : key;
    return { glyph: shown, spoken: shown };
  });
}

/** The viewer's platform; `other` where there's no navigator, as on a server. */
export function detectPlatform(): KbdPlatform {
  if (typeof navigator === 'undefined') return 'other';
  const data = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform;
  return /mac|iphone|ipad/i.test(data ?? navigator.platform ?? '') ? 'mac' : 'other';
}
