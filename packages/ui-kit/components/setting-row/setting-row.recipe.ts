// A setting's copy beside its controls: <ui-setting-row> and the React SettingRow. A CSS-only tag, like
// ui-row: the recipe object is also emitted as global rules on the tag and its twin. Copy and controls
// sit at opposite edges and wrap when the row gets narrow. It names nothing: controls keep their own names.
import { defineSlotRecipe } from '@pandacss/dev';
import { tagRules } from '../recipe-parts.ts';
import { SETTING_ROW } from '../../tokens/geometry/resolve.ts';

export const settingRow = defineSlotRecipe({
  className: 'ui-setting-row',
  description: 'Setting copy beside its controls (ui-setting-row, React SettingRow).',
  slots: ['root'],
  base: {
    root: {
      display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: `calc(${SETTING_ROW.gap} * var(--u))`, minWidth: 0,
      '& > [data-part=copy]': { display: 'flex', flexDirection: 'column', gap: 'calc(0.5 * var(--u))', flex: `1 1 calc(${SETTING_ROW.copy} * var(--u))`, minWidth: 0 },
      '& [data-part=title]': { textStyle: 'title' },
      '& [data-part=description]': { textStyle: 'body-sm' },
    },
  },
});

export { settingRow as 'setting-row' };
export const settingRowTags = tagRules(':is(ui-setting-row, [data-ui=setting-row])', settingRow);
