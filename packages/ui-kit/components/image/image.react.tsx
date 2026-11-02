// React <Image>: a <div data-ui="image"> frame around a lazy <img> (or authored <img>/<picture>
// children). Presets are data-ratio selectors; a custom "w/h" reaches CSS as --ui-image-ratio; a failed
// generated image gets data-error (authored children handle their own). Slideshow is web-component only for now.
import { useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { customRatio } from './ratios.ts';

const POSITION = /^[a-z0-9.%\s-]{1,40}$/i;

export interface ImageProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  srcSet?: string;
  sizes?: string;
  alt?: string;
  ratio?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  position?: string;
  children?: ReactNode;
}

export function Image({ src, srcSet, sizes, alt = '', ratio = '', fit = 'cover', position = '', children, style, ...rest }: ImageProps) {
  const [error, setError] = useState(false);
  const custom = customRatio(ratio);
  return (
    <div {...rest} data-ui="image" data-ratio={ratio || undefined} data-fit={fit}
      style={{ ...style, ...(custom ? { '--ui-image-ratio': custom } : {}), ...(POSITION.test(position) ? { '--ui-image-position': position } : {}) } as CSSProperties}>
      {children ?? (src ? <img src={src} srcSet={srcSet} sizes={sizes} alt={alt} loading="lazy" decoding="async" data-error={error || undefined} onError={() => setError(true)} onLoad={() => setError(false)} /> : null)}
    </div>
  );
}
