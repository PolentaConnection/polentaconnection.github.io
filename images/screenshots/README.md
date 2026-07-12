# Product screenshots

Store screenshots under `images/screenshots/<ProductShortName>/`.

## Naming

Use zero-padded numeric prefixes so files sort in display order:

- `01-main-panel.png`
- `02-settings.png`
- `03-edit-list.png`

Supported formats: `.png`, `.jpg`, `.webp`.

## Automatic carousel

Each product folder gets a `manifest.json` and a `manifest.js` built from the image files present.

`manifest.js` is used when previewing pages locally (`file://`), because browsers block `fetch()` on local JSON files.

After adding or removing screenshots, regenerate manifests:

```cmd
python scripts\generate_screenshot_manifests.py
```

This runs automatically before website publish.

On the product page, use:

```html
<div
  class="product-screenshots-host"
  data-product-screenshots="PolentaToDoWallpaper"
  data-screenshots-base="../images/screenshots/PolentaToDoWallpaper/"
></div>
<script src="../images/screenshots/PolentaToDoWallpaper/manifest.js"></script>
<script src="../js/product-screenshots.js"></script>
```

With two or more images, click a thumbnail to open fullscreen preview and browse with arrows or keyboard (← →, Esc to close).

## Captions

Default alt/caption text is derived from the filename (`02-settings.png` → “Settings”).

To override, edit `CAPTION_OVERRIDES` in `scripts/generate_screenshot_manifests.py`, or edit the generated `manifest.json` directly (regenerate preserves existing entries).

## Product folders

| Folder | Product page |
|--------|----------------|
| `PolentaToDoWallpaper/` | `pages/product-polentatodowallpaper.html` |
| `PolentaMealPlanner/` | `pages/product-polentamealplanner.html` |
