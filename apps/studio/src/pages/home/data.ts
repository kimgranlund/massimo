// Fake content for the Home page: a small outdoor-goods brand ("Fieldnote") with a store, a team
// and a journal. Figures are illustrative.
import type { Tone } from './styles.ts';
import type { RoleKey, Scene } from './art.ts';

export const BRAND = 'Fieldnote';

export const FEATURES: { icon: string; title: string; text: string }[] = [
  { icon: 'calendar-blank', title: 'Plan drops', text: 'Line up collections by season and see what ships when.' },
  { icon: 'chart-line-up', title: 'Watch the numbers', text: 'Revenue, orders and returns for every channel in one view.' },
  { icon: 'users-three', title: 'Work together', text: 'Comments, approvals and handoffs without the email chain.' },
];

export interface Stat { label: string; value: string; unit?: string; delta: string; tone: Tone; icon: string; note: string }
export const STATS: Stat[] = [
  { label: 'Revenue', value: '48,210', unit: '$', delta: '12.4%', tone: 'success', icon: 'arrow-up-right', note: 'vs. last 30 days' },
  { label: 'Orders', value: '1,284', delta: '3.1%', tone: 'success', icon: 'arrow-up-right', note: '42 today' },
  { label: 'Conversion', value: '3.42', unit: '%', delta: '0.4 pt', tone: 'critical', icon: 'arrow-down-right', note: 'checkout step 2' },
  { label: 'Returns', value: '18', delta: '2 new', tone: 'warning', icon: 'warning', note: 'awaiting review' },
];

// Weekly revenue by channel (thousands), eight weeks; one data color per channel.
export const CHANNELS: [string, number[]][] = [
  ['Online store', [8.2, 9.1, 8.7, 10.4, 11.2, 10.8, 12.6, 13.1]],
  ['Retail', [5.1, 5.4, 6.0, 5.8, 6.6, 7.2, 7.0, 7.9]],
  ['Wholesale', [3.0, 2.6, 3.4, 3.1, 2.8, 3.6, 3.9, 3.5]],
  ['Marketplace', [1.8, 2.1, 1.9, 2.4, 2.6, 2.2, 2.9, 3.2]],
  ['Social', [0.9, 1.2, 1.4, 1.1, 1.6, 2.0, 1.8, 2.3]],
  ['Pop-ups', [0, 0.4, 0, 0.8, 0, 1.2, 0.6, 1.4]],
];
export const WEEKS = ['Sep 8', 'Sep 15', 'Sep 22', 'Sep 29', 'Oct 6', 'Oct 13', 'Oct 20', 'Oct 27'];

export const TOP_PRODUCTS: { name: string; units: number }[] = [
  { name: 'Waxed field jacket', units: 312 },
  { name: 'Merino trail crew', units: 268 },
  { name: 'Canvas day pack', units: 201 },
  { name: 'Ridge wool beanie', units: 144 },
];

export type OrderStatus = 'Paid' | 'Pending' | 'Shipped' | 'Refunded';
export const STATUS_TONE: Record<OrderStatus, Tone> = { Paid: 'success', Pending: 'warning', Shipped: 'info', Refunded: 'critical' };
export interface Order { id: string; customer: string; initials: string; item: string; channel: string; status: OrderStatus; total: string; when: string }
export const ORDERS: Order[] = [
  { id: '#4821', customer: 'Maya Lindqvist', initials: 'ML', item: 'Waxed field jacket', channel: 'Online', status: 'Paid', total: '248.00', when: '2 min ago' },
  { id: '#4820', customer: 'Tomás Herrera', initials: 'TH', item: 'Canvas day pack ×2', channel: 'Retail', status: 'Shipped', total: '196.00', when: '18 min ago' },
  { id: '#4819', customer: 'Aiko Tanaka', initials: 'AT', item: 'Merino trail crew', channel: 'Marketplace', status: 'Pending', total: '89.00', when: '1 h ago' },
  { id: '#4818', customer: 'Jonas Becker', initials: 'JB', item: 'Ridge wool beanie ×3', channel: 'Online', status: 'Refunded', total: '72.00', when: '3 h ago' },
  { id: '#4817', customer: 'Priya Nair', initials: 'PN', item: 'Trail kit bundle', channel: 'Wholesale', status: 'Paid', total: '1,140.00', when: 'Yesterday' },
];

export const TIMEZONES: [string, string][] = [
  ['europe-stockholm', 'Stockholm (UTC+1)'], ['europe-london', 'London (UTC+0)'], ['america-new-york', 'New York (UTC−5)'],
  ['america-los-angeles', 'Los Angeles (UTC−8)'], ['asia-tokyo', 'Tokyo (UTC+9)'],
];

export const SETTINGS_NAV: [string, string, string][] = [
  ['profile', 'user-circle', 'Profile'], ['notifications', 'bell', 'Notifications'], ['billing', 'credit-card', 'Plan & billing'],
  ['team', 'users-three', 'Team'], ['security', 'lock-simple', 'Security'],
];

export interface Shot { title: string; place: string; scene: Scene; role: RoleKey; accent: RoleKey; tag: string }
export const SHOTS: Shot[] = [
  { title: 'Ridge at first light', place: 'Sarek, Sweden', scene: 'hills', role: 'data1', accent: 'data4', tag: 'Hiking' },
  { title: 'Low tide, late August', place: 'Lofoten, Norway', scene: 'coast', role: 'data2', accent: 'data4', tag: 'Coast' },
  { title: 'Old growth', place: 'Białowieża, Poland', scene: 'forest', role: 'data3', accent: 'data4', tag: 'Forest' },
  { title: 'The long dune', place: 'Erg Chebbi, Morocco', scene: 'dunes', role: 'data4', accent: 'data5', tag: 'Desert' },
  { title: 'Night shift', place: 'Osaka, Japan', scene: 'city', role: 'data6', accent: 'data4', tag: 'City' },
  { title: 'Kit, laid out', place: 'Studio, Malmö', scene: 'studio', role: 'neutral', accent: 'data5', tag: 'Gear' },
];

export const FEATURED: Shot[] = [
  { title: 'Ten days on the Kungsleden', place: 'Field report · 12 min read', scene: 'hills', role: 'primary', accent: 'secondary', tag: 'Report' },
  { title: 'Packing for wet weather', place: 'Guide · 6 min read', scene: 'coast', role: 'info', accent: 'secondary', tag: 'Guide' },
  { title: 'A city on foot, after dark', place: 'Photo essay · 24 photos', scene: 'city', role: 'data6', accent: 'secondary', tag: 'Essay' },
];
