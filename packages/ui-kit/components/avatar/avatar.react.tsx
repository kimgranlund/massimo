// React <Avatar>: a data-ui span with the web component's anatomy (Base UI Avatar: Root, Image,
// Fallback) and slot recipe (avatar.recipe.ts). Avatar.Image renders an <img> that stays hidden
// until it has loaded and carries data-loading / data-error; Avatar.Fallback shows until then (after
// `delay` ms): its children, else the initials of the Root's name, else a user icon. The preset
// <Avatar src alt name> is Root + Image + Fallback; its children are the fallback's.
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type HTMLAttributes, type ImgHTMLAttributes, type ReactNode, type SyntheticEvent } from 'react';
import { renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { avatarAttrs, avatarImageAttrs, initialImageStatus, initialsOf, type ImageStatus } from '../../dom/display.ts';
import { toReactProps } from '../../dom/attrs.ts';
import type { AvatarSize } from '../../tokens/geometry/resolve.ts';
import { avatar } from '../../styled-system/recipes/avatar.js';

interface AvatarContext { c: Record<string, string>; state: PartState; status: ImageStatus; setStatus: (s: ImageStatus) => void; labelled: boolean; name?: string }
const Ctx = createContext<AvatarContext | null>(null);
const useAvatar = (part: string) => {
  const v = useContext(Ctx);
  if (!v) throw new Error(`<${part}> must be inside Avatar.Root`);
  return v;
};
// Layout effects do not run on the server; this keeps SSR quiet.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface AvatarRootProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'>, PartBase {
  /** Names the avatar (role=img, aria-label) when the image has no alt; its initials are the default fallback. */
  name?: string;
  /** Accessible name of the image; names the avatar (role=img). */
  alt?: string;
  /** sm 6u (the slot) | md 8u (the control height, default) | lg 12u | xl 16u. */
  avatarSize?: AvatarSize;
  /** Unit u in px for this element. */
  size?: number;
  children?: ReactNode;
}

/** Avatar.Root: the frame; shares the image status with its parts. */
export function AvatarRoot({ name, alt, avatarSize = 'md', size, className, render, children, ...rest }: AvatarRootProps) {
  const [status, setStatus] = useState<ImageStatus>('idle');
  const c = avatar();
  const attrs = toReactProps(avatarAttrs({ alt, name }));
  const state = stateOf(attrs);
  const labelled = !!(alt || name);
  return (
    <Ctx.Provider value={{ c, state, status, setStatus, labelled, name }}>
      {renderPart('span', c.root, { 'data-ui': 'avatar', 'data-size': size, 'data-avatar-size': avatarSize, ...attrs, ...rest, className, render, children }, state)}
    </Ctx.Provider>
  );
}

export interface AvatarImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'className'>, PartBase {
  /** Every status change: 'loading', 'loaded' or 'error' (Base UI onLoadingStatusChange). */
  onLoadingStatusChange?: (status: ImageStatus) => void;
}

/** Avatar.Image: the <img>, hidden until it has loaded. */
export function AvatarImage({ src, alt, onLoadingStatusChange, onLoad, onError, className, render, ...rest }: AvatarImageProps) {
  const a = useAvatar('Avatar.Image');
  const ref = useRef<HTMLImageElement>(null);
  const report = useRef(onLoadingStatusChange);
  report.current = onLoadingStatusChange;
  const set = useCallback((s: ImageStatus) => { a.setStatus(s); report.current?.(s); }, [a.setStatus]);
  // The first render (and SSR) has the status a source implies; a cached image may already be complete.
  const status = a.status === 'idle' && src ? initialImageStatus(src) : a.status;
  useIsoLayoutEffect(() => {
    const el = ref.current;
    set(src && el?.complete && el.naturalWidth > 0 ? 'loaded' : initialImageStatus(src));
  }, [src]);
  const attrs = toReactProps(avatarImageAttrs(status));
  return renderPart('img', a.c.image, {
    ref, src: src || undefined, alt: a.labelled ? '' : alt ?? '', 'data-part': 'image', ...attrs, hidden: status !== 'loaded', ...rest,
    onLoad: (e: SyntheticEvent<HTMLImageElement>) => { set('loaded'); onLoad?.(e); },
    onError: (e: SyntheticEvent<HTMLImageElement>) => { set('error'); onError?.(e); },
    className, render,
  }, { ...a.state, ...stateOf(attrs) });
}

export interface AvatarFallbackProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'>, PartBase {
  /** Milliseconds to wait before showing the fallback (Base UI delay). */
  delay?: number;
  children?: ReactNode;
}

/** Avatar.Fallback: shown until the image has loaded; children, else the Root's initials, else a user icon. */
export function AvatarFallback({ delay = 0, className, render, children, ...rest }: AvatarFallbackProps) {
  const a = useAvatar('Avatar.Fallback');
  const [waiting, setWaiting] = useState(delay > 0);
  useEffect(() => {
    if (!(delay > 0)) return;
    setWaiting(true);
    const id = setTimeout(() => setWaiting(false), delay);
    return () => clearTimeout(id);
  }, [delay]);
  const has = children !== undefined && children !== null && children !== false;
  const initials = initialsOf(a.name);
  const content = has ? children : initials || <i name="user" />;
  const generated = has ? undefined : initials || 'icon';
  return renderPart('span', a.c.fallback, {
    'data-part': 'fallback', 'data-generated': generated, ...rest,
    hidden: a.status === 'loaded' || waiting, 'aria-hidden': a.labelled ? 'true' : undefined,
    className, render, children: content,
  }, a.state);
}

export interface AvatarProps extends AvatarRootProps {
  /** Image source; without one (or until it loads, or after an error) the fallback shows. */
  src?: string;
  /** Fallback delay in ms. */
  delay?: number;
  onLoadingStatusChange?: (status: ImageStatus) => void;
}

/** Preset: Avatar.Root with Avatar.Image and Avatar.Fallback (its children). */
export function Avatar({ src, alt, delay, onLoadingStatusChange, children, ...root }: AvatarProps) {
  return (
    <AvatarRoot alt={alt} {...root}>
      <AvatarImage src={src} alt={alt} onLoadingStatusChange={onLoadingStatusChange} />
      <AvatarFallback delay={delay}>{children}</AvatarFallback>
    </AvatarRoot>
  );
}
Avatar.Root = AvatarRoot;
Avatar.Image = AvatarImage;
Avatar.Fallback = AvatarFallback;
