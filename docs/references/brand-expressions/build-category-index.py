"""Package thumbnail metadata for the offline cross-brand category view."""
import json
from pathlib import Path

root = Path(__file__).resolve().parent
collections = {}
for directory in sorted(root.glob("*/manifests")):
    slides = []
    for path in sorted(directory.glob("*.json")):
        manifest = json.loads(path.read_text())
        image = manifest["image"]
        if not (directory / image).is_file():
            raise FileNotFoundError(directory / image)
        purposes = manifest.get("reference_purposes")
        if purposes is not None:
            if not isinstance(purposes, dict) or any(
                key not in {"Intent", "Expression", "Application", "Constraint"}
                or not isinstance(value, str) or not value.strip()
                for key, value in purposes.items()
            ):
                raise ValueError(f"Invalid reference purposes: {path}")
        slides.append({
            "id": manifest["id"], "title": manifest["title"],
            "category": manifest["category"], "image": image,
            "page": manifest["location"].get("page"),
            "order": manifest["location"].get("order"),
            **({"reference_purposes": purposes,
                "ingredient": manifest.get("ingredient")} if purposes is not None else {}),
        })
    # An explicit order preserves multiple source series without changing PDF locators.
    # Otherwise keep PDF order and book pages ahead of standalone App Store panels.
    slides.sort(key=lambda s: (s["order"] if s["order"] is not None else s["page"] or 0,
                               s["id"].startswith("AS"), s["id"]))
    collections[directory.parent.name] = slides

(root / "category-index.js").write_text(
    "// Generated from slide manifests by build-category-index.py.\n"
    + "const categoryIndex = " + json.dumps(collections, ensure_ascii=False, separators=(",", ":"))
    + ";\n"
)
