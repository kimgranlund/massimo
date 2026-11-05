// Components: every ui-kit web component at the live theme, grouped by family. The family filter
// lives in the content header and in the hash query (#/components?family=fields).
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/select/element';
import '@massimo/ui-kit/components/btg/element';
import '@massimo/ui-kit/components/choice/element';
import '@massimo/ui-kit/components/range/element';
import '@massimo/ui-kit/components/color/element';
import '@massimo/ui-kit/components/swiper/element';
import '@massimo/ui-kit/components/image/element';
import '@massimo/ui-kit/components/field/element';
import '@massimo/ui-kit/components/separator/element';
import '@massimo/ui-kit/components/avatar/element';
import '@massimo/ui-kit/components/meter/element';
import '@massimo/ui-kit/components/toggle/element';
import '@massimo/ui-kit/components/toggle-group/element';
import '@massimo/ui-kit/components/radio-group/element';
import '@massimo/ui-kit/components/checkbox-group/element';
import '@massimo/ui-kit/components/fieldset/element';
import '@massimo/ui-kit/components/collapsible/element';
import '@massimo/ui-kit/components/accordion/element';
import '@massimo/ui-kit/components/tabs/element';
import { createToastManager, type ToastManager, type ToastOptions } from '@massimo/ui-kit/components/toast/element';
import { DENSITIES, resolveDialog, resolvePopup, resolveToast } from '@massimo/ui-kit/tokens/geometry/resolve';
import '@massimo/ui-kit/components/form/element';
import '@massimo/ui-kit/components/scroll-area/element';
import '@massimo/ui-kit/components/number-field/element';
import '@massimo/ui-kit/components/otp-field/element';
import '@massimo/ui-kit/components/combobox/element';
import '@massimo/ui-kit/components/autocomplete/element';
import '@massimo/ui-kit/components/dialog/element';
import '@massimo/ui-kit/components/alert-dialog/element';
import '@massimo/ui-kit/components/drawer/element';
import '@massimo/ui-kit/components/menu/element';
import '@massimo/ui-kit/components/context-menu/element';
import '@massimo/ui-kit/components/menubar/element';
import '@massimo/ui-kit/components/popover/element';
import '@massimo/ui-kit/components/tooltip/element';
import '@massimo/ui-kit/components/preview-card/element';
import '@massimo/ui-kit/components/navigation-menu/element';
import { Fragment, useCallback, useState, type ReactNode } from 'react';
import { css } from '../../styled-system/css/index.js';
import type { PageProps } from './types.ts';
import { FAMILIES, type Family } from './families.ts';
import { CQ_MD, Divider, IMAGES, Page, Row, Section, SizeLadder, caption, columns, fmt, specimens, stack, subTitle } from './shared.tsx';


const avatar = css({ display: 'block', bg: 'primary.solid' });
const media = css({ width: 'full', maxWidth: '[40rem]', borderRadius: 'xl', overflow: 'hidden' });
const formats = css({ display: 'flex', gap: '3', flexWrap: 'wrap', alignItems: 'end' });
const figure = css({ display: 'flex', flexDirection: 'column', gap: '1', width: '[8rem]' });
const formGrid = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '4', alignItems: 'start', [CQ_MD]: { gridTemplateColumns: '1fr 1fr' } });
const tonePrimary = css({ bg: 'primary.subtle', color: 'primary.fg' });
const separatorDemo = css({ display: 'flex', flexDirection: 'column', gap: '4', width: '[min(100%, 24rem)]' });
const separatorLadder = css({ display: 'flex', flexDirection: 'column', gap: '2', width: '[min(100%, 20rem)]' });
// Number entry fields sit in a narrow column, like the inspector rows they serve.
const entryColumn = css({ display: 'flex', flexDirection: 'column', gap: '4', width: '[min(100%, 18rem)]', alignSelf: 'start' });
const trackStack = css({ display: 'flex', flexDirection: 'column', gap: '4', width: '[min(100%, 24rem)]' });
// Inline fields demo: a property panel (field grid) beside stacked fields.
const panelCard = css({ display: 'flex', flexDirection: 'column', gap: '3', padding: '4', borderRadius: 'xl', bg: 'bg.subtle', width: '[min(100%, 22rem)]' });

/** A ui-range whose readout follows it: the field's readout is application text. */
function useRangeValue(initial: number) {
  const [value, setValue] = useState(initial);
  const ref = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const h = (e: Event) => setValue((e as CustomEvent<{ value: number }>).detail.value);
    el.addEventListener('input', h);
    return () => el.removeEventListener('input', h);
  }, []);
  return [value, ref] as const;
}

function InlineFields() {
  const [radius, radiusRef] = useRangeValue(12);
  const [opacity, opacityRef] = useRangeValue(80);
  const [volume, volumeRef] = useRangeValue(40);
  return (
    <div className={columns}>
      <div className={panelCard}>
        <p className={caption}>Inline rows in a ui-field-grid: labels share one column, readouts another.</p>
        <ui-field-grid>
          <h3>Layer</h3>
          <ui-field layout="inline" label="Name"><ui-input value="Card background" /></ui-field>
          <ui-field layout="inline" label="Blend">
            <ui-select value="normal"><ui-option value="normal">Normal</ui-option><ui-option value="multiply">Multiply</ui-option><ui-option value="screen">Screen</ui-option></ui-select>
          </ui-field>
          <ui-field layout="inline" label="Opacity" unit="%" readout={String(opacity)}><ui-range ref={opacityRef} value={80} /></ui-field>
          <h3>Shape</h3>
          <ui-field layout="inline" label="Radius" unit="px" readout={String(radius)}><ui-range ref={radiusRef} min={0} max={48} value={12} /></ui-field>
          <ui-field layout="inline" label="Corners">
            <ui-segmented value="round"><ui-option value="round">Round</ui-option><ui-option value="squircle">Squircle</ui-option><ui-option value="bevel">Bevel</ui-option></ui-segmented>
          </ui-field>
          <ui-field layout="inline" label="Clip content"><ui-switch checked /></ui-field>
        </ui-field-grid>
      </div>
      <div className={stack}>
        <p className={caption}>Stacked (the default): the label above; a readout still sits beside the control.</p>
        <ui-field label="Volume" unit="%" readout={String(volume)} description="Applies to every output."><ui-range ref={volumeRef} value={40} /></ui-field>
        <ui-field label="Theme">
          <ui-segmented value="auto"><ui-option value="light">Light</ui-option><ui-option value="dark">Dark</ui-option><ui-option value="auto">Auto</ui-option></ui-segmented>
        </ui-field>
        <ui-field label="Project name" description="Shown in the title bar."><ui-input placeholder="Untitled" /></ui-field>
      </div>
    </div>
  );
}


/** Fieldsets: a legend over a set of fields, a disabled set (toggled), and a size ladder. */
function Fieldsets({ params }: Pick<PageProps, 'params'>) {
  const [off, setOff] = useState(true);
  return (
    <>
      <div className={columns}>
        <ui-fieldset legend="Billing address">
          <ui-input name="street" label="Street" value="Storgatan 1" />
          <ui-input name="city" label="City" value="Stockholm" />
          <ui-field label="Invoice by">
            <ui-radio-group name="invoice" value="email" orientation="horizontal"><ui-radio value="email">Email</ui-radio><ui-radio value="post">Post</ui-radio></ui-radio-group>
          </ui-field>
        </ui-fieldset>
        <div className={stack}>
          <ui-checkbox checked={off} onClick={() => setOff((v) => !v)}>Ship to the billing address</ui-checkbox>
          <ui-fieldset legend="Shipping address" disabled={off || undefined}>
            <ui-input name="ship-street" label="Street" value="Storgatan 1" />
            <ui-select name="ship-country" label="Country" value="se"><ui-option value="se">Sweden</ui-option><ui-option value="no">Norway</ui-option></ui-select>
          </ui-fieldset>
        </div>
      </div>
      <SizeLadder family="fieldset" params={params}>
        <div className={ladderField}><ui-fieldset legend="Address"><ui-input label="Street" value="Storgatan 1" /><ui-checkbox checked>Default</ui-checkbox></ui-fieldset></div>
      </SizeLadder>
    </>
  );
}

/**
 * Forms: a ui-form whose submit validates its fields and reports the values; a simulated server
 * answers "taken@example.com" with errors by name (the email and the plan), which clear on change.
 * The validation mode is switchable; a size ladder follows.
 */
