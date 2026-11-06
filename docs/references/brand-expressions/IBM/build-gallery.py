"""Rebuild IBM's offline gallery, retaining page-associated motion examples."""
import json
import re
import subprocess
import sys
from html import escape
from pathlib import Path

root = Path(__file__).resolve().parent
subprocess.run([sys.executable, str(root.parent / 'build-gallery.py'), str(root), 'IBM',
    'Complete public brand-guidance webpages, alternate specimens and two complete logo guides. Webpages are faithful content-area captures, not presentation slides. Scroll the long-page preview or open its full-size image. Local motion examples appear beneath their related page.'], check=True)
page = (root / 'index.html').read_text()
page = page.replace('</style>', '''.document-scroll{max-height:78vh;overflow:auto;border:1px solid #d5d6dc}.document-scroll img{max-height:none;width:100%;height:auto}.motion-examples{margin-top:1rem}.motion-examples summary{cursor:pointer;font-weight:600}.motion-example{margin:1.2rem 0}.motion-example video{max-height:50vh}.motion-example h3{font-size:1rem;margin:.4rem 0}.motion-example a{font-size:.85rem}</style>''')
for path in sorted((root / 'manifests').glob('*.json')):
    record = json.loads(path.read_text())
    pattern = r'(<article id="' + re.escape(record['id']) + r'".*?</article>)'
    def enrich(match):
        article = match.group(0)
        if re.fullmatch(r'ib\d{3}', path.stem):
            article = re.sub(r'(<a href="manifests/[^\"]+\.png"><img[^>]+></a>)', r'<div class="document-scroll" tabindex="0" aria-label="Scrollable complete webpage capture">\1</div>', article, count=1)
        clips = record.get('motion_assets', [])
        if clips:
            media = []
            for clip in clips:
                video = escape('manifests/' + clip['file'], quote=True)
                poster = escape('manifests/' + clip['poster'], quote=True)
                title = escape(clip['title'])
                media.append(f'<div class="motion-example"><h3>{title}</h3><video controls playsinline preload="none" src="{video}" poster="{poster}" aria-label="{title}"></video><a href="{video}">Open local clip</a> · {clip["duration_seconds"]:g} seconds</div>')
            block = f'<details class="motion-examples"><summary>Local motion examples ({len(clips)})</summary>' + ''.join(media) + '</details>'
            article = article.replace('</figcaption>', '</figcaption>' + block, 1)
        return article
    page = re.sub(pattern, enrich, page, count=1, flags=re.S)
(root / 'index.html').write_text(page)
