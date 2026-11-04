// React <ScrollArea>: the anatomy, classes and data-* of <ui-scroll-area>, as Base UI ScrollArea's
// compound parts: ScrollArea.Root (the area; overflowEdgeThreshold), ScrollArea.Viewport (the
// natively scrolling element), ScrollArea.Content, ScrollArea.Scrollbar (orientation, keepMounted)
// with ScrollArea.Thumb, and ScrollArea.Corner. The Root measures the viewport on scroll and resize
// (dom/scroll-area.ts, shared with the web component), sets Base UI's CSS variables on the parts as
// custom properties and keeps the data-* in React state. The preset <ScrollArea> is Root +
// Viewport › Content (the children) + both scrollbars + Corner.
import { createContext, useCallback, useContext, useEffect, useRef, useState, type HTMLAttributes, type PointerEvent, type ReactNode, type UIEvent } from 'react';
import { renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { bindScrollbar, measureScrollArea, scrollAreaDataAttrs, scrollAreaVars, setVars, type EdgeThreshold, type ScrollOrientation } from '../../dom/scroll-area.ts';
import { scrollArea } from '../../styled-system/recipes/scroll-area.js';

type Div = Omit<HTMLAttributes<HTMLDivElement>, 'className'> & PartBase;
const on = (v: boolean) => (v ? '' : undefined);

interface ScrollAreaContext {
  c: Record<string, string>;
  attrs: Record<string, string | undefined>;
  state: PartState;
  has: { x: boolean; y: boolean };
  scrolling: boolean;
  hovering: boolean;
  setViewport: (el: HTMLDivElement | null) => void;
  setContent: (el: HTMLDivElement | null) => void;
  setBar: (o: ScrollOrientation, el: HTMLDivElement | null) => void;
  onScroll: () => void;
}
const Ctx = createContext<ScrollAreaContext | null>(null);
const useArea = (part: string) => {
  const v = useContext(Ctx);
  if (!v) throw new Error(`<${part}> must be inside ScrollArea.Root`);
  return v;
};
const BarCtx = createContext<ScrollOrientation>('vertical');

export interface ScrollAreaRootProps extends Div {
  /** Distance in px from an edge before its data-overflow-*-start / -end applies (Base UI overflowEdgeThreshold): one number or per edge. */
  overflowEdgeThreshold?: EdgeThreshold;
  /** Unit u in px for the area and its scrollbars. */
  size?: number;
  children?: ReactNode;
}

/** ScrollArea.Root: the area; measures its Viewport and shares the overflow state with its parts. */
export function ScrollAreaRoot({ overflowEdgeThreshold, size, className, render, onPointerEnter, onPointerLeave, children, ...rest }: ScrollAreaRootProps) {
  const c = scrollArea() as Record<string, string>;
  const root = useRef<HTMLDivElement>(null), viewport = useRef<HTMLDivElement | null>(null), content = useRef<HTMLDivElement | null>(null);
  const bars = useRef<Partial<Record<ScrollOrientation, HTMLDivElement | null>>>({});
  const [attrs, setAttrs] = useState<Record<string, string | undefined>>(() => scrollAreaDataAttrs(null) as Record<string, string | undefined>);
  const [has, setHas] = useState({ x: false, y: false });
  const [scrolling, setScrolling] = useState(false);
  const [hovering, setHovering] = useState(false);
  const scrollingRef = useRef(false), timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const threshold = useRef(overflowEdgeThreshold);
  threshold.current = overflowEdgeThreshold;

  const sync = useCallback(() => {
    const vp = viewport.current;
    if (!vp) return;
    const m = measureScrollArea(vp, { x: bars.current.horizontal, y: bars.current.vertical });
    const vars = scrollAreaVars(m);
    setVars(root.current, vars.root);
    setVars(vp, vars.viewport);
    setVars(bars.current.horizontal, vars.x);
    setVars(bars.current.vertical, vars.y);
    const next = scrollAreaDataAttrs(m, scrollingRef.current, threshold.current) as Record<string, string | undefined>;
    setAttrs((p) => (JSON.stringify(p) === JSON.stringify(next) ? p : next));
    setHas((p) => (p.x === m.hasX && p.y === m.hasY ? p : { x: m.hasX, y: m.hasY }));
  }, []);

  const onScroll = useCallback(() => {
    scrollingRef.current = true;
    setScrolling(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { scrollingRef.current = false; setScrolling(false); sync(); }, 500);
    sync();
  }, [sync]);

  useEffect(() => {
    sync();
    if (typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(() => sync());
    if (viewport.current) ro.observe(viewport.current);
    if (content.current) ro.observe(content.current);
    return () => { ro.disconnect(); clearTimeout(timer.current); };
  }, [sync]);
  // A bar mounts hidden; once shown its track has a length, so the thumb is measured again.
  useEffect(() => { sync(); }, [sync, has.x, has.y, overflowEdgeThreshold]);

  const ctx: ScrollAreaContext = {
    c, attrs, state: stateOf(attrs), has, scrolling, hovering, onScroll,
    setViewport: (el) => { viewport.current = el; },
    setContent: (el) => { content.current = el; },
    setBar: (o, el) => { bars.current[o] = el; },
  };
  return (
    <Ctx.Provider value={ctx}>
      {renderPart('div', c.root, {
        ref: root, 'data-ui': 'scroll-area', 'data-size': size, ...attrs, className, ...rest,
        onPointerEnter: (e: PointerEvent<HTMLDivElement>) => { if (e.pointerType !== 'touch') setHovering(true); onPointerEnter?.(e); },
        onPointerLeave: (e: PointerEvent<HTMLDivElement>) => { setHovering(false); onPointerLeave?.(e); },
        render, children,
      }, ctx.state)}
    </Ctx.Provider>
  );
}

export interface ScrollAreaPartProps extends Div { children?: ReactNode }

/** ScrollArea.Viewport: the natively scrolling element (its own scrollbars hidden); focusable while it overflows. */
export function ScrollAreaViewport({ className, render, onScroll, ...rest }: ScrollAreaPartProps) {
  const a = useArea('ScrollArea.Viewport');
  return renderPart('div', a.c.viewport, {
    ref: a.setViewport, 'data-part': 'viewport', role: 'presentation', tabIndex: a.has.x || a.has.y ? 0 : undefined, ...a.attrs, className, ...rest,
    onScroll: (e: UIEvent<HTMLDivElement>) => { a.onScroll(); onScroll?.(e); },
    render,
  }, a.state);
}

/** ScrollArea.Content: the scrolled content (at least as wide as it needs: min-width fit-content). */
export function ScrollAreaContent({ className, render, ...rest }: ScrollAreaPartProps) {
  const a = useArea('ScrollArea.Content');
  return renderPart('div', a.c.content, { ref: a.setContent, 'data-part': 'content', role: 'presentation', ...a.attrs, className, ...rest, render }, a.state);
}

export interface ScrollAreaScrollbarProps extends ScrollAreaPartProps {
  /** Which axis it scrolls (Base UI orientation). */
  orientation?: ScrollOrientation;
  /** Keep it shown while its axis has no overflow (Base UI keepMounted; otherwise it is hidden). */
  keepMounted?: boolean;
}

/** ScrollArea.Scrollbar: a track at the inline end (vertical) or block end (horizontal); its Thumb drags, a press on the track jumps. */
export function ScrollAreaScrollbar({ orientation = 'vertical', keepMounted = false, className, render, ...rest }: ScrollAreaScrollbarProps) {
  const a = useArea('ScrollArea.Scrollbar');
  const el = useRef<HTMLDivElement | null>(null);
  const shown = orientation === 'vertical' ? a.has.y : a.has.x;
  const { setBar } = a;
  const ref = useCallback((n: HTMLDivElement | null) => { el.current = n; setBar(orientation, n); }, [setBar, orientation]);
  useEffect(() => {
    const bar = el.current;
    if (!bar) return;
    return bindScrollbar(bar, () => bar.parentElement?.querySelector<HTMLElement>(':scope > [data-part=viewport]') ?? null, orientation);
  }, [orientation]);
  return (
    <BarCtx.Provider value={orientation}>
      {renderPart('div', a.c.scrollbar, {
        ref, 'data-part': 'scrollbar', hidden: !shown && !keepMounted, 'aria-hidden': true, 'keep-mounted': keepMounted ? '' : undefined,
        ...a.attrs, 'data-orientation': orientation, 'data-hovering': on(a.hovering), className, ...rest, render,
      }, { ...a.state, orientation, ...(a.hovering ? { hovering: true } : {}) })}
    </BarCtx.Provider>
  );
}

/** ScrollArea.Thumb: the draggable indicator; its length and place along the track come from the Scrollbar's variables. */
export function ScrollAreaThumb({ className, render, ...rest }: ScrollAreaPartProps) {
  const a = useArea('ScrollArea.Thumb');
  const orientation = useContext(BarCtx);
  return renderPart('div', a.c.thumb, { 'data-part': 'thumb', 'data-orientation': orientation, 'data-scrolling': on(a.scrolling), className, ...rest, render }, { orientation, ...(a.scrolling ? { scrolling: true } : {}) });
}

/** ScrollArea.Corner: the square where the two scrollbars meet; hidden unless both show. */
export function ScrollAreaCorner({ className, render, ...rest }: ScrollAreaPartProps) {
  const a = useArea('ScrollArea.Corner');
  return renderPart('div', a.c.corner, { 'data-part': 'corner', hidden: !(a.has.x && a.has.y), className, ...rest, render }, {});
}

export interface ScrollAreaProps extends ScrollAreaRootProps {}

/** Preset: ScrollArea.Root with Viewport › Content (the children), a vertical and a horizontal Scrollbar with their Thumbs, and the Corner. */
export function ScrollArea({ children, ...rest }: ScrollAreaProps) {
  return (
    <ScrollAreaRoot {...rest}>
      <ScrollAreaViewport><ScrollAreaContent>{children}</ScrollAreaContent></ScrollAreaViewport>
      <ScrollAreaScrollbar orientation="vertical"><ScrollAreaThumb /></ScrollAreaScrollbar>
      <ScrollAreaScrollbar orientation="horizontal"><ScrollAreaThumb /></ScrollAreaScrollbar>
      <ScrollAreaCorner />
    </ScrollAreaRoot>
  );
}
ScrollArea.Root = ScrollAreaRoot;
ScrollArea.Viewport = ScrollAreaViewport;
ScrollArea.Content = ScrollAreaContent;
ScrollArea.Scrollbar = ScrollAreaScrollbar;
ScrollArea.Thumb = ScrollAreaThumb;
ScrollArea.Corner = ScrollAreaCorner;
