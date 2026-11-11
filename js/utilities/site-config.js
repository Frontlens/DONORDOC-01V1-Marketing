/*
Website System Name: DONORDOC-01 V1
Author: FRONTLENS LLC
License: For personal/business use only. Redistribution, resale, or sublicensing is strictly Copyright (c) 2026 FRONTLENS LLC. All rights reserved.
*/
import { themeRegistry } from "../../config/themeRegistry.js";

const VISIBILITY_SECTIONS = [
  "hero",
  "trust",
  "about",
  "services",
  "pricing",
  "howItWorks",
  "reviews",
  "faq",
  "consultation",
];

const NAV_LINK_SECTION = {
  home: "hero",
  about: "about",
  coverage: "services",
  howItWorks: "howItWorks",
  reviews: "reviews",
  faq: "faq",
};

const NAV_ACTION_SECTION = {
  primary: "pricing",
  secondary: "consultation",
};

const COMPANY_LINK_SECTION = {
  about: "about",
  howItWorks: "howItWorks",
  advisors: "consultation",
  faq: "faq",
};

const THEME_CSS_VARS = [
  ["brand", "--color-brand"],
  ["brandHover", "--color-brand-hover"],
  ["accent", "--color-accent"],
  ["accentHover", "--color-accent-hover"],
  ["brandSoft", "--color-brand-soft"],
  ["brandMuted", "--color-brand-muted"],
  ["brandLine", "--color-brand-line"],
  ["brandTint", "--color-brand-tint"],
  ["brandFaint", "--color-brand-faint"],
];

let siteConfig = null;

export function getSiteConfig() {
  return siteConfig;
}

const DEFAULT_THEME = "trustGreen";
const LOGO_PENDING_CLASS = "is-logo-pending";

// Own-property lookup: keys like "constructor" or "toString" must not
// resolve to inherited Object.prototype members.
function ownValue(map, key) {
  return typeof key === "string" && Object.prototype.hasOwnProperty.call(map, key)
    ? map[key]
    : undefined;
}

export function getTheme(config) {
  return ownValue(themeRegistry, config?.theme?.variant) || themeRegistry[DEFAULT_THEME];
}

