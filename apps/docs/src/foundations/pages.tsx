// The foundation pages. Their numbers come from the kit's resolvers and exports, and their specimens
// use its components and tokens, so a change to the system changes these pages with it.
import { useState, type ComponentType, type ReactNode } from 'react';
import { css } from '../../styled-system/css/index.js';
import '@massimo/ui-kit/components/btg/element';
import { CARD_PADDINGS, CONTAINERS, resolveContainer, resolveControl, resolveIcon, resolveSection, type ContainerLevel } from '@massimo/ui-kit/tokens/geometry/resolve';
import { resolveType, TYPE_ROLES, type TypeRoleName } from '@massimo/ui-kit/tokens/typography/resolve';
import { ELEVATION } from '@massimo/ui-kit/tokens/elevation/index';
import { INTENTS, type IntentName } from '@massimo/ui-kit/tokens/motion/index';
import { SCALE_ROLES } from '@massimo/ui-kit/tokens/colors/spectrum/roles';
import { Live, SystemBar, useSystem, type System } from './system.tsx';
import { Accessibility } from './accessibility.tsx';
import { Theming } from './theming.tsx';
import { useEvent } from '../wc.ts';

export const s = {
  title: css({ textStyle: 'heading-1' }),
  display: css({ textStyle: 'heading-1', md: { textStyle: 'display' } }),
  lead: css({ textStyle: 'body-lg', marginBlockStart: '3', maxWidth: '[44rem]' }),
  section: css({ display: 'flex', flexDirection: 'column', gap: '4', marginBlockStart: '10' }),
  h2: css({ textStyle: 'heading-2' }),
  h3: css({ textStyle: 'heading-3' }),
  body: css({ textStyle: 'body-md', maxWidth: '[44rem]' }),
  code: css({ textStyle: 'code', padding: '4', borderRadius: 'lg', bg: 'bg.muted', overflowX: 'auto', margin: '0', whiteSpace: 'pre' }),
  inline: css({ textStyle: 'code' }),
  preview: css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3', padding: '6', borderRadius: 'lg', bg: 'bg.subtle', minWidth: '0', overflowX: 'auto' }),
  scroller: css({ overflowX: 'auto', maxWidth: 'full' }),
  table: css({
    width: 'full', borderCollapse: 'collapse', textStyle: 'body-sm',
    '& th': { textStyle: 'group-kicker', textAlign: 'start', padding: '2' },
    '& td': { padding: '2', verticalAlign: 'top', fontVariantNumeric: 'tabular-nums' },
    '& tbody tr:nth-child(odd)': { bg: 'bg.subtle' },
  }),
  steps: css({ display: 'flex', flexDirection: 'column', gap: '3', margin: '0', padding: '0', listStyleType: 'none' }),
  step: css({ display: 'grid', gridTemplateColumns: '[2.5rem minmax(0, 1fr)]', gap: '3', padding: '4', borderRadius: 'lg', bg: 'bg.subtle', md: { gridTemplateColumns: '[2.5rem minmax(0, 1fr) 11rem]' } }),
  index: css({ textStyle: 'heading-3', color: 'primary.fg' }),
  stepTitle: css({ textStyle: 'title' }),
  stepBody: css({ textStyle: 'body-sm', marginBlockStart: '1' }),
  eq: css({ textStyle: 'code', gridColumn: '2', md: { gridColumn: '3', textAlign: 'end' } }),
  cardRow: css({ width: 'full', maxWidth: '[26rem]' }),
  cards: css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))', gap: '3' }),
  link: css({ display: 'flex', flexDirection: 'column', gap: '1', padding: '4', borderRadius: 'lg', bg: 'bg.subtle', textDecoration: 'none', '&:hover': { bg: 'bg.muted' } }),
  linkTitle: css({ textStyle: 'title' }),
  linkNote: css({ textStyle: 'body-sm' }),
  ramp: css({ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', borderRadius: 'md', overflow: 'hidden', minHeight: '10' }),
  rampRow: css({ display: 'grid', gridTemplateColumns: '[6rem minmax(0, 1fr)]', gap: '3', alignItems: 'center', textStyle: 'label' }),
  specimen: css({ display: 'flex', flexDirection: 'column', gap: '1', paddingBlock: '3' }),
  tag: css({ textStyle: 'code' }),
  mover: css({ width: '10', height: '10', borderRadius: 'md', bg: 'primary.solid', transitionProperty: 'transform' }),
  track: css({ display: 'flex', alignItems: 'center', gap: '4', flexWrap: 'wrap' }),
};

const TYPE_CLASS: Record<TypeRoleName, string> = {
  display: css({ textStyle: 'display' }), 'heading-1': css({ textStyle: 'heading-1' }), 'heading-2': css({ textStyle: 'heading-2' }), 'heading-3': css({ textStyle: 'heading-3' }),
  'body-lg': css({ textStyle: 'body-lg' }), 'body-md': css({ textStyle: 'body-md' }), 'body-sm': css({ textStyle: 'body-sm' }), label: css({ textStyle: 'label' }), title: css({ textStyle: 'title' }),
  'control-md': css({ textStyle: 'control-md' }), 'control-sm': css({ textStyle: 'control-sm' }), 'section-kicker': css({ textStyle: 'section-kicker' }), 'group-kicker': css({ textStyle: 'group-kicker' }), code: css({ textStyle: 'code' }),
};

export const px = (n: number) => `${Math.round(n * 100) / 100}px`;
export const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <div className={s.scroller}><table className={s.table}>
    <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
  </table></div>
);
export const Page = ({ title, lead, display, children }: { title: string; lead: string; display?: boolean; children: ReactNode }) => (
  <article data-page="">
    <h1 className={display ? s.display : s.title}>{title}</h1>
    <p className={s.lead}>{lead}</p>
    {children}
  </article>
);
export const Section = ({ title, children }: { title: string; children: ReactNode }) => <section className={s.section}><h2 className={s.h2}>{title}</h2>{children}</section>;
const inputs = (x: System) => ({ unit: x.unit, density: x.density, radiusScale: x.radiusScale });

