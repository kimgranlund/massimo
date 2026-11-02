// Motion: every spring and intent the kit supports, live. Each spring plots the easing the CSS
// computes from the current params (liveMotion, the same solve as tokens/motion) over the solved
// spring, with a thumb that replays on its own tokens; each intent shows the spring it runs and where
// components use it; component demos flip state so their transitions play. Spec: docs/specs/motion.md.
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/btg/element';
import '@massimo/ui-kit/components/choice/element';
import '@massimo/ui-kit/components/select/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/range/element';
import '@massimo/ui-kit/components/swiper/element';
import '@massimo/ui-kit/components/image/element';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { css } from '../../styled-system/css/index.js';
import { INTENTS, SPRING_NAMES, intentSpring, liveMotion, spanFactor, springAt, type IntentName, type SpringName } from '@massimo/ui-kit/tokens';
import { useEvent } from '../studio/wc.tsx';
import type { PageProps } from './types.ts';
import { CQ_LG, CQ_MD, Divider, Page, Section, caption, dataTable, nameCell, noteCell, tableScroller } from './shared.tsx';

// The demo column holds a replayable thumb track.
const thumbCell = css({ width: '[14rem]', minWidth: '[10rem]' });

const grid = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '4', [CQ_MD]: { gridTemplateColumns: '1fr 1fr' }, [CQ_LG]: { gridTemplateColumns: 'repeat(4, 1fr)' } });
const cardHead = css({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '2' });
const cardTitle = css({ textStyle: 'heading-3' });
const stats = css({ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: '3', rowGap: '1', textStyle: 'caption', color: 'fg.muted', '& dd': { color: 'fg', fontVariantNumeric: 'tabular-nums', textAlign: 'end' } });
const plot = css({ width: 'full', height: 'auto', overflow: 'visible' });
const axis = css({ stroke: 'border', fill: 'none', strokeWidth: '[1]' });
const rest = css({ stroke: 'border.strong', fill: 'none', strokeWidth: '[1]', strokeDasharray: '[3 3]' });
const exact = css({ stroke: 'fg.subtle', fill: 'none', strokeWidth: '[3]', opacity: 0.35, strokeLinecap: 'round', strokeLinejoin: 'round' });
const sampled = css({ stroke: 'primary.solid', fill: 'none', strokeWidth: '[1.5]', strokeLinejoin: 'round' });
const dot = css({ fill: 'primary.solid' });
const tick = css({ stroke: 'fg.muted', strokeWidth: '[1]' });
const tickLabel = css({ fill: 'fg.muted', fontSize: '[9px]', fontFamily: 'mono' });
const demos = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '4', [CQ_MD]: { gridTemplateColumns: '1fr 1fr' }, [CQ_LG]: { gridTemplateColumns: 'repeat(3, 1fr)' } });
const demoBody = css({ display: 'flex', flexDirection: 'column', gap: '3', alignItems: 'start', minHeight: '[5rem]', '& > ui-progress, & > ui-select, & > ui-swiper': { width: 'full' } });
const row = css({ display: 'flex', gap: '3', alignItems: 'center', flexWrap: 'wrap' });

// The replayable thumb: a track whose thumb slides from start to end on its own motion tokens.
// [data-snap] parks it at the start with no transition; [data-run] sends it to the end.
const track = css({
  position: 'relative', width: 'full', height: '6', bg: 'bg.muted', borderRadius: 'full', containerType: 'inline-size',
  '&[data-snap] > *': { transitionDuration: 'instant' },
  '&[data-run] > *': { translate: '[calc(100cqi - 100%) 0]' },
});
const thumbBase = { width: '6', height: '6', borderRadius: 'full', bg: 'primary.solid', transitionProperty: 'translate' } as const;
// One class per motion token pair (Panda extracts literal objects only).
const THUMB: Record<SpringName | IntentName, string> = {
  quick: css({ ...thumbBase, transitionDuration: 'quick', transitionTimingFunction: 'quick' }),
  smooth: css({ ...thumbBase, transitionDuration: 'smooth', transitionTimingFunction: 'smooth' }),
  snappy: css({ ...thumbBase, transitionDuration: 'snappy', transitionTimingFunction: 'snappy' }),
  bouncy: css({ ...thumbBase, transitionDuration: 'bouncy', transitionTimingFunction: 'bouncy' }),
  feedback: css({ ...thumbBase, transitionDuration: 'feedback', transitionTimingFunction: 'feedback' }),
  toggle: css({ ...thumbBase, transitionDuration: 'toggle', transitionTimingFunction: 'toggle' }),
  reveal: css({ ...thumbBase, transitionDuration: 'reveal', transitionTimingFunction: 'reveal' }),
  emphasis: css({ ...thumbBase, transitionDuration: 'emphasis', transitionTimingFunction: 'emphasis' }),
};

