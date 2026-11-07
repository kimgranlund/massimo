// React <SearchTrigger>: a Button drawn like a search field, like <ui-search-trigger>.
import { Button } from '../button/button.react.tsx';
import { Kbd } from '../kbd/kbd.react.tsx';
import { searchTrigger } from '../../styled-system/recipes/search-trigger.js';

export interface SearchTriggerProps {
  label?: string;
  shortcut?: string;
  onClick?: () => void;
  className?: string;
}

export function SearchTrigger({ label = 'Search', shortcut = 'mod+k', onClick, className }: SearchTriggerProps) {
  return (
    <span data-ui="search-trigger" className={[searchTrigger().root, className].filter(Boolean).join(' ')}>
      <Button onClick={onClick} leading={<i {...{ name: 'magnifying-glass' }} />} trailing={shortcut ? <Kbd keys={shortcut} /> : undefined}>{label}</Button>
    </span>
  );
}
