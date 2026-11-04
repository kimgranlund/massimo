// The panel's Brand tab: edit the active brand in place (frame, anchors, faces, closed choices,
// signature) instead of authoring JSON. Every edit produces a new brand; the jig re-hydrates it
// (tokens/brand hydrate), so the brand stays the source and the canvas follows. Start from a worked
// brand or a blank one.
import { useState } from 'react';
import { DESCRIPTORS, EXAMPLE_BRANDS, FACE_CATALOGUE, GROUNDINGS, TERRITORIES, RELATIONS, SUBJECT_KINDS, brandCharacter, primaryTerritory, validateBrand, type Brand } from '@massimo/ui-kit/tokens';
import { ROLE_NAMES, isAnchorColor } from '@massimo/ui-kit/spectrum';
import { Field, Group, Segmented, Select, SelectControl, useEvent } from './wc.tsx';

const BLANK: Brand = { schemaVersion: 1, name: 'new-brand', subject: { name: 'New brand', audience: 'who it serves', primaryJob: 'what it helps them do', kind: 'product', sources: ['a source of visual character'] } };
const FRAME_SCALES = Object.values(DESCRIPTORS);
/** The option value for "none" / "from the frame" (a select's empty value would show its placeholder). */
const NONE = '-';
/** Where a scale lives in a brand (form, color.character, type.character, or top level). */
const scalePath = (id: string): ['form' | 'color' | 'type' | 'top', string] =>
  ['scale', 'density', 'space', 'curvature', 'corner', 'line', 'elevation'].includes(id) ? ['form', id]
  : ['vibrancy', 'harmony', 'neutral', 'emphasis'].includes(id) ? ['color', id]
  : id === 'type-scale' ? ['type', id] : ['top', id];

/** A text row: commits on change (blur or Enter), so the brand re-hydrates once per edit. */
function Text({ label, value, onValue }: { label: string; value: string; onValue: (v: string) => void }) {
  const ref = useEvent('change', (_el, d) => onValue(String(d.value)));
  return <Field label={label}><ui-input ref={ref} label={label} hide-label="" value={value} /></Field>;
}

export function BrandEditor({ brand, onBrand }: { brand: Brand | null; onBrand: (b: Brand) => void }) {
  return brand ? <BrandForm brand={brand} onBrand={onBrand} /> : <StartBrand onBrand={onBrand} />;
}

function StartBrand({ onBrand }: { onBrand: (b: Brand) => void }) {
  return (
    <Group title="Brand">
      <Select label="Start from" value="choose" options={[['choose', 'Choose…'], ['blank', 'A blank brand'], ...EXAMPLE_BRANDS.map((b) => [b.name, b.subject.name] as [string, string])]}
        onValue={(v) => { if (v !== 'choose') onBrand(structuredClone(v === 'blank' ? BLANK : EXAMPLE_BRANDS.find((b) => b.name === v)!)); }} />
    </Group>
  );
}

