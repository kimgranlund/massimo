// Typographic roles. Use `textStyle="heading"` etc. in Panda style objects.
import { defineTextStyles } from '@pandacss/dev';

export const textStyles = defineTextStyles({
  display: { value: { fontSize: '4xl', fontWeight: 'bold', lineHeight: 'tight', letterSpacing: 'tight' } },
  heading: { value: { fontSize: '2xl', fontWeight: 'semibold', lineHeight: 'tight', letterSpacing: 'tight' } },
  title: { value: { fontSize: 'lg', fontWeight: 'semibold', lineHeight: 'snug' } },
  body: { value: { fontSize: 'md', lineHeight: 'normal' } },
  label: { value: { fontSize: 'sm', fontWeight: 'medium', lineHeight: 'snug' } },
  caption: { value: { fontSize: 'xs', lineHeight: 'snug' } },
});
