// React <Kbd>: a native <kbd> with the web component's caps, hidden label and slot recipe. The server
// renders the `other` platform, and `auto` resolves after mount, so hydration always matches.
import { useEffect, useState, type HTMLAttributes } from 'react';
import { detectPlatform, parseKeys, type KbdPlatform } from '../../dom/kbd.ts';
import { kbd } from '../../styled-system/recipes/kbd.js';

export interface KbdProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  /** Keys joined with +, such as mod+shift+p. mod is Command on a Mac and Control elsewhere. */
  keys: string;
  /** auto follows the viewer's platform. */
  platform?: 'auto' | KbdPlatform;
  /** Unit u in px for this element. */
  size?: number;
}

export function Kbd({ keys, platform = 'auto', size, className, ...rest }: KbdProps) {
  const [detected, setDetected] = useState<KbdPlatform>('other');
  useEffect(() => setDetected(detectPlatform()), []);
  const caps = parseKeys(keys, platform === 'auto' ? detected : platform), c = kbd();
  return (
    <kbd {...rest} data-ui="kbd" data-size={size} className={[c.root, className].filter(Boolean).join(' ')}>
      <span data-part="keys" aria-hidden="true" className={c.keys}>
        {caps.map((k, i) => <span key={i} data-part="cap" className={c.cap}>{k.glyph}</span>)}
      </span>
      <span data-part="label" className={c.label}>{caps.map((k) => k.spoken).join(' ')}</span>
    </kbd>
  );
}
