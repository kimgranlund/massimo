// Settings: a panel sidebar (area) beside cards of fields: inputs with prefix and suffix, a select,
// choices (a fieldset of a checkbox group and a radio group), a segmented control and a range, an
// invalid field, and primary/neutral actions.
import '@massimo/ui-kit/components/field/element';
import '@massimo/ui-kit/components/radio-group/element';
import '@massimo/ui-kit/components/checkbox-group/element';
import '@massimo/ui-kit/components/fieldset/element';
import { useState } from 'react';
import { css, cx } from '../../../styled-system/css/index.js';
import { SETTINGS_NAV, TIMEZONES } from './data.ts';
import * as s from './styles.ts';

// Container queries on the page width (literal here so Panda can extract them).
const CQ_MD = '@container home (min-width: 44rem)';
const CQ_LG = '@container home (min-width: 64rem)';

const layout = css({
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', alignItems: 'start', bg: 'bg', borderWidth: 'thin', borderColor: 'border',
  [CQ_LG]: { gridTemplateColumns: '[16rem minmax(0, 1fr)]' },
});
const sidebar = css({ alignSelf: 'stretch', borderBottomWidth: 'thin', borderColor: 'border', [CQ_LG]: { borderBottomWidth: '[0]', borderInlineEndWidth: 'thin' } });
const nav = css({ width: 'full' });
const main = css({ display: 'flex', flexDirection: 'column', gap: 'gap.panel', padding: 'inset.panel', minWidth: '0' });
const fields = css({ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '4', [CQ_MD]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' } });
const full = css({ [CQ_MD]: { gridColumn: '1 / -1' } });
const cardHead = css({ display: 'flex', flexDirection: 'column', gap: '1' });
const toggleRow = css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4', paddingBlock: '1' });
const choiceList = css({ display: 'flex', flexDirection: 'column', gap: '2' });
const footer = css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3', flexWrap: 'wrap' });
const callout = css({ display: 'flex', gap: '3', alignItems: 'start', padding: '3', borderRadius: 'lg', textStyle: 'body' });
const planGrid = css({ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '4', [CQ_MD]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }, alignItems: 'start' });
const price = css({ textStyle: 'heading-2', '& span': { textStyle: 'body', color: 'fg.muted' } });
const profileText = css({ flex: '[1 1 14rem]', minWidth: '0' });
const profileHead = css({ display: 'flex', alignItems: 'center', gap: '4', flexWrap: 'wrap' });

export function Settings() {
  const [seats, setSeats] = useState(12);
  const [yearly, setYearly] = useState(true);
  const perSeat = yearly ? 9 : 11;
  return (
    <div className={layout}>
      <ui-panel className={sidebar} aria-label="Settings sections">
        <div className={s.stack1}>
          <span className={s.groupKicker}>Workspace</span>
          <span className={s.h3}>Settings</span>
        </div>
        <ui-listbox label="Settings sections" value="profile" className={nav}>
          {SETTINGS_NAV.map(([v, icon, text]) => <ui-option key={v} value={v}><i slot="leading" name={icon} />{text}</ui-option>)}
        </ui-listbox>
        <p className={s.caption}>Changes apply to everyone in Fieldnote Studio.</p>
      </ui-panel>

      <form className={main} onSubmit={(e) => e.preventDefault()} aria-label="Profile settings">
        <ui-card padding="lg">
          <div className={profileHead}>
            <ui-avatar avatar-size="xl" className={s.tone.primary} aria-hidden="true">KS</ui-avatar>
            <div className={cx(s.stack1, profileText)}>
              <h3 className={s.h3}>Profile</h3>
              <p className={s.caption}>How you appear on comments, approvals and the activity feed.</p>
            </div>
            <ui-button><i slot="leading" name="upload-simple" />Upload photo</ui-button>
          </div>
          <div className={fields}>
            <ui-input name="name" label="Full name" value="Kim Sandberg" required />
            <ui-input name="title" label="Role" value="Head of product" />
            <ui-input name="email" type="email" label="Email" value="kim@fieldnote" error="Enter a full address, like kim@fieldnote.co." className={full}>
              <i slot="leading" name="envelope-simple" />
            </ui-input>
            <ui-input name="site" label="Website" value="fieldnote.co" description="Shown on your public profile.">
              <span slot="prefix">https://</span>
            </ui-input>
            <ui-select name="tz" label="Time zone" value="europe-stockholm">
              <i slot="leading" name="globe" />
              {TIMEZONES.map(([v, t]) => <ui-option key={v} value={v}>{t}</ui-option>)}
            </ui-select>
          </div>
        </ui-card>

        <ui-card padding="lg">
          <div className={cardHead}><h3 className={s.h3}>Notifications</h3><p className={s.caption}>Pick where updates reach you. Critical alerts always send.</p></div>
          <div className={choiceList}>
            <div className={toggleRow}><div className={s.stack1}><span className={s.title}>Order alerts</span><span className={s.caption}>Every new order over $500</span></div><ui-switch checked aria-label="Order alerts" /></div>
            <div className={toggleRow}><div className={s.stack1}><span className={s.title}>Weekly digest</span><span className={s.caption}>A Monday summary of last week</span></div><ui-switch checked aria-label="Weekly digest" /></div>
            <div className={toggleRow}><div className={s.stack1}><span className={s.title}>Product news</span><span className={s.caption}>New features, about once a month</span></div><ui-switch aria-label="Product news" /></div>
          </div>
          <ui-fieldset legend="Delivery">
            <ui-field label="Send to">
              <ui-checkbox-group name="channels" value="email push" orientation="horizontal">
                <ui-checkbox value="email">Email</ui-checkbox>
                <ui-checkbox value="push">Push</ui-checkbox>
                <ui-checkbox value="sms">SMS</ui-checkbox>
              </ui-checkbox-group>
            </ui-field>
            <ui-field label="Quiet hours">
              <ui-radio-group name="quiet" value="night" orientation="horizontal">
                <ui-radio value="off">Off</ui-radio>
                <ui-radio value="night">Nights, 22–07</ui-radio>
                <ui-radio value="weekend">Weekends</ui-radio>
              </ui-radio-group>
            </ui-field>
          </ui-fieldset>
        </ui-card>

        <ui-card padding="lg">
          <div className={s.spread}>
            <div className={cardHead}><h3 className={s.h3}>Plan</h3><p className={s.caption}>Team plan · renews Dec 1</p></div>
            <ui-segmented label="Billing period" value={yearly ? 'yearly' : 'monthly'} onInput={(e) => setYearly((e.currentTarget as unknown as { value: string }).value === 'yearly')}>
              <ui-option value="monthly">Monthly</ui-option>
              <ui-option value="yearly">Yearly<span slot="suffix">−18%</span></ui-option>
            </ui-segmented>
          </div>
          <div className={planGrid}>
            <div className={s.stack2}>
              <div className={s.spread}><span className={s.label}>Seats</span><span className={s.strong} data-numeric>{seats}</span></div>
              <ui-range label="Seats" min={1} max={50} step={1} value={seats} value-text={`${seats} seats`}
              onInput={(e) => setSeats(Number((e.currentTarget as unknown as { value: number }).value))} />
              <span className={s.caption}>Up to 50 on the Team plan</span>
            </div>
            <div className={s.stack1}>
              <strong className={price} data-numeric>${(seats * perSeat).toLocaleString('en-US')}<span> / month</span></strong>
              <span className={s.caption}>{seats} seats × ${perSeat}{yearly ? ', billed yearly' : ''}</span>
            </div>
          </div>
          <p className={cx(callout, s.tone.info)} role="note"><i name="info" />Seats you add today are prorated to your renewal date.</p>
          <div className={s.stack2}>
            <span className={s.groupKicker}>Billing questions</span>
            <ui-accordion>
              <ui-collapsible label="When am I charged?"><p className={s.caption}>On the first of each period. Yearly plans are charged once, up front.</p></ui-collapsible>
              <ui-collapsible label="Can I remove seats?"><p className={s.caption}>Yes. Removed seats are credited at your next renewal.</p></ui-collapsible>
              <ui-collapsible label="Do you offer invoices?"><p className={s.caption}>Every charge has a PDF invoice under Billing history.</p></ui-collapsible>
            </ui-accordion>
          </div>
        </ui-card>

        <div className={footer}>
          <span className={s.caption}>Last saved 4 minutes ago</span>
          <ui-group>
            <ui-button type="reset">Discard</ui-button>
            <ui-button type="submit" variant="primary">Save changes</ui-button>
          </ui-group>
        </div>
      </form>
    </div>
  );
}