function isUsablePath(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isSystemLogo(src) {
  return Object.keys(themeRegistry).some(function (key) {
    return themeRegistry[key].logo === src;
  });
}

// Logo of the active edition. Unknown variants fall back to Trust Green;
// a known variant is never swapped for a different edition.
export function resolveThemeLogo(config) {
  const logo = getTheme(config).logo;
  return isUsablePath(logo) ? logo : themeRegistry[DEFAULT_THEME].logo;
}

// branding.logo: { mode: "theme" | "custom", customSrc, alt }.
// "custom" with a usable customSrc wins; anything else resolves to the theme
// logo. Legacy configs ({ src } without mode) keep a non-system src as custom.
export function resolveLogo(config) {
  const logo = config?.branding?.logo;
  if (logo && typeof logo === "object") {
    if (logo.mode === "custom" && isUsablePath(logo.customSrc)) {
      return logo.customSrc.trim();
    }
    if (logo.mode == null && isUsablePath(logo.src) && !isSystemLogo(logo.src)) {
      return logo.src.trim();
    }
  }
  return resolveThemeLogo(config);
}

function loadImage(src) {
  return new Promise(function (resolve, reject) {
    const probe = new Image();
    probe.onload = function () {
      resolve(src);
    };
    probe.onerror = function () {
      reject(new Error("Logo failed to load: " + src));
    };
    probe.src = src;
  });
}

export function revealLogos() {
  document.documentElement.classList.remove(LOGO_PENDING_CLASS);
}

// Shared by hero-boot.js (early) and applyBranding(): waits until the
// resolved logo is cached, stamps every [data-branding-logo], then reveals.
export function applyBrandingLogo(config) {
  const preferred = resolveLogo(config);
  const themeLogo = resolveThemeLogo(config);
  const alt = config?.branding?.logo?.alt;
  return loadImage(preferred)
    .catch(function () {
      if (preferred === themeLogo) return preferred;
      console.warn(
        "Custom logo could not be loaded; using the theme logo instead:",
        preferred,
      );
      return themeLogo;
    })
    .then(function (src) {
      document.querySelectorAll("[data-branding-logo]").forEach(function (img) {
        if (img.getAttribute("src") !== src) img.setAttribute("src", src);
        if (hasText(alt)) img.setAttribute("alt", alt);
      });
      revealLogos();
      return src;
    });
}

export function resolveHeroImage(config) {
  const image = config?.sections?.hero?.image || {};
  if (image.mode === "custom" && image.customSrc) {
    return image.customSrc;
  }
  return getTheme(config).heroImage;
}

const HERO_SIZES = "(max-width: 1023.98px) 75vw, 560px";

const SYSTEM_SRCSET = {
  "assets/images/hero-image.webp": {
    srcset:
      "assets/images/hero-image-742w.webp 742w, assets/images/hero-image.webp 1024w",
    sizes: HERO_SIZES,
  },
  "assets/images/hero-professional-blue.webp": {
    srcset:
      "assets/images/hero-professional-blue-742w.webp 742w, assets/images/hero-professional-blue.webp 1254w",
    sizes: HERO_SIZES,
  },
  "assets/images/hero-executive-navy.webp": {
    srcset:
      "assets/images/hero-executive-navy-742w.webp 742w, assets/images/hero-executive-navy.webp 1254w",
    sizes: HERO_SIZES,
  },
  "assets/images/hero-healthcare-teal.webp": {
    srcset:
      "assets/images/hero-healthcare-teal-742w.webp 742w, assets/images/hero-healthcare-teal.webp 1254w",
    sizes: HERO_SIZES,
  },
  "assets/images/about-image.webp": {
    srcset:
      "assets/images/about-image-1050w.webp 1050w, assets/images/about-image.webp 1536w",
    sizes: "(max-width: 1023.98px) 100vw, 50vw",
  },
  "assets/images/advisor-image.webp": {
    srcset:
      "assets/images/advisor-image-1040w.webp 1040w, assets/images/advisor-image.webp 1536w",
    sizes: "(max-width: 1023.98px) 100vw, 520px",
  },
  "assets/images/final-cta-image.webp": {
    srcset:
      "assets/images/final-cta-image-640w.webp 640w, assets/images/final-cta-image.webp 1536w",
    sizes: "(max-width: 991.98px) 150px, 400px", // $bp-md
  },
  "assets/images/testimonial-1.webp": {
    srcset:
      "assets/images/testimonial-1-156w.webp 156w, assets/images/testimonial-1.webp 640w",
    sizes: "52px",
  },
  "assets/images/testimonial-2.webp": {
    srcset:
      "assets/images/testimonial-2-156w.webp 156w, assets/images/testimonial-2.webp 640w",
    sizes: "52px",
  },
  "assets/images/testimonial-3.webp": {
    srcset:
      "assets/images/testimonial-3-156w.webp 156w, assets/images/testimonial-3.webp 640w",
    sizes: "52px",
  },
};

function applyResponsiveSrc(img, src, single) {
  if (!src) return;
  img.setAttribute("src", src);
  const spec = single ? null : ownValue(SYSTEM_SRCSET, src);
  if (spec) {
    img.setAttribute("srcset", spec.srcset);
    img.setAttribute("sizes", spec.sizes);
    return;
  }
  img.removeAttribute("srcset");
  img.removeAttribute("sizes");
}

function applyHeroPreload(src, single) {
  let preload = document.querySelector('link[rel="preload"][as="image"]');
  if (!preload) {
    preload = document.createElement("link");
    preload.rel = "preload";
    preload.as = "image";
    const css = document.querySelector('link[rel="stylesheet"]');
    if (css) document.head.insertBefore(preload, css);
    else document.head.appendChild(preload);
  }
  preload.setAttribute("href", src);
  preload.setAttribute("fetchpriority", "high");
  const spec = single ? null : ownValue(SYSTEM_SRCSET, src);
  if (spec) {
    preload.setAttribute("imagesrcset", spec.srcset);
    preload.setAttribute("imagesizes", spec.sizes);
    return;
  }
  preload.removeAttribute("imagesrcset");
  preload.removeAttribute("imagesizes");
}

function getPath(object, path) {
  return path.split(".").reduce(function (current, key) {
    if (current == null) return undefined;
    return current[key];
  }, object);
}

function setTextPreserveChildren(el, value) {
  if (value == null) return;
  const text = String(value);
  const labeled = el.querySelector("[data-config-text]");
  if (labeled) {
    labeled.textContent = text;
    return;
  }
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: function (node) {
      return node.textContent.trim()
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_SKIP;
    },
  });
  const first = walker.nextNode();
  if (first) {
    first.textContent = text;
    return;
  }
  el.textContent = text;
}

