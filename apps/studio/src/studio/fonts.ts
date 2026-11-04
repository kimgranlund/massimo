// Web face stylesheets (theme typography.sources, the face catalogue): loaded once each as a <link>.
/** Load a web face stylesheet once (a <link> in the head, keyed by URL). Only Google Fonts loads: a
 * stylesheet from another host is CSS from pasted JSON, so the jig does not fetch it. Returns whether it loads. */
export function loadFontSource(url: string) {
  if (!url.startsWith('https://fonts.googleapis.com/css2?')) return false;
  if (document.head.querySelector(`link[data-font-source="${CSS.escape(url)}"]`)) return true;
  const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: url });
  link.dataset.fontSource = url;
  document.head.append(link);
  return true;
}
