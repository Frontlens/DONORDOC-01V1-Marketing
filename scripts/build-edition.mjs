// Builds deployable DONORDOC-01 editions into dist/<edition>/.
//
//   node scripts/build-edition.mjs --edition executiveNavy
//   DONORDOC_EDITION=healthcare-teal node scripts/build-edition.mjs
//   node scripts/build-edition.mjs --all
//
// Source: the committed tree at HEAD, read through Git. Uncommitted working-tree
// edits are never included, so the output depends only on the commit and the
// edition, and repeated builds are byte-identical.
// Edition: --edition beats DONORDOC_EDITION. Accepts a themeRegistry key
// (executiveNavy) or its kebab-case slug (executive-navy). A missing or unknown
// edition fails the build; there is no implicit default.
// Per edition, only these generated files differ from the commit:
//   config/siteConfig.json  theme.variant
//   index.html              static logo, favicon and Apple touch icon; the
//                           edition's CSS color defaults; hero-boot ?v= stamp
//   site.webmanifest        theme/background colors and Android icon paths
//   js/hero-boot.js         config-failure hero fallback
// Trust Green needs none of these changes, so its output equals the commit.
// Node.js built-ins only.
import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const REF = "HEAD";

// Development-only paths never published.
const EXCLUDE = [
  /^\.git/, // .gitignore, .gitattributes
  /^\.vscode\//,
  /^scss\//,
  /^scripts\//,
  /^node_modules\//,
  /^dist\//,
  /^package(-lock)?\.json$/,
  /^README\.md$/i,
  /^LICENSE$/i,
  /(^|\/)\.gitkeep$/,
  /(^|\/)\.DS_Store$/,
  /(^|\/)\.env/,
];

// Asset-version targets, as stamped by scripts/version-assets.mjs.
const VERSIONED = [
  ["src", "js/hero-boot.js", "js/hero-boot.js"],
  ["data-logo-module", "js/logo-boot.min.js", "js/logo-boot.min.js"],
  ["src", "js/app.min.js", "js/app.min.js"],
  ["href", "./css/style.css", "css/style.css"],
];

class BuildError extends Error {}
const fail = (message) => {
  throw new BuildError(message);
};