const CardSpecimen = ({ system }: { system: System }) => (
  <Live system={system} className={s.cardRow}>
    <ui-container preset="card" padding="md" surface="raised"><ui-section>
      <ui-row><strong>Files</strong><ui-badge>3</ui-badge></ui-row>
      <span>Everything here is sized from one number.</span>
      <ui-row><ui-button variant="primary">Rename</ui-button><ui-button>Share</ui-button></ui-row>
    </ui-section></ui-container>
  </Live>
);

function Story() {
  const [system, setSystem] = useSystem();
  const g = inputs(system), c = resolveControl(g), card = resolveContainer('card-md', g);
  const steps: [string, string, string, string][] = [
    ['One unit', 'u is the only free length. Size a subtree by setting it, and everything inside follows.', 'u', px(system.unit)],
    ['Type', 'Text starts from a 10px floor, so small interfaces stay readable.', 'F = 10 + u', px(c.fontSize)],
    ['Slot', 'Icons and adornments sit in a fixed slot. Density never touches it.', 'S = 6u', px(c.slot)],
    ['Control', 'Density picks the inset around the slot, and that sets every control height.', 'h = S + 2I', px(c.height)],
    ['Card', 'A card steps up from the same unit, and its corners follow its padding.', `p ${px(card.padding)}`, `R ${px(card.radius)}`],
  ];
  return (
    <Page display title="Every length comes from one unit" lead="Massimo is a design system for the web and React. Lengths derive from u, colors are roles on 12-step ramps, and type sizes are steps on one ratio. Change the inputs below and the card re-solves.">
      <Section title="See it re-solve">
        <SystemBar system={system} onChange={setSystem} />
        <div className={s.preview}><CardSpecimen system={system} /></div>
      </Section>
      <Section title="From one number to a card">
        <ol className={s.steps}>
          {steps.map(([title, body, eq, val], i) => (
            <li key={title} className={s.step}>
              <span className={s.index} aria-hidden="true">{i + 1}</span>
              <div><div className={s.stepTitle}>{title}</div><p className={s.stepBody}>{body}</p></div>
              <span className={s.eq}>{eq} · {val}</span>
            </li>
          ))}
        </ol>
      </Section>
      <Section title="Keep reading">
        <div className={s.cards}>
          {FOUNDATIONS.filter((f) => f.slug !== 'overview').map((f) => <a key={f.slug} className={s.link} href={`#/${f.slug}`}><span className={s.linkTitle}>{f.title}</span><span className={s.linkNote}>{f.note}</span></a>)}
          <a className={s.link} href="#/components"><span className={s.linkTitle}>Components</span><span className={s.linkNote}>Every component, with live examples and its API.</span></a>
        </div>
      </Section>
    </Page>
  );
}

