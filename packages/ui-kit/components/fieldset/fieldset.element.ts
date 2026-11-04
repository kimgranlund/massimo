// <ui-fieldset>: a named set of related fields (Base UI Fieldset), with no native <fieldset> or
// <legend>: the host is role=group named by its legend part (aria-labelledby). disabled reaches every
// kit form control inside, at any depth (their isDisabled reads the nearest disabling container, as
// a native <fieldset disabled> would), and sets data-disabled on the host and the legend. Children
// stack with the collection gap (the container ladder; the gap attribute wins).
// Composition: the legend may be authored as a [data-part=legend] child (any element, a heading
// too); its text seeds `legend` at the first connect when the property is unset, and the fieldset
// keeps it. Without one, the `legend` property fills a generated legend part.
import { UIElement, define } from '../../core/element.ts';
import { disablingContainer, registerDisabler, syncDisabled } from '../../core/form-element.ts';
import { signal } from '../../core/signals.ts';
import { applyAttrs, uid } from '../../dom/attrs.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { fieldset } from '../../styled-system/recipes/fieldset.js';

export class UIFieldset extends UIElement {
  static properties = {
    /** Disables every form control inside (data-disabled here and on the legend). */
    disabled: { type: Boolean, default: false, reflect: true },
    /** The legend text; it names the group. An authored [data-part=legend] child takes its place. */
    legend: { type: String, default: '' },
  };
  declare disabled: boolean;
  declare legend: string;

  #id = '';
  #authored = false;
  /** The nearest disabling container around this fieldset (a disabled outer fieldset disables this one too). */
  #container = signal<{ isDisabled?: boolean } | null>(null);

  /** Disabled by its own attribute or by a disabled ui-fieldset around it. Reactive. */
  get isDisabled(): boolean { return this.disabled || !!this.#container.value?.isDisabled; }

  connected() {
    this.#id = this.id ? `${this.id}-fieldset` : uid('fieldset');
    const own = partOf(this, 'legend');
    this.#authored = !!own;
    if (own && !this.legend) this.legend = (own.textContent ?? '').trim();
    this.#container.value = disablingContainer(this);
    // Controls inside may have connected (and looked for their container) before this upgraded.
    queueMicrotask(() => syncDisabled(this));
  }

  disconnected() { this.#container.value = null; }
  /** Find the nearest disabling container again (an outer fieldset that upgraded late calls this). */
  syncContainer() { this.#container.value = null; this.#container.value = disablingContainer(this); }

  update() {
    let legend = partOf(this, 'legend') as HTMLElement | null;
    if (!legend && this.legend) {
      legend = document.createElement('div');
      legend.setAttribute('data-part', 'legend');
      this.prepend(legend);
    }
    const disabled = this.isDisabled;
    if (legend) {
      if (!this.#authored) legend.textContent = this.legend;
      legend.id ||= `${this.#id}-legend`;
      legend.hidden = !this.#authored && !this.legend;
      applyAttrs(legend, { 'data-disabled': disabled ? '' : undefined });
    }
    applyAttrs(this, {
      role: 'group',
      'aria-labelledby': legend && !legend.hidden ? legend.id : undefined,
      'aria-disabled': disabled ? 'true' : undefined,
      'data-disabled': disabled ? '' : undefined,
    });
    applyRecipe(this, fieldset());
  }
}

registerDisabler('ui-fieldset');
define('ui-fieldset', UIFieldset);

declare global {
  interface HTMLElementTagNameMap { 'ui-fieldset': UIFieldset }
}
