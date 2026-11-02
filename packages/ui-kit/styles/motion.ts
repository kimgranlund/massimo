// Motion foundations: the derived --motion-* variables the spring and intent tokens read
// (tokens/motion/index.ts, motionVars()), declared on the root next to the tokens, and their
// registration as <number> so each computes to a number where it is declared. Unregistered, every
// var() in a linear() sample would expand to the whole chain of expressions behind it.
import { defineGlobalStyles } from '@pandacss/dev';
import { motionVars } from '../tokens/motion/index.ts';

const VARS = motionVars() as Record<`--${string}`, string>;

export const motion = defineGlobalStyles({
  // Not ':root': a shared key would replace the theme parameters (themeCss) instead of merging.
  ':where(:root)': VARS,
});

/** @property registrations for the derived motion variables (Panda globalVars). */
export const motionProperties = Object.fromEntries(
  Object.keys(VARS).map((k) => [k, { syntax: '<number>', inherits: true, initialValue: '0' }]),
);