function applyDataConfig(config) {
  document.querySelectorAll("[data-config]").forEach(function (el) {
    const path = el.getAttribute("data-config");
    const attr = el.getAttribute("data-config-attr");
    const value = getPath(config, path);
    if (value == null || typeof value === "object") return;
    if (attr) {
      el.setAttribute(attr, String(value));
      return;
    }
    setTextPreserveChildren(el, value);
  });
}

function applyTheme(config) {
  const theme = getTheme(config);
  const root = document.documentElement;
  root.setAttribute("data-theme", config?.theme?.variant || "trustGreen");
  THEME_CSS_VARS.forEach(function (pair) {
    root.style.setProperty(pair[1], theme[pair[0]]);
  });

  let themeMeta = document.querySelector('meta[name="theme-color"]');
  if (!themeMeta) {
    themeMeta = document.createElement("meta");
    themeMeta.setAttribute("name", "theme-color");
    document.head.appendChild(themeMeta);
  }
  themeMeta.setAttribute("content", theme.manifestThemeColor);
  applyManifest(theme);
}

function applyManifest(theme) {
  const link = document.querySelector('link[rel="manifest"]');
  if (!link) return;
  const manifest = {
    name: "Donordoc-01",
    short_name: "Donordoc",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    theme_color: theme.manifestThemeColor,
    background_color: theme.manifestBackgroundColor,
    display: "standalone",
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" }),
  );
  if (link.dataset.manifestUrl) URL.revokeObjectURL(link.dataset.manifestUrl);
  link.dataset.manifestUrl = url;
  link.setAttribute("href", url);
}

function applySeo(config) {
  const seo = config.seo || {};
  const social = seo.socialSharing || {};
  if (seo.title) document.title = seo.title;
  setMeta('meta[name="description"]', "content", seo.description);
  setLink('link[rel="canonical"]', "href", seo.canonicalUrl);
  setMeta('meta[property="og:title"]', "content", social.title);
  setMeta('meta[property="og:description"]', "content", social.description);
  setMeta('meta[property="og:image"]', "content", social.image);
  setMeta('meta[property="og:url"]', "content", social.url);
  setMeta('meta[name="twitter:title"]', "content", social.title);
  setMeta('meta[name="twitter:description"]', "content", social.description);
  setMeta('meta[name="twitter:image"]', "content", social.image);
}

