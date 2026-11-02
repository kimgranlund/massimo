import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SPRINGS, SPRING_NAMES, INTENTS, BOUNCE_MAX, RESOLVED_SPRINGS, durations, easings, semanticDurations, semanticEasings,
  motionTokenVars, motionVars, resolveSpring, springAt, spanFactor, settleFactor, liveMotion, intentSpring, type SpringName, type IntentName,
} from '../tokens/motion/index.ts';
import { PARAMS, defaultParams, paramVar, validateTheme, type ParamName } from '../tokens/themes/index.ts';
import { motionProperties } from '../styles/motion.ts';

// Evaluate the motion CSS as a browser would: theme params as --ui-*, the derived variables and
// tokens from motionTokenVars(), var() substituted, then calc/clamp/max/sqrt/exp/cos/sin as JS.
function cssEnv(overrides: Partial<Record<ParamName, number>> = {}) {
  const decls: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...defaultParams, ...overrides })) decls[paramVar(k as ParamName)] = String(v);
  Object.assign(decls, motionTokenVars());
  const cache = new Map<string, number>();
  const evalExpr = (expr: string): number => {
    const sub = expr.replace(/var\((--[\w-]+)\)/g, (_, name) => String(get(name)));
    const js = sub.replaceAll('calc(', '(').replace(/(\d)ms\b/g, '$1')
      .replace(/\b(exp|cos|sin|sqrt)\(/g, 'Math.$1(').replace(/\bmax\(/g, 'Math.max(').replace(/\bmin\(/g, 'Math.min(')
      .replace(/\bclamp\(/g, 'clamp(');
    return Function('clamp', `return (${js})`)((lo: number, v: number, hi: number) => Math.min(Math.max(v, lo), hi)) as number;
  };
  // Registered <number> variables compute once, where declared (styles/motion.ts).
  const get = (name: string): number => {
    if (!cache.has(name)) {
      if (!(name in decls)) throw new Error(`undeclared ${name}`);
      cache.set(name, evalExpr(decls[name]));
    }
    return cache.get(name)!;
  };
  const ms = (token: string) => evalExpr(decls[`--durations-${token}`]);
  const curve = (token: string) => {
    const v = decls[`--easings-${token}`];
    return v.slice('linear('.length, -1).split(/, (?![^(]*\))/).map((p) => evalExpr(p));
  };
  return { ms, curve, get };
}
const split = (css: string) => css.slice('linear('.length, -1).split(/, (?![^(]*\))/);
const near = (a: number[], b: number[], tol: number) => a.every((v, i) => Math.abs(v - b[i]) <= tol);

test('motion params: global multipliers, per-spring duration and bounce, intent → spring', () => {
  assert.equal(defaultParams['motion-scale'], 1);
  assert.equal(defaultParams['motion-bounce'], 1);
  assert.equal(PARAMS['motion-scale'].min, 0);
  assert.deepEqual([PARAMS['motion-bounce'].min, PARAMS['motion-bounce'].max], [0, 1]);
  for (const [name, s] of Object.entries(SPRINGS)) {
    assert.equal(defaultParams[`spring-${name}-duration` as ParamName], s.duration);
    assert.equal(defaultParams[`spring-${name}-bounce` as ParamName], s.bounce);
    assert.equal(PARAMS[`spring-${name}-bounce` as ParamName].max, BOUNCE_MAX);
  }
  for (const [intent, spring] of Object.entries(INTENTS)) {
    const p = PARAMS[`intent-${intent}` as ParamName];
    assert.deepEqual([p.min, p.max, p.step, p.default], [0, 3, 1, SPRING_NAMES.indexOf(spring)]);
  }
  assert.ok(validateTheme('t', { 'spring-snappy-bounce': 0.4, 'intent-toggle': 3 }).ok);
  assert.ok(!validateTheme('t', { 'intent-toggle': 4 }).ok);
});

test('span: exact settle time at bounce 0, 0.15 and 0.3, at or past it elsewhere (rest within 0.25%)', () => {
  for (const b of [0, 0.15, 0.3]) assert.ok(Math.abs(spanFactor(b) - settleFactor(b)) < 1e-4, `bounce ${b}`);
  for (let b = 0; b <= BOUNCE_MAX + 1e-9; b += 0.01) {
    const span = spanFactor(b);
    for (let t = span; t < span + 3; t += 0.01) assert.ok(Math.abs(springAt(t, { duration: 1, bounce: b }) - 1) < 0.0025, `bounce ${b.toFixed(2)} not at rest after its span`);
  }
});

test('default params reproduce each spring: span and linear() samples (and the pre-live values)', () => {
  const env = cssEnv();
  // The springs before the params went live: settle ms and the first overshoot samples.
  const before = { quick: 294, smooth: 514, snappy: 419, bouncy: 737 };
  for (const [name, r] of Object.entries(RESOLVED_SPRINGS)) {
    const ms = env.ms(name);
    assert.equal(Math.round(ms), r.ms, `${name} duration`);
    assert.ok(Math.abs(ms - before[name as SpringName]) <= 1, `${name}: ${ms} vs ${before[name as SpringName]}`);
    assert.ok(near(env.curve(name), r.points, 1e-4), `${name} easing`);
  }
  // Intents at their default springs.
  for (const [intent, spring] of Object.entries(INTENTS)) {
    assert.ok(Math.abs(env.ms(intent) - env.ms(spring)) < 1e-9, `${intent} duration`);
    assert.ok(near(env.curve(intent), env.curve(spring), 1e-12), `${intent} easing`);
  }
});

test('live params: duration and bounce re-solve the spring exactly', () => {
  for (const [d, b] of [[0.5, 0.45], [0.12, 0.05], [1, 0.6], [0.3, 0.27]]) {
    const env = cssEnv({ 'spring-snappy-duration': d, 'spring-snappy-bounce': b });
    const exact = resolveSpring({ duration: d, bounce: b });
    assert.ok(Math.abs(env.ms('snappy') - d * spanFactor(b) * 1000) < 1e-6, `duration ${d}/${b}`);
    assert.ok(near(env.curve('snappy'), exact.points, 1e-4), `easing ${d}/${b}`);
    // The other springs are untouched.
    assert.ok(near(env.curve('bouncy'), RESOLVED_SPRINGS.bouncy.points, 1e-4));
  }
  // Effective bounce is clamped to BOUNCE_MAX.
  assert.ok(Math.abs(cssEnv({ 'spring-bouncy-bounce': 0.6, 'motion-bounce': 1 }).get('--motion-bouncy-b') - 0.6) < 1e-12);
});

test('motion-scale 0 makes every duration 0; 2 doubles it', () => {
  const zero = cssEnv({ 'motion-scale': 0 }), two = cssEnv({ 'motion-scale': 2 }), one = cssEnv();
  for (const name of [...SPRING_NAMES, ...Object.keys(INTENTS)]) {
    assert.equal(zero.ms(name), 0, name);
    assert.ok(Math.abs(two.ms(name) - 2 * one.ms(name)) < 1e-9, name);
  }
});

test('motion-bounce 0 gives each spring its critically damped twin: no overshoot', () => {
  const env = cssEnv({ 'motion-bounce': 0 });
  for (const [name, s] of Object.entries(SPRINGS)) {
    const flat = resolveSpring({ duration: s.duration, bounce: 0 });
    assert.equal(Math.round(env.ms(name)), flat.ms, name);
    const pts = env.curve(name);
    assert.ok(near(pts, flat.points, 1e-4), `${name} easing`);
    assert.ok(pts.every((y) => y <= 1 + 1e-9), `${name} overshoots at bounce 0`);
  }
  // The overshooting springs really do overshoot at bounce 1 (the multiplier is not vacuous).
  assert.ok(cssEnv().curve('snappy').some((y) => y > 1));
  // Half: bounce × 0.5.
  assert.ok(near(cssEnv({ 'motion-bounce': 0.5 }).curve('bouncy'), resolveSpring({ duration: 0.45, bounce: 0.15 }).points, 1e-4));
});

test('each intent mapping switch changes the resolved spring', () => {
  for (const intent of Object.keys(INTENTS) as IntentName[]) {
    SPRING_NAMES.forEach((spring, n) => {
      const params = { [`intent-${intent}`]: n } as Partial<Record<ParamName, number>>;
      const env = cssEnv(params);
      assert.ok(Math.abs(env.ms(intent) - RESOLVED_SPRINGS[spring].duration * spanFactor(RESOLVED_SPRINGS[spring].bounce) * 1000) < 1e-6, `${intent} → ${spring} duration`);
      assert.ok(near(env.curve(intent), RESOLVED_SPRINGS[spring].points, 1e-4), `${intent} → ${spring} easing`);
      assert.equal(intentSpring({ ...defaultParams, ...params }, intent), spring);
    });
  }
  // An intent follows its spring's live params.
  const env = cssEnv({ 'intent-feedback': 3, 'spring-bouncy-duration': 0.8 });
  assert.ok(Math.abs(env.ms('feedback') - env.ms('bouncy')) < 1e-9);
  assert.ok(Math.abs(env.ms('feedback') - 0.8 * spanFactor(0.3) * 1000) < 1e-6);
});

test('liveMotion (the jig) matches the CSS', () => {
  const p = { ...defaultParams, 'spring-smooth-duration': 0.6, 'spring-smooth-bounce': 0.2, 'motion-scale': 1.5, 'motion-bounce': 0.5 };
  const env = cssEnv(p);
  const live = liveMotion(p, 'smooth');
  assert.ok(Math.abs(live.ms - env.ms('smooth')) < 1e-6);
  assert.ok(near(live.points, env.curve('smooth'), 1e-4));
});

test('motion tokens: Panda tokens, semantic intents and canvas redeclarations agree; derived vars registered', () => {
  for (const s of SPRING_NAMES) {
    assert.match(durations[s].value, new RegExp(`--motion-${s}-span`));
    assert.equal(split(easings[s].value).length, 49);
  }
  for (const i of Object.keys(INTENTS) as IntentName[]) {
    assert.match(semanticDurations[i].value, new RegExp(`--motion-${i}-span`));
    assert.match(semanticEasings[i].value, new RegExp(`--motion-${i}-a`));
  }
  const vars = motionTokenVars();
  assert.equal(vars['--durations-toggle'], semanticDurations.toggle.value);
  assert.equal(vars['--durations-snappy'], durations.snappy.value);
  assert.ok(!('--durations-instant' in vars));
  assert.deepEqual(Object.keys(motionProperties).sort(), Object.keys(motionVars()).sort());
  assert.ok(Object.values(motionProperties).every((p) => p.syntax === '<number>' && p.inherits));
  // Static CSS: no value depends on anything but --ui-* params and other --motion-* variables.
  for (const v of Object.values(vars)) for (const [, name] of v.matchAll(/var\((--[\w-]+)\)/g)) assert.match(name, /^--(ui|motion)-/);
});

test('component recipes name motion intents, never springs', async () => {
  const { readFileSync, readdirSync } = await import('node:fs');
  const dir = new URL('../components/', import.meta.url);
  const files = ['recipe-parts.ts', ...readdirSync(dir, { recursive: true }).map(String).filter((f) => f.endsWith('.recipe.ts'))];
  const src = files.map((f) => readFileSync(new URL(f, dir), 'utf8')).join('\n');
  assert.doesNotMatch(src, /\{(durations|easings)\.(quick|smooth|snappy|bouncy)\}|t\('(quick|smooth|snappy|bouncy)'/);
  assert.match(src, /t\('toggle'/);
});