function Forms({ params }: Pick<PageProps, 'params'>) {
  const [mode, setMode] = useState<'onSubmit' | 'onBlur' | 'onChange'>('onSubmit');
  const [result, setResult] = useState('Submit to see the values.');
  const onMode = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const h = (e: Event) => setMode((e as CustomEvent<{ value: 'onSubmit' | 'onBlur' | 'onChange' }>).detail.value);
    el.addEventListener('change', h);
    return () => el.removeEventListener('change', h);
  }, []);
  const onForm = useCallback((el: (HTMLElement & { errors?: unknown }) | null) => {
    if (!el) return;
    const h = (e: Event) => {
      const values = (e as CustomEvent<{ values: Record<string, unknown> }>).detail.values;
      if (values.email === 'taken@example.com') {
        el.errors = { email: 'Already registered: sign in instead', plan: 'Team is not available for this address' };
        setResult('The server answered with errors by name.');
      } else setResult(`Submitted ${JSON.stringify(values)}`);
    };
    const r = () => setResult('Reset.');
    el.addEventListener('formsubmit', h);
    el.addEventListener('reset', r);
    return () => { el.removeEventListener('formsubmit', h); el.removeEventListener('reset', r); };
  }, []);
  return (
    <>
      <div className={columns}>
        <ui-container preset="card" padding="lg">
          <ui-form ref={onForm} validation-mode={mode}>
            <ui-input name="email" label="Email" type="email" required description="taken@example.com gets server errors" />
            <ui-field label="Plan">
              <ui-radio-group name="plan" value="team" orientation="horizontal"><ui-radio value="solo">Solo</ui-radio><ui-radio value="team">Team</ui-radio></ui-radio-group>
            </ui-field>
            <ui-checkbox-group name="topics" value="news" orientation="horizontal"><ui-checkbox value="news">News</ui-checkbox><ui-checkbox value="tips">Tips</ui-checkbox></ui-checkbox-group>
            <ui-input name="code" label="Invite code" minlength={4} />
            <ui-container preset="group"><ui-button type="submit" variant="primary">Sign up</ui-button><ui-button type="reset">Reset</ui-button></ui-container>
          </ui-form>
        </ui-container>
        <div className={stack}>
          <ui-field label="Validation mode">
            <ui-segmented ref={onMode} value={mode}><ui-option value="onSubmit">onSubmit</ui-option><ui-option value="onBlur">onBlur</ui-option><ui-option value="onChange">onChange</ui-option></ui-segmented>
          </ui-field>
          <p className={caption} aria-live="polite">{result}</p>
        </div>
      </div>
      <SizeLadder family="form" params={params}>
        <div className={ladderField}><ui-form><ui-input name="n" label="Name" value="Ada" /><ui-checkbox checked>Subscribe</ui-checkbox><ui-button type="submit">Save</ui-button></ui-form></div>
      </SizeLadder>
    </>
  );
}

const scrollBox = css({ height: '[14rem]', width: 'full', maxWidth: '[22rem]', borderRadius: 'xl', bg: 'bg.subtle' });
const scrollWide = css({ height: '[12rem]', width: 'full', maxWidth: '[22rem]', borderRadius: 'xl', bg: 'bg.subtle' });
const scrollPad = css({ padding: '4', paddingInlineEnd: '6', display: 'flex', flexDirection: 'column', gap: '2' });
const scrollGrid = css({ display: 'grid', gridTemplateColumns: 'repeat(12, 6rem)', gap: '2', padding: '4' });
const scrollCell = css({ height: '[4rem]', borderRadius: 'md', bg: 'bg.muted', display: 'grid', placeItems: 'center', textStyle: 'body-sm' });
const scrollLadder = css({ height: '[10rem]', width: 'full', maxWidth: '[16rem]', borderRadius: 'lg', bg: 'bg.subtle' });
const LINES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot', 'Golf', 'Hotel', 'India', 'Juliett', 'Kilo', 'Lima', 'Mike', 'November', 'Oscar', 'Papa'];

/** Scroll areas: a vertical list, both axes with the corner, and a size ladder. */
function ScrollAreas({ params }: Pick<PageProps, 'params'>) {
  return (
    <>
      <div className={columns}>
        <ui-scroll-area className={scrollBox}>
          <div className={scrollPad}>{LINES.map((l, i) => <p key={l}><strong>{l}</strong> — item {i + 1} of a list taller than its area. Wheel, drag the thumb, press the track or focus the area and use the keys.</p>)}</div>
        </ui-scroll-area>
        <ui-scroll-area className={scrollWide}>
          <div className={scrollGrid}>{Array.from({ length: 48 }, (_, i) => <div key={i} className={scrollCell}>{i + 1}</div>)}</div>
        </ui-scroll-area>
      </div>
      <SizeLadder family="scrollArea" params={params}>
        <ui-scroll-area className={scrollLadder}><div className={scrollPad}>{LINES.slice(0, 10).map((l) => <span key={l}>{l}</span>)}</div></ui-scroll-area>
      </SizeLadder>
    </>
  );
}

/** Choice groups: a radio group named by a field label, a horizontal one, states, and a size ladder. */
function ChoiceGroups({ params }: Pick<PageProps, 'params'>) {
  const [plan, setPlan] = useState('pro');
  const onPlan = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const h = (e: Event) => setPlan((e as CustomEvent<{ value: string }>).detail.value);
    el.addEventListener('change', h);
    return () => el.removeEventListener('change', h);
  }, []);
  return (
    <>
      <div className={stack}><h3 className={subTitle}>Groups</h3></div>
      <div className={columns}>
        <div className={stack}>
          <ui-field label="Plan" description={`Value: ${plan}`}>
            <ui-radio-group ref={onPlan} name="plan-g" value="pro">
              <ui-radio value="free">Free</ui-radio>
              <ui-radio value="pro">Pro<span slot="suffix">$9</span></ui-radio>
              <ui-radio value="team">Team<span slot="suffix">$29</span></ui-radio>
            </ui-radio-group>
          </ui-field>
          <ui-field label="Quiet hours">
            <ui-radio-group orientation="horizontal" value="night">
              <ui-radio value="off">Off</ui-radio><ui-radio value="night">Nights, 22–07</ui-radio><ui-radio value="weekend">Weekends</ui-radio>
            </ui-radio-group>
          </ui-field>
          <ui-field label="Send to">
            <ui-checkbox-group orientation="horizontal" value="email push">
              <ui-checkbox value="email">Email</ui-checkbox><ui-checkbox value="push">Push</ui-checkbox><ui-checkbox value="sms">SMS</ui-checkbox>
            </ui-checkbox-group>
          </ui-field>
        </div>
        <div className={stack}>
          <ui-field label="Size" description="Required; one option is sold out.">
            <ui-radio-group required>
              <ui-radio value="s">Small</ui-radio><ui-radio value="m">Medium</ui-radio><ui-radio value="l" disabled>Large</ui-radio>
            </ui-radio-group>
          </ui-field>
          <ui-field label="Notify by" description="A parent checkbox over the set.">
            <ui-checkbox-group name="notify-g" value="email">
              <ui-checkbox parent>All channels</ui-checkbox>
              <ui-checkbox value="email">Email</ui-checkbox><ui-checkbox value="push">Push</ui-checkbox><ui-checkbox value="sms">SMS</ui-checkbox>
            </ui-checkbox-group>
          </ui-field>
          <ui-field label="Region (disabled)">
            <ui-radio-group disabled value="eu" orientation="horizontal">
              <ui-radio value="us">US</ui-radio><ui-radio value="eu">EU</ui-radio>
            </ui-radio-group>
          </ui-field>
        </div>
      </div>
      <div className={stack}><h3 className={subTitle}>Card choices and attached lists</h3></div>
      <div className={stack}>
        <ui-field label="Plan" description="variant=&quot;card&quot;: each radio is a card holding any content; the whole card is the choice.">
          <ui-radio-group variant="card" orientation="horizontal" name="plan-c" value="pro">
            <ui-radio value="free"><strong>Free</strong><span>$0 / month</span><span>One project</span></ui-radio>
            <ui-radio value="pro"><strong>Pro</strong><span>$20 / month</span><span>Unlimited projects</span></ui-radio>
            <ui-radio value="team"><strong>Team</strong><span>$60 / month</span><span>Shared workspaces</span></ui-radio>
          </ui-radio-group>
        </ui-field>
        <div className={columns}>
          <ui-field label="Add-ons" description="Checkbox cards: several at once.">
            <ui-checkbox-group variant="card" value="backups"><ui-checkbox value="backups">Daily backups</ui-checkbox><ui-checkbox value="support">Priority support</ui-checkbox></ui-checkbox-group>
          </ui-field>
          <ui-field label="Section" description="An attached list (inset=&quot;none&quot;): rows edge to edge, split by dividers.">
            <ui-listbox inset="none" value="a"><ui-option value="a">Option 1</ui-option><ui-option value="b">Option 2</ui-option><ui-option value="c">Option 3</ui-option></ui-listbox>
          </ui-field>
        </div>
        <div className={columns}>
          <ui-segmented inset="none" value="w"><ui-option value="d">Day</ui-option><ui-option value="w">Week</ui-option><ui-option value="m">Month</ui-option></ui-segmented>
          <ui-switch inset="none" checked>Attached switch</ui-switch>
          <ui-range inset="none" value={40} label="Attached range" />
        </div>
      </div>
      <SizeLadder family="choiceGroup" params={params}>
        <ui-radio-group label="Plan" value="pro"><ui-radio value="free">Free</ui-radio><ui-radio value="pro">Pro</ui-radio></ui-radio-group>
        <ui-radio-group label="Quiet hours" orientation="horizontal" value="off"><ui-radio value="off">Off</ui-radio><ui-radio value="night">Nights</ui-radio></ui-radio-group>
        <ui-checkbox-group label="Channels" value="email"><ui-checkbox parent>All</ui-checkbox><ui-checkbox value="email">Email</ui-checkbox><ui-checkbox value="push">Push</ui-checkbox></ui-checkbox-group>
      </SizeLadder>
    </>
  );
}
// Disclosure specimens: a readable column, as a settings or FAQ page would hold them.
const disclosureColumn = css({ display: 'flex', flexDirection: 'column', gap: '1', width: 'full', maxWidth: '[28rem]' });
const panelText = css({ color: 'fg.muted', textStyle: 'body-md' });
const contextArea = css({ display: 'grid', placeItems: 'center', width: '[min(100%, 28rem)]', height: '[8rem]', borderRadius: 'xl', borderWidth: 'thin', borderStyle: 'dashed', borderColor: 'border', color: 'fg.muted', textStyle: 'body-sm' });
const tabsColumn = css({ display: 'flex', flexDirection: 'column', gap: '6', width: 'full', maxWidth: '[36rem]' });
const tabsRow = css({ display: 'flex', flexWrap: 'wrap', gap: '8', width: 'full' });

