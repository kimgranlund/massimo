// Studio shell: parameter panel on the left, isolated canvas on the right.
// The shell itself always uses the default theme; only the canvas document is themed.
import { useEffect, useRef, useState } from 'react';
import { Button } from '@massimo/ui-kit/components/button/react';
import { Input } from '@massimo/ui-kit/components/input/react';
import { PARAMS, defaultParams, diffFromDefaults, savedThemes, THEME_NAME, type ParamName, type ThemeParams } from '@massimo/ui-kit/tokens';
import { listen, post } from '../protocol.ts';
import * as s from './styles.ts';

const NAMES = Object.keys(PARAMS) as ParamName[];

export function App() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [params, setParams] = useState<ThemeParams>(defaultParams);
  // The canvas starts in the host's scheme and follows it until the user picks one.
  const [dark, setDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const [pinned, setPinned] = useState(false);
  useEffect(() => {
    if (pinned) return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const on = () => setDark(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [pinned]);
  const [themes, setThemes] = useState(savedThemes);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  const send = () => post(frame.current?.contentWindow, { type: 'studio/theme', params, dark });
  useEffect(send, [params, dark]);
  useEffect(() => listen(() => frame.current?.contentWindow, (m) => { if (m.type === 'studio/ready') send(); }), [params, dark]);

  const load = (key: string) => {
    setParams({ ...defaultParams, ...(themes[key] ?? {}) });
    setName(key === '' ? '' : key);
    setStatus('');
  };

  const overrides = diffFromDefaults(params);
  const nameError = name && !THEME_NAME.test(name) ? 'Lowercase letters, digits and dashes; start with a letter.' : undefined;

  async function save() {
    setStatus('Saving…');
    const res = await fetch('/__studio/themes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name, params: overrides }) });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return setStatus(`Not saved: ${body.error ?? res.status}`);
    setThemes((t) => ({ ...t, [body.saved]: body.params }));
    setStatus(`Saved "${body.saved}" to packages/ui-kit/tokens/themes/themes.json`);
  }

  const snippet = `<html data-ui-theme="${name || 'my-theme'}">\n\n"${name || 'my-theme'}": ${JSON.stringify(overrides, null, 2)}`;

  return (
    <div className={s.shell}>
      <aside className={s.panel} aria-label="Theme">
        <header className={s.panelHeader}>
          <h1 className={s.brand}>Studio</h1>
          <Button onClick={() => { setPinned(true); setDark((d) => !d); }} aria-pressed={dark}>{dark ? 'Dark' : 'Light'}</Button>
        </header>

        <label className={s.fieldLabel}>
          Start from
          <select className={s.select} value={themes[name] ? name : ''} onChange={(e) => load(e.target.value)}>
            <option value="">Default</option>
            {Object.keys(themes).map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <div className={s.sliders}>
          {NAMES.map((k) => {
            const spec = PARAMS[k];
            return (
              <label key={k} className={s.slider}>
                <span className={s.sliderHead}><span>{spec.label}</span><output className={s.value}>{params[k]}</output></span>
                <input type="range" min={spec.min} max={spec.max} step={spec.step} value={params[k]}
                  onChange={(e) => setParams((p) => ({ ...p, [k]: Number(e.target.value) }))} />
              </label>
            );
          })}
        </div>

        <div className={s.saveRow}>
          <Input label="Theme name" placeholder="brand-x" value={name} onChange={(e) => setName(e.target.value)} error={nameError} />
          <div className={s.actions}>
            <Button disabled={!name || !!nameError} onClick={save}>Save theme</Button>
            <Button onClick={() => navigator.clipboard.writeText(snippet).then(() => setStatus('Copied'))}>Copy</Button>
            <Button onClick={() => load('')}>Reset</Button>
          </div>
          <p className={s.status} role="status">{status}</p>
        </div>

        <pre className={s.code}>{snippet}</pre>
      </aside>

      <iframe ref={frame} className={s.canvas} src="/canvas.html" title="Canvas" />
    </div>
  );
}
