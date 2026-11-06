// The manifests and examples files, read at build time. There are no hand-written component pages.
import { buildPages, tagModulesOf, type ExamplesFile, type Manifest } from './model.ts';
import { reactNames } from './react-code.ts';

const manifestFiles = import.meta.glob<Manifest>('../../../packages/ui-kit/components/*/*.manifest.json', { eager: true, import: 'default' });
const exampleFiles = import.meta.glob<ExamplesFile>('../../../packages/ui-kit/components/*/*.examples.json', { eager: true, import: 'default' });
const elements = import.meta.glob('../../../packages/ui-kit/components/*/*.element.ts');

const manifests = Object.values(manifestFiles);
export const PAGES = buildPages(manifests, Object.values(exampleFiles));
export const REACT_NAMES = reactNames(manifests);
export const TAG_MODULES = tagModulesOf(manifests);
export const loadElement = (module: string) => elements[`../../../packages/ui-kit/components/${module}`]?.();