// Combobox specimens: a field's reading width, options a real picker would hold.
const comboColumn = css({ display: 'flex', flexDirection: 'column', gap: '4', width: 'full', maxWidth: '[22rem]' });
const COUNTRIES = [['ar', 'Argentina'], ['at', 'Austria'], ['ca', 'Canada'], ['dk', 'Denmark'], ['fi', 'Finland'], ['fr', 'France'], ['is', 'Iceland'], ['jp', 'Japan'], ['mx', 'México'], ['no', 'Norway'], ['se', 'Sweden']] as const;
const CITIES = ['Oslo', 'Osaka', 'Ottawa', 'Oaxaca', 'Paris', 'Porto', 'Prague'];
const COMMANDS = ['build', 'bench', 'check', 'deploy', 'dev', 'test'];
const LABELS = [['bug', 'Bug'], ['docs', 'Docs'], ['perf', 'Performance'], ['ui', 'UI'], ['a11y', 'Accessibility'], ['infra', 'Infrastructure']] as const;
// Overlay specimens: dialog content (a field column, an action row of triggers).
const dialogBody = css({ display: 'flex', flexDirection: 'column', gap: '3' });
/** Attributes the DOM types lack (a navigation item's value and label, a link's active), for ui-navigation-menu markup. */
const nav = (a: Record<string, string>) => a as Record<string, string>;
// Popup specimens: a row of triggers; ladder rows leave room for the open popup beside the trigger.
const popupRow = css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4' });
const popupLadder = css({ display: 'flex', alignItems: 'start', minHeight: '[calc(36 * var(--u))]', width: 'full' });
const popupGap = css({ width: '[40%]', flexShrink: '0' });
const popupText = css({ textStyle: 'body-md', color: 'fg.muted', margin: '0' });

// A field in a size ladder: a fixed share of the row so each size's field keeps its own width.
const ladderField = css({ width: 'full', maxWidth: '[20rem]' });

