"""Render a standalone reference gallery from one collection's JSON manifests."""
import json
import sys
from html import escape
from pathlib import Path


def render_slide(path):
    slide = json.loads(path.read_text())
    media = escape("manifests/" + slide["image"], quote=True)
    title = escape(slide["title"])
    category = escape(slide["category"], quote=True)
    fields = [
        ("Slide intent", "slide_intent"),
        ("Strategic value", "strategic_value"),
        ("Demonstration", "demonstration"),
        ("Category", "category"),
        ("Practical value", "practical_value"),
    ]
    spec = "".join(f"<dt>{label}</dt><dd>{escape(slide[key])}</dd>" for label, key in fields)
    if "reference_purposes" in slide:
        purposes = "".join(f"<li><b>{escape(key)}</b> {escape(value)}</li>"
                           for key, value in slide["reference_purposes"].items())
        spec += "<dt>Reference purpose</dt><dd>" + (f"<ul>{purposes}</ul>" if purposes else "Reviewed; no purpose assigned.") + "</dd>"
    ingredient_spec = ""
    if ingredient := slide.get("ingredient"):
        rules = "".join(f"<dt>{label}</dt><dd>{escape(ingredient[key])}</dd>"
                        for label, key in [("Role", "role"), ("Application", "application"), ("Scope", "scope")])
        ingredient_spec = f"<dt>Brand ingredient</dt><dd><strong>{escape(ingredient['name'])}</strong><dl>{rules}</dl></dd>"
    islands = "".join(f"<li><b>{escape(i['name'])}</b> {escape(i['spec'])}</li>"
                      for i in slide["content_islands"])
    preview = f'<a href="{media}"><img loading="lazy" src="{media}" alt="{title}"></a>'
    if slide.get("motion"):
        clip = escape("manifests/" + slide["motion"], quote=True)
        preview = f'<video controls playsinline preload="none" poster="{media}" aria-label="{title}" src="{clip}"></video>'
    source = "manifests/" + slide["source"]
    if source.lower().endswith(".pdf") and "page" in slide["location"]:
        source += "#page=" + str(slide["location"]["page"])
    folio = " / PDF page " + str(slide["location"]["page"]) if "page" in slide["location"] else ""
    return f"""<article id="{escape(slide["id"], quote=True)}" data-category="{category}">
<p class="folio">{escape(slide['id'])} &nbsp;/&nbsp; {category}{folio}</p><h2>{title}</h2>
<div class="pair"><figure>{preview}
<figcaption><a href="{media}">Full-size image</a> · <a href="manifests/{escape(path.name)}">JSON manifest</a> · <a href="{escape(source, quote=True)}">Local source</a></figcaption>
</figure><dl>{spec}<dt>Content islands</dt><dd><ol>{islands}</ol></dd>{ingredient_spec}</dl></div></article>"""


folder = Path(sys.argv[1])
title = escape(sys.argv[2])
intro = f"<p>{escape(sys.argv[3])}</p>" if len(sys.argv) > 3 else ""


def source_order(path):
    location = json.loads(path.read_text())["location"]
    return location.get("order", location.get("page", 0)), path.name


paths = sorted((folder / "manifests").glob("*.json"),
               key=source_order)
if not paths:
    raise SystemExit("No manifests found")
slides = "\n".join(render_slide(path) for path in paths)
categories = sorted({json.loads(path.read_text())["category"] for path in paths})
options = "".join(f"<option>{escape(c)}</option>" for c in categories)
page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · Brand expressions</title>
<style>
*{{box-sizing:border-box}}body{{margin:0;background:#fafaf9;color:#16171b;font:1rem/1.5 system-ui,sans-serif}}
main{{max-width:94rem;margin:auto;padding:clamp(1rem,4vw,4rem)}}
header{{border-top:3px solid;padding-top:.8rem}}h1,h2{{letter-spacing:-.045em;line-height:1.05}}
h1{{font-size:clamp(2.5rem,6vw,4.5rem);margin:1.5rem 0 .8rem}}h2{{font-size:clamp(1.6rem,3vw,2.5rem);margin:.4rem 0 1rem}}
.folio,dt,label{{font:600 .76rem/1.3 ui-monospace,monospace;letter-spacing:.07em;text-transform:uppercase}}
a{{color:#243bab;text-underline-offset:.18em}}select{{padding:.4rem;font:inherit}}.tools{{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;margin:1.5rem 0}}
article{{border-top:1px solid #c9cacd;padding:1rem 0 2rem}}.pair{{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(18rem,1fr);gap:clamp(1rem,3vw,3rem)}}
figure,dl{{margin:0}}img,video{{display:block;width:100%;max-height:78vh;object-fit:contain;background:#eeeef0}}figcaption{{font-size:.85rem;margin-top:.5rem}}
dd{{margin:.2rem 0 1rem}}ol{{padding-left:1.2rem}}li{{margin:.4rem 0}}:focus-visible{{outline:3px solid #243aff;outline-offset:2px}}
@media(max-width:740px){{.pair{{grid-template-columns:1fr}}}}
</style></head><body><main><header><span class="folio">Brand expressions / Reference collection</span>
<h1>{title}</h1>{intro}<a href="manifests/README.md">Sources and selection notes</a></header>
<div class="tools"><label for="category">Category</label><select id="category"><option value="">All categories</option>{options}</select>
<span id="count" role="status">{len(paths)} references</span></div>{slides}</main>
<script>
const filter = document.getElementById('category');
filter.addEventListener('change', () => {{
  let visible = 0;
  for (const slide of document.querySelectorAll('article')) {{
    slide.hidden = Boolean(filter.value && filter.value !== slide.dataset.category);
    if (!slide.hidden) visible++;
  }}
  document.getElementById('count').textContent = visible + (visible === 1 ? ' reference' : ' references');
}});
function revealHashSlide() {{
  const slide = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (!slide || !slide.matches('article[data-category]')) return;
  filter.value = slide.dataset.category;
  filter.dispatchEvent(new Event('change'));
  slide.scrollIntoView();
}}
window.addEventListener('hashchange', revealHashSlide);
revealHashSlide();
</script></body></html>"""
(folder / "index.html").write_text(page)
