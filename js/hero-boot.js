/*
Website System Name: DONORDOC-01 V1
Author: FRONTLENS LLC
License: For personal/business use only. Redistribution, resale, or sublicensing is strictly Copyright (c) 2026 FRONTLENS LLC. All rights reserved.
*/
(function () {
  var HERO_SIZES = "(max-width: 1023.98px) 75vw, 560px";
  var THEME_HERO = {
    trustGreen: "assets/images/hero-image.webp",
    professionalBlue: "assets/images/hero-professional-blue.webp",
    executiveNavy: "assets/images/hero-executive-navy.webp",
    healthcareTeal: "assets/images/hero-healthcare-teal.webp",
  };
  var THEME_SRCSET = {
    "assets/images/hero-image.webp":
      "assets/images/hero-image-742w.webp 742w, assets/images/hero-image.webp 1024w",
    "assets/images/hero-professional-blue.webp":
      "assets/images/hero-professional-blue-742w.webp 742w, assets/images/hero-professional-blue.webp 1254w",
    "assets/images/hero-executive-navy.webp":
      "assets/images/hero-executive-navy-742w.webp 742w, assets/images/hero-executive-navy.webp 1254w",
    "assets/images/hero-healthcare-teal.webp":
      "assets/images/hero-healthcare-teal-742w.webp 742w, assets/images/hero-healthcare-teal.webp 1254w",
  };

  function own(map, key) {
    return typeof key === "string" &&
      Object.prototype.hasOwnProperty.call(map, key)
      ? map[key]
      : undefined;
  }

  function resolveHero(config) {
    var image =
      (config &&
        config.sections &&
        config.sections.hero &&
        config.sections.hero.image) ||
      {};
    if (image.mode === "custom" && image.customSrc) {
      return { src: image.customSrc, single: true };
    }
    var variant = config && config.theme && config.theme.variant;
    return {
      src: own(THEME_HERO, variant) || THEME_HERO.trustGreen,
      single: false,
    };
  }

  function applyHeroEarly(src, single) {
    var spec = single ? null : own(THEME_SRCSET, src) || null;
    var link = document.querySelector('link[rel="preload"][as="image"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      var css = document.querySelector('link[rel="stylesheet"]');
      if (css) document.head.insertBefore(link, css);
      else document.head.appendChild(link);
    }
    link.href = src;
    link.setAttribute("fetchpriority", "high");
    if (spec) {
      link.setAttribute("imagesrcset", spec);
      link.setAttribute("imagesizes", HERO_SIZES);
    } else {
      link.removeAttribute("imagesrcset");
      link.removeAttribute("imagesizes");
    }

    function stamp() {
      var img = document.querySelector("[data-hero-image]");
      if (!img) return;
      img.setAttribute("src", src);
      if (spec) {
        img.setAttribute("srcset", spec);
        img.setAttribute("sizes", HERO_SIZES);
      } else {
        img.removeAttribute("srcset");
        img.removeAttribute("sizes");
      }
    }

    stamp();
    if (!document.querySelector("[data-hero-image]")) {
      document.addEventListener("DOMContentLoaded", stamp);
    }
  }

  // Edition logo: hide [data-branding-logo] until the configured logo is
  // resolved by logo-boot.min.js (site-config.js bundled with themeRegistry),
  // so the Trust Green default in the HTML never flashes for other editions.
  // index.html supplies the content-versioned resolver URL (data-logo-module,
  // stamped by scripts/version-assets.mjs); the fallback serves an older page.
  var LOGO_PENDING = "is-logo-pending";
  var LOGO_FAILSAFE_MS = 8000;
  var root = document.documentElement;
  var bootScript = document.currentScript;
  var logoModuleAttr = bootScript && bootScript.getAttribute("data-logo-module");
  var siteConfigModule = logoModuleAttr
    ? new URL(logoModuleAttr, document.baseURI).href
    : new URL("logo-boot.min.js", (bootScript && bootScript.src) || location.href)
        .href;

  var logoStyle = document.createElement("style");
  logoStyle.textContent =
    "." + LOGO_PENDING + " [data-branding-logo]{visibility:hidden}";
  document.head.appendChild(logoStyle);
  root.classList.add(LOGO_PENDING);

  function revealLogos() {
    root.classList.remove(LOGO_PENDING);
  }

  // Edition favicon: this script runs before the <link rel="icon"> tags are
  // parsed, so point them at a transparent placeholder as they arrive and let
  // applyBrandingIcons() set the edition icon. The static Trust Green favicon
  // is restored if the config cannot be resolved; without JavaScript the HTML
  // is untouched.
  var ICON_PLACEHOLDER =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVR42mNgYGBgAAAABQABeqhXUAAAAABJRU5ErkJggg==";
  var heldIcons = [];
  function holdIcon(node) {
    if (node.nodeName !== "LINK" || !/(^|\s)icon(\s|$)/i.test(node.rel)) return;
    if (!node.hasAttribute("data-static-href")) {
      node.setAttribute("data-static-href", node.getAttribute("href") || "");
    }
    node.setAttribute("href", ICON_PLACEHOLDER);
    heldIcons.push(node);
  }
  var iconObserver =
    typeof MutationObserver === "function"
      ? new MutationObserver(function (records) {
          records.forEach(function (record) {
            record.addedNodes.forEach(holdIcon);
          });
        })
      : null;
  if (iconObserver) {
    iconObserver.observe(root, { childList: true, subtree: true });
    document.addEventListener("DOMContentLoaded", function () {
      iconObserver.disconnect();
    });
  }
  function restoreStaticIcons() {
    heldIcons.forEach(function (link) {
      if (link.getAttribute("href") === ICON_PLACEHOLDER) {
        link.setAttribute("href", link.getAttribute("data-static-href"));
      }
    });
  }

  setTimeout(function () {
    revealLogos();
    restoreStaticIcons();
  }, LOGO_FAILSAFE_MS);

  // Start loading the resolver in parallel with the config fetch.
  var logoModuleReady = import(siteConfigModule);
  logoModuleReady.catch(function () {});

  function applyLogoEarly(config) {
    if (!config) {
      // no config: the HTML defaults (Trust Green logo and favicon) are correct
      revealLogos();
      restoreStaticIcons();
      return;
    }
    logoModuleReady
      .then(function (mod) {
        function applyEarly() {
          mod.applyBrandingLogo(config);
          // Edition favicon, Apple touch icon, theme-color and manifest.
          if (typeof mod.applyBrandingIcons === "function") {
            mod.applyBrandingIcons(config);
          }
        }
        applyEarly();
        if (document.readyState === "loading") {
          // logos and icon links parsed after the first pass
          document.addEventListener("DOMContentLoaded", applyEarly);
        }
      })
      .catch(function () {
        // Leave hidden; applyBranding() in app.min.js resolves and reveals.
      });
  }

  window.__donordocConfigReady = fetch("config/siteConfig.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Failed to load siteConfig.json");
      return response.json();
    })
    .then(function (config) {
      var hero = resolveHero(config);
      applyHeroEarly(hero.src, hero.single);
      return config;
    })
    .catch(function () {
      applyHeroEarly(THEME_HERO.trustGreen, false);
      return null;
    });
  window.__donordocConfigReady.then(applyLogoEarly);
})();
