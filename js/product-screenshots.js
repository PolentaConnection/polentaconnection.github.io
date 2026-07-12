(function () {
  "use strict";

  let lightboxElement = null;
  let lightboxItems = [];
  let lightboxIndex = 0;
  let lightboxBase = "";
  let lightboxKeyHandler = null;
  let activeGallery = null;

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

  function itemsFromPayload(payload) {
    if (!payload) {
      return [];
    }
    return Array.isArray(payload) ? payload : payload.items || [];
  }

  function readEmbeddedManifest(productSlug) {
    const registry = window.PolentaProductScreenshots;
    if (!registry || !registry[productSlug]) {
      return null;
    }
    return itemsFromPayload(registry[productSlug]);
  }

  function loadManifestScript(base, productSlug, options = {}) {
    const cacheBust = options.cacheBust !== false;

    return new Promise((resolve, reject) => {
      if (cacheBust && window.PolentaProductScreenshots) {
        delete window.PolentaProductScreenshots[productSlug];
      }

      const script = document.createElement("script");
      script.src = cacheBust
        ? `${base}manifest.js?v=${Date.now()}`
        : `${base}manifest.js`;
      script.async = true;
      script.onload = () => {
        const items = readEmbeddedManifest(productSlug);
        if (items && items.length) {
          resolve(items);
          return;
        }
        reject(new Error("manifest.js loaded but product data is missing"));
      };
      script.onerror = () => reject(new Error("manifest.js failed to load"));
      document.head.appendChild(script);
    });
  }

  async function loadManifestItems(base, productSlug) {
    if (window.location.protocol !== "file:") {
      try {
        const response = await fetch(`${base}manifest.json?v=${Date.now()}`, {
          cache: "no-store",
        });
        if (response.ok) {
          const payload = await response.json();
          const items = itemsFromPayload(payload);
          if (items.length) {
            return items;
          }
        }
      } catch (error) {
        console.warn("Screenshot manifest.json unavailable, trying manifest.js:", error);
      }
    }

    return loadManifestScript(base, productSlug, { cacheBust: true });
  }

  function ensureLightbox() {
    if (lightboxElement) {
      return lightboxElement;
    }

    lightboxElement = document.createElement("div");
    lightboxElement.className = "screenshot-lightbox";
    lightboxElement.hidden = true;
    lightboxElement.innerHTML = `
      <div class="screenshot-lightbox-backdrop" data-lightbox-close></div>
      <div class="screenshot-lightbox-shell" role="dialog" aria-modal="true" aria-label="Screenshot preview">
        <button type="button" class="screenshot-lightbox-close" data-lightbox-close aria-label="Close preview">&times;</button>
        <button type="button" class="screenshot-lightbox-nav screenshot-lightbox-prev" data-lightbox-prev aria-label="Previous screenshot">&#8249;</button>
        <div class="screenshot-lightbox-main">
          <img class="screenshot-lightbox-image" alt="">
          <p class="screenshot-lightbox-counter"></p>
          <p class="screenshot-lightbox-caption"></p>
        </div>
        <button type="button" class="screenshot-lightbox-nav screenshot-lightbox-next" data-lightbox-next aria-label="Next screenshot">&#8250;</button>
      </div>
    `;
    document.body.appendChild(lightboxElement);

    lightboxElement.querySelectorAll("[data-lightbox-close]").forEach((element) => {
      element.addEventListener("click", closeLightbox);
    });
    lightboxElement.querySelector("[data-lightbox-prev]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      shiftLightbox(-1);
    });
    lightboxElement.querySelector("[data-lightbox-next]")?.addEventListener("click", (event) => {
      event.stopPropagation();
      shiftLightbox(1);
    });

    return lightboxElement;
  }

  function setActiveThumbnail(gallery, index) {
    if (!gallery) {
      return;
    }
    gallery.querySelectorAll(".screenshot-thumb").forEach((button, buttonIndex) => {
      const isActive = buttonIndex === index;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }

  function updateLightboxView() {
    const lightbox = ensureLightbox();
    const item = lightboxItems[lightboxIndex];
    if (!item) {
      return;
    }

    const image = lightbox.querySelector(".screenshot-lightbox-image");
    const caption = lightbox.querySelector(".screenshot-lightbox-caption");
    const counter = lightbox.querySelector(".screenshot-lightbox-counter");
    const prevButton = lightbox.querySelector("[data-lightbox-prev]");
    const nextButton = lightbox.querySelector("[data-lightbox-next]");
    const hasMultiple = lightboxItems.length > 1;

    if (image) {
      image.src = lightboxBase + item.file;
      image.alt = item.alt || "";
    }
    if (caption) {
      caption.textContent = item.caption || "";
      caption.hidden = !item.caption;
    }
    if (counter) {
      counter.textContent = hasMultiple ? `${lightboxIndex + 1} / ${lightboxItems.length}` : "";
      counter.hidden = !hasMultiple;
    }
    if (prevButton) {
      prevButton.hidden = !hasMultiple;
    }
    if (nextButton) {
      nextButton.hidden = !hasMultiple;
    }

    setActiveThumbnail(activeGallery, lightboxIndex);
  }

  function shiftLightbox(delta) {
    if (!lightboxItems.length) {
      return;
    }
    lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
    updateLightboxView();
  }

  function closeLightbox() {
    if (!lightboxElement || lightboxElement.hidden) {
      return;
    }

    lightboxElement.hidden = true;
    document.body.classList.remove("screenshot-lightbox-open");
    activeGallery = null;

    if (lightboxKeyHandler) {
      document.removeEventListener("keydown", lightboxKeyHandler);
      lightboxKeyHandler = null;
    }
  }

  function openLightbox(gallery, items, index, base) {
    if (!items.length) {
      return;
    }

    activeGallery = gallery;
    lightboxItems = items;
    lightboxIndex = index;
    lightboxBase = base;

    const lightbox = ensureLightbox();
    updateLightboxView();
    lightbox.hidden = false;
    document.body.classList.add("screenshot-lightbox-open");
    lightbox.querySelector(".screenshot-lightbox-close")?.focus();

    lightboxKeyHandler = (event) => {
      if (event.key === "Escape") {
        closeLightbox();
      } else if (event.key === "ArrowLeft") {
        shiftLightbox(-1);
      } else if (event.key === "ArrowRight") {
        shiftLightbox(1);
      }
    };
    document.addEventListener("keydown", lightboxKeyHandler);
  }

  function thumbLabel(item, index) {
    if (item.caption) {
      const words = item.caption.split(/\s+/).slice(0, 4).join(" ");
      return words.length < item.caption.length ? `${words}…` : words;
    }
    return `Screenshot ${index + 1}`;
  }

  function renderThumbnailGallery(container, base, items) {
    const thumbs = items
      .map(
        (item, index) => `
          <button
            type="button"
            class="screenshot-thumb${index === 0 ? " is-active" : ""}"
            data-screenshot-index="${index}"
            aria-label="Open screenshot ${index + 1}: ${escapeHtml(thumbLabel(item, index))}"
            ${index === 0 ? 'aria-current="true"' : 'aria-current="false"'}
          >
            <span class="screenshot-thumb-frame">
              <img
                src="${escapeHtml(base + item.file)}"
                alt="${escapeHtml(item.alt || `Screenshot ${index + 1}`)}"
                class="screenshot-thumb-image"
                loading="eager"
                decoding="async"
              >
            </span>
            <span class="screenshot-thumb-label">${escapeHtml(thumbLabel(item, index))}</span>
          </button>
        `
      )
      .join("");

    container.innerHTML = `
      <div class="screenshot-gallery">
        <div class="screenshot-thumbnails">${thumbs}</div>
        <p class="screenshot-gallery-hint mb-0">Click a thumbnail to enlarge. Use the arrows or keyboard to browse.</p>
      </div>
    `;

    const gallery = container.querySelector(".screenshot-gallery");
    gallery?.querySelectorAll(".screenshot-thumb").forEach((button) => {
      button.addEventListener("click", () => {
        const index = parseInt(button.dataset.screenshotIndex || "0", 10);
        openLightbox(gallery, items, index, base);
      });
    });
  }

  async function initContainer(container) {
    const productSlug = container.dataset.productScreenshots;
    if (!productSlug) {
      return;
    }

    const base = normalizeBase(
      container.dataset.screenshotsBase || `../images/screenshots/${productSlug}/`
    );

    try {
      const items = await loadManifestItems(base, productSlug);
      if (!items.length) {
        container.innerHTML = '<p class="text-muted mb-0">No screenshots available yet.</p>';
        return;
      }

      renderThumbnailGallery(container, base, items);
    } catch (error) {
      console.error("Failed to load product screenshots:", error);
      container.innerHTML =
        '<p class="text-muted mb-0">Screenshots could not be loaded. Run <code>python scripts\\generate_screenshot_manifests.py</code> and refresh.</p>';
    }
  }

  function initAll() {
    document.querySelectorAll("[data-product-screenshots]").forEach((container) => {
      void initContainer(container);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