// ---------------------------------------------------------------- Git source
function git(args, options = {}) {
  return execFileSync("git", args, {
    cwd: ROOT,
    maxBuffer: 512 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

function readCommittedTree() {
  let commit;
  try {
    commit = git(["rev-parse", "--verify", `${REF}^{commit}`]).toString().trim();
  } catch {
    fail(
      "Cannot read the committed source through Git. build-edition builds from " +
        "the committed tree (HEAD) so the output is reproducible and uncommitted " +
        "edits are never included. Run it inside the Git repository with Git installed.",
    );
  }
  const entries = git(["ls-tree", "-r", "-z", "--full-tree", commit])
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf("\t");
      const [mode, type, sha] = line.slice(0, tab).split(" ");
      return { mode, type, sha, path: line.slice(tab + 1) };
    });
  const published = entries.filter((e) => !EXCLUDE.some((re) => re.test(e.path)));
  for (const e of published) {
    if (e.type !== "blob" || !/^100(644|755)$/.test(e.mode)) {
      fail(`Unsupported entry in the publish set: ${e.path} (${e.type} ${e.mode}).`);
    }
  }
  // Read all blobs in one git cat-file --batch call.
  const out = spawnSync("git", ["cat-file", "--batch"], {
    cwd: ROOT,
    input: published.map((e) => e.sha).join("\n") + "\n",
    maxBuffer: 512 * 1024 * 1024,
  });
  if (out.status !== 0) fail(`git cat-file failed: ${out.stderr}`);
  const buf = out.stdout;
  const files = new Map();
  let offset = 0;
  for (const e of published) {
    const nl = buf.indexOf(10, offset);
    const [sha, type, size] = buf.toString("utf8", offset, nl).split(" ");
    if (sha !== e.sha || type !== "blob") fail(`Unexpected git object for ${e.path}.`);
    const start = nl + 1;
    files.set(e.path, buf.subarray(start, start + Number(size)));
    offset = start + Number(size) + 1;
  }
  const all = new Map(entries.map((e) => [e.path, e]));
  return { commit, files, all };
}

function readCommittedFile(commit, path) {
  try {
    return git(["show", `${commit}:${path}`]).toString("utf8");
  } catch {
    fail(`Cannot read ${path} from the committed tree (${commit.slice(0, 7)}).`);
  }
}

function uncommittedChanges() {
  try {
    return git(["status", "--porcelain=v1", "-z", "--untracked-files=all"])
      .toString("utf8")
      .split("\0")
      .filter(Boolean)
      .map((line) => line.slice(3))
      .filter((p) => !/^dist\//.test(p));
  } catch {
    return [];
  }
}

// ------------------------------------------------------------------ Editions
async function loadRegistry(commit) {
  const source = readCommittedFile(commit, "config/themeRegistry.js");
  const url = "data:text/javascript;base64," + Buffer.from(source).toString("base64");
  const { themeRegistry } = await import(url);
  if (!themeRegistry || typeof themeRegistry !== "object") {
    fail("config/themeRegistry.js does not export themeRegistry.");
  }
  return themeRegistry;
}

const slugOf = (key) => key.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

function resolveEdition(registry, value, origin) {
  const id = typeof value === "string" ? value.trim() : "";
  const keys = Object.keys(registry);
  const key = keys.find((k) => k === id || slugOf(k) === id);
  if (!key) {
    fail(
      `Unknown edition "${id}" (from ${origin}). Use one of: ` +
        keys.map((k) => `${k} (${slugOf(k)})`).join(", ") + ".",
    );
  }
  return key;
}

function editionsFromArgs(registry, argv, env) {
  let cli = null;
  let all = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--all") all = true;
    else if (a === "--edition") {
      if (i + 1 >= argv.length || argv[i + 1].startsWith("--")) fail("--edition needs a value.");
      cli = argv[++i];
    } else if (a.startsWith("--edition=")) cli = a.slice("--edition=".length);
    else if (a === "--help" || a === "-h") return { help: true };
    else fail(`Unknown argument "${a}". Use --edition <name>, --all or --help.`);
  }
  const fromEnv = env.DONORDOC_EDITION;
  const notes = [];
  if (all) {
    if (cli !== null) fail("Use either --all or --edition, not both.");
    if (fromEnv) notes.push(`--all given: DONORDOC_EDITION="${fromEnv}" is ignored.`);
    return { keys: Object.keys(registry), notes };
  }
  if (cli !== null) {
    const key = resolveEdition(registry, cli, "--edition");
    if (fromEnv && fromEnv.trim() && resolveEdition(registry, fromEnv, "DONORDOC_EDITION") !== key) {
      notes.push(`--edition ${cli} overrides DONORDOC_EDITION="${fromEnv}".`);
    }
    return { keys: [key], notes };
  }
  if (fromEnv !== undefined && fromEnv.trim() !== "") {
    return { keys: [resolveEdition(registry, fromEnv, "DONORDOC_EDITION")], notes };
  }
  fail(
    "No edition selected. Set DONORDOC_EDITION or pass --edition <name> (or --all). " +
      "Editions: " + Object.keys(registry).map((k) => `${k} (${slugOf(k)})`).join(", ") + ".",
  );
}

function validateTheme(key, theme, files) {
  const need = ["logo", "manifestThemeColor", "manifestBackgroundColor"];
  for (const field of need) if (typeof theme[field] !== "string") fail(`themeRegistry.${key}.${field} is missing.`);
  const icons = theme.icons || {};
  for (const field of ["ico", "appleTouch", "android192", "android512"]) {
    if (typeof icons[field] !== "string") fail(`themeRegistry.${key}.icons.${field} is missing.`);
  }
  for (const path of [theme.logo, theme.heroImage, ...Object.values(icons)].filter(Boolean)) {
    if (!files.has(path)) fail(`themeRegistry.${key} references ${path}, which is not in the committed tree.`);
  }
}

// ------------------------------------------------------------- Transforms
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const sameJson = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function editSiteConfig(text, key) {
  const original = JSON.parse(text);
  if (!original.theme || typeof original.theme !== "object") fail("config/siteConfig.json has no theme object.");
  const re = /("theme"\s*:\s*\{[^{}]*?"variant"\s*:\s*)"(?:[^"\\]|\\.)*"/;
  if (!re.test(text)) fail('config/siteConfig.json: cannot find "theme": { "variant": ... }.');
  const next = text.replace(re, `$1${JSON.stringify(key)}`);
  const expected = { ...original, theme: { ...original.theme, variant: key } };
  if (!sameJson(JSON.parse(next), expected)) fail("config/siteConfig.json: edition edit changed more than theme.variant.");
  return next;
}

