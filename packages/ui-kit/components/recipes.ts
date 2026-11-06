// The recipe registry: every component slot recipe, registered in the preset (theme.slotRecipes).
// One <name>.recipe.ts per component folder; the key is the generated function's name in
// styled-system/recipes (badge → styled-system/recipes/badge.js).
import { badge, tag, chip } from './btg/btg.recipe.ts';
import { button } from './button/button.recipe.ts';
import { checkbox, radio, switchRecipe } from './choice/choice.recipe.ts';
import { range, progress } from './range/range.recipe.ts';
import { swatch, palette } from './color/color.recipe.ts';
import { listbox, segmented, option } from './listbox/listbox.recipe.ts';
import { input } from './input/input.recipe.ts';
import { select } from './select/select.recipe.ts';
import { swiper } from './swiper/swiper.recipe.ts';
import { image } from './image/image.recipe.ts';
import { uiContainer } from './container/container.recipe.ts';
import { row } from './row/row.recipe.ts';
import { column, grid, list } from './flow/flow.recipe.ts';
import { section } from './section/section.recipe.ts';
import { field, fieldGrid } from './field/field.recipe.ts';
import { separator } from './separator/separator.recipe.ts';
import { avatar } from './avatar/avatar.recipe.ts';
import { meter } from './meter/meter.recipe.ts';
import { toggle } from './toggle/toggle.recipe.ts';
import { toggleGroup } from './toggle-group/toggle-group.recipe.ts';
import { radioGroup } from './radio-group/radio-group.recipe.ts';
import { checkboxGroup } from './checkbox-group/checkbox-group.recipe.ts';
import { fieldset } from './fieldset/fieldset.recipe.ts';
import { collapsible } from './collapsible/collapsible.recipe.ts';
import { accordion } from './accordion/accordion.recipe.ts';
import { tabs } from './tabs/tabs.recipe.ts';
import { toast } from './toast/toast.recipe.ts';
import { form } from './form/form.recipe.ts';
import { scrollArea } from './scroll-area/scroll-area.recipe.ts';
import { numberField } from './number-field/number-field.recipe.ts';
import { otpField } from './otp-field/otp-field.recipe.ts';
import { combobox, autocomplete } from './combobox/combobox.recipe.ts';
import { dialog } from './dialog/dialog.recipe.ts';
import { alertDialog } from './alert-dialog/alert-dialog.recipe.ts';
import { drawer } from './drawer/drawer.recipe.ts';
import { menu } from './menu/menu.recipe.ts';
import { contextMenu } from './context-menu/context-menu.recipe.ts';
import { menubar } from './menubar/menubar.recipe.ts';
import { popover } from './popover/popover.recipe.ts';
import { tooltip } from './tooltip/tooltip.recipe.ts';
import { previewCard } from './preview-card/preview-card.recipe.ts';
import { navigationMenu } from './navigation-menu/navigation-menu.recipe.ts';

export const slotRecipes = { badge, tag, chip, button, checkbox, radio, switchRecipe, range, progress, swatch, palette, listbox, segmented, option, input, select, swiper, image, uiContainer, row, column, list, gridRecipe: grid, section, field, fieldGrid, separator, avatar, meter, toggle, radioGroup, checkboxGroup, fieldset, collapsible, accordion, tabs, toast, form, scrollArea, numberField, otpField, combobox, autocomplete, toggleGroup, dialog, alertDialog, drawer, menu, contextMenu, menubar, popover, tooltip, previewCard, navigationMenu };




