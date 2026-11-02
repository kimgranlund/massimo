/// <reference path="../jsx.d.ts" />
// React <Swiper>: the web component's anatomy with native parts. Slides scroll in a scroll-snap
// viewport (native momentum, touch, trackpad and arrow-key scrolling); the paddles are native
// <button data-ui="button">s and the dots native <button>s. An IntersectionObserver tracks the slide
// that is at least 60% visible.
import { Children, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from 'react';

export interface SwiperProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Accessible name of the carousel region. */
  label?: string;
  /** Paddles and dots appear on hover or focus. */
  hoverControls?: boolean;
  noDots?: boolean;
  noPaddles?: boolean;
  onSlideChange?: (index: number) => void;
  size?: number;
  /** Each child is a slide. */
  children?: ReactNode;
}

export function Swiper({ label, hoverControls, noDots, noPaddles, onSlideChange, size, children, ...rest }: SwiperProps) {
  const viewport = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const slides = Children.toArray(children);
  const n = slides.length;

  useEffect(() => {
    const vp = viewport.current;
    if (!vp || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting && en.intersectionRatio >= 0.6) {
        const i = [...vp.children].indexOf(en.target);
        if (i >= 0) { setIndex(i); onSlideChange?.(i); }
      }
    }, { root: vp, threshold: [0.6] });
    [...vp.children].forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [n, onSlideChange]);

  const go = (i: number) => {
    const vp = viewport.current, target = vp?.children[Math.max(0, Math.min(n - 1, i))] as HTMLElement | undefined;
    if (!vp || !target) return;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    vp.scrollTo({ left: target.offsetLeft - vp.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    setIndex(Math.max(0, Math.min(n - 1, i)));
  };

  const paddle = (dir: 'prev' | 'next') => (
    <button type="button" data-ui="button" data-part="paddle" data-dir={dir} aria-label={dir === 'prev' ? 'Previous slide' : 'Next slide'}
      aria-disabled={(dir === 'prev' ? index <= 0 : index >= n - 1) || undefined}
      onClick={() => { if (dir === 'prev' ? index > 0 : index < n - 1) go(index + (dir === 'prev' ? -1 : 1)); }}>
      <span data-part="leading"><i name={`caret-${dir === 'prev' ? 'left' : 'right'}`} /></span>
    </button>
  );

  return (
    <div {...rest} data-ui="swiper" data-size={size} role="region" aria-roledescription="carousel" aria-label={label || undefined}
      data-hover-controls={hoverControls || undefined} data-no-dots={noDots || undefined} data-no-paddles={noPaddles || undefined} data-single={n <= 1 || undefined}>
      <div ref={viewport} data-part="viewport" tabIndex={0}>
        {slides.map((s, k) => <div key={k} data-part="slide" role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${n}`}>{s}</div>)}
      </div>
      {paddle('prev')}
      {paddle('next')}
      <div data-part="dots">
        {slides.map((_, k) => <button key={k} type="button" data-part="dot" aria-label={`Go to slide ${k + 1}`} aria-current={k === index} onClick={() => go(k)} />)}
      </div>
    </div>
  );
}
