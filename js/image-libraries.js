(function () {
  "use strict";

  const MANIFEST_BASE = "../images/image-libraries/";
  const DEFAULT_PAGE_SIZE = 24;
  const HOVER_ZOOM_FACTOR = 2.75;
  const HOVER_PREVIEW_MIN_WIDTH = 360;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeBase(base) {
    return base.endsWith("/") ? base : `${base}/`;
  }

  function readEmbeddedManifest(libraryId) {
    const registry = window.PolentaImageLibraries;
    if (!registry || !registry[libraryId]) {
      return null;
    }
    return registry[libraryId];
  }

  function loadManifestScript(base, libraryId) {
    return new Promise((resolve, reject) => {
      if (window.PolentaImageLibraries) {
        delete window.PolentaImageLibraries[libraryId];
      }

      const script = document.createElement("script");
      script.src = `${base}manifest.js?v=${Date.now()}`;
      script.async = true;
      script.onload = () => {
        const payload = readEmbeddedManifest(libraryId);
        if (payload) {
          resolve(payload);
          return;
        }
        reject(new Error("manifest.js loaded but library data is missing"));
      };
      script.onerror = () => reject(new Error("manifest.js failed to load"));
      document.head.appendChild(script);
    });
  }

  async function loadRootManifest() {
    const base = normalizeBase(MANIFEST_BASE);

    if (window.location.protocol !== "file:") {
      try {
        const response = await fetch(`${base}manifest.json?v=${Date.now()}`, {
          cache: "no-store",
        });
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.warn("ImageLibraries index manifest.json unavailable, trying manifest.js:", error);
      }
    }

    if (window.PolentaImageLibrariesIndex) {
      return window.PolentaImageLibrariesIndex;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `${base}manifest.js?v=${Date.now()}`;
      script.async = true;
      script.onload = () => {
        if (window.PolentaImageLibrariesIndex) {
          resolve(window.PolentaImageLibrariesIndex);
          return;
        }
        reject(new Error("manifest.js loaded but index data is missing"));
      };
      script.onerror = () => reject(new Error("index manifest.js failed to load"));
      document.head.appendChild(script);
    });
  }

  function renderLibraryCard(library) {
    const pageFile =
      library.pageFile || String(library.pageUrl || "").replace(/^pages\//, "");
    const preview = library.previewFile
      ? `${MANIFEST_BASE}${library.previewFile}`
      : "";
    const previewHtml = preview
      ? `<img src="${escapeHtml(preview)}" alt="${escapeHtml(library.title || "")} preview" loading="lazy" decoding="async">`
      : `<div class="image-libraries-card-placeholder">${escapeHtml(library.title || library.id || "")}</div>`;
    return `
      <div class="col-md-6 col-lg-4">
        <div class="card h-100 image-libraries-library-card">
          <div class="image-libraries-card-preview">${previewHtml}</div>
          <div class="card-body">
            <h2 class="h5 card-title"><a href="${escapeHtml(pageFile)}">${escapeHtml(library.title || library.id)}</a></h2>
            <p class="card-text">${escapeHtml(library.description || "")}</p>
            <p class="text-muted small mb-3">${library.phraseCount || 0} phrases · ${library.templateCount || 0} styles · ${library.imageCount || 0} SVG files</p>
            <a href="${escapeHtml(pageFile)}" class="btn btn-custom">Browse library</a>
          </div>
        </div>
      </div>`;
  }

  function initHub() {
    const root = document.getElementById("image-libraries-index");
    const status = document.getElementById("image-libraries-index-status");
    if (!root) {
      return;
    }

    loadRootManifest()
      .then((payload) => {
        const libraries = Array.isArray(payload?.libraries) ? payload.libraries : [];
        root.innerHTML = libraries.map((library) => renderLibraryCard(library)).join("");
        if (status) {
          status.textContent = `${libraries.length} libraries available.`;
        }
      })
      .catch((error) => {
        root.innerHTML = `<div class="col-12"><p class="text-danger">Could not load libraries: ${escapeHtml(error.message)}</p></div>`;
      });
  }

  async function loadLibraryManifest(libraryId) {
    const base = normalizeBase(`${MANIFEST_BASE}${libraryId}`);

    if (window.location.protocol !== "file:") {
      try {
        const response = await fetch(`${base}manifest.json?v=${Date.now()}`, {
          cache: "no-store",
        });
        if (response.ok) {
          return response.json();
        }
      } catch (error) {
        console.warn("ImageLibraries manifest.json unavailable, trying manifest.js:", error);
      }
    }

    return loadManifestScript(base, libraryId);
  }

  function templateLabel(manifest, templateId) {
    const names = manifest?.templateNames || {};
    return names[templateId] || `Style ${templateId}`;
  }

  function selectedTemplate(manifest, selectElement) {
    const templates = manifest.templates || [];
    const preferred = selectElement.value || manifest.previewTemplate || templates[templates.length - 1];
    if (templates.includes(preferred)) {
      return preferred;
    }
    return templates[0];
  }

  function fileForPhrase(phrase, templateId) {
    if (phrase.files && phrase.files[templateId]) {
      return phrase.files[templateId];
    }
    return phrase.preview;
  }

  function renderCard(phrase, templateId) {
    const file = fileForPhrase(phrase, templateId);
    if (!file) {
      return `
      <div class="col-sm-6 col-lg-4 col-xl-3">
        <article class="image-libraries-card gallery-item h-100">
          <div class="image-libraries-card-body">
            <h2 class="h6 mb-1">${escapeHtml(phrase.top)}</h2>
            <p class="small text-muted mb-0">${escapeHtml(phrase.bottom)}</p>
          </div>
        </article>
      </div>`;
    }
    const src = `${MANIFEST_BASE}${file}`;
    const downloadName = file.split("/").pop() || "stamp.svg";
    return `
      <div class="col-sm-6 col-lg-4 col-xl-3">
        <article class="image-libraries-card gallery-item h-100">
          <div class="image-libraries-thumb">
            <img src="${escapeHtml(src)}" alt="${escapeHtml(phrase.alt || phrase.label)}" loading="lazy" decoding="async">
          </div>
          <div class="image-libraries-card-body">
            <h2 class="h6 mb-1">${escapeHtml(phrase.top)}</h2>
            <p class="small text-muted mb-2">${escapeHtml(phrase.bottom)}</p>
            <a class="btn btn-sm btn-custom" href="${escapeHtml(src)}" download="${escapeHtml(downloadName)}">Download SVG</a>
          </div>
        </article>
      </div>`;
  }

  function renderPagination(currentPage, totalPages) {
    if (totalPages <= 1) {
      return "";
    }

    const items = [];
    const addItem = (page, label, disabled, active) => {
      const css = ["page-item"];
      if (disabled) css.push("disabled");
      if (active) css.push("active");
      items.push(
        `<li class="${css.join(" ")}"><a class="page-link" href="#" data-page="${page}">${label}</a></li>`
      );
    };

    addItem(currentPage - 1, "Previous", currentPage <= 1, false);
    const windowStart = Math.max(1, currentPage - 2);
    const windowEnd = Math.min(totalPages, currentPage + 2);
    for (let page = windowStart; page <= windowEnd; page += 1) {
      addItem(page, String(page), false, page === currentPage);
    }
    addItem(currentPage + 1, "Next", currentPage >= totalPages, false);

    return `<ul class="pagination justify-content-center flex-wrap mb-0">${items.join("")}</ul>`;
  }

  function filterPhrases(phrases, query) {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return phrases;
    }
    return phrases.filter((phrase) => {
      const haystack = `${phrase.top} ${phrase.bottom} ${phrase.slug}`.toLowerCase();
      return haystack.includes(needle);
    });
  }

  function initGallery(root) {
    const libraryId = root.getAttribute("data-library");
    if (!libraryId) {
      return;
    }

    const searchInput = document.getElementById("image-libraries-search");
    const templateSelect = document.getElementById("image-libraries-template");
    const paginationRoot = document.getElementById("image-libraries-pagination");
    const status = document.getElementById("image-libraries-status");

    let manifest = null;
    let filtered = [];
    let currentPage = 1;

    function pageSize() {
      return manifest?.pageSize || DEFAULT_PAGE_SIZE;
    }

    function render() {
      if (!manifest) {
        return;
      }

      const templateId = selectedTemplate(manifest, templateSelect);
      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / pageSize()));
      currentPage = Math.min(currentPage, pages);
      const start = (currentPage - 1) * pageSize();
      const slice = filtered.slice(start, start + pageSize());

      root.innerHTML = slice
        .map((phrase) => renderCard(phrase, templateId))
        .join("");

      if (paginationRoot) {
        paginationRoot.innerHTML = renderPagination(currentPage, pages);
        paginationRoot.querySelectorAll("[data-page]").forEach((link) => {
          link.addEventListener("click", (event) => {
            event.preventDefault();
            const target = Number(link.getAttribute("data-page"));
            if (!Number.isFinite(target) || target < 1 || target > pages) {
              return;
            }
            currentPage = target;
            render();
            root.scrollIntoView({ behavior: "smooth", block: "start" });
          });
        });
      }

      if (status) {
        const from = total ? start + 1 : 0;
        const to = Math.min(start + pageSize(), total);
        status.textContent = `Showing ${from}-${to} of ${total} phrases (${templateLabel(manifest, templateId)}).`;
      }
    }

    function applyFilters() {
      filtered = filterPhrases(manifest.phrases || [], searchInput ? searchInput.value : "");
      currentPage = 1;
      render();
    }

    loadLibraryManifest(libraryId)
      .then((payload) => {
        manifest = payload;
        if (templateSelect) {
          templateSelect.innerHTML = (payload.templates || [])
            .map((templateId) => {
              const selected = templateId === payload.previewTemplate ? " selected" : "";
              const label = templateLabel(payload, templateId);
              return `<option value="${escapeHtml(templateId)}"${selected}>${escapeHtml(label)}</option>`;
            })
            .join("");
          templateSelect.addEventListener("change", () => render());
        }
        if (searchInput) {
          searchInput.addEventListener("input", applyFilters);
        }
        applyFilters();
      })
      .catch((error) => {
        root.innerHTML = `<div class="col-12"><p class="text-danger">Could not load gallery: ${escapeHtml(error.message)}</p></div>`;
      });
  }

  function initHoverPreview() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      return;
    }

    let panel = document.getElementById("image-libraries-hover-preview");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "image-libraries-hover-preview";
      panel.setAttribute("aria-hidden", "true");
      panel.innerHTML = '<img alt="">';
      document.body.appendChild(panel);
    }

    const previewImg = panel.querySelector("img");
    let activeZone = null;

    function previewZone(target) {
      return target.closest(".image-libraries-thumb, .image-libraries-card-preview");
    }

    function positionPanel(zone) {
      const rect = zone.getBoundingClientRect();
      const width = Math.min(
        Math.max(rect.width * HOVER_ZOOM_FACTOR, HOVER_PREVIEW_MIN_WIDTH),
        window.innerWidth * 0.92
      );
      const height = width / 2;
      const gap = 10;

      let left = rect.left + rect.width / 2 - width / 2;
      let top = rect.top - height - gap;

      if (top < 8) {
        top = rect.bottom + gap;
      }
      if (top + height > window.innerHeight - 8) {
        top = Math.max(8, window.innerHeight - height - 8);
      }

      left = Math.max(8, Math.min(left, window.innerWidth - width - 8));

      panel.style.width = `${width}px`;
      panel.style.height = `${height}px`;
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
    }

    function showPanel(zone) {
      const img = zone.querySelector("img");
      if (!img) {
        return;
      }

      activeZone = zone;
      previewImg.src = img.currentSrc || img.src;
      previewImg.alt = img.alt || "";
      positionPanel(zone);
      panel.classList.add("is-visible");
      panel.setAttribute("aria-hidden", "false");
    }

    function hidePanel() {
      activeZone = null;
      panel.classList.remove("is-visible");
      panel.setAttribute("aria-hidden", "true");
    }

    document.body.addEventListener("mouseover", (event) => {
      const zone = previewZone(event.target);
      if (!zone || zone === activeZone) {
        return;
      }
      showPanel(zone);
    });

    document.body.addEventListener("mouseout", (event) => {
      const fromZone = previewZone(event.target);
      if (!fromZone) {
        return;
      }
      const toZone = event.relatedTarget && previewZone(event.relatedTarget);
      if (!toZone) {
        hidePanel();
      } else if (toZone !== fromZone) {
        showPanel(toZone);
      }
    });

    window.addEventListener(
      "scroll",
      () => {
        if (activeZone) {
          positionPanel(activeZone);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "resize",
      () => {
        if (activeZone) {
          positionPanel(activeZone);
        }
      },
      { passive: true }
    );
  }

  document.addEventListener("DOMContentLoaded", () => {
    initHoverPreview();
    initHub();
    const gallery = document.getElementById("image-libraries-gallery");
    if (gallery) {
      initGallery(gallery);
    }
  });
})();
