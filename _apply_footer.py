#!/usr/bin/env python3
"""Replace footer blocks in all WebSite HTML pages."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SITE_BASE = "https://polentaconnection.github.io"

MAIN_PAGES = [
    ("Products", "products.html"),
    ("Valuable Stuff", "valuable-stuff.html"),
    ("Contact", "contact.html"),
    ("Donate", "donate.html"),
    ("Inno di Storo", "inno-di-storo.html"),
]

PRODUCT_PAGES = [
    ("PA2Z", "product-pa2z.html"),
    ("PBeep", "product-pbeep.html"),
    ("PDelay", "product-pdelay.html"),
    ("PElevate", "product-pelevate.html"),
    ("PFormatXML", "product-pformatxml.html"),
    ("PIconConvert", "product-piconconvert.html"),
    ("PPlayAudio", "product-pplayaudio.html"),
    ("PPlayMidi", "product-pplaymidi.html"),
    ("PSOM", "product-psom.html"),
    ("PTouch", "product-ptouch.html"),
    ("PXCopy", "product-pxcopy.html"),
    ("Polenta Meal Planner", "product-polentamealplanner.html"),
    ("Polenta ToDo Wallpaper", "product-polentatodowallpaper.html"),
]


def _page_url(filename: str) -> str:
    return f"{SITE_BASE}/pages/{filename}"


def _links(items: list[tuple[str, str]]) -> str:
    lines = []
    for label, href in items:
        lines.append(f'                            <li><a href="{_page_url(href)}">{label}</a></li>')
    return "\n".join(lines)


def build_footer() -> str:
    main_links = _links(MAIN_PAGES)
    product_links = _links(PRODUCT_PAGES)

    return f"""    <!-- Footer -->
    <footer class="text-center py-4">
        <div class="container">
            <p class="mb-0">&copy; 2025 – Polenta Connection - <a href="{_page_url("secret-info.html")}" style="color: inherit; text-decoration: none; border: none;">PolCon2607</a></p>
            <p class="mb-0 mt-1" style="font-size: 12px;"><a href="{SITE_BASE}/sitemap.xml">Sitemap</a></p>

            <div class="site-pages-panel mt-3">
                <button class="site-pages-toggle collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#sitePagesList" aria-expanded="false" aria-controls="sitePagesList">
                    All site pages
                </button>
                <div class="collapse" id="sitePagesList">
                    <div class="site-pages-content">
                        <div class="row g-3">
                            <div class="col-md-5">
                                <h6>Site</h6>
                                <ul>
                                    <li><a href="{SITE_BASE}/">Home</a></li>
{main_links}
                                </ul>
                            </div>
                            <div class="col-md-7">
                                <h6>Products</h6>
                                <ul class="site-pages-grid">
{product_links}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </footer>"""


FOOTER = build_footer()
FOOTER_PATTERN = re.compile(r"    <!-- Footer -->.*?    </footer>", re.DOTALL)


def apply_footer(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    updated, count = FOOTER_PATTERN.subn(FOOTER, text, count=1)
    if count != 1:
        raise RuntimeError(f"Footer not replaced in {path}")
    path.write_text(updated, encoding="utf-8")


def main() -> None:
    apply_footer(ROOT / "index.html")
    for path in sorted((ROOT / "pages").glob("*.html")):
        apply_footer(path)
    print("Updated footers in index.html and pages/*.html")


if __name__ == "__main__":
    main()
