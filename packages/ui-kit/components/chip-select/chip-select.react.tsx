// React <ChipSelect>: Select at chip size, like <ui-chip-select>.
import { Select, type SelectProps } from '../select/select.react.tsx';
import { chipSelect } from '../../styled-system/recipes/chip-select.js';

export function ChipSelect({ className, ...rest }: SelectProps) {
  return <Select {...rest} className={[chipSelect().root, className].filter(Boolean).join(' ') as never} />;
}
