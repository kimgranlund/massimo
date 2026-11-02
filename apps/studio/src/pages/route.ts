// Hash routing for the content area: #/<route>?<query>. An empty or unknown route is home.
// Every navigation is a history entry (back and forward work) and a reload keeps the page.
import { useEffect, useState } from 'react';
import { ROUTES, type Route } from './types.ts';

export interface Location { route: Route; query: URLSearchParams }

export function parseHash(hash: string): Location {
  const [path, q = ''] = hash.replace(/^#\/?/, '').split('?');
  const route = (ROUTES as readonly string[]).includes(path) ? (path as Route) : 'home';
  return { route, query: new URLSearchParams(q) };
}

export function hrefFor(route: Route, query?: Record<string, string | undefined>) {
  const q = new URLSearchParams(Object.entries(query ?? {}).filter((e): e is [string, string] => !!e[1])).toString();
  return `#/${route}${q ? `?${q}` : ''}`;
}

/** The current location, following hashchange (links, back/forward, navigate). */
export function useHashRoute(): Location {
  const [loc, setLoc] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setLoc(parseHash(location.hash));
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return loc;
}

export function navigate(route: Route, query?: Record<string, string | undefined>) {
  const next = hrefFor(route, query);
  if (location.hash !== next) location.hash = next;
}