function editIndexHtml(html, theme) {
  let logos = 0;
  html = html.replace(/<img\b[^>]*\bdata-branding-logo\b[^>]*>/g, (tag) => {
    logos++;
    if (!/\ssrc="[^"]*"/.test(tag)) fail("index.html: a data-branding-logo image has no src.");
    return tag.replace(/(\ssrc=")[^"]*(")/, `$1${theme.logo}$2`);
  });
  if (!logos) fail("index.html: no <img data-branding-logo> found.");
  const single = (re, label, value) => {
    const matches = html.match(new RegExp(re.source, "g")) || [];
    if (matches.length !== 1) fail(`index.html: expected exactly one ${label}, found ${matches.length}.`);
    html = html.replace(re, `$1${value}$2`);
  };
  single(/(<link\s+rel="icon"\s+href=")[^"]*(")/, '<link rel="icon">', "/" + theme.icons.ico);
  single(/(<link\s+rel="apple-touch-icon"\s+href=")[^"]*(")/, '<link rel="apple-touch-icon">', "/" + theme.icons.appleTouch);
  return { html, logos };
}

function editManifest(text, theme) {
  const original = JSON.parse(text);
  const sizes = { "192x192": theme.icons.android192, "512x512": theme.icons.android512 };
  let next = text;
  for (const [field, value] of [["theme_color", theme.manifestThemeColor], ["background_color", theme.manifestBackgroundColor]]) {
    const re = new RegExp(`("${field}"\\s*:\\s*)"[^"]*"`);
    if (!re.test(next)) fail(`site.webmanifest has no ${field}.`);
    next = next.replace(re, `$1${JSON.stringify(value)}`);
  }
  for (const icon of original.icons || []) {
    if (!sizes[icon.sizes]) continue;
    const re = new RegExp(`("src"\\s*:\\s*)"${escapeRe(icon.src)}"`);
    next = next.replace(re, `$1${JSON.stringify("/" + sizes[icon.sizes])}`);
  }
  const expected = {
    ...original,
    theme_color: theme.manifestThemeColor,
    background_color: theme.manifestBackgroundColor,
    icons: (original.icons || []).map((i) => (sizes[i.sizes] ? { ...i, src: "/" + sizes[i.sizes] } : i)),
  };
  if (!sameJson(JSON.parse(next), expected)) fail("site.webmanifest: edition edit did not produce the expected manifest.");
  if (!expected.icons.some((i) => i.sizes === "192x192") || !expected.icons.some((i) => i.sizes === "512x512")) {
    fail("site.webmanifest must declare 192x192 and 512x512 icons.");
  }
  return next;
}

// --- Config-failure defaults. If config/siteConfig.json cannot load, the
// runtime never applies the theme, so the page shows the CSS defaults and
// hero-boot.js's fallback hero. Both are Trust Green in the source; the
// generated edition gets its own, so a failed config never mixes editions.

// CSS: theme colors are custom properties defined once in style.css :root and
// named by THEME_CSS_VARS in site-config.js (the runtime's own mapping). The
// edition's values go in a <style> after the stylesheet link; the runtime's
// inline style on <html> still overrides them when the config loads.
function themeCssVars(siteConfigJs) {
  const block = siteConfigJs.match(/const THEME_CSS_VARS = \[([\s\S]*?)\];/);
  if (!block) fail("js/utilities/site-config.js: THEME_CSS_VARS not found.");
  const pairs = [...block[1].matchAll(/\[\s*"(\w+)"\s*,\s*"(--[\w-]+)"\s*\]/g)].map((m) => [m[1], m[2]]);
  if (!pairs.length) fail("js/utilities/site-config.js: THEME_CSS_VARS is empty.");
  return pairs;
}

function cssDefaults(css, vars) {
  const defaults = {};
  for (const [, name] of vars) {
    const found = [...css.matchAll(new RegExp(`${escapeRe(name)}\\s*:\\s*([^;}]+)`, "g"))];
    if (found.length !== 1) fail(`css/style.css: expected one default for ${name}, found ${found.length}.`);
    defaults[name] = found[0][1].trim();
  }
  return defaults;
}

function addCssDefaults(html, theme, vars, defaults) {
  const decls = vars
    .filter(([field, name]) => {
      if (typeof theme[field] !== "string") fail(`themeRegistry: theme value ${field} is missing.`);
      return theme[field].toLowerCase() !== defaults[name].toLowerCase();
    })
    .map(([field, name]) => `${name}:${theme[field]}`);
  if (!decls.length) return html; // the CSS defaults already are this edition (Trust Green)
  const re = /^([ \t]*)(<link rel="stylesheet" href="\.\/css\/style\.css[^"]*" \/>)(\r?\n)/m;
  const lines = html.match(new RegExp(re.source, "gm")) || [];
  if (lines.length !== 1) fail(`index.html: expected one stylesheet link for css/style.css, found ${lines.length}.`);
  return html.replace(re, `$1$2$3$1<style data-edition-defaults>:root{${decls.join(";")}}</style>$3`);
}

// Hero: point hero-boot.js's config-failure fallback at the edition. Its small
// THEME_HERO map must agree with themeRegistry (checked here, so drift fails).
function editHeroBoot(js, key, registry) {
  const map = js.match(/var THEME_HERO = \{([\s\S]*?)\};/);
  if (!map) fail("js/hero-boot.js: THEME_HERO not found.");
  const heroes = Object.fromEntries([...map[1].matchAll(/(\w+):\s*"([^"]+)"/g)].map((m) => [m[1], m[2]]));
  for (const k of Object.keys(registry)) {
    if (registry[k].heroImage && heroes[k] !== registry[k].heroImage) {
      fail(`js/hero-boot.js THEME_HERO.${k} (${heroes[k]}) does not match themeRegistry.${k}.heroImage (${registry[k].heroImage}).`);
    }
  }
  const re = /applyHeroEarly\(THEME_HERO\.(\w+), false\);/g;
  const found = [...js.matchAll(re)];
  if (found.length !== 1) fail(`js/hero-boot.js: expected one config-failure hero fallback, found ${found.length}.`);
  return js.replace(re, `applyHeroEarly(THEME_HERO.${key}, false);`);
}

const contentVersion = (buf) =>
  createHash("sha256").update(buf.toString("utf8").replace(/\r\n/g, "\n")).digest("hex").slice(0, 10);

function restamp(html, attr, url, buf) {
  const re = new RegExp(`(${attr}="${escapeRe(url)}\\?v=)[0-9a-f]{10}(")`);
  if (!re.test(html)) fail(`index.html: versioned ${attr}="${url}" not found.`);
  return html.replace(re, `$1${contentVersion(buf)}$2`);
}

// The committed ?v= stamps must match the committed files (stale bundles fail).
function checkVersionStamps(html, files) {
  for (const [attr, url, file] of VERSIONED) {
    const re = new RegExp(`${attr}="${escapeRe(url)}\\?v=([0-9a-f]{10})"`, "g");
    const found = [...html.matchAll(re)];
    if (found.length !== 1) fail(`index.html: expected one versioned ${attr}="${url}?v=...", found ${found.length}. Run npm run build and commit.`);
    const text = files.get(file);
    if (!text) fail(`${file} is missing from the committed tree.`);
    const v = createHash("sha256").update(text.toString("utf8").replace(/\r\n/g, "\n")).digest("hex").slice(0, 10);
    if (found[0][1] !== v) fail(`${file} does not match its committed ?v=${found[0][1]} stamp (content hash ${v}). Run npm run build and commit.`);
  }
}

// ------------------------------------------------------------------- Build
function buildEdition(key, registry, tree) {
  const theme = registry[key];
  const files = new Map(tree.files);
  validateTheme(key, theme, files);
  for (const f of ["index.html", "config/siteConfig.json", "site.webmanifest"]) {
    if (!files.has(f)) fail(`${f} is missing from the committed tree.`);
  }
  for (const f of ["js/hero-boot.js", "css/style.css", "js/utilities/site-config.js"]) {
    if (!files.has(f)) fail(`${f} is missing from the committed tree.`);
  }
  const text = (p) => files.get(p).toString("utf8");
  // The committed stamps must match the committed files before anything changes.
  checkVersionStamps(text("index.html"), files);
  files.set("config/siteConfig.json", Buffer.from(editSiteConfig(text("config/siteConfig.json"), key)));
  let { html, logos } = editIndexHtml(text("index.html"), theme);
  const vars = themeCssVars(text("js/utilities/site-config.js"));
  html = addCssDefaults(html, theme, vars, cssDefaults(text("css/style.css"), vars));
  const heroBoot = Buffer.from(editHeroBoot(text("js/hero-boot.js"), key, registry));
  if (!heroBoot.equals(files.get("js/hero-boot.js"))) {
    files.set("js/hero-boot.js", heroBoot);
    html = restamp(html, "src", "js/hero-boot.js", heroBoot);
  }
  checkVersionStamps(html, files);
  files.set("index.html", Buffer.from(html));
  files.set("site.webmanifest", Buffer.from(editManifest(text("site.webmanifest"), theme)));

  const out = join(DIST, slugOf(key));
  if (!out.startsWith(DIST + sep)) fail("Refusing to write outside dist/.");
  rmSync(out, { recursive: true, force: true });
  const digest = createHash("sha256");
  for (const path of [...files.keys()].sort()) {
    const dest = join(out, ...path.split("/"));
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, files.get(path));
    digest.update(path + "\0").update(files.get(path)).update("\0");
  }
  return { out, count: files.size, logos, digest: digest.digest("hex").slice(0, 16) };
}

const HELP = `Usage:
  node scripts/build-edition.mjs --edition <edition>
  DONORDOC_EDITION=<edition> node scripts/build-edition.mjs
  node scripts/build-edition.mjs --all

Editions: trustGreen, executiveNavy, professionalBlue, healthcareTeal
(or trust-green, executive-navy, professional-blue, healthcare-teal).
--edition wins over DONORDOC_EDITION. Output: dist/<edition-slug>/.
Builds from the committed tree (HEAD); uncommitted changes are not included.`;

async function main() {
  const tree = readCommittedTree();
  const registry = await loadRegistry(tree.commit);
  const selection = editionsFromArgs(registry, process.argv.slice(2), process.env);
  if (selection.help) return console.log(HELP);
  selection.notes.forEach((n) => console.log(`note: ${n}`));
  const dirty = uncommittedChanges();
  console.log(`Building from committed ${REF} ${tree.commit.slice(0, 12)}.`);
  if (dirty.length) console.log(`note: uncommitted changes are not included: ${dirty.join(", ")}`);
  for (const key of selection.keys) {
    const r = buildEdition(key, registry, tree);
    console.log(`  ${key.padEnd(17)} -> dist/${slugOf(key)}/  (${r.count} files, ${r.logos} logo tags, tree ${r.digest})`);
  }
}

main().catch((error) => {
  if (error instanceof BuildError) {
    console.error(`build-edition: ${error.message}`);
    process.exit(1);
  }
  throw error;
});
