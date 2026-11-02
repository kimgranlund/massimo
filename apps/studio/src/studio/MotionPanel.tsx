// The jig's Motion tab: the global motion multipliers, each spring's duration and bounce, and the
// spring each intent runs (tokens/motion, docs/specs/motion.md). Every control is a theme param in
// PARAMS, so it flows into the canvas stylesheet, Copy and Reset with no extra wiring.
import { INTENTS, PARAMS, SPRING_NAMES, liveMotion, type IntentName, type ParamName, type SpringName, type ThemeParams } from '@massimo/ui-kit/tokens';
import { Group, Range, Select } from './wc.tsx';

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const SPRING_OPTIONS = SPRING_NAMES.map((s, i) => [String(i), cap(s)] as [string, string]);

export function MotionPanel({ params, setParam }: { params: ThemeParams; setParam: (name: ParamName, value: number) => void }) {
  const range = (k: ParamName, label: string, format?: (v: number) => string) => {
    const p = PARAMS[k];
    return <Range key={k} label={label} value={params[k]} min={p.min} max={p.max} step={p.step} format={format} onValue={(v) => setParam(k, v)} />;
  };
  return (
    <>
      <Group title="Global">
        {range('motion-scale', 'Duration scale (×)')}
        {range('motion-bounce', 'Bounce scale (×)')}
      </Group>
      {SPRING_NAMES.map((name: SpringName) => (
        <Group key={name} title={`${cap(name)} · ${Math.round(liveMotion(params, name).ms)}ms`}>
          {range(`spring-${name}-duration`, 'Duration (s)', (v) => v.toFixed(2))}
          {range(`spring-${name}-bounce`, 'Bounce', (v) => v.toFixed(2))}
        </Group>
      ))}
      <Group title="Intents">
        {(Object.keys(INTENTS) as IntentName[]).map((intent) => {
          const k: ParamName = `intent-${intent}`;
          return <Select key={k} label={cap(intent)} value={String(params[k])} options={SPRING_OPTIONS} onValue={(v) => setParam(k, Number(v))} />;
        })}
      </Group>
    </>
  );
}
