// <ui-command-bar>: search commands by label or keywords, in a dialog. `commands` is a list of
// { id, label, keywords?, group?, shortcut? }. Choosing one closes the bar and fires `select`. It filters
// and reports; running the command is the app's job.
import { UIElement, define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import { signal } from '../../core/signals.ts';
import '../dialog/dialog.element.ts';
import '../input/input.element.ts';
import '../kbd/kbd.element.ts';
import { filterCommands, groupCommands, moveHighlight, type Command } from '../../dom/command.ts';
import { commandBar } from '../../styled-system/recipes/command-bar.js';
import { setClasses } from '../classes.ts';

export class UICommandBar extends UIElement {
  static properties = {
    label: { type: String, default: 'Commands' },
    open: { type: Boolean, default: false, reflect: true },
    commands: { default: null },
  };
  declare label: string;
  declare open: boolean;
  declare commands: Command[] | string | null;

  #query = signal('');
  #active = signal(0);
  get #list(): Command[] { const c = this.commands; if (Array.isArray(c)) return c; try { return (JSON.parse(c ?? '[]') ?? []) as Command[]; } catch { return []; } }
  get #shown() { return filterCommands(this.#list, this.#query.value); }

  template() {
    return html`<ui-dialog .label=${this.label} .open=${this.open} @openchange=${this.#onOpen}>
      <ui-input label="Search commands" hide-label placeholder="Search commands" @input=${this.#onInput} @keydown=${this.#onKey}></ui-input>
      <div data-part="list" role="listbox" aria-label=${this.label} @click=${this.#onClick}></div>
    </ui-dialog>`;
  }

  update() {
    const c = commandBar(), list = this.querySelector('[data-part=list]');
    setClasses(this, c.root);
    if (!list) return;
    setClasses(list, c.list);
    const shown = this.#shown, nodes: HTMLElement[] = [];
    let index = 0;
    for (const { group, items } of groupCommands(shown)) {
      if (group) { const g = document.createElement('div'); g.setAttribute('data-part', 'group'); g.setAttribute('role', 'presentation'); setClasses(g, c.group); g.textContent = group; nodes.push(g); }
      for (const item of items) {
        const row = document.createElement('div');
        row.setAttribute('data-part', 'item'); row.setAttribute('role', 'option'); row.setAttribute('data-id', item.id);
        row.setAttribute('aria-selected', String(index === this.#active.value)); setClasses(row, c.item);
        const text = document.createElement('span'); text.textContent = item.label; row.append(text);
        if (item.shortcut) { const k = document.createElement('ui-kbd'); k.setAttribute('keys', item.shortcut); row.append(k); }
        nodes.push(row); index++;
      }
    }
    if (!shown.length) { const e = document.createElement('div'); e.setAttribute('data-part', 'empty'); setClasses(e, c.empty); e.textContent = 'No matching commands'; nodes.push(e); }
    list.replaceChildren(...nodes);
  }

  #ordered() { return groupCommands(this.#shown).flatMap((g) => g.items); }
  #onOpen = (e: Event) => { const open = !!(e as CustomEvent).detail?.open; this.open = open; if (!open) { this.#query.value = ''; this.#active.value = 0; } this.dispatchEvent(new CustomEvent('openchange', { detail: { open } })); };
  #onInput = (e: Event) => { e.stopPropagation(); this.#query.value = (e.currentTarget as HTMLElement & { value: string }).value; this.#active.value = 0; };
  #choose(c?: Command) { if (!c) return; this.open = false; this.dispatchEvent(new CustomEvent('select', { bubbles: true, detail: { command: c } })); }
  #onKey = (e: KeyboardEvent) => {
    const items = this.#ordered();
    if (e.key === 'Enter') { e.preventDefault(); this.#choose(items[this.#active.value]); return; }
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) { e.preventDefault(); this.#active.value = moveHighlight(e.key, this.#active.value, items.length); }
  };
  #onClick = (e: Event) => { const id = (e.target as HTMLElement).closest?.('[data-id]')?.getAttribute('data-id'); this.#choose(this.#list.find((c) => c.id === id)); };
}

define('ui-command-bar', UICommandBar);

declare global {
  interface HTMLElementTagNameMap { 'ui-command-bar': UICommandBar }
}
