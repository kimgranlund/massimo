// React <Chart>: the same marks as <ui-chart>, from the same model. It measures its width after mount.
import { useEffect, useRef, useState, type HTMLAttributes } from 'react';
import { attachChartHover, chartMarkup, type ChartData, type ChartKind } from '../../dom/chart.ts';
import { resolveChart } from '../../tokens/geometry/resolve.ts';
import { chart } from '../../styled-system/recipes/chart.js';

export interface ChartProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  kind?: ChartKind;
  data: ChartData;
  stacked?: boolean;
  /** Height in px. Default 64u. */
  height?: number;
  locale?: string;
}

export function Chart({ label, kind = 'column', data, stacked = false, height, locale, className, ...rest }: ChartProps) {
  const host = useRef<HTMLDivElement>(null), [width, setWidth] = useState(0), [h, setH] = useState(0);
  const live = useRef({ kind, data, locale });
  live.current = { kind, data, locale };
  useEffect(() => {
    const el = host.current!, stop = attachChartHover(el, () => live.current);
    setH(resolveChart({ unit: parseFloat(getComputedStyle(el).scrollPaddingTop) || 4 }).height);
    setWidth(el.clientWidth);
    const size = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => setWidth(Math.round(el.clientWidth))) : undefined;
    size?.observe(el);
    return () => { stop(); size?.disconnect(); };
  }, []);
  const __html = chartMarkup({ kind, data, width: width || 480, height: height || h || 256, stacked, locale, label });
  return <div {...rest} ref={host} data-ui="chart" role="figure" aria-label={label} className={[chart().root, className].filter(Boolean).join(' ')} dangerouslySetInnerHTML={{ __html }} />;
}