/** Where each intent shows up in the components (their slot recipes). */
const INTENT_USES: Record<IntentName, string> = {
  feedback: 'Hover, press, selection and validity: button and chip fills, options, swatches, range and choice colors.',
  toggle: 'A state flip that moves something: switch thumb, radio dot, select chevron, range thumb on key steps, swiper dot.',
  reveal: 'Something appearing or growing: the select popup (fade and scale), swiper hover controls, progress fill.',
  emphasis: 'Drawing attention with visible overshoot. No component uses it yet.',
};

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const ms = (v: number) => `${Math.round(v)}ms`;

/** Replay every track inside `root` (or the one given): park at the start, then run. */
function replay(root: Element | null) {
  if (!root) return;
  const tracks = root.matches('[data-track]') ? [root] : [...root.querySelectorAll('[data-track]')];
  for (const t of tracks) { t.removeAttribute('data-run'); t.setAttribute('data-snap', ''); }
  void (root as HTMLElement).offsetWidth; // commit the parked state before the transition starts
  for (const t of tracks) { t.removeAttribute('data-snap'); t.setAttribute('data-run', ''); }
}

function ReplayButton({ onReplay, label = 'Replay', primary }: { onReplay: () => void; label?: string; primary?: boolean }) {
  const ref = useEvent('click', onReplay);
  return <ui-button ref={ref} variant={primary ? 'primary' : 'neutral'}><i slot="leading" name="arrow-clockwise" />{label}</ui-button>;
}

function Thumb({ token, trackRef }: { token: SpringName | IntentName; trackRef?: (el: HTMLDivElement | null) => void }) {
  return <div ref={trackRef} className={track} data-track="" data-run="" aria-hidden="true"><div className={THUMB[token]} /></div>;
}

// Plot: x is time over the span (0..1), y the position (0 at the bottom, 1 the dashed rest line).
const W = 200, H = 120, X0 = 6, X1 = 194;
const px = (t: number) => X0 + t * (X1 - X0);
const py = (v: number) => 104 - v * 72;
const path = (pts: [number, number][]) => pts.map(([t, v], i) => `${i ? 'L' : 'M'}${px(t).toFixed(2)} ${py(v).toFixed(2)}`).join(' ');

