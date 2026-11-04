// Web face stylesheets (theme typography.sources, the face catalogue): loaded once each as a <link>.
/** Load a web face stylesheet once (a <link> in the head, keyed by URL). */
export function loadFontSource(url: string) {
  if (document.head.querySelector(`link[data-font-source="${CSS.escape(url)}"]`)) return;
  const link = Object.assign(document.createElement('link'), { rel: 'stylesheet', href: url });
  link.dataset.fontSource = url;
  document.head.append(link);
}
