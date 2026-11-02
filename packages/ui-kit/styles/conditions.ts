// Panda conditions: the state vocabulary shared by both renderers. A web component carries state in
// ARIA attributes on its host; a React renderer often keeps it in a native <input> that is a direct
// child of a data-ui host. Each condition matches both, so one rule (css, recipes) serves both.
// checked, indeterminate and disabled extend Panda's built-ins (their clauses are kept) with the
// native-child form; the others are new. The scheme conditions (osDark, dark, light) live in the preset.
export const conditions = {
  /** Keyboard modality (core/modality.ts): focus rings and active-descendant outlines. */
  keyboard: ':root[data-modality=keyboard] &',
  checked: '&:is(:checked, [data-checked], [aria-checked=true], [data-state="checked"], :has(> input:checked))',
  indeterminate: '&:is(:indeterminate, [data-indeterminate], [aria-checked=mixed], [data-state="indeterminate"], :has(> input:indeterminate))',
  disabled: '&:is(:disabled, [disabled], [data-disabled], [aria-disabled=true], :has(> input:disabled))',
  /** Busy (loading) controls: aria-busy on the host. */
  busy: '&:is([aria-busy=true], [data-busy])',
  /** Invalid after interaction or author error; not :invalid, which shows before the user acts. */
  userInvalid: '&:is([aria-invalid=true], [data-invalid], :user-invalid, :has(> input:user-invalid))',
} as const;
