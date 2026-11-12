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
- `assets/icons/<edition>/` — favicon, Apple touch and Android icons for Executive Navy, Professional Blue and Healthcare Teal. Trust Green's icons stay in the site root (`favicon.ico`, `apple-touch-icon.png`, `android-chrome-*.png`) and are the static fallback.

Each edition's icons are listed in `config/themeRegistry.js` (`icons`) and chosen from `theme.variant`. `branding.favicon` in `siteConfig.json` keeps working: `{ "src": "/favicon.ico" }` uses the edition's icons; `{ "mode": "custom", "customSrc": "..." }` (or any other `src`) replaces the browser-tab icon only.

Empty `pages/` and `assets/fonts/` are omitted until those files exist.

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

## Edition builds

`scripts/build-edition.mjs` builds a deployable copy of one edition into `dist/<edition>/` (Git-ignored). Node.js built-ins only; no `npm install` needed.

```bash
npm run build:edition -- --edition executiveNavy   # one edition
DONORDOC_EDITION=executive-navy npm run build:edition
npm run build:editions                             # all four
```

| Edition | `--edition` / `DONORDOC_EDITION` | Output |
| --- | --- | --- |
| Trust Green | `trustGreen` or `trust-green` | `dist/trust-green/` |
| Executive Navy | `executiveNavy` or `executive-navy` | `dist/executive-navy/` |
| Professional Blue | `professionalBlue` or `professional-blue` | `dist/professional-blue/` |
| Healthcare Teal | `healthcareTeal` or `healthcare-teal` | `dist/healthcare-teal/` |

- `--edition` wins over `DONORDOC_EDITION` (a note is printed when they differ). A missing or unknown edition stops the build; there is no default.
- The build reads the **committed** tree (`HEAD`) through Git, so the output depends only on the commit and the edition, and repeated builds are byte-identical. Uncommitted edits are not included (the build lists them). Commit first, including the output of `npm run build`; the build stops if a `?v=` stamp does not match its file.
- Per edition, only four generated files change: `config/siteConfig.json` (`theme.variant`), `index.html` (static logo, favicon and Apple touch icon, plus the edition's CSS color defaults in a `<style data-edition-defaults>` after the stylesheet), `site.webmanifest` (colors and Android icons) and `js/hero-boot.js` (its hero fallback when `siteConfig.json` cannot load, with a new `?v=` stamp). So a page whose config fails to load still shows one edition throughout. Runtime logo/favicon selection, theme colors from the config, custom branding and asset versioning are unchanged. Trust Green needs none of these changes: its output is identical to the committed site files.
- Not published: `scss/`, `scripts/`, `package*.json`, `README.md`, `LICENSE`, `.vscode/`, `.git*`, `node_modules/`, `.gitkeep`.

Netlify (one site per edition, configured in the site settings; no `netlify.toml`): build command `node scripts/build-edition.mjs`, environment variables `DONORDOC_EDITION=<edition>` and `NODE_VERSION=20` (or later), publish directory `dist/<edition-slug>` (for example `dist/executive-navy`). Netlify builds from a Git checkout, which the script needs.

## Local preview

Do not double-click `index.html` to open it. Preview the site with Live Server (port 5506) or another local web preview from this folder so `config/siteConfig.json` can load.