function SpringPlot({ name, points, bounce, duration }: { name: string; points: number[]; bounce: number; duration: number }) {
  const span = spanFactor(bounce);
  const n = points.length - 1;
  const solved = Array.from({ length: 241 }, (_, i) => [i / 240, springAt((i / 240) * span, { duration: 1, bounce })] as [number, number]);
  const perceptual = 1 / span; // the perceptual duration on the span's time axis
  return (
    <svg className={plot} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${name} easing: ${n + 1} linear() samples over the solved spring`}>
      <line className={axis} x1={X0} x2={X1} y1={py(0)} y2={py(0)} vectorEffect="non-scaling-stroke" />
      <line className={rest} x1={X0} x2={X1} y1={py(1)} y2={py(1)} vectorEffect="non-scaling-stroke" />
      <line className={tick} x1={px(perceptual)} x2={px(perceptual)} y1={py(0) - 3} y2={py(0) + 3} vectorEffect="non-scaling-stroke" />
      <text className={tickLabel} x={px(perceptual)} y={py(0) + 13} textAnchor="middle">{`${duration.toFixed(2)}s`}</text>
      <text className={tickLabel} x={X1} y={py(0) + 13} textAnchor="end">span</text>
      <path className={exact} d={path(solved)} vectorEffect="non-scaling-stroke" />
      <path className={sampled} d={path(points.map((v, i) => [i / n, v]))} vectorEffect="non-scaling-stroke" />
      {points.map((v, i) => <circle key={i} className={dot} cx={px(i / n)} cy={py(v)} r={1.1} />)}
    </svg>
  );
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}


// Sample slides as inline SVG gradients (no network).
const art = (a: string, b: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/></svg>`)}`;
const SLIDES = [art('#4f46e5', '#06b6d4'), art('#f97316', '#db2777'), art('#16a34a', '#0ea5e9')];

/** Component demos: one Replay flips every demo's state, so each transition plays on its intent. */
function ComponentDemos() {
  const [on, setOn] = useState(false);
  const selectRef = useRef<any>(null);
  const swiperRef = useRef<any>(null);
  const flip = () => setOn((v) => !v);
  useEffect(() => {
    const sel = selectRef.current;
    // Base UI open: the property opens and closes the popup.
    if (sel) sel.open = on;
    swiperRef.current?.go?.(on ? 1 : 0);
  }, [on]);
  const demo = (title: string, intent: string, body: ReactNode) => (
    <ui-card key={title}>
      <div className={cardHead}><h3 className={cardTitle}>{title}</h3><span className={caption}>{intent}</span></div>
      <div className={demoBody}>{body}</div>
    </ui-card>
  );
  return (
    <Section id="in-components" title="In components" note="Replay flips every demo at once; each transition runs on its intent. All of them are live controls too." action={<ReplayButton onReplay={flip} primary />}>
      <div className={demos}>
        {demo('Switch', 'toggle', <div className={row}><ui-switch checked={on}>Wi-Fi</ui-switch><ui-switch checked={!on}>Bluetooth</ui-switch></div>)}
        {demo('Radio', 'toggle', <div className={row}><ui-radio name="motion-plan" value="free" checked={!on}>Free</ui-radio><ui-radio name="motion-plan" value="pro" checked={on}>Pro</ui-radio></div>)}
        {demo('Select popup', 'reveal · chevron toggle', (
          <ui-select ref={selectRef} label="Role" value="editor">
            <ui-option value="viewer">Viewer</ui-option>
            <ui-option value="editor">Editor</ui-option>
            <ui-option value="admin">Admin</ui-option>
          </ui-select>
        ))}
        {demo('Chip', 'feedback', <div className={row}><ui-chip selectable selected={on}>Design</ui-chip><ui-chip selectable selected={!on}>Engineering</ui-chip></div>)}
        {demo('Button', 'feedback (hover, press)', <div className={row}><ui-button variant={on ? 'primary' : 'neutral'}>Save</ui-button><span className={caption}>Hover and press it too.</span></div>)}
        {demo('Progress', 'reveal', <ui-progress label="Upload" value={on ? 85 : 20} />)}
        {demo('Swiper', 'toggle (dots)', (
          <ui-swiper ref={swiperRef} label="Slides">
            {SLIDES.map((src, i) => <ui-image key={i} src={src} alt={`Slide ${i + 1}`} ratio="wide" />)}
          </ui-swiper>
        ))}
      </div>
    </Section>
  );
}

export function MotionPage({ params }: PageProps) {
  const reduced = usePrefersReducedMotion();
  const springsRef = useRef<HTMLDivElement>(null);
  const intentsRef = useRef<HTMLDivElement>(null);
  const tracks = useRef<Partial<Record<string, HTMLDivElement | null>>>({});
  const scale = params['motion-scale'];

  return (
    <Page
      title="Motion"
      lead="Four springs, each a perceptual duration and a bounce, solved in CSS into a linear() easing that spans the time the spring takes to settle. Components never name a spring: they name an intent, and each intent runs one spring. Tune all of it in the Motion tab."
      notices={[
        reduced && 'Reduced motion is on: the kit collapses every transition to an instant change, so the thumbs and demos below jump. The plots still show each curve as tuned.',
        scale === 0 && !reduced && 'Duration scale is 0: every transition is instant.',
      ]}
    >

        <Divider />
        <Section
          id="springs"
          title="Springs"
          note={`Plot: the linear() samples the CSS computes (dots) over the continuously solved spring (wide line); the dashed line is rest, the tick the perceptual duration. Spans include the ${scale}× duration scale.`}
          action={<ReplayButton onReplay={() => replay(springsRef.current)} label="Replay all" />}
        >
          <div ref={springsRef} className={grid}>
            {SPRING_NAMES.map((name) => {
              const m = liveMotion(params, name);
              const used = (Object.keys(INTENTS) as IntentName[]).filter((i) => intentSpring(params, i) === name);
              return (
                <ui-card key={name}>
                  <div className={cardHead}><h3 className={cardTitle}>{cap(name)}</h3><span className={caption}>{ms(m.ms)}</span></div>
                  <SpringPlot name={name} points={m.points} bounce={m.spring.bounce} duration={m.spring.duration} />
                  <Thumb token={name} trackRef={(el) => { tracks.current[name] = el; }} />
                  <dl className={stats}>
                    <dt>Duration</dt><dd>{m.spring.duration.toFixed(2)}s</dd>
                    <dt>Bounce</dt><dd>{m.spring.bounce.toFixed(2)}</dd>
                    <dt>Span</dt><dd>{ms(m.ms)}</dd>
                    <dt>Intents</dt><dd>{used.length ? used.join(', ') : 'none'}</dd>
                  </dl>
                  <ReplayButton onReplay={() => replay(tracks.current[name] ?? null)} />
                </ui-card>
              );
            })}
          </div>
        </Section>

        <Divider />
        <Section
          id="intents"
          title="Intents"
          note="What a transition is for. Each intent runs the spring the Motion tab picks for it; the thumb runs on the intent's own tokens."
          action={<ReplayButton onReplay={() => replay(intentsRef.current)} label="Replay all" />}
        >
          <div ref={intentsRef} className={tableScroller}>
            <table className={dataTable} aria-label="Motion intents">
              <thead><tr><th>Intent</th><th>Spring</th><th>Span<small>ms</small></th><th>Used for</th><th>Demo</th></tr></thead>
              <tbody>
                {(Object.keys(INTENTS) as IntentName[]).map((intent) => {
                  const spring = intentSpring(params, intent);
                  return (
                    <tr key={intent}>
                      <td className={nameCell}>{intent}</td>
                      <td>{cap(spring)}</td>
                      <td>{Math.round(liveMotion(params, spring).ms)}</td>
                      <td className={noteCell}>{INTENT_USES[intent]}</td>
                      <td className={thumbCell}><Thumb token={intent} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <Divider />
        <ComponentDemos />
    </Page>
  );
}
