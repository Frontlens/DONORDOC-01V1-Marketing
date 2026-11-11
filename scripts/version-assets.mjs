// Stamps content-hash versions (?v=) onto the production JavaScript and CSS
// URLs in index.html, so a release changes the URL of every changed file and
// only those. index.html is the version manifest: hero-boot.js reads the logo
// resolver URL from its own data-logo-module attribute.
// Runs at the end of build:css and build:js; safe to run repeatedly.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";

const HTML = "index.html";

// [attribute, URL as written in index.html, file on disk]; each URL must
// appear exactly once.
const targets = [
  ["src", "js/hero-boot.js", "js/hero-boot.js"],
  ["data-logo-module", "js/logo-boot.min.js", "js/logo-boot.min.js"],
  ["src", "js/app.min.js", "js/app.min.js"],
  ["href", "./css/style.css", "css/style.css"],
];

// Hash text with LF line endings: the bytes Git stores and the host serves,
// whatever the local checkout (CRLF on Windows) or build tool (LF) wrote.
function version(file) {
  const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  return createHash("sha256").update(text).digest("hex").slice(0, 10);
}

let html = readFileSync(HTML, "utf8");
const original = html;
for (const [attr, url, file] of targets) {
  const escaped = url.replace(/[.]/g, "\\.");
  const pattern = new RegExp(`(${attr}=")${escaped}(?:\\?v=[0-9a-f]*)?(")`, "g");
  const matches = html.match(pattern) || [];
  if (matches.length !== 1) {
    throw new Error(`${HTML}: expected one ${attr}="${url}", found ${matches.length}`);
  }
  const v = version(file);
  html = html.replace(pattern, `$1${url}?v=${v}$2`);
  console.log(`${url}?v=${v}`);
}
if (html !== original) writeFileSync(HTML, html);