function Start() {
  return (
    <Page title="Get started" lead="The kit is plain web components with React renderers that share their styles. Use either, or both.">
      <Section title="Install">
        <p className={s.body}>The package isn't on npm yet. Today it lives in this repository as the workspace <code className={s.inline}>@massimo/ui-kit</code>, so an app in the workspace depends on it directly.</p>
        <pre className={s.code} tabIndex={0}><code>{'{\n  "dependencies": { "@massimo/ui-kit": "*" }\n}'}</code></pre>
      </Section>
      <Section title="Web components">
        <p className={s.body}>Import the stylesheet once, then each element you use. Importing an element registers it.</p>
        <pre className={s.code} tabIndex={0}><code>{"import '@massimo/ui-kit/css';\nimport '@massimo/ui-kit/icons';\nimport '@massimo/ui-kit/components/button/element';\n\n// <ui-button variant=\"primary\">Save</ui-button>"}</code></pre>
      </Section>
      <Section title="React">
        <p className={s.body}>React components render native HTML with the same anatomy and styles.</p>
        <pre className={s.code} tabIndex={0}><code>{"import '@massimo/ui-kit/css';\nimport { Button } from '@massimo/ui-kit/components/button/react';\n\n<Button variant=\"primary\">Save</Button>"}</code></pre>
      </Section>
      <Section title="Your own styles">
        <p className={s.body}>Use the Panda preset to style an app with the same tokens. List <code className={s.inline}>@pandacss/preset-base</code> too, or utilities won't resolve.</p>
        <pre className={s.code} tabIndex={0}><code>{"import { defineConfig } from '@pandacss/dev';\nimport { uiKitPreset } from '@massimo/ui-kit/preset';\n\nexport default defineConfig({\n  presets: ['@pandacss/preset-base', uiKitPreset],\n  strictTokens: true,\n});"}</code></pre>
      </Section>
    </Page>
  );
}

function Geometry() {
  const [system, setSystem] = useSystem();
  const g = inputs(system), c = resolveControl(g);
  return (
    <Page title="Unit and density" lead="u sets the size of everything. Density changes the insets, padding and gaps around content, and never changes type, slots or icons.">
      <Section title="Try it">
        <SystemBar system={system} onChange={setSystem} />
        <div className={s.preview}><Live system={system}><ui-button variant="primary">Save</ui-button> <ui-button>Cancel</ui-button></Live></div>
      </Section>
      <Section title="A control at these inputs">
        <Table head={['Length', 'Formula', 'Value']} rows={[
          ['Font size', '10 + u', px(c.fontSize)], ['Slot', '6u', px(c.slot)], ['Inset', 'by density', px(c.inset)], ['Height', '6u + 2 × inset', px(c.height)], ['Radius', 'min(3u × scale, height / 2)', px(c.radius)],
          ...(['sm', 'md', 'lg'] as const).map((k) => [`Icon ${k}`, 'follows the text, capped at the slot', px(resolveIcon(c.fontSize, system.unit, k, c.slot))]),
        ]} />
      </Section>
    </Page>
  );
}

function Type() {
  return (
    <Page title="Typography" lead="Type works in three layers: faces, voices and roles. A role sets the size, weight and color, so components name a role and never a font size.">
      <Section title="Roles">
        {(Object.keys(TYPE_ROLES) as TypeRoleName[]).map((role) => {
          const t = resolveType(role);
          return <div key={role} className={s.specimen}><span className={TYPE_CLASS[role]}>{TYPE_ROLES[role].label}</span><span className={s.tag}>{role} · {px(t.size)} / {px(t.lineHeight)} · {t.weight}</span></div>;
        })}
      </Section>
    </Page>
  );
}

const STEPS: [string, string][] = [['1–2', 'Page and subtle backgrounds'], ['3–5', 'Tinted fills and their hover states'], ['6–8', 'Borders'], ['9–10', 'Solids and their hover'], ['11–12', 'Text']];
function Color() {
  return (
    <Page title="Color" lead="Each role is a 12-step ramp with separate light and dark values. Components paint with roles only, so a theme recolors everything at once. Pick a theme above to see these change.">
      <Section title="Roles">
        {SCALE_ROLES.map((role) => (
          <div key={role} className={s.rampRow}>
            <span>{role}</span>
            <div className={s.ramp} role="img" aria-label={`${role} ramp, steps 1 to 12`}>
              {Array.from({ length: 12 }, (_, i) => <span key={i} style={{ background: `var(--colors-${role}-${i + 1})` }} />)}
            </div>
          </div>
        ))}
      </Section>
      <Section title="What each step is for">
        <Table head={['Steps', 'Use']} rows={STEPS} />
      </Section>
      <Section title="Brand colors">
        <p className={s.body}>A theme can pin a brand's exact colors to a role. The ramp settles around the pin, so steps 9 to 12 stay one curve. Two dials shape those steps alone: <code className={s.inline}>keyIntensity</code> scales their chroma, and <code className={s.inline}>keyDepth</code> moves their tone.</p>
        <p className={s.body}>Step contrast is solved with APCA, not WCAG 2 ratios. See <a href="#/accessibility">Accessibility</a> for what that means for your product.</p>
      </Section>
    </Page>
  );
}

