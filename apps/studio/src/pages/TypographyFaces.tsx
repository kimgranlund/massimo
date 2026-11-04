// Typography › Face catalogue: every catalogue face (contracts/face-catalogue.json) loaded in this
// browser, with its descriptor, source, curated weight range, what the browser reports now (the
// weight range its stylesheet's @font-face rules declare for web faces; presence for system faces) and the measured
// metrics, plus a specimen at regular and bold.
import { useEffect, useState, type CSSProperties } from 'react';
import { css } from '../../styled-system/css/index.js';
import { FACE_CATALOGUE, googleFontsUrl } from '@massimo/ui-kit/tokens/typography/faces';
import { loadFontSource } from '../studio/fonts.ts';
import { dataTable, nameCell, noteCell, tableScroller } from './shared.tsx';

const specimen = css({ fontFamily: '[var(--face)]', fontSize: '[1.25rem]', lineHeight: '[1.2]', whiteSpace: 'nowrap' });
const bold = css({ fontWeight: 'bold' });

export function FaceCatalogue() {
  const [live, setLive] = useState<Record<string, string>>({});
  useEffect(() => {
    for (const f of FACE_CATALOGUE) if (f.source === 'google') loadFontSource(googleFontsUrl(f));
    let alive = true;
    const read = async () => {
      const out: Record<string, string> = {};
      for (const f of FACE_CATALOGUE) {
        const fam = f.family === 'system-ui' ? 'system-ui' : `"${f.family}"`;
        await Promise.all([400, 700].map((w) => document.fonts.load(`${w} 16px ${fam}`).catch(() => [])));
        if (f.source === 'google') {
          // Every @font-face rule the stylesheet declares (static weights load lazily, on first use).
          const rules = [...document.fonts].filter((x) => x.family.replace(/["']/g, '') === f.family);
          const ws = rules.flatMap((x) => x.weight.split(' ').map(Number));
          out[f.id] = !ws.length ? 'not loaded' : `${rules.some((x) => x.status === 'loaded') ? 'loaded' : 'declared'} ${Math.min(...ws)}–${Math.max(...ws)}`;
        } else out[f.id] = document.fonts.check(`400 16px ${fam}`) ? 'system' : 'not found';
      }
      if (alive) setLive(out);
    };
    void document.fonts.ready.then(read);
    const t = setTimeout(read, 2500);
    return () => { alive = false; clearTimeout(t); };
  }, []);
  return (
    <div className={tableScroller}>
      <table className={dataTable} aria-label="Face catalogue">
        <thead><tr><th>Face</th><th>Descriptor</th><th>Source</th><th>Weights<small>curated</small></th><th>Here<small>this browser</small></th><th>x · cap<small>em</small></th><th>Specimen<small>400 · 700</small></th><th>Notes</th></tr></thead>
        <tbody>
          {FACE_CATALOGUE.map((f) => (
            <tr key={f.id}>
              <td className={nameCell}>{f.family}</td><td>{f.descriptor}</td><td>{f.source}{f.variable ? ' · variable' : ''}</td>
              <td>{f.weights.min}–{f.weights.max}</td><td>{live[f.id] ?? '…'}</td>
              <td>{f.measured?.metrics ? `${f.measured.metrics.xHeight} · ${f.measured.metrics.capHeight}` : '–'}</td>
              <td><span className={specimen} style={{ '--face': f.family === 'system-ui' ? 'system-ui' : `"${f.family}", monospace` } as CSSProperties}>Hamburg <span className={bold}>Hamburg</span></span></td>
              <td className={noteCell}>{f.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
