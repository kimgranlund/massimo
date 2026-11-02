import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SPRINGS, INTENTS, RESOLVED_SPRINGS, durations, easings, semanticDurations, semanticEasings, motionTokenVars, resolveSpring, flatSpring } from '../tokens/motion/index.ts';
import { PARAMS, defaultParams } from '../tokens/themes/params.ts';

// Evaluate a token value as CSS would, with the motion params substituted (calc → JS arithmetic).
const evalCss = (css: string, scale: number, bounce: number) => {
  const js = css.replaceAll('var(--ui-motion-scale)', String(scale)).replaceAll('var(--ui-motion-bounce)', String(bounce)).replaceAll('calc', '').replaceAll('ms', '');
  return Function(`return (${js})`)() as number;
};
const easingPoints = (css: string, bounce: number) =>
  css.slice('linear('.length, -1).split(/, (?![^(]*\))/).map((p) => evalCss(p, 1, bounce));

test('motion params: scale and bounce, default 1, in PARAMS', () => {
  assert.equal(defaultParams['motion-scale'], 1);
  assert.equal(defaultParams['motion-bounce'], 1);
  assert.equal(PARAMS['motion-scale'].min, 0);
  assert.deepEqual([PARAMS['motion-bounce'].min, PARAMS['motion-bounce'].max], [0, 1]);
});

test('defaults reproduce each spring exactly (settle time and linear() samples)', () => {
  for (const [name, r] of Object.entries(RESOLVED_SPRINGS)) {
    assert.equal(evalCss(durations[name as keyof typeof durations].value, 1, 1), r.ms, `${name} duration`);
    assert.deepEqual(easingPoints(easings[name as keyof typeof easings].value, 1).map((x) => Math.round(x * 1e4) / 1e4), r.points, `${name} easing`);
  }
});

test('motion-scale 0 makes every duration 0; 2 doubles it', () => {
  for (const name of Object.keys(SPRINGS)) {
    const v = durations[name as keyof typeof durations].value;
    assert.equal(evalCss(v, 0, 1), 0, name);
    assert.equal(evalCss(v, 2, 1), 2 * RESOLVED_SPRINGS[name as keyof typeof SPRINGS].ms, name);
  }
});

test('motion-bounce 0 gives the critically damped twin: no overshoot', () => {
  for (const [name, s] of Object.entries(SPRINGS)) {
    const flat = resolveSpring(flatSpring(s));
    assert.equal(evalCss(durations[name as keyof typeof durations].value, 1, 0), flat.ms, name);
    const pts = easingPoints(easings[name as keyof typeof easings].value, 0);
    assert.ok(pts.every((y) => y <= 1 + 1e-9), `${name} overshoots at bounce 0`);
  }
  // The overshooting springs really do overshoot at bounce 1 (the blend is not vacuous).
  assert.ok(easingPoints(easings.snappy.value, 1).some((y) => y > 1));
});

test('intents map to their springs (Panda semantic tokens and canvas redeclarations)', () => {
  assert.deepEqual(INTENTS, { feedback: 'quick', toggle: 'snappy', reveal: 'smooth', emphasis: 'bouncy' });
  for (const [intent, spring] of Object.entries(INTENTS)) {
    assert.equal(semanticDurations[intent as keyof typeof INTENTS].value, `{durations.${spring}}`);
    assert.equal(semanticEasings[intent as keyof typeof INTENTS].value, `{easings.${spring}}`);
  }
  const vars = motionTokenVars();
  assert.equal(vars['--durations-toggle'], 'var(--durations-snappy)');
  assert.equal(vars['--durations-snappy'], durations.snappy.value);
  assert.ok(!('--durations-instant' in vars));
});

test('styles/motion.ts names intents, never springs', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../styles/motion.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(src, /\{(durations|easings)\.(quick|smooth|snappy|bouncy)\}|t\('(quick|smooth|snappy|bouncy)'/);
  assert.match(src, /t\('toggle'/);
});
