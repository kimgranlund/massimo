// React <Image>: a <div data-ui="image"> frame around a lazy <img> (or authored <img>/<picture>
// children). Presets are data-ratio selectors; a custom "w/h" reaches CSS as --ui-image-ratio; a failed
// generated image gets data-error (authored children handle their own). `slideshow` turns the children
// into an inline Swiper with hover controls.
import { useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { customRatio, fitVariant, ratioVariant } from './ratios.ts';
import { cx } from '../../styled-system/css/cx.js';
import { image } from '../../styled-system/recipes/image.js';
import { Swiper } from '../swiper/swiper.react.tsx';

const POSITION = /^[a-z0-9.%\s-]{1,40}$/i;

export interface ImageProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  srcSet?: string;
  sizes?: string;
  alt?: string;
  ratio?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  position?: string;
  /** Children become slides of an inline swiper (dots and paddles on hover). */
  slideshow?: boolean;
  children?: ReactNode;
}

export function Image({ src, srcSet, sizes, alt = '', ratio = '', fit = 'cover', position = '', slideshow, children, style, className, ...rest }: ImageProps) {
  const [error, setError] = useState(false);
  const custom = customRatio(ratio);
  return (
    <div {...rest} className={cx(image({ ratio: ratioVariant(ratio) as any, fit: fitVariant(fit), slideshow: !!slideshow }).root, className)} data-ui="image" data-ratio={ratio || undefined} data-fit={fit} data-slideshow={slideshow || undefined}
      style={{ ...style, ...(custom ? { '--ui-image-ratio': custom } : {}), ...(POSITION.test(position) ? { '--ui-image-position': position } : {}) } as CSSProperties}>
      {slideshow ? <Swiper hoverControls label={alt || 'Images'}>{children}</Swiper> : children ?? (src ? <img src={src} srcSet={srcSet} sizes={sizes} alt={alt} loading="lazy" decoding="async" data-error={error || undefined} onError={() => setError(true)} onLoad={() => setError(false)} /> : null)}
    </div>
  );
}