function setMeta(selector, attr, value) {
  if (value == null) return;
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

function setLink(selector, attr, value) {
  if (value == null) return;
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

function applyBranding(config) {
  applyBrandingLogo(config);

  const favicon = config.branding?.favicon?.src;
  if (favicon) {
    document.querySelectorAll('link[rel="icon"]').forEach(function (icon) {
      icon.setAttribute("href", favicon);
    });
  }
}

function sectionIsEnabled(config, sectionId) {
  if (!sectionId) return true;
  return config.sections?.[sectionId]?.enabled !== false;
}

function hasText(value) {
  return value != null && String(value).trim() !== "";
}

function removeConfigRow(el) {
  const row = el && el.closest("li");
  if (row) row.remove();
  else if (el) el.remove();
}

function applyNavigation(config) {
  const nav = config.navigation || {};
  (nav.items || []).forEach(function (item) {
    const visible = sectionIsEnabled(config, NAV_LINK_SECTION[item.id]);
    document
      .querySelectorAll('[data-nav-item="' + item.id + '"]')
      .forEach(function (el) {
        if (!visible) {
          removeConfigRow(el);
          return;
        }
        if (item.href) el.setAttribute("href", item.href);
        setTextPreserveChildren(el, item.label);
      });
  });

  applyNavAction(config, nav.primaryAction, "primary", "[data-nav-primary]");
  applyNavAction(
    config,
    nav.secondaryAction,
    "secondary",
    "[data-nav-secondary]",
  );
}

function applyNavAction(config, action, key, selector) {
  if (!action) return;
  const visible = sectionIsEnabled(config, NAV_ACTION_SECTION[key]);
  document.querySelectorAll("#header " + selector).forEach(function (el) {
    if (!visible) {
      removeConfigRow(el);
      return;
    }
    if (action.href) el.setAttribute("href", action.href);
    setTextPreserveChildren(el, action.label);
  });
  if (!visible && key === "secondary") {
    document
      .querySelectorAll("#header [data-nav-divider]")
      .forEach(function (el) {
        el.remove();
      });
  }
}

function applyHero(config) {
  const hero = document.querySelector('[data-section="hero"]');
  if (!hero) return;
  const src = resolveHeroImage(config);
  const single = config.sections?.hero?.image?.mode === "custom";
  const alt = config.sections?.hero?.image?.alt ?? "";
  hero.querySelectorAll("[data-hero-image]").forEach(function (img) {
    applyResponsiveSrc(img, src, single);
    img.setAttribute("alt", alt);
    img.setAttribute("loading", "eager");
    img.setAttribute("fetchpriority", "high");
    img.setAttribute("decoding", "async");
  });
  applyHeroPreload(src, single);
}

function applyImage(selector, image) {
  if (!image) return;
  document.querySelectorAll(selector).forEach(function (img) {
    if (image.src) applyResponsiveSrc(img, image.src);
    if (image.alt != null) img.setAttribute("alt", image.alt);
  });
}

function applyIndexed(section, selector, items, writer) {
  if (!section || !items) return;
  const nodes = section.querySelectorAll(selector);
  items.forEach(function (item, index) {
    if (nodes[index]) writer(nodes[index], item);
  });
}

function configField(el, name) {
  return el.querySelector('[data-config-field="' + name + '"]');
}

function configFields(el, name) {
  return el.querySelectorAll('[data-config-field="' + name + '"]');
}

function applyServiceCards(section, items) {
  if (!section || !items) return;
  const cards = {};
  let parent = null;
  section.querySelectorAll('[data-config-item="services"]').forEach(function (card) {
    const id = card.getAttribute("data-service-id");
    if (!id) return;
    cards[id] = card;
    if (!parent) parent = card.parentElement;
  });
  if (!parent) return;
  items.forEach(function (item) {
    const card = item && cards[item.id];
    if (!card) return;
    parent.appendChild(card);
    const title = configField(card, "title");
    const desc = configField(card, "description");
    if (title) title.textContent = item.title;
    if (desc) desc.textContent = item.description;
  });
}

function applySectionLists(config) {
  const sections = config.sections || {};

  applyIndexed(
    document.querySelector('[data-section="trust"]'),
    '[data-config-item="trust"]',
    sections.trust?.stats,
    function (el, item) {
      const value = configField(el, "value");
      const label = configField(el, "label");
      if (value) value.textContent = item.value;
      if (label) label.textContent = item.label;
    },
  );

  applyIndexed(
    document.querySelector('[data-section="trust"]'),
    '[data-config-item="trustBenefits"]',
    sections.trust?.benefits,
    function (el, item) {
      const title = configField(el, "title");
      const desc = configField(el, "description");
      if (title) title.textContent = item.title;
      if (desc) desc.textContent = item.description;
    },
  );

  applyIndexed(
    document.querySelector('[data-section="hero"]'),
    '[data-config-item="hero"]',
    sections.hero?.benefits,
    function (el, item) {
      const nodes = Array.from(el.childNodes).filter(function (node) {
        return node.nodeType === Node.TEXT_NODE && node.textContent.trim();
      });
      if (nodes[0]) nodes[0].textContent = " " + item.text;
    },
  );

  applyServiceCards(
    document.querySelector('[data-section="services"]'),
    sections.services?.items,
  );

  applyIndexed(
    document.querySelector('[data-section="pricing"]'),
    '[data-config-item="pricing"]',
    sections.pricing?.plans,
    function (el, item) {
      const name = configField(el, "name");
      const desc = configField(el, "description");
      const badge = configField(el, "badge");
      const prefix = configField(el, "prefix");
      const amount = configField(el, "amount");
      const suffix = configField(el, "suffix");
      const cta = configField(el, "cta");
      if (name) name.textContent = item.name;
      if (desc) desc.textContent = item.description;
      if (badge) badge.textContent = item.badge || "";
      if (prefix && item.price) prefix.textContent = item.price.prefix;
      if (amount && item.price) amount.textContent = item.price.amount;
      if (suffix && item.price) suffix.textContent = item.price.suffix;
      if (cta) {
        if (item.cta?.href) cta.setAttribute("href", item.cta.href);
        setTextPreserveChildren(cta, item.cta?.label);
      }
      applyIndexed(
        el,
        '[data-config-item="pricingFeatures"]',
        item.features,
        function (li, feature) {
          const texts = Array.from(li.childNodes).filter(function (node) {
            return node.nodeType === Node.TEXT_NODE && node.textContent.trim();
          });
          if (texts[0]) texts[0].textContent = " " + feature;
        },
      );
    },
  );

  const how = document.querySelector('[data-section="howItWorks"]');
  if (how && sections.howItWorks) {
    const groups = sections.howItWorks.groups || [];
    applyIndexed(
      how,
      '[data-config-item="howItWorksGroup"]',
      groups,
      function (el, group) {
        const text = Array.from(el.childNodes).filter(function (node) {
          return node.nodeType === Node.TEXT_NODE && node.textContent.trim();
        });
        if (text[0]) text[0].textContent = " " + group.label;
      },
    );

    const steps = groups.reduce(function (all, group) {
      return all.concat(group.steps || []);
    }, []);
    applyIndexed(
      how,
      '[data-config-item="howItWorks"]',
      steps,
      function (el, step) {
        const number = configField(el, "number");
        const title = configField(el, "title");
        const desc = configField(el, "description");
        if (number) number.textContent = step.number;
        if (title) title.textContent = step.title;
        if (desc) desc.textContent = step.description;
      },
    );
    applyIndexed(
      how,
      '[data-config-item="howItWorksMarkers"]',
      steps,
      function (el, step) {
        el.textContent = step.number;
      },
    );
  }

  const advisor = document.querySelector('[data-config-item="advisorCta"]');
  if (advisor && sections.pricing?.advisorCta) {
    const title = configField(advisor, "headline");
    const desc = configField(advisor, "description");
    const button = configField(advisor, "button");
    if (title) title.textContent = sections.pricing.advisorCta.headline;
    if (desc) desc.textContent = sections.pricing.advisorCta.description;
    if (button) {
      if (sections.pricing.advisorCta.button?.href) {
        button.setAttribute("href", sections.pricing.advisorCta.button.href);
      }
      setTextPreserveChildren(
        button,
        sections.pricing.advisorCta.button?.label,
      );
    }
  }

  applyIndexed(
    document.querySelector('[data-section="reviews"]'),
    '[data-config-item="reviews"]',
    sections.reviews?.items,
    function (el, item) {
      const quote = configField(el, "quote");
      const name = configField(el, "name");
      const role = configField(el, "clientType");
      const status = configField(el, "enrollmentText");
      const img = configField(el, "image");
      const stars = configField(el, "rating");
      if (quote) quote.textContent = "\u201C" + item.quote + "\u201D";
      if (name) name.textContent = item.name;
      if (role) role.textContent = item.clientType;
      if (status) status.textContent = item.enrollmentText;
      if (img && item.image) {
        applyResponsiveSrc(img, item.image.src);
        img.setAttribute("alt", item.image.alt || item.name);
      }
      if (stars && item.rating) {
        const rating = Number(item.rating) || 0;
        stars.setAttribute("aria-label", rating + " out of 5 stars");
        stars.querySelectorAll("svg").forEach(function (star, index) {
          star.style.opacity = index < rating ? "1" : "0.22";
        });
      }
    },
  );

  applyIndexed(
    document.querySelector('[data-section="consultation"]'),
    '[data-config-item="consultation"]',
    sections.consultation?.benefits,
    function (el, item) {
      const title = configField(el, "title");
      const desc = configField(el, "description");
      if (title) title.textContent = item.title;
      if (desc) desc.textContent = item.description;
    },
  );

  applyIndexed(
    document.querySelector('[data-section="finalCta"]'),
    '[data-config-item="finalCta"]',
    sections.finalCta?.features,
    function (el, item) {
      el.textContent = item.text;
    },
  );

  const footer = document.querySelector('[data-section="footer"]');
  if (footer && sections.footer) {
    applyIndexed(
      footer,
      '[data-config-item="footerSocial"]',
      sections.footer.socialLinks,
      function (el, item) {
        el.setAttribute("href", item.href);
        el.setAttribute("aria-label", item.label);
      },
    );
    applyFooterGroups(footer, config);
    syncLegalLinks(footer, sections.footer.legalLinks);
    applyFooterContact(footer, sections.footer.contact || {});
  }
}

function visibleFooterLinks(group, config) {
  const sectionByLink = group.id === "company" ? COMPANY_LINK_SECTION : null;
  return (group.links || []).filter(function (link) {
    if (!link || !link.id) return false;
    if (!sectionByLink || !sectionByLink[link.id]) return true;
    return sectionIsEnabled(config, sectionByLink[link.id]);
  });
}

function syncFooterLinkList(groupEl, links) {
  const list = groupEl.querySelector("[data-footer-link-list]");
  if (!list) return;

  const anchors = {};
  list.querySelectorAll("[data-footer-link]").forEach(function (anchor) {
    anchors[anchor.getAttribute("data-footer-link")] = anchor;
  });

  const visibleIds = {};
  links.forEach(function (link) {
    const anchor = anchors[link.id];
    if (!anchor) return;
    visibleIds[link.id] = true;
    if (link.href) anchor.setAttribute("href", link.href);
    anchor.textContent = link.label;
    list.appendChild(anchor.parentElement);
  });

  list.querySelectorAll("[data-footer-link]").forEach(function (anchor) {
    if (!visibleIds[anchor.getAttribute("data-footer-link")]) {
      removeConfigRow(anchor);
    }
  });
}

function applyFooterGroups(footer, config) {
  const linkGroups = config.sections?.footer?.linkGroups || [];
  const byId = {};
  linkGroups.forEach(function (group) {
    if (group && group.id) byId[group.id] = group;
  });

  footer.querySelectorAll("[data-footer-group]").forEach(function (groupEl) {
    const id = groupEl.getAttribute("data-footer-group");
    if (id === "contact") return;

    const group = byId[id];
    const links = group ? visibleFooterLinks(group, config) : [];
    if (!group || !links.length) {
      groupEl.remove();
      return;
    }

    configFields(groupEl, "title").forEach(function (node) {
      node.textContent = group.title;
    });
    syncFooterLinkList(groupEl, links);
  });

  syncFooterColumns(footer);
}

function syncFooterColumns(footer) {
  const nav = footer.querySelector("[data-footer-columns]");
  if (!nav) return;
  const count = nav.querySelectorAll("[data-footer-group]").length;
  if (count === 4) nav.removeAttribute("data-footer-cols");
  else if (count > 0) nav.setAttribute("data-footer-cols", String(count));
}

function syncLegalLinks(footer, links) {
  const nav = footer.querySelector("[data-footer-legal-links]");
  if (!nav) return;

  const items = Array.isArray(links) ? links : [];
  const anchors = {};
  nav.querySelectorAll("[data-footer-link]").forEach(function (anchor) {
    anchors[anchor.getAttribute("data-footer-link")] = anchor;
  });

  nav.querySelectorAll("span").forEach(function (sep) {
    sep.remove();
  });

  const visible = [];
  const keep = {};
  items.forEach(function (item) {
    const anchor = item && anchors[item.id];
    if (!anchor) return;
    keep[item.id] = true;
    if (item.href) anchor.setAttribute("href", item.href);
    anchor.textContent = item.label;
    visible.push(anchor);
  });

  Object.keys(anchors).forEach(function (id) {
    if (!keep[id]) anchors[id].remove();
  });

  visible.forEach(function (anchor, index) {
    if (index > 0) {
      const sep = document.createElement("span");
      sep.setAttribute("aria-hidden", "true");
      sep.textContent = "|";
      nav.appendChild(sep);
    }
    nav.appendChild(anchor);
  });
}

function applyFooterContact(footer, contact) {
  const phone = configField(footer, "phone");
  const email = configField(footer, "email");
  const address = footer.querySelector(
    '[data-config="sections.footer.contact.address"]',
  );
  const hours = footer.querySelector(
    '[data-config="sections.footer.contact.hours"]',
  );

  if (phone) {
    if (hasText(contact.phone?.display)) {
      if (contact.phone.href) phone.setAttribute("href", contact.phone.href);
      setTextPreserveChildren(phone, contact.phone.display);
    } else {
      removeConfigRow(phone);
    }
  }

  if (email) {
    if (hasText(contact.email)) {
      email.setAttribute("href", "mailto:" + contact.email);
      setTextPreserveChildren(email, contact.email);
    } else {
      removeConfigRow(email);
    }
  }

  if (address && !hasText(contact.address)) removeConfigRow(address);
  if (hours && !hasText(contact.hours)) removeConfigRow(hours);

  const group = footer.querySelector('[data-footer-group="contact"]');
  if (!group) return;
  if (group.querySelector("[data-footer-contact-list] > li")) return;
  group.remove();
  syncFooterColumns(footer);
}

function applyConsultationOptions(config) {
  const fields = config.sections?.consultation?.form?.fields;
  if (!fields) return;
  fillSelect("#consultation-coverage", fields.coverageType);
  fillSelect("#consultation-contact", fields.contactMethod);
}

function fillSelect(rootId, field) {
  if (!field) return;
  const root = document.getElementById(rootId.replace("#", ""));
  if (!root) return;
  const placeholder = root.querySelector("[data-select-value]");
  const box = root.querySelector("[data-select-options]");
  if (placeholder && field.placeholder)
    placeholder.textContent = field.placeholder;
  if (!box || !field.options) return;
  box.innerHTML = field.options
    .map(function (option) {
      return '<div class="option" data-select-option>' + option + "</div>";
    })
    .join("");
}

export function applySectionVisibility(config) {
  VISIBILITY_SECTIONS.forEach(function (key) {
    const enabled = config.sections?.[key]?.enabled;
    if (enabled !== false) return;
    const section = document.querySelector('[data-section="' + key + '"]');
    if (section) section.remove();
  });
  applySectionLayout(config);
}

function applySectionLayout(config) {
  const root = document.documentElement;
  const heroOn = sectionIsEnabled(config, "hero");
  const trustOn = sectionIsEnabled(config, "trust");
  root.classList.toggle("is-no-hero", !heroOn);
  root.classList.toggle("is-trust-off", heroOn && !trustOn);
}

function applySiteConfig(config) {
  applyTheme(config);
  applySeo(config);
  applyBranding(config);
  applyNavigation(config);
  applyDataConfig(config);
  applyHero(config);
  applyImage('[data-section="about"] img', config.sections?.about?.image);
  applyImage(
    '[data-section="consultation"] img',
    config.sections?.consultation?.image,
  );
  applyImage('[data-section="finalCta"] img', config.sections?.finalCta?.image);
  applySectionLists(config);
  applyConsultationOptions(config);
  applySectionVisibility(config);
}

function loadSiteConfig() {
  if (window.__donordocConfigReady) return window.__donordocConfigReady;
  return fetch("config/siteConfig.json").then(function (response) {
    if (!response.ok) throw new Error("Failed to load siteConfig.json");
    return response.json();
  });
}

export function initSiteConfig() {
  return loadSiteConfig()
    .then(function (config) {
      if (!config) {
        siteConfig = null;
        revealLogos();
        return null;
      }
      siteConfig = config;
      applySiteConfig(config);
      return config;
    })
    .catch(function (error) {
      console.error("initSiteConfig error:", error);
      siteConfig = null;
      revealLogos();
      return null;
    });
}
