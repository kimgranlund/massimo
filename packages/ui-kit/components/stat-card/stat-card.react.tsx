// React <StatCard>: the same card, parts and trend line as <ui-stat-card>. Empty parts are left out.
import type { HTMLAttributes } from 'react';
import { Container } from '../container/container.react.tsx';
import { Section } from '../section/section.react.tsx';
import { trendLabel, trendPoints } from '../../dom/stat.ts';
import { statCard } from '../../styled-system/recipes/stat-card.js';

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string;
  delta?: string;
  /** Whether the delta is good news. A sign can't say: a falling number can be good. */
  tone?: 'positive' | 'negative' | 'neutral';
  comparison?: string;
  /** At least two values draw a line. */
  trend?: number[];
}

const VIEW = { w: 100, h: 32 };

export function StatCard({ label, value, delta, tone = 'neutral', comparison, trend = [], className, ...rest }: StatCardProps) {
  const c = statCard();
  return (
    <div {...rest} data-ui="stat-card" className={[c.root, className].filter(Boolean).join(' ')}>
      <Container preset="card" padding="md"><Section>
        <span data-part="label" className={c.label}>{label}</span>
        <span data-part="value" className={c.value}>{value}{delta && <span data-part="delta" data-tone={tone} className={c.delta}>{delta}</span>}</span>
        {comparison && <span data-part="comparison" className={c.comparison}>{comparison}</span>}
        {trend.length > 1 && (
          <span data-part="trend-slot">
            <svg data-part="trend" role="img" aria-label={trendLabel(trend)} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} preserveAspectRatio="none" className={c.trend}>
              <polyline points={trendPoints(trend, VIEW.w, VIEW.h)} />
            </svg>
          </span>
        )}
      </Section></Container>
    </div>
  );
}
