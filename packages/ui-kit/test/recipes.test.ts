// Component slot recipes (components/<name>/<name>.recipe.ts): each manifest that names one has a
// recipe per component node, registered in the preset, whose slots equal the node's parts; the web
// components put the generated recipe classes on their host and parts.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { manifests, buildGraph, record, fromManifest } from '../scripts/registry-lib.ts';
import { uiKitPreset } from '../preset.ts';

const graph = buildGraph();
const registered: Record<string, any> = (uiKitPreset as any).theme.slotRecipes;
const recipeManifests = manifests().filter(({ manifest }) => manifest.styleSource.format === 'panda-slot-recipe');

/** The recipe slot a part maps to: the last [data-part=x] (or [data-x]) in its selector. */
export function slotOf(partId: string): string {
  const selector: string = record(partId, graph).selector;
  const attrs = [...selector.matchAll(/\[data-([a-z-]+)(?:=([a-z-]+))?\]/g)];
  const [, name, value] = attrs.at(-1) ?? [];
  if (!name) throw new Error(`${partId}: no data-part in ${selector}`);
  return name === 'part' ? value : name;
}

/** Slots a component node's recipe must have: root plus one per owned part. */
const expectedSlots = (id: string) => ['root', ...graph.edges.filter((e) => e.from === id && e.relation === 'ownsPart').map((e) => slotOf(e.to))];

/** Differences between a recipe's slots and a node's parts (empty when they agree). */
export function slotMismatch(id: string, recipe: { slots: readonly string[] }) {
  const want = new Set(expectedSlots(id)), have = new Set(recipe.slots);
  return [...[...want].filter((s) => !have.has(s)).map((s) => `missing ${s}`), ...[...have].filter((s) => !want.has(s)).map((s) => `extra ${s}`)];
}

test('migrated folders exist: at least one manifest names a slot recipe', () => {
  assert.ok(recipeManifests.length > 0);
});

test("each manifest's parts equal its recipe's slots, and every recipe is registered in the preset", async () => {
  for (const { path, manifest } of recipeManifests) {
    const mod = await import(`../${fromManifest(path, manifest.styleSource.module)}`);
    for (const node of manifest.nodes.filter((n: any) => n.kind === 'component')) {
      const name = node.id.slice('component:'.length);
      const recipe = mod[name];
      assert.ok(recipe, `${path}: ${manifest.styleSource.module} exports no recipe ${name}`);
      assert.deepEqual(slotMismatch(node.id, recipe), [], `${node.id}: parts vs recipe slots`);
      // Registered under its name, or another key when the name is a reserved word (switch → switchRecipe).
      assert.ok(Object.values(registered).includes(recipe), `${name} is registered in the preset (theme.slotRecipes)`);
    }
  }
});

test('the slot check bites: an extra or a missing slot is reported', () => {
  assert.deepEqual(slotMismatch('component:chip', { slots: ['root', 'leading', 'prefix', 'contents', 'suffix', 'trailing', 'remove', 'halo'] }), ['extra halo']);
  assert.deepEqual(slotMismatch('component:chip', { slots: ['root', 'leading', 'prefix', 'contents', 'suffix', 'trailing'] }), ['missing remove']);
  assert.equal(slotOf('part:chip-remove'), 'remove');
  assert.equal(slotOf('part:slot-leading'), 'leading');
});

test('web components carry the recipe classes on host and parts; variant classes follow attributes, author classes stay', async () => {
  await import('../components/btg/btg.element.ts');
  const chip = document.createElement('ui-chip') as any;
  chip.className = 'mine';
  chip.innerHTML = '<i slot="leading" name="check"></i>Design';
  document.body.append(chip);
  await tick();
  assert.ok(chip.classList.contains('ui-chip__root') && chip.classList.contains('ui-chip__root--selectable_false'));
  assert.ok(chip.querySelector(':scope > [data-part=leading]').classList.contains('ui-chip__leading'));
  assert.ok(chip.querySelector(':scope > [data-part=contents]').classList.contains('ui-chip__contents'));
  chip.selectable = true;
  chip.removable = true;
  await tick();
  assert.ok(chip.classList.contains('ui-chip__root--selectable_true'));
  assert.ok(!chip.classList.contains('ui-chip__root--selectable_false'));
  assert.ok(chip.classList.contains('mine'), 'author class kept');
  assert.ok(chip.querySelector('[data-remove]').classList.contains('ui-chip__remove'));
  chip.remove();
});

test('CSS-only container tags get their recipes as tag rules: base and default variant on the tag, other variants on [attr=value]', async () => {
  const { card, group, containerTags } = await import('../components/container/container.recipe.ts');
  const { tagRules } = await import('../components/recipe-parts.ts');
  const tags = Object.keys(containerTags);
  for (const t of ['ui-group', 'ui-collection', 'ui-card', 'ui-panel', 'ui-region', 'ui-page', 'ui-card[padding=xs]', 'ui-card[padding=sm]', 'ui-card[padding=lg]', 'ui-card[padding=xl]']) assert.ok(tags.includes(t), t);
  assert.ok(!tags.includes('ui-card[padding=md]'), 'the default variant is on the bare tag');
  assert.equal(containerTags['ui-card']['--cp'], 'calc(var(--ui-pad-card-md) * (0.5 + 0.5 * var(--ui-density)))', 'the theme ladder × the density factor');
  assert.equal(containerTags['ui-card'].padding, (card.base as any).root.padding, 'same style objects as the recipe');
  assert.deepEqual(containerTags['ui-card[padding=sm]'], (card.variants as any).padding.sm.root);
  assert.deepEqual(containerTags['ui-group'], (group.base as any).root);
  // In the preset's global CSS; only root-only recipes can be aliased.
  assert.equal((uiKitPreset as any).globalCss['ui-card[padding=xl]']['--cp'], 'calc(var(--ui-pad-card-xl) * (0.5 + 0.5 * var(--ui-density)))');
  assert.throws(() => tagRules('ui-x', { slots: ['root', 'label'] }), /root-only/);
});

test('--ui-gap does not inherit, so the gap attribute applies to its own element only', () => {
  assert.deepEqual((uiKitPreset as any).globalVars['--ui-gap'], { syntax: '*', inherits: false });
});
