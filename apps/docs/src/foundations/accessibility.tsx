// Accessibility: what follows from the system and what stays with the product. The contrast table
// measures the live theme, so it changes with the Theme select and the color scheme, and the target
// sizes come from the resolver.
import { useEffect, useMemo, useState } from 'react';
import { css } from '../../styled-system/css/index.js';
import { apcaLc } from '@massimo/ui-kit/tokens/colors/spectrum/contrast';
import { toneOfY } from '@massimo/ui-kit/tokens/colors/spectrum/anchors';
import { DENSITIES, resolveControl, SIZES } from '@massimo/ui-kit/tokens/geometry/resolve';
import { Page, px, s, Section, Table } from './pages.tsx';

const TEXT: [string, string, number][] = [
  ['Strong text', '--colors-fg-strong', 75], ['Body text', '--colors-fg', 75], ['Muted text', '--colors-fg-muted', 60], ['Subtle text', '--colors-fg-subtle', 45], ['Primary text', '--colors-primary-fg', 60],
];
const SURFACES: [string, string][] = [['Page', '--colors-bg'], ['Subtle', '--colors-bg-subtle'], ['Muted', '--colors-bg-muted']];
const SOLID: [string, string, string][] = [['Primary', '--colors-fg-on-solid', '--colors-primary-solid'], ['Critical', '--colors-fg-on-solid', '--colors-critical-solid']];

const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const luminance = (rgb: number[]) => 0.2126 * lin(rgb[0] / 255) + 0.7152 * lin(rgb[1] / 255) + 0.0722 * lin(rgb[2] / 255);
/** A token's sRGB, through a canvas, which converts any CSS color and applies the page's scheme. */
function rgbOf(token: string, probe: HTMLElement, ctx: CanvasRenderingContext2D) {
  probe.style.color = `var(${token})`;
  ctx.fillStyle = getComputedStyle(probe).color;
  ctx.fillRect(0, 0, 1, 1);
  return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)];
}
const wcag = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

type Reading = { text: string; cells: { surface: string; lc: number; need: number }[] };
function useContrast() {
  const [rows, setRows] = useState<Reading[]>([]);
  const [solids, setSolids] = useState<{ role: string; lc: number; ratio: number }[]>([]);
  useEffect(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const probe = document.createElement('span'); document.body.append(probe);
    const measure = () => {
      const y = (token: string) => luminance(rgbOf(token, probe, ctx));
      const lc = (fg: string, bg: string) => Math.round(apcaLc(toneOfY(y(fg)), toneOfY(y(bg))));
      setRows(TEXT.map(([text, fg, need]) => ({ text, cells: SURFACES.map(([surface, bg]) => ({ surface, lc: lc(fg, bg), need })) })));
      setSolids(SOLID.map(([role, fg, bg]) => ({ role, lc: lc(fg, bg), ratio: Math.round(wcag(y(fg), y(bg)) * 100) / 100 })));
    };
    measure();
    // The Theme select swaps a stylesheet in the head, and the scheme is a class on the root.
    const again = () => setTimeout(measure, 150);
    const seen = new MutationObserver(again);
    seen.observe(document.head, { childList: true });
    seen.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('load', again, true);
    return () => { seen.disconnect(); document.removeEventListener('load', again, true); probe.remove(); };
  }, []);
  return { rows, solids };
}

const local = {
  pass: css({ fontVariantNumeric: 'tabular-nums' }),
  low: css({ fontVariantNumeric: 'tabular-nums', color: 'critical.fg', fontWeight: 'semibold' }),
  columns: css({ display: 'grid', gridTemplateColumns: '1fr', gap: '6', md: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } }),
  list: css({ textStyle: 'body-md', display: 'flex', flexDirection: 'column', gap: '2', paddingInlineStart: '5', listStyleType: 'disc' }),
};

const GUARANTEED = ['Each ramp step is solved from an APCA target against the page, in both schemes.', 'Text on a solid is black or white, whichever reads better, so a light brand gets dark text.', 'Controls grow with the unit, so target sizes follow it.', 'One focus ring for keyboard focus, never on a pointer press.', 'Reduced-motion settings are honored.'];
const YOURS = ['Pick a size for the input mode. Touch-first products need the sizes below.', 'Name icon-only controls with an aria-label.', 'Never use color alone: pair status colors with an icon or a word.', 'Check WCAG 2 yourself if your contract requires it.', 'Keep a logical tab order, real field labels and descriptive headings.'];

export function Accessibility() {
  const { rows, solids } = useContrast();
  const smallest = (min: number, density: (typeof DENSITIES)[number]) => SIZES.find((unit) => resolveControl({ unit, density }).height >= min);
  const targets = useMemo(() => DENSITIES.map((d) => [d, px(resolveControl({ density: d }).height), `u = ${smallest(24, d)}`, `u = ${smallest(44, d)}`]), []);
  return (
    <Page title="Accessibility" lead="Much of this follows from the equations: contrast is solved per step, and target size grows with the unit. The rest stays with your product, and the numbers below show where the line falls.">
      <Section title="Text contrast">
        <p className={s.body}>APCA Lc for each text role on each surface, measured from the live theme, so these change with the Theme select and color scheme. Bold red marks a value under the role's target: 75 for body text, 60 for UI text, 45 for hints.</p>
        <Table head={['Text', ...SURFACES.map(([n]) => n), 'Target']} rows={rows.map((r) => [r.text, ...r.cells.map((c) => <span key={c.surface} className={c.lc >= c.need ? local.pass : local.low}>{c.lc}</span>), r.cells[0]?.need])} />
      </Section>
      <Section title="APCA and WCAG 2">
        <p className={s.body}>The kit meets APCA, not WCAG 2 ratios, so a pair can pass one and fail the other. White on the default primary solid is the clearest case: it clears the kit's Lc 60 target for UI text, and it's under WCAG AA's 4.5:1. If AA is a requirement, anchor darker solids or raise the step targets.</p>
        <Table head={['Text on solid', 'APCA Lc', 'WCAG 2 ratio', 'WCAG AA text']} rows={solids.map((x) => [x.role, x.lc, `${x.ratio}:1`, x.ratio >= 4.5 ? 'Passes' : 'Doesn\'t pass'])} />
        <p className={s.body}>APCA values here are guidance, not certification.</p>
      </Section>
      <Section title="Target size">
        <p className={s.body}>A control is as tall as its height, and the height follows the unit and density. WCAG 2.2 AA asks for 24px, and touch platforms ask for 44px.</p>
        <Table head={['Density', 'Height at the default unit', 'Smallest unit for 24px', 'Smallest unit for 44px']} rows={targets} />
      </Section>
      <Section title="Who owns what">
        <div className={local.columns}>
          <div><h3 className={s.h3}>Guaranteed by the system</h3><ul className={local.list}>{GUARANTEED.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div><h3 className={s.h3}>Still yours to own</h3><ul className={local.list}>{YOURS.map((x) => <li key={x}>{x}</li>)}</ul></div>
        </div>
      </Section>
    </Page>
  );
}