export function ComponentsPage({ family, params }: PageProps & { family?: Family }) {
  const [status, setStatus] = useState('');
  // Container-backed parts take their numbers from the resolvers at the live theme (cards are concentric).
  const geo = { unit: params.unit, border: params.border, radiusScale: params['radius-scale'], density: DENSITIES[params.density] };
  const dlg = resolveDialog(geo), tst = resolveToast(geo), pop = resolvePopup('popover', geo), prev = resolvePopup('preview-card', geo);
  const px = (n: number) => `${fmt(n)}px`;
  const NOTES: Record<Family, string> = {
    actions: 'Construction pattern: leading icon, prefix, label, suffix, trailing icon. Icon slots at least 6u; text parts 1u apart, 1u beside a slot, 2u at a bare edge; padding 1u; text 10px + u. A toggle is a button with a pressed state (aria-pressed, data-pressed): the primary solid while on.',
    labels: 'Heights 12px + k·u (badge 1, tag 2, chip 3), capped below the control height.',
    fields: 'No native form elements. Errors appear after interaction or a submit attempt; the form submits real values. ui-field names one control with a visible label (unit suffix, readout); a ui-field-grid aligns inline rows on shared columns; a ui-fieldset names a set of fields (legend) and disables them together, stacked with the collection gap.',
    entry: 'A number field is the field control with its steppers in the 6u leading and trailing slots (the glyph at icon size sm, radius R − u) and the text 1u from each. The text is formatNumber of the value for the locale and is parsed back; arrows step (Shift ×10, Alt ×0.1), the steppers repeat while held, dragging the label scrubs, blur clamps and reformats. An OTP field is a row of 8u square cells 1u apart over one code: typing advances, a paste fills from the focused cell, Backspace steps back; a separator is a 2u dash.',
    selection: 'Select, segmented control, listbox and combobox share one option model; composites pad 0.5u so a segmented row stays the control height. A combobox is the select trigger row with editable text: typing filters (contains, accents folded), arrows highlight, Enter commits; multiple keeps 6u chips that wrap the row. An autocomplete is free text with suggestions: mode list filters, both also completes inline (the completed rest selected).',
    choices: 'A 5u box (switch 9u × 5u) in the 6u leading slot; the label starts 1u after the slot. Groups own one value: rows 1u apart (a 7u pitch), or a wrapping row 4u apart.',
    tracks: 'A 4u track. The range thumb sits inside it (track − u, inset 0.5u) and the fill wraps it with a concentric cap. Arrow keys, Page Up/Down, Home/End, drag. A meter is the progress track under a label | value row 1.5u above it; its value is formatNumber (a percentage by default).',
    color: 'Swatches are 6u; a palette attaches them with no gaps and can be a selectable listbox.',
    disclosure: 'A collapsible trigger is an 8u control row with a caret (icon size sm) that turns while open; the panel starts at the label edge (3u) and its height animates between 0 and auto on the reveal intent, in CSS. An accordion stacks collapsibles with 1px dividers; one or several open, arrow keys move between triggers. Tabs: a segmented composite (7u tabs in an 8u list) or 8u underline tabs over a 1px track; the indicator follows the active tab through --active-tab-* variables set by script.',
    forms: 'A ui-form owns the kit controls inside it (no native form): a submit validates them all, shows their errors and focuses the first invalid one, then fires formsubmit with the values by name. Errors by name (a server answer) show at once on the named fields and clear on change; validation-mode is Base UI\'s onSubmit, onBlur or onChange. Fields stack with the collection gap; no box of its own.',
    scrolling: 'A ui-scroll-area scrolls natively with its own scrollbars hidden and draws the kit\'s over its edges: a 2u track, the thumb u thick 0.5u inside it and at least 4u long, pills; a 2u corner where both bars show. The bars show while their axis overflows and fade in on hover, scroll or keyboard focus; drag a thumb or press a track. Base UI\'s overflow data-* and variables are set by script.',
    overlays: `A dialog popup is a card-xl container in the top layer: padding ${px(dlg.padding)}, radius ${px(dlg.radius)} (a popup surface: at most its padding), parts 2u apart, 96u wide within a 4u viewport margin, over the bg.backdrop role. Modal by default: page scroll locks, the rest of the page turns inert and focus is trapped; Escape, the backdrop and close parts dismiss it (reasons escape-key, outside-press, close-press) and focus returns to the trigger. It fades and grows in on the reveal intent. An alert dialog is the same popup with role=alertdialog: always modal, no outside-press dismissal, focus on the least destructive action (Cancel). A drawer is a square panel-level sheet (6u padding) on one edge: side sheets 80u wide, top and bottom sheets full width, 8u of the viewport kept in view; it slides in on the reveal intent and a swipe toward its edge dismisses it (reason swipe).`,
    menus: 'A menu trigger is an 8u control row; its popup is a floating composite 1u below it (beside a submenu trigger), at least as wide, with 7u items in the construction pattern. Focus moves to the highlighted item: arrow keys wrap, Home / End, typeahead and the pointer; ArrowRight opens a submenu, ArrowLeft or Escape closes it. Checkbox and radio items keep a 6u indicator slot and stay open on a press. A context menu opens the same popup 1u from the pointer on a right click, a long press or Shift+F10. A menubar is an 8u composite row of its menus\' triggers (7u); arrow keys move between them and, once a menu is open, switch menus, as does hovering another trigger.',
    popups: `Anchored popups on the floating layer: 1u from the trigger, flipping when there is no room, at least as wide as the trigger. A popover is a small card (padding ${px(pop.paddingBlock)}, radius ${px(pop.radius)}, a 1u gap) that takes focus when pressed open; Escape, an outside press or a Close part dismiss it. A tooltip is a 7u text row on the inverse fill, above its trigger, after 600 ms on hover or at once on keyboard focus (and at once while the group is warm). A preview card is a medium card (padding ${px(prev.paddingBlock)}, radius ${px(prev.radius)}, a 2u gap) below a link, after 600 ms on hover; it stays while the pointer moves onto it. A navigation menu is an 8u composite row of 7u triggers and links; one popup (a composite container) shows the open item's links 1u below its trigger, animating its size between items. An arrow is a 2u triangle spanning the 1u gap.`,
    media: 'Scroll-snap carousel with paddles and dots; images take a cover format, a fit, and an optional inline slideshow (controls on hover).',
    feedback: `A toast is a container at the card-sm level: padding ${px(tst.padding)}, radius ${px(tst.radius)}. Title and description share one column 0.5u apart; the action is an 8u control row and the close a 6u slot, 1u apart. The viewport is 80u wide, 4u from the window edges; collapsed toasts peek 2u, expanded (hover or focus, which also pause the timers) they stand 2u apart. Swipe, the close or Escape dismiss; F6 focuses the stack.`,
    display: 'Static display elements. A separator is a rule as thick as the theme border, never thinner than a hairline; the container gap spaces it. An avatar is a round square on the slot and control ladder (sm 6u, md 8u, lg 12u, xl 16u) whose initials and icon scale with it; the fallback shows until the picture loads.',
  };
  const CONTENT: Record<Family, ReactNode> = {
    popups: (
      <>
        <Row label="Popover">
          <div className={popupRow}>
            <ui-popover label="Notifications">
              <h2 data-part="title">Notifications</h2>
              <p data-part="description">You are all caught up. New mentions and replies show here.</p>
            </ui-popover>
            <ui-popover side="top">
              <ui-button data-part="trigger"><i slot="leading" name="share" />Share</ui-button>
              <div data-part="popup">
                <h2 data-part="title">Share link</h2>
                <p data-part="description">Anyone with the link can view this page.</p>
                <ui-button data-part="close">Done</ui-button>
                <div data-part="arrow" />
              </div>
            </ui-popover>
            <ui-popover label="Rename" modal>
              <h2 data-part="title">Rename file</h2>
              <ui-input label="Name" value="Quarterly report" />
              <ui-button data-part="close">Save</ui-button>
            </ui-popover>
            <ui-popover label="Hover me" open-on-hover><p className={popupText}>Opens after 300 ms on hover; a press keeps it open.</p></ui-popover>
          </div>
        </Row>
        <Row label="Tooltip">
          <div className={popupRow}>
            <ui-tooltip content="Bold (⌘B)"><ui-button aria-label="Bold"><i slot="leading" name="text-b" /></ui-button></ui-tooltip>
            <ui-tooltip content="Italic (⌘I)"><ui-button aria-label="Italic"><i slot="leading" name="text-italic" /></ui-button></ui-tooltip>
            <ui-tooltip side="bottom"><ui-button data-part="trigger">Publish</ui-button><div data-part="popup">Visible to everyone with the link<div data-part="arrow" /></div></ui-tooltip>
            <ui-tooltip content="A longer explanation wraps at 60u so the tooltip stays a readable column of short lines." side="right"><ui-button>Long text</ui-button></ui-tooltip>
          </div>
        </Row>
        <Row label="Preview card">
          <div className={popupText}>
            Geometry follows the{' '}
            <ui-preview-card>
              <a href="#/geometry">Differential Forms model</a>
              <strong>Differential Forms</strong>
              <span>Every length is a multiple of the unit u: controls 8u, slots 6u, type 10px + u.</span>
            </ui-preview-card>
            {' '}by{' '}
            <ui-preview-card side="top">
              <a data-part="trigger" href="#/components">the kit</a>
              <div data-part="popup"><ui-avatar name="Massimo Kit" /><span>Light-DOM web components with React renderers.</span><div data-part="arrow" /></div>
            </ui-preview-card>.
          </div>
        </Row>
        <Row label="Navigation menu">
          <ui-navigation-menu label="Specimen">
            <div data-part="item" {...nav({ value: 'docs', label: 'Docs' })}><a href="#/geometry">Geometry</a><a href="#/colors" {...nav({ active: '' })}>Colors</a><a href="#/typography">Typography</a></div>
            <div data-part="item" {...nav({ value: 'kit', label: 'Components' })}><a href="#/components?family=actions">Actions and toggles</a><a href="#/components?family=fields">Fields, selects and fieldsets</a><a href="#/components?family=disclosure">Collapsibles, accordions and tabs</a><a href="#/components?family=popups">Popovers, tooltips and preview cards</a></div>
            <div data-part="item"><a data-part="link" href="#/motion">Motion</a></div>
          </ui-navigation-menu>
        </Row>
        <SizeLadder family="popup" params={params}>
          <div className={popupLadder}>
            <ui-popover label="Details" side="right" align="start" default-open>
              <h2 data-part="title">Storage</h2>
              <p data-part="description">12 of 50 GB used.</p>
              <div data-part="arrow" />
            </ui-popover>
            <span className={popupGap} />
            <ui-navigation-menu label="Ladder"><div data-part="item" {...nav({ label: 'Menu' })}><a href="#/geometry">Link</a></div><div data-part="item"><a data-part="link" href="#/colors">Link</a></div></ui-navigation-menu>
            <ui-tooltip content="Tooltip" side="right" default-open><ui-button aria-label="Info"><i slot="leading" name="info" /></ui-button></ui-tooltip>
          </div>
        </SizeLadder>
      </>
    ),
    actions: (
      <>
        <Row label="Slots">
          <ui-button><i slot="leading" name="plus" />Add item</ui-button>
          <ui-button>Next<i slot="trailing" name="arrow-right" /></ui-button>
          <ui-button aria-label="Add"><i slot="leading" name="plus" /></ui-button>
          <ui-button icon-size="fill"><span slot="leading" className={avatar} />Kim</ui-button>
        </Row>
        <Row label="Primary">
          <ui-button variant="primary">Save</ui-button>
          <ui-button variant="primary"><i slot="leading" name="plus" />Add item</ui-button>
          <ui-button variant="primary">Publish<span slot="suffix">⌘P</span></ui-button>
          <ui-button variant="primary" aria-label="Add"><i slot="leading" name="plus" /></ui-button>
          <ui-button variant="primary" loading>Saving</ui-button>
          <ui-button variant="primary" disabled>Disabled</ui-button>
        </Row>
        <Row label="Prefix / suffix">
          <ui-button><i slot="leading" name="credit-card" /><span slot="prefix">$</span>Pay 40<span slot="suffix">⌘P</span><i slot="trailing" name="caret-down" /></ui-button>
          <ui-button>Save<span slot="suffix">⌘S</span></ui-button>
          <ui-button><i slot="leading" name="bell" />Inbox<span slot="suffix">12</span></ui-button>
          <ui-chip selectable>Unread<span slot="suffix">4</span></ui-chip>
          <ui-tag><i slot="leading" name="tag" />Size<span slot="suffix">M</span></ui-tag>
        </Row>
        <Row label="Icon sizes">
          {(['sm', 'md', 'lg'] as const).map((k) => <ui-button key={k} icon-size={k}><i slot="leading" name="star" />{k}</ui-button>)}
          <ui-button icon-size="fill"><span slot="leading" className={avatar} />fill</ui-button>
        </Row>
        <Row label="Toggle">
          <ui-container preset="group">
            <ui-toggle aria-label="Bold" pressed><i slot="leading" name="text-b" /></ui-toggle>
            <ui-toggle aria-label="Italic"><i slot="leading" name="text-italic" /></ui-toggle>
            <ui-toggle aria-label="Underline" disabled><i slot="leading" name="text-underline" /></ui-toggle>
          </ui-container>
          <ui-toggle default-pressed><i slot="leading" name="star" />Favorite</ui-toggle>
          <ui-toggle>Notify me<span slot="suffix">3</span></ui-toggle>
          <ui-toggle pressed disabled>Locked on</ui-toggle>
        </Row>
        <Row label="Toggle group">
          <ui-toggle-group aria-label="Formatting" multiple value="bold,italic">
            <ui-toggle value="bold" aria-label="Bold"><i slot="leading" name="text-b" /></ui-toggle>
            <ui-toggle value="italic" aria-label="Italic"><i slot="leading" name="text-italic" /></ui-toggle>
            <ui-toggle value="underline" aria-label="Underline"><i slot="leading" name="text-underline" /></ui-toggle>
          </ui-toggle-group>
          <ui-toggle-group aria-label="Alignment" default-value="left">
            <ui-toggle value="left">Left</ui-toggle><ui-toggle value="center">Center</ui-toggle><ui-toggle value="right" disabled>Right</ui-toggle>
          </ui-toggle-group>
          <ui-toggle-group aria-label="View" orientation="vertical" value="grid">
            <ui-toggle value="grid"><i slot="leading" name="grid-four" />Grid</ui-toggle><ui-toggle value="list"><i slot="leading" name="list" />List with a longer label</ui-toggle>
          </ui-toggle-group>
        </Row>
        <SizeLadder family="composite" params={params}>
          <ui-toggle-group aria-label="Formatting" multiple value="bold"><ui-toggle value="bold"><i slot="leading" name="text-b" />Bold</ui-toggle><ui-toggle value="italic">Italic</ui-toggle></ui-toggle-group>
        </SizeLadder>
        <Row label="States">
          <ui-button>Default</ui-button>
          <ui-button loading>Loading</ui-button>
          <ui-button disabled>Disabled</ui-button>
        </Row>
        <SizeLadder family="button" params={params}>
          <ui-button><i slot="leading" name="plus" />Button</ui-button>
          <ui-button variant="primary">Save</ui-button>
          <ui-button aria-label="More"><i slot="leading" name="dots-three" /></ui-button>
          <ui-toggle pressed><i slot="leading" name="star" />Toggle</ui-toggle>
          <ui-toggle aria-label="Bold"><i slot="leading" name="text-b" /></ui-toggle>
        </SizeLadder>
      </>
    ),
    labels: (
      <SizeLadder family="btg" params={params}>
        <ui-badge>3</ui-badge>
        <ui-badge>New</ui-badge>
        <ui-tag><i slot="leading" name="star" />Featured</ui-tag>
        <ui-chip selectable selected><i slot="leading" name="check" />Design</ui-chip>
        <ui-chip selectable>Engineering</ui-chip>
        <ui-chip removable>Remote</ui-chip>
      </SizeLadder>
    ),
    fields: (
      <>
      <form className={formGrid} onSubmit={(e) => { e.preventDefault(); setStatus(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))); }}>
        <ui-input name="email" type="email" required label="Email" placeholder="you@example.com" description="We never share it." />
        <ui-input name="password" type="password" required minlength={12} label="Password" value="hunter2" />
        <ui-input name="team" label="Team" error="That name is taken." value="Acme" />
        <ui-input name="price" label="Price" value="40"><span slot="prefix">$</span><span slot="suffix">USD</span></ui-input>
        <ui-input name="search" label="Search" placeholder="Find a file"><i slot="leading" name="magnifying-glass" /><span slot="suffix">⌘K</span></ui-input>
        <ui-select name="role" label="Role" required>
          <ui-option value="design">Designer</ui-option>
          <ui-option value="eng">Engineer</ui-option>
          <ui-option value="research">Researcher</ui-option>
        </ui-select>
        <ui-checkbox name="terms" required>I accept the terms</ui-checkbox>
        <div className={specimens}>
          <ui-button type="submit">Create account</ui-button>
          <ui-button type="reset">Reset</ui-button>
        </div>
        <p className={caption} role="status">{status}</p>
      </form>
      <SizeLadder family="field" params={params}>
        <div className={ladderField}><ui-input label="Price" value="40"><span slot="prefix">$</span><span slot="suffix">USD</span></ui-input></div>
        <div className={ladderField}><ui-select label="Role" value="eng"><ui-option value="design">Designer</ui-option><ui-option value="eng">Engineer</ui-option></ui-select></div>
      </SizeLadder>
      <div className={stack}><h3 className={subTitle}>Inline fields</h3><InlineFields /></div>
      <div className={stack}><h3 className={subTitle}>Fieldsets</h3><Fieldsets params={params} /></div>
      </>
    ),
    selection: (
      <>
      <div className={columns}>
        <div className={stack}>
          <ui-select name="role" label="Role" required description="You can change this later.">
            <ui-option value="design">Designer</ui-option>
            <ui-option value="eng">Engineer</ui-option>
            <ui-option value="pm" disabled>Product manager</ui-option>
            <ui-option value="research">Researcher</ui-option>
          </ui-select>
          <ui-segmented name="plan" value="monthly" label="Billing">
            <ui-option value="monthly">Monthly</ui-option>
            <ui-option value="yearly">Yearly</ui-option>
          </ui-segmented>
        </div>
        <ui-listbox name="region" value="eu" label="Region">
          <ui-option value="us"><i slot="leading" name="globe" />United States</ui-option>
          <ui-option value="eu"><i slot="leading" name="globe" />Europe</ui-option>
          <ui-option value="apac"><i slot="leading" name="globe" />Asia Pacific</ui-option>
        </ui-listbox>
      </div>
      <SizeLadder family="composite" params={params}>
        <ui-segmented label="Billing" value="monthly"><ui-option value="monthly">Monthly</ui-option><ui-option value="yearly">Yearly</ui-option></ui-segmented>
      </SizeLadder>
      <Row label="Combobox">
        <div className={comboColumn}>
          <ui-combobox name="country" label="Country" placeholder="Search countries…" description="Type to filter; arrows and Enter pick.">
            {COUNTRIES.map(([v, l]) => <ui-option key={v} value={v}>{l}</ui-option>)}
          </ui-combobox>
          <ui-combobox name="assignee" label="Assignee" auto-highlight empty-text="Nobody by that name." value="alan">
            <i slot="leading" name="user" />
            <ui-option value="ada">Ada Lovelace</ui-option>
            <ui-option value="alan">Alan Turing</ui-option>
            <ui-option value="grace" disabled>Grace Hopper</ui-option>
            <ui-option value="katherine">Katherine Johnson</ui-option>
          </ui-combobox>
        </div>
        <div className={comboColumn}>
          <ui-combobox name="labels" label="Labels" multiple value="bug,docs,perf" placeholder="Add a label…">
            {LABELS.map(([v, l]) => <ui-option key={v} value={v}>{l}</ui-option>)}
          </ui-combobox>
          <ui-combobox label="Read only" readonly value="fi">{COUNTRIES.map(([v, l]) => <ui-option key={v} value={v}>{l}</ui-option>)}</ui-combobox>
        </div>
      </Row>
      <Row label="Autocomplete">
        <div className={comboColumn}>
          <ui-autocomplete name="city" label="City" placeholder="Where to?" description="Any text; suggestions filter as you type.">
            {CITIES.map((c) => <ui-option key={c}>{c}</ui-option>)}
          </ui-autocomplete>
        </div>
        <div className={comboColumn}>
          <ui-autocomplete name="command" label="Command" mode="both" show-trigger empty-text="Runs as typed.">
            <i slot="leading" name="terminal" />
            {COMMANDS.map((c) => <ui-option key={c}>{c}</ui-option>)}
          </ui-autocomplete>
        </div>
      </Row>
      <SizeLadder family="field" params={params}>
        <div className={ladderField}><ui-combobox label="Labels" multiple value="bug,ui">{LABELS.map(([v, l]) => <ui-option key={v} value={v}>{l}</ui-option>)}</ui-combobox></div>
      </SizeLadder>
      </>
    ),
    choices: (
      <>
        <Row label="Checkbox">
          <ui-checkbox>Email updates</ui-checkbox>
          <ui-checkbox checked>Push</ui-checkbox>
          <ui-checkbox indeterminate>Some</ui-checkbox>
          <ui-checkbox disabled>Disabled</ui-checkbox>
        </Row>
        <Row label="Radio">
          <ui-radio name="plan-r" value="free" checked>Free</ui-radio>
          <ui-radio name="plan-r" value="pro">Pro</ui-radio>
          <ui-radio name="plan-r" value="team">Team</ui-radio>
        </Row>
        <Row label="Switch">
          <ui-switch checked>Wi-Fi</ui-switch>
          <ui-switch>Bluetooth</ui-switch>
        </Row>
        <SizeLadder family="choice" params={params}>
          <ui-checkbox checked>Checkbox</ui-checkbox><ui-radio checked>Radio</ui-radio><ui-switch checked>Switch</ui-switch>
        </SizeLadder>
        <ChoiceGroups params={params} />
      </>
    ),
    tracks: (
      <>
        <Row label="Range"><div className={trackStack}><ui-range label="Volume" value={40} /><ui-range label="Steps" min={0} max={10} step={1} value={3} /></div></Row>
        <Row label="Range pair"><div className={trackStack}><ui-range label="Price" min={0} max={500} step={10} value={[100, 350]} /><ui-range label="Hours" min={0} max={24} value={[9, 9]} /></div></Row>
        <Row label="Progress"><div className={trackStack}><ui-progress label="Upload" value={64} /><ui-progress label="Loading" /></div></Row>
        <Row label="Meter">
          <div className={trackStack}>
            <ui-meter label="Battery" value={72} />
            <ui-meter label="Storage" value={38.5} max={50} format='{"style":"unit","unit":"gigabyte","maximumFractionDigits":1}' value-text="38.5 of 50 gigabytes used" />
            <ui-meter label="A much longer label that has to give way to the value" value={12} />
            <ui-meter aria-label="Strength" value={3} max={4} format='{"style":"decimal"}' />
          </div>
        </Row>
        <SizeLadder family="track" params={params}>
          <div className={trackStack}><ui-range label="Volume" value={40} /><ui-range label="Price" value={[20, 70]} /><ui-progress label="Upload" value={64} /><ui-meter label="Storage" value={64} /></div>
        </SizeLadder>
      </>
    ),
    color: (
      <>
        <Row label="Swatches">
          {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', 'oklch(0.6 0.2 300 / 0.5)'].map((c) => <ui-swatch key={c} color={c} />)}
        </Row>
        <Row label="Palette">
          <ui-palette label="Brand" name="brand" value="#3b82f6">
            {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map((c) => <ui-swatch key={c} color={c} />)}
          </ui-palette>
        </Row>
        <SizeLadder family="swatch" params={params}>
          <ui-swatch color="#3b82f6" />
          <ui-palette label="Brand">{['#ef4444', '#f59e0b', '#10b981', '#3b82f6'].map((c) => <ui-swatch key={c} color={c} />)}</ui-palette>
        </SizeLadder>
      </>
    ),
    entry: (
      <>
        <Row label="Number field">
          <div className={entryColumn}>
            <ui-number-field label="Quantity" value={1} min={1} max={99} description="Drag the label to scrub." />
            <ui-number-field label="Width" value={240} min={0} step={8} snap-on-step allow-wheel-scrub><span slot="suffix">px</span></ui-number-field>
          </div>
          <div className={entryColumn}>
            <ui-number-field label="Price" value={1200} min={0} step={0.5} locale="de-DE" format='{"style":"currency","currency":"EUR"}' />
            <ui-number-field label="Discount" value={0.15} min={0} max={1} step={0.01} format='{"style":"percent"}' />
          </div>
        </Row>
        <Row label="States">
          <div className={entryColumn}>
            <ui-number-field label="Read-only" value={-42.5} readonly />
            <ui-number-field label="Disabled" value={3} disabled />
          </div>
          <div className={entryColumn}>
            <ui-number-field label="Required" required placeholder="Enter a number" />
            <ui-number-field label="Out of range" value={12} max={10} allow-out-of-range error="Use 10 or less." />
          </div>
        </Row>
        <SizeLadder family="numberField" params={params}>
          <div className={entryColumn}><ui-number-field label="Amount" value={1284} /></div>
        </SizeLadder>
        <Row label="OTP field">
          <div className={entryColumn}>
            <ui-field label="Verification code" description="Paste or type the 6 digits."><ui-otp-field name="code" required /></ui-field>
            <ui-field label="Grouped">
              <ui-otp-field value="123">
                <div data-part="input" /><div data-part="input" /><div data-part="input" /><div data-part="separator" /><div data-part="input" /><div data-part="input" /><div data-part="input" />
              </ui-otp-field>
            </ui-field>
          </div>
          <div className={entryColumn}>
            <ui-field label="Recovery key"><ui-otp-field length={4} validation-type="alphanumeric" value="A7" mask /></ui-field>
            <ui-field label="Read-only"><ui-otp-field length={4} value="2468" readonly /></ui-field>
            <ui-field label="Disabled"><ui-otp-field length={4} value="13" disabled /></ui-field>
          </div>
        </Row>
        <SizeLadder family="otpField" params={params}>
          <ui-otp-field length={4} value="42" label="Code" />
        </SizeLadder>
      </>
    ),
    disclosure: (
      <>
        <Row label="Collapsible">
          <div className={disclosureColumn}>
            <ui-collapsible label="What is a unit?"><p className={panelText}>Every length in the kit is a multiple of u. A control is 8u tall; type is 10px + u.</p></ui-collapsible>
            <ui-collapsible label="Shipping" default-open><p className={panelText}>Orders ship within two working days. Tracking arrives by email.</p></ui-collapsible>
            <ui-collapsible>
              <div data-part="trigger"><i slot="leading" name="key" />Recovery keys<span slot="suffix">3</span></div>
              <div data-part="panel"><p className={panelText}>alien-bean-pasta · quiet-river-stone · north-paper-lamp</p></div>
            </ui-collapsible>
            <ui-collapsible label="Archived (read only)" disabled><p className={panelText}>Hidden.</p></ui-collapsible>
          </div>
        </Row>
        <Row label="Accordion">
          <div className={disclosureColumn}>
            <ui-accordion default-value="shipping">
              <ui-collapsible value="shipping" label="Shipping"><p className={panelText}>Orders ship within two working days. Tracking arrives by email.</p></ui-collapsible>
              <ui-collapsible value="returns" label="Returns"><p className={panelText}>Return anything within 30 days, free of charge.</p></ui-collapsible>
              <ui-collapsible value="warranty" label="Warranty"><i slot="leading" name="shield-check" /><p className={panelText}>Two years on every part, worldwide.</p></ui-collapsible>
              <ui-collapsible value="archive" label="Archived orders" disabled><p className={panelText}>Hidden.</p></ui-collapsible>
            </ui-accordion>
          </div>
        </Row>
        <Row label="Multiple">
          <div className={disclosureColumn}>
            <ui-accordion multiple>
              <ui-collapsible label="Account" open><p className={panelText}>Name, email and avatar.</p></ui-collapsible>
              <ui-collapsible label="Billing" open><p className={panelText}>Card ending 4242, renews 1 Dec.</p></ui-collapsible>
              <ui-collapsible label="Notifications"><p className={panelText}>Email and push.</p></ui-collapsible>
            </ui-accordion>
          </div>
        </Row>
        <Row label="Tabs">
          <div className={tabsColumn}>
            <ui-tabs label="Project">
              <div {...{ value: 'overview', label: 'Overview' }} data-part="panel"><p className={panelText}>Status, owners and the next milestone.</p></div>
              <div {...{ value: 'activity', label: 'Activity' }} data-part="panel"><p className={panelText}>Twelve changes this week, three reviews waiting.</p></div>
              <div {...{ value: 'settings', label: 'Settings' }} data-part="panel"><p className={panelText}>Name, visibility and access.</p></div>
            </ui-tabs>
            <ui-tabs variant="underline" default-value="files" label="Repository">
              <div data-part="list">
                <div {...{ value: 'code' }} data-part="tab"><i slot="leading" name="code" />Code</div>
                <div {...{ value: 'files' }} data-part="tab">Files<span slot="suffix">12</span></div>
                <div {...{ value: 'issues' }} data-part="tab"><i slot="leading" name="bug" />Issues</div>
                <div {...{ value: 'wiki', disabled: true }} data-part="tab">Wiki</div>
              </div>
              <div {...{ value: 'code' }} data-part="panel"><p className={panelText}>main.ts · styles.css · README.md</p></div>
              <div {...{ value: 'files' }} data-part="panel"><p className={panelText}>12 files, 4 folders.</p></div>
              <div {...{ value: 'issues' }} data-part="panel"><p className={panelText}>No open issues.</p></div>
              <div {...{ value: 'wiki' }} data-part="panel"><p className={panelText}>Empty.</p></div>
            </ui-tabs>
          </div>
        </Row>
        <Row label="Vertical">
          <div className={tabsRow}>
            <ui-tabs orientation="vertical" activate-on-focus label="Preferences">
              <div {...{ label: 'General' }} data-part="panel"><p className={panelText}>Language and region. Arrow keys switch tabs here (activate on focus).</p></div>
              <div {...{ label: 'Privacy' }} data-part="panel"><p className={panelText}>Who can see your profile.</p></div>
              <div {...{ label: 'Billing' }} data-part="panel"><p className={panelText}>Invoices and payment.</p></div>
            </ui-tabs>
            <ui-tabs orientation="vertical" variant="underline" label="Sections">
              <div {...{ label: 'Intro' }} data-part="panel"><p className={panelText}>Underline, vertical: the bar runs on the inline end.</p></div>
              <div {...{ label: 'Details' }} data-part="panel"><p className={panelText}>Second panel.</p></div>
            </ui-tabs>
          </div>
        </Row>
        <SizeLadder family="disclosure" params={params}>
          <ui-tabs label="Size"><div {...{ label: 'One' }} data-part="panel" /><div {...{ label: 'Two' }} data-part="panel" /><div {...{ label: 'Three' }} data-part="panel" /></ui-tabs>
          <ui-tabs variant="underline" label="Size"><div {...{ label: 'One' }} data-part="panel" /><div {...{ label: 'Two' }} data-part="panel" /></ui-tabs>
          <div className={disclosureColumn}>
            <ui-accordion default-value="0"><ui-collapsible label="Details"><p className={panelText}>Panel text starts at the trigger label.</p></ui-collapsible><ui-collapsible label="More" /></ui-accordion>
          </div>
        </SizeLadder>
      </>
    ),
    forms: <Forms params={params} />,
    scrolling: <ScrollAreas params={params} />,
    overlays: (
      <>
        <Row label="Dialog">
          <ui-dialog label="Rename file" description="The name shows in the sidebar and in shared links.">
            <ui-button data-part="trigger">Rename…</ui-button>
            <ui-input label="Name" value="Quarterly report" {...{ autofocus: '' }} />
            <div data-part="actions"><ui-button data-part="close">Cancel</ui-button><ui-button data-part="close" variant="primary">Rename</ui-button></div>
          </ui-dialog>
          <ui-dialog label="Workspace settings" description="Nested: a second dialog opens over this one.">
            <ui-button data-part="trigger"><i slot="leading" name="gear" />Settings</ui-button>
            <div className={dialogBody}>
              <ui-switch checked>Show hidden files</ui-switch>
              <ui-switch>Compact rows</ui-switch>
            </div>
            <div data-part="actions">
              <ui-dialog label="Reset settings?" description="Every preference returns to its default.">
                <ui-button data-part="trigger">Reset…</ui-button>
                <div data-part="actions"><ui-button data-part="close">Cancel</ui-button><ui-button data-part="close" variant="primary">Reset</ui-button></div>
              </ui-dialog>
              <ui-button data-part="close" variant="primary">Done</ui-button>
            </div>
          </ui-dialog>
          <ui-dialog modal="false" label="Keyboard shortcuts" description="Not modal: the page stays interactive; focus leaving closes it.">
            <ui-button data-part="trigger">Shortcuts</ui-button>
            <p className={panelText}>⌘K search · ⌘S save · ⌘/ this list</p>
            <div data-part="actions"><ui-button data-part="close">Close</ui-button></div>
          </ui-dialog>
        </Row>
        <Row label="Alert dialog">
          <ui-alert-dialog label="Delete project?" description="Its files, history and shared links are removed. This cannot be undone.">
            <ui-button data-part="trigger"><i slot="leading" name="trash" />Delete project…</ui-button>
            <div data-part="actions"><ui-button data-part="close">Cancel</ui-button><ui-button data-part="close" variant="primary">Delete</ui-button></div>
          </ui-alert-dialog>
          <ui-alert-dialog label="Discard changes?" description="Your edits since the last save are lost.">
            <ui-button data-part="trigger">Discard</ui-button>
            <div data-part="actions"><ui-button data-part="close">Keep editing</ui-button><ui-button data-part="close" variant="primary">Discard</ui-button></div>
          </ui-alert-dialog>
        </Row>
        <Row label="Drawer">
          <ui-drawer side="right" label="Filters" description="Narrow the list; swipe right or press Escape to close.">
            <ui-button data-part="trigger"><i slot="leading" name="funnel" />Filters</ui-button>
            <div className={dialogBody}>
              <ui-checkbox checked>In stock</ui-checkbox>
              <ui-checkbox>On sale</ui-checkbox>
              <ui-switch>Free shipping</ui-switch>
            </div>
            <div data-part="actions"><ui-button data-part="close">Reset</ui-button><ui-button data-part="close" variant="primary">Show results</ui-button></div>
          </ui-drawer>
          <ui-drawer label="Share" description="A bottom sheet: drag it down to dismiss.">
            <ui-button data-part="trigger">Share…</ui-button>
            <div data-part="actions"><ui-button data-part="close">Copy link</ui-button><ui-button data-part="close" variant="primary">Done</ui-button></div>
          </ui-drawer>
          <ui-drawer side="left" label="Navigation">
            <ui-button data-part="trigger"><i slot="leading" name="list" />Menu</ui-button>
            <div className={dialogBody}><ui-button>Inbox</ui-button><ui-button>Sent</ui-button><ui-button>Archive</ui-button></div>
          </ui-drawer>
        </Row>
        <SizeLadder family="dialog" params={params}>
          <ui-dialog label="Dialog at this size" description="Padding 6u, radius = padding, parts 2u apart.">
            <ui-button data-part="trigger">Open</ui-button>
            <div data-part="actions"><ui-button data-part="close">Close</ui-button></div>
          </ui-dialog>
        </SizeLadder>
        <SizeLadder family="drawer" params={params}>
          <ui-drawer side="right" label="Drawer at this size" description="Panel padding 6u, square, 80u wide.">
            <ui-button data-part="trigger">Open drawer</ui-button>
            <div data-part="actions"><ui-button data-part="close">Close</ui-button></div>
          </ui-drawer>
        </SizeLadder>
      </>
    ),
    menus: (
      <>
        <Row label="Menu">
          <ui-menu label="Edit">
            <div data-part="item"><i slot="leading" name="scissors" />Cut<span slot="suffix">⌘X</span></div>
            <div data-part="item"><i slot="leading" name="copy" />Copy<span slot="suffix">⌘C</span></div>
            <div data-part="item"><i slot="leading" name="clipboard" />Paste<span slot="suffix">⌘V</span></div>
            <div data-part="separator" />
            <div data-part="item" {...{ disabled: true }}>Select all</div>
          </ui-menu>
          <ui-menu>
            <div data-part="trigger"><i slot="leading" name="sliders" />View</div>
            <div data-part="popup">
              <div data-part="checkbox-item" {...{ checked: '' }}>Show grid</div>
              <div data-part="checkbox-item">Show rulers</div>
              <div data-part="separator" />
              <div data-part="group">
                <div data-part="group-label">Sort by</div>
                <div data-part="radio-group" {...{ value: 'name' }}>
                  <div data-part="radio-item" {...{ value: 'name' }}>Name</div>
                  <div data-part="radio-item" {...{ value: 'date' }}>Date modified</div>
                  <div data-part="radio-item" {...{ value: 'size' }}>Size</div>
                </div>
              </div>
            </div>
          </ui-menu>
          <ui-menu label="File">
            <div data-part="item">New file<span slot="suffix">⌘N</span></div>
            <div data-part="item">Open…<span slot="suffix">⌘O</span></div>
            <ui-menu>
              <div data-part="submenu-trigger"><i slot="leading" name="export" />Export</div>
              <div data-part="popup"><div data-part="item">PNG</div><div data-part="item">SVG</div><div data-part="item">PDF</div></div>
            </ui-menu>
            <div data-part="separator" />
            <div data-part="item">Close</div>
          </ui-menu>
          <ui-menu label="Hover" open-on-hover><div data-part="item">Opens on hover</div><div data-part="item">After 100ms</div></ui-menu>
          <ui-menu label="Disabled" disabled><div data-part="item">Hidden</div></ui-menu>
        </Row>
        <Row label="Menubar">
          <ui-menubar label="Editor">
            <ui-menu label="File">
              <div data-part="item">New<span slot="suffix">⌘N</span></div>
              <div data-part="item">Open…<span slot="suffix">⌘O</span></div>
              <ui-menu><div data-part="submenu-trigger">Open recent</div><div data-part="popup"><div data-part="item">notes.md</div><div data-part="item">plan.md</div></div></ui-menu>
              <div data-part="separator" />
              <div data-part="item">Save<span slot="suffix">⌘S</span></div>
            </ui-menu>
            <ui-menu label="Edit">
              <div data-part="item">Undo<span slot="suffix">⌘Z</span></div>
              <div data-part="item">Redo<span slot="suffix">⇧⌘Z</span></div>
            </ui-menu>
            <ui-menu label="View">
              <div data-part="checkbox-item" {...{ checked: '' }}>Ruler</div>
              <div data-part="checkbox-item">Grid</div>
            </ui-menu>
            <ui-menu label="Help" disabled><div data-part="item">Docs</div></ui-menu>
          </ui-menubar>
          <ui-menubar orientation="vertical" label="Tools">
            <ui-menu><div data-part="trigger"><i slot="leading" name="pencil" />Draw</div><div data-part="popup"><div data-part="item">Pen</div><div data-part="item">Brush</div></div></ui-menu>
            <ui-menu><div data-part="trigger"><i slot="leading" name="shapes" />Shapes</div><div data-part="popup"><div data-part="item">Rectangle</div><div data-part="item">Ellipse</div></div></ui-menu>
          </ui-menubar>
        </Row>
        <Row label="Context menu">
          <ui-context-menu>
            <div data-part="trigger" tabIndex={0} className={contextArea}>Right-click (or long-press, or Shift+F10) here</div>
            <div data-part="popup" aria-label="Canvas actions">
              <div data-part="item"><i slot="leading" name="copy" />Copy<span slot="suffix">⌘C</span></div>
              <div data-part="item"><i slot="leading" name="clipboard" />Paste<span slot="suffix">⌘V</span></div>
              <ui-menu>
                <div data-part="submenu-trigger"><i slot="leading" name="stack" />Arrange</div>
                <div data-part="popup"><div data-part="item">Bring to front</div><div data-part="item">Send to back</div></div>
              </ui-menu>
              <div data-part="separator" />
              <div data-part="checkbox-item" {...{ checked: '' }}>Snap to grid</div>
              <div data-part="item"><i slot="leading" name="trash" />Delete</div>
            </div>
          </ui-context-menu>
        </Row>
        <SizeLadder family="menu" params={params}>
          <ui-menu label="Menu"><div data-part="item">One</div><div data-part="item">Two</div></ui-menu>
          <ui-menubar label="Size"><ui-menu label="File"><div data-part="item">New</div></ui-menu><ui-menu label="Edit"><div data-part="item">Undo</div></ui-menu></ui-menubar>
        </SizeLadder>
      </>
    ),
    media: (
      <>
        <Row label="Swiper">
          <ui-swiper label="Gallery" className={media}>
            {IMAGES.map((src, i) => <ui-image key={i} src={src} alt={`Slide ${i + 1}`} ratio="wide" />)}
          </ui-swiper>
        </Row>
        <Row label="Formats">
          <div className={formats}>
            {['square', 'landscape', 'portrait', 'wide', 'golden'].map((r, i) => (
              <figure key={r} className={figure}><ui-image src={IMAGES[i % 4]} alt={r} ratio={r} /><figcaption className={caption}>{r}</figcaption></figure>
            ))}
          </div>
        </Row>
        <Row label="Slideshow">
          <ui-image slideshow ratio="wide" alt="Places" className={media}>
            {IMAGES.map((src, i) => <img key={i} src={src} alt={`Place ${i + 1}`} />)}
          </ui-image>
        </Row>
      </>
    ),
    feedback: <Toasts params={params} />,
    display: (
      <>
        <Row label="Separator">
          <div className={separatorDemo}>
            <ui-container preset="collection"><span>Account</span><span>Billing</span><ui-separator /><span>Sign out</span></ui-container>
            <ui-container preset="group"><ui-button>Cut</ui-button><ui-button>Copy</ui-button><ui-separator orientation="vertical" /><ui-button>Paste</ui-button></ui-container>
          </div>
        </Row>
        <Row label="Avatar">
          <ui-avatar avatar-size="sm" name="Maya Lindqvist" />
          <ui-avatar name="Maya Lindqvist" />
          <ui-avatar avatar-size="lg" name="Tomás Herrera" className={tonePrimary} />
          <ui-avatar avatar-size="xl" src={IMAGES[1]} alt="Aiko Tanaka">AT</ui-avatar>
          <ui-avatar name="Broken link" src="data:image/png;base64,broken" />
          <ui-avatar />
        </Row>
        <Row label="In a slot">
          <ui-button icon-size="fill"><ui-avatar slot="leading" avatar-size="sm" name="Kim Sandberg" />Kim</ui-button>
          <ui-chip><ui-avatar slot="leading" avatar-size="sm" src={IMAGES[0]} alt="" />Dawn</ui-chip>
        </Row>
        <h3 className={subTitle}>Avatar sizes</h3>
        <SizeLadder family="avatar" params={params}>
          <ui-avatar avatar-size="sm" name="Ada Lovelace" /><ui-avatar name="Ada Lovelace" /><ui-avatar avatar-size="lg" name="Ada Lovelace" className={tonePrimary} /><ui-avatar avatar-size="xl" />
        </SizeLadder>
        <h3 className={subTitle}>Separator sizes</h3>
        <SizeLadder family="separator" params={params}>
          <div className={separatorLadder}><ui-container preset="group"><ui-button>Cut</ui-button><ui-separator orientation="vertical" /><ui-button>Paste</ui-button></ui-container><ui-separator /></div>
        </SizeLadder>
      </>
    ),
  };
  const shown = FAMILIES.filter(([f]) => !family || f === family);
  return (
    <Page title="Components" lead="Every web component at the live theme, by family. Sizes are the unit u (control height 8u); the jig panel changes the theme live.">
      {shown.map(([f, label, tags]) => (
        <Fragment key={f}>
          <Divider />
          <Section id={f} title={label} tags={tags} note={NOTES[f]}>{CONTENT[f]}</Section>
        </Fragment>
      ))}
    </Page>
  );
}