function Containers() {
  const [system, setSystem] = useSystem();
  const g = inputs(system);
  const levels = Object.keys(CONTAINERS) as ContainerLevel[];
  return (
    <Page title="Containers" lead="One container covers every level, from a group of buttons to a page. Padding steps down with depth and corners stay concentric.">
      <Section title="The ladder">
        <SystemBar system={system} onChange={setSystem} />
        <Table head={['Level', 'Padding', 'Radius']} rows={levels.map((l) => { const r = resolveContainer(l, g); return [l, px(r.padding), px(r.radius)]; })} />
      </Section>
      <Section title="Cards and sections">
        <p className={s.body}>A card has no padding of its own: a section supplies it. A section of size c sits inside the card's padding p and pads c, so its text always lands on p. Each cell shows the section's inset, then its radius.</p>
        <Table head={['Card', ...CARD_PADDINGS.map((c) => `Section ${c}`)]} rows={CARD_PADDINGS.map((card) => {
          const r = resolveContainer(`card-${card}`, g);
          return [card, ...CARD_PADDINGS.map((c) => { const x = resolveSection({ padding: r.edge, radius: r.radius }, c, g); return `${px(x.inset)} · ${px(x.radius)}`; })];
        })} />
      </Section>
    </Page>
  );
}

function Elevation() {
  return (
    <Page title="Elevation" lead="Six levels, each a fill, a shadow and a layer. Page, panel and card differ by fill alone, and shadows are tinted by the neutral, never black.">
      <Section title="Surfaces">
        <div className={s.preview}>
          {(['panel', 'card', 'raised'] as const).map((surface) => <ui-container key={surface} preset="card" padding="md" surface={surface}><ui-section><span>{surface}</span></ui-section></ui-container>)}
        </div>
      </Section>
      <Section title="Levels">
        <Table head={['Level', 'Fill', 'Shadow', 'Used by']} rows={Object.entries(ELEVATION).map(([name, e]) => [name, e.fill, `${e.dp}dp`, e.uses])} />
      </Section>
    </Page>
  );
}

function Intent({ intent }: { intent: IntentName }) {
  const [on, setOn] = useState(false);
  const ref = useEvent('click', () => setOn((v) => !v));
  return (
    <div className={s.track}>
      <ui-button ref={ref}>{intent}</ui-button>
      <span className={s.mover} style={{ transform: on ? 'translateX(6rem)' : 'none', transitionDuration: `var(--durations-${intent})`, transitionTimingFunction: `var(--easings-${intent})` }} />
    </div>
  );
}
const INTENT_NOTE: Record<IntentName, string> = { feedback: 'Hover, press, selection and validity', toggle: 'A state flip that moves something', reveal: 'Something appearing or growing', emphasis: 'Drawing attention, with visible overshoot' };
function Motion() {
  return (
    <Page title="Motion" lead="Components name what a transition is for, and that intent picks a spring. A theme can remap intents without touching a component. Reduced-motion settings are honored.">
      <Section title="Intents">
        {(Object.keys(INTENTS) as IntentName[]).map((i) => <Intent key={i} intent={i} />)}
        <Table head={['Intent', 'Spring', 'Use']} rows={(Object.keys(INTENTS) as IntentName[]).map((i) => [i, INTENTS[i], INTENT_NOTE[i]])} />
      </Section>
    </Page>
  );
}

export interface Foundation { slug: string; title: string; note: string; section: 'System' | 'Guides'; Page: ComponentType }
export const FOUNDATIONS: Foundation[] = [
  { slug: 'overview', section: 'System', title: 'Overview', note: 'How one unit produces the whole system.', Page: Story },
  { slug: 'get-started', section: 'System', title: 'Get started', note: 'Use the kit with web components or React.', Page: Start },
  { slug: 'unit-and-density', section: 'System', title: 'Unit and density', note: 'The inputs behind every length.', Page: Geometry },
  { slug: 'typography', section: 'System', title: 'Typography', note: 'Faces, voices and roles.', Page: Type },
  { slug: 'color', section: 'System', title: 'Color', note: 'Ramps, roles and brand colors.', Page: Color },
  { slug: 'containers', section: 'System', title: 'Containers', note: 'The ladder, cards and sections.', Page: Containers },
  { slug: 'elevation', section: 'System', title: 'Elevation', note: 'Fills, shadows and layers.', Page: Elevation },
  { slug: 'motion', section: 'System', title: 'Motion', note: 'Intents and springs.', Page: Motion },
  { slug: 'theming', section: 'Guides', title: 'Theming and brands', note: 'A few inputs produce a whole theme.', Page: Theming },
  { slug: 'accessibility', section: 'Guides', title: 'Accessibility', note: 'What the system guarantees and what you own.', Page: Accessibility },
];
