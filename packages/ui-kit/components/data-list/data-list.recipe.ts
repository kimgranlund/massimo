// Labelled records: <ui-data-list> around a native dl, and the React DataList. A CSS-only tag: rules
// reach the dl inside it. Rows own their gutters, so the list has no gap, and a value wraps instead of
// pushing its label. divided rules the rows; layout="stacked" puts each label above its value.
import { defineSlotRecipe } from '@pandacss/dev';
import { tagRules } from '../recipe-parts.ts';
import { DATA_LIST } from '../../tokens/geometry/resolve.ts';

const ROW = '& > dl > div';

export const dataList = defineSlotRecipe({
  className: 'ui-data-list',
  description: 'Labelled records (ui-data-list, React DataList).',
  slots: ['root'],
  base: {
    root: {
      display: 'block', minWidth: 0,
      '& > dl': { margin: 0, padding: 0 },
      [ROW]: {
        display: 'grid', gridTemplateColumns: `minmax(0, calc(${DATA_LIST.label} * var(--u))) minmax(0, 1fr)`, columnGap: `calc(${DATA_LIST.gap} * var(--u))`,
        alignItems: 'baseline', paddingBlock: `calc(${DATA_LIST.rowBlock} * var(--u) * (0.5 + 0.5 * var(--ui-density)))`,
      },
      [`${ROW} > dt`]: { textStyle: 'label', minWidth: 0 },
      [`${ROW} > dd`]: { textStyle: 'body-md', margin: 0, minWidth: 0, overflowWrap: 'anywhere' },
      [`&[divided] ${ROW} + div`]: { borderBlockStartWidth: 'var(--separator)', borderBlockStartStyle: 'solid', borderColor: 'border' },
      [`&[layout=stacked] ${ROW}`]: { gridTemplateColumns: 'minmax(0, 1fr)', rowGap: 'calc(0.5 * var(--u))' },
    },
  },
});

export { dataList as 'data-list' };
export const dataListTags = tagRules(':is(ui-data-list, [data-ui=data-list])', dataList);