// Toast specimens: inline viewports seeded from their own managers (timeout 0: they stay), and live
// viewports in the top layer fed by the buttons.
const toastColumn = css({ display: 'flex', flexDirection: 'column', gap: '4', width: 'full', maxWidth: '[24rem]' });
const live = createToastManager();
const liveTop = createToastManager();
type ToastViewportEl = HTMLElement & { manager: ToastManager };

function ToastPreview({ toasts, limit }: { toasts: ToastOptions[]; limit?: number }) {
  const ref = useCallback((el: ToastViewportEl | null) => {
    if (!el) return;
    const m = createToastManager({ timeout: 0 });
    el.manager = m;
    for (const t of [...toasts].reverse()) m.add({ timeout: 0, ...t });
  }, []);
  return <ui-toast-viewport ref={ref} placement="inline" limit={limit} label="Preview" />;
}

function Toasts({ params }: Pick<PageProps, 'params'>) {
  const bind = (m: ToastManager) => (el: ToastViewportEl | null) => { if (el) el.manager = m; };
  let n = 0;
  const save = () => new Promise<string>((ok, no) => setTimeout(() => (Math.random() < 0.75 ? ok('draft.md') : no(new Error('The server did not answer.'))), 1600));
  return (
    <>
      <Row label="Types">
        <div className={toastColumn}>
          <ToastPreview toasts={[
            { title: 'Changes saved', description: 'Your draft is stored on this device.', type: 'success', actionProps: { children: 'Undo' } },
            { title: 'Upload failed', description: 'cover.png is larger than 10 MB.', type: 'error' },
            { description: 'Syncing 12 files…', type: 'loading' },
          ]} />
        </div>
      </Row>
      <Row label="Long text">
        <div className={toastColumn}>
          <ToastPreview toasts={[{ title: 'Invitation sent to the design review group for Thursday', description: 'Everyone on the list gets an email with the agenda, the meeting link and the files attached to this project.', actionProps: { children: 'View invite' } }]} />
        </div>
      </Row>
      <Row label="Live">
        <ui-button onClick={() => live.add({ title: `Message ${++n}`, description: 'Hover or focus the stack to pause and expand it.', actionProps: { children: 'Undo', onClick: () => live.add({ description: 'Undone.', type: 'info' }) } })}>Notify</ui-button>
        <ui-button onClick={() => live.promise(save(), { loading: 'Saving draft…', success: (f) => ({ title: 'Saved', description: `${f} is stored.` }), error: (e) => ({ title: 'Not saved', description: (e as Error).message }) })}>Save (promise)</ui-button>
        <ui-button onClick={() => liveTop.add({ title: 'Connection lost', description: 'Swipe up or press Escape to dismiss.', type: 'warning', priority: 'high' })}>Alert at the top</ui-button>
        <ui-button onClick={() => { live.close(); liveTop.close(); }}>Close all</ui-button>
        <ui-toast-viewport ref={bind(live)} />
        <ui-toast-viewport ref={bind(liveTop)} placement="top-center" swipe-direction="up" label="Alerts" />
      </Row>
      <SizeLadder family="toast" params={params}>
        <div className={toastColumn}><ToastPreview toasts={[{ title: 'Saved', description: 'Draft stored.', actionProps: { children: 'Undo' } }]} /></div>
      </SizeLadder>
    </>
  );
}
