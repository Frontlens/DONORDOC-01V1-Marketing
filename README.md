# DONORDOC-01 V1

Website System for Frontlens. Static HTML, modular Sass, and ES module JavaScript.

Do not change visual design, copy, or interactions unless Frontlens asks.

## Layout

- `index.html` — page structure
- `scss/` — style source of truth (`style.scss` imports partials)
- `css/style.css` — compiled output. Do not edit by hand.
- `css/vendor/` — Bootstrap utilities and the date picker stylesheet
- `js/app.js` — JavaScript entry
- `js/app.min.js` — bundled output. Do not edit by hand.
- `js/components/`, `js/sections/`, `js/utilities/` — feature modules
- `js/vendor/` — FLDatePicker (global)
- `config/` — `siteConfig.json` and `themeRegistry.js`
- `assets/images/` — image assets

Empty `pages/`, `assets/icons/`, and `assets/fonts/` are omitted until those files exist.

## Sass

```bash
npm install
npm run build:css
```

`npm run watch:css` rebuilds while you edit `scss/`.

## JavaScript

```bash
npm run build:js
```

`npm run watch:js` rebuilds while you edit `js/`. `index.html` loads `js/app.min.js`. Modules still initialize only when their DOM exists.

`build:js` also bundles `js/logo-boot.js` into `js/logo-boot.min.js` (the early logo resolver that `js/hero-boot.js` imports). `build:css` and `build:js` both finish with `scripts/version-assets.mjs`, which stamps a content hash (`?v=`) onto the `hero-boot.js`, `logo-boot.min.js`, `app.min.js` and `css/style.css` URLs in `index.html`. Always deploy after `npm run build`; the watch scripts do not stamp versions.

Swiper and the date picker stay vendor files, loaded when those sections are near the viewport.

## Local preview

Do not double-click `index.html` to open it. Preview the site with Live Server (port 5506) or another local web preview from this folder so `config/siteConfig.json` can load.
