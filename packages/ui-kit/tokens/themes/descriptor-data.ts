// The descriptor scales as data (contracts/domains/<domain>.json `descriptors`), apart from the
// resolvers in descriptors.ts so the theme validator can read them without a cycle.
import geometry from '../../contracts/domains/geometry.json' with { type: 'json' };
import typography from '../../contracts/domains/typography.json' with { type: 'json' };
import color from '../../contracts/domains/color.json' with { type: 'json' };
import motion from '../../contracts/domains/motion.json' with { type: 'json' };

export type InputValue = number | string;
export type DescriptorDomain = 'geometry' | 'typography' | 'color' | 'motion';
export interface DescriptorValue { name: string; set: Record<string, InputValue>; means: string }
export interface DescriptorScale { id: string; concept: string; title: string; reads: string; default: string; inputs: string[]; values: DescriptorValue[]; domain: DescriptorDomain }

const MANIFESTS = { geometry, typography, color, motion } as unknown as Record<DescriptorDomain, { descriptors: Omit<DescriptorScale, 'domain'>[] }>;
/** Every descriptor scale, keyed by id, with the domain that owns it. */
export const DESCRIPTORS: Record<string, DescriptorScale> = Object.fromEntries(
  (Object.keys(MANIFESTS) as DescriptorDomain[]).flatMap((domain) => MANIFESTS[domain].descriptors.map((d) => [d.id, { ...d, domain } as DescriptorScale])));
