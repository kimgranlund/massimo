// The worked brands (tokens/brand/examples/*.json): Swiss International in a harbor, mingei in a
// workshop, Bauhaus at night. The jig's Brand page offers them; test/brand.test.ts holds them valid.
import fjord from './examples/fjord-ledger.json' with { type: 'json' };
import kiln from './examples/kiln-and-cup.json' with { type: 'json' };
import night from './examples/night-signal.json' with { type: 'json' };
import type { Brand } from './index.ts';

export const EXAMPLE_BRANDS = [fjord, kiln, night] as unknown as Brand[];