function BrandForm({ brand, onBrand }: { brand: Brand; onBrand: (b: Brand) => void }) {
  const [error, setError] = useState('');
  // Every edit: a deep copy changed at one path, validated before it is applied.
  const edit = (fn: (b: any) => void) => {
    const next = structuredClone(brand) as any;
    fn(next);
    const r = validateBrand(next);
    if (!r.ok) { setError(r.errors[0]); return; }
    setError(''); onBrand(r.brand);
  };
  const { character, from } = brandCharacter(brand);
  const t = primaryTerritory(brand);
  const anchors = brand.color?.anchors ?? [];
  const faceOptions: [string, string][] = [[NONE, 'Kit default'], ...FACE_CATALOGUE.map((f) => [f.id, `${f.family} · ${f.descriptor}`] as [string, string])];
  return (
    <>
      <Group title="Subject">
        <Text label="Name" value={brand.subject.name} onValue={(v) => edit((b) => { b.subject.name = v; b.name = v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'brand'; })} />
        <Text label="Audience" value={brand.subject.audience} onValue={(v) => edit((b) => { b.subject.audience = v; })} />
        <Text label="Primary job" value={brand.subject.primaryJob} onValue={(v) => edit((b) => { b.subject.primaryJob = v; })} />
        <Select label="Kind" value={brand.subject.kind} options={SUBJECT_KINDS.map((k) => [k, k])} onValue={(v) => edit((b) => { b.subject.kind = v; })} />
        <Text label="Sources" value={brand.subject.sources.join('; ')} onValue={(v) => edit((b) => { b.subject.sources = v.split(';').map((x) => x.trim()).filter(Boolean); })} />
      </Group>
      <Group title="Frame">
        <Select label="Grounding" value={brand.grounding?.primary.ref ?? NONE} options={[[NONE, 'None'], ...GROUNDINGS.map((g) => [g.id, g.title] as [string, string])]}
          onValue={(v) => edit((b) => { b.grounding = v !== NONE ? { primary: { ref: v, relation: b.grounding?.primary.relation ?? 'inherit' } } : undefined; })} />
        {brand.grounding && <Segmented label="Relation" value={brand.grounding.primary.relation} options={RELATIONS.map((r) => [r, r === 'react-against' ? 'Against' : r[0].toUpperCase() + r.slice(1)])} onValue={(v) => edit((b) => { b.grounding.primary.relation = v; })} />}
        <Select label="Territory" value={t?.ref ?? NONE} options={[[NONE, 'None'], ...TERRITORIES.map((x) => [x.id, x.title] as [string, string])]}
          onValue={(v) => edit((b) => {
            if (v === NONE) { b.territories = undefined; return; }
            const entry = TERRITORIES.find((x) => x.id === v)!;
            const keep = primaryTerritory(b);
            b.territories = [{ ...(keep ?? {}), name: keep?.name ?? entry.title, ref: v, primary: true, description: keep?.description ?? (entry as any).description }];
          })} />
        <Text label="Muse" value={brand.muse?.name ?? ''} onValue={(v) => edit((b) => { b.muse = v ? { kind: b.muse?.kind ?? 'work', name: v, take: b.muse?.take ?? 'a quality to take' } : undefined; })} />
        {brand.muse && <Text label="Take" value={brand.muse.take} onValue={(v) => edit((b) => { b.muse.take = v; })} />}
      </Group>
      <Group title="Anchors">
        {anchors.map((a, i) => (
          <AnchorRow key={i} anchor={a}
            onRole={(v) => edit((b) => { b.color.anchors[i].role = v; })}
            onValue={(v) => edit((b) => { b.color.anchors[i].value = v; })}
            onRemove={() => edit((b) => { b.color.anchors.splice(i, 1); if (!b.color.anchors.length) delete b.color.anchors; })} />
        ))}
        <AddAnchor onAdd={() => edit((b) => {
          const used = new Set((b.color?.anchors ?? []).map((x: any) => x.role));
          const role = ROLE_NAMES.find((r) => !used.has(r));
          if (!role) return;
          (b.color ??= {}).anchors = [...(b.color.anchors ?? []), { name: `${role} color`, value: '#3355aa', role }];
        })} />
      </Group>
      <Group title="Faces">
        {(['display', 'body', 'utility'] as const).map((role) => (
          <Select key={role} label={role[0].toUpperCase() + role.slice(1)} value={brand.type?.faces?.[role]?.ref ?? FACE_CATALOGUE.find((f) => f.family === brand.type?.faces?.[role]?.family)?.id ?? NONE} options={faceOptions}
            onValue={(v) => edit((b) => { b.type ??= {}; b.type.faces ??= {}; if (v !== NONE) b.type.faces[role] = { ref: v }; else delete b.type.faces[role]; })} />
        ))}
      </Group>
      <Group title="Character">
        {FRAME_SCALES.map((s) => {
          const [section, key] = scalePath(s.id);
          const own = section === 'form' ? brand.form?.[key] : section === 'color' ? brand.color?.character?.[key] : section === 'type' ? brand.type?.character?.[key] : s.id === 'iconography' ? brand.iconography?.set : (brand as any)[s.id];
          const inherited = character[s.id] && from[s.id] && !own ? ` (from ${from[s.id].split(' ')[0].replace(/^territories:/, '')})` : '';
          return (
            <Select key={s.id} label={`${s.title}${brand.signature?.scale === s.id ? ' ★' : ''}`} value={own ?? NONE}
              options={[[NONE, `Frame: ${character[s.id] ?? s.default}${inherited}`], ...s.values.map((v) => [v.name, v.name] as [string, string])]}
              onValue={(v) => edit((b) => {
                const pick = v !== NONE;
                const set = (o: any, k: string) => { if (pick) o[k] = v; else delete o[k]; };
                if (section === 'form') set((b.form ??= {}), key);
                else if (section === 'color') set(((b.color ??= {}).character ??= {}), key);
                else if (section === 'type') set(((b.type ??= {}).character ??= {}), key);
                else if (s.id === 'iconography') { if (pick) (b.iconography ??= {}).set = v; else if (b.iconography) delete b.iconography.set; }
                else set(b, s.id);
              })} />
          );
        })}
        <Select label="Signature" value={brand.signature?.scale ?? NONE} options={[[NONE, 'None'], ...FRAME_SCALES.map((s) => [s.id, s.title] as [string, string])]}
          onValue={(v) => edit((b) => { b.signature = v !== NONE ? { concept: DESCRIPTORS[v].concept, scale: v, reason: b.signature?.reason ?? 'why the brand pushes it' } : undefined; })} />
      </Group>
      {error && <Group title="Not applied"><p role="alert">{error}</p></Group>}
    </>
  );
}

/** A #rrggbb text entry with a live swatch; commits only valid colors. */
function AnchorColor({ value, onValue }: { value: string; onValue: (v: string) => void }) {
  const ref = useEvent('change', (_el, d) => { const v = String(d.value).trim().toLowerCase(); if (isAnchorColor(v)) onValue(v); });
  return <ui-input ref={ref} label="Color" hide-label="" value={value}><ui-swatch slot="leading" color={value} /></ui-input>;
}
type Anchor = NonNullable<NonNullable<Brand['color']>['anchors']>[number];
function AnchorRow({ anchor, onRole, onValue, onRemove }: { anchor: Anchor; onRole: (v: string) => void; onValue: (v: string) => void; onRemove: () => void }) {
  const remove = useEvent('click', () => onRemove());
  return (
    <Field label={anchor.name}>
      <SelectControl label={`${anchor.name} role`} value={anchor.role} options={ROLE_NAMES.map((r) => [r, r])} onValue={onRole} />
      <AnchorColor value={anchor.value} onValue={onValue} />
      <ui-button ref={remove} aria-label={`Remove ${anchor.name}`}><i slot="leading" name="x" /></ui-button>
    </Field>
  );
}
function AddAnchor({ onAdd }: { onAdd: () => void }) {
  const add = useEvent('click', () => onAdd());
  return <Field label="Add"><ui-button ref={add}><i slot="leading" name="plus" />Anchor</ui-button></Field>;
}
