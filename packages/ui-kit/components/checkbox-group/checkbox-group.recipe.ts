// Slot recipe for <ui-checkbox-group> / React CheckboxGroup: the choice-group recipe (shared with
// the radio group, radio-group.recipe.ts): 6u checkbox rows 1u apart, or a wrapping row 4u apart
// (resolveChoiceGroup); the gap attribute replaces the gap along the direction. No paint of its own.
import { choiceGroup } from '../radio-group/radio-group.recipe.ts';

export const checkboxGroup = choiceGroup('checkbox-group', 'Checkbox group (ui-checkbox-group, React CheckboxGroup): its checkboxes in a column or a wrapping row.');

// The manifest names each node's recipe by its id (component:checkbox-group).
export { checkboxGroup as 'checkbox-group' };
