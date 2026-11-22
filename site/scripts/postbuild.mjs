#!/usr/bin/env node
// After `vite build`: write one real HTML file per route (GitHub Pages has no rewrites), with per-route
// metadata; keep the legacy guide URLs (<slug>.html); add 404.html, sitemap.xml, robots.txt and the
// service worker with its precache list.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const site = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(site, "dist");
const rawBase = process.env.DOCS_BASE || "/";
const base = rawBase.endsWith("/") ? rawBase : `${rawBase}/`;
// The configured custom domain (docs/site.md). Overridable for previews.
const origin = (process.env.SITE_ORIGIN || "https://config.fikrimarzuki.work").replace(/\/$/, "");
const guides = JSON.parse(readFileSync(join(site, "src/generated/guide-index.json"), "utf8"));
const template = readFileSync(join(dist, "index.html"), "utf8");

const pages = [
  { path: "", title: "Ecosystem Config: the architecture behind FM Work", description: "The shared registry behind FM Work: projects, deployments, consumers and the contracts that keep them in sync." },
  { path: "blueprint/", title: "Ecosystem Blueprint | Ecosystem Config", description: "An interactive map of the FM Work registry: destinations, the applications that read it, and documented links." },
  { path: "registry/", title: "Project registry | Ecosystem Config", description: "Every publicly described FM Work project, with its status, destination, website and approved screenshot." },
  { path: "a-z/", title: "A–Z Showcase | Ecosystem Config", description: "Every FM Work entry the owner has explicitly approved for public discovery, filed alphabetically: projects, concepts and case studies." },
  { path: "connections/", title: "Connections | Ecosystem Config", description: "Which applications read the registry, which file they use, and how the sibling repositories relate." },
  { path: "health/", title: "Registry health | Ecosystem Config", description: "A build-time snapshot of the registry: validation result, source revision and record counts." },
  { path: "about/", title: "About | Ecosystem Config", description: "What Ecosystem Config is, what it owns, and how a fact travels from source to every FM Work application." },
  { path: "README.html", title: "Guides | Ecosystem Config", description: "Reference and integration guides for the FM Work registry." },
  ...guides.filter(guide => guide.slug !== "README").map(guide => ({ path: `${guide.slug}.html`, title: `${guide.title} | Ecosystem Config`, description: guide.summary || "A guide to the FM Work registry." })),
];

const escape = value => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
function render(page, { noindex = false } = {}) {
  const url = `${origin}${base}${page.path}`;
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${escape(page.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${escape(page.description)}"`)
    .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${url}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${escape(page.title)}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${escape(page.description)}"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${url}"`)
    .replace(/(<meta property="og:image" content=")[^"]*"/, `$1${origin}${base}social-preview.png"`);
  if (noindex) html = html.replace(/<link rel="canonical"[^>]*>\s*/, "").replace("<meta name=\"viewport\"", "<meta name=\"robots\" content=\"noindex\" />\n    <meta name=\"viewport\"");
  return html;
}

for (const page of pages) {
  const file = page.path === "" ? join(dist, "index.html") : page.path.endsWith("/") ? join(dist, page.path, "index.html") : join(dist, page.path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, render(page));
}
writeFileSync(join(dist, "404.html"), render({ path: "404.html", title: "Not found | Ecosystem Config", description: "This page is not part of the Ecosystem Config website." }, { noindex: true }));
// The former VitePress home URL keeps working.
writeFileSync(join(dist, "index.html"), render(pages[0]));

const lastmod = new Date().toISOString().slice(0, 10);
writeFileSync(join(dist, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(page => `  <url><loc>${origin}${base}${page.path}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n")}\n</urlset>\n`);
writeFileSync(join(dist, "robots.txt"), `User-agent: *\nAllow: /\n\nSitemap: ${origin}${base}sitemap.xml\n`);

// Service worker: precache the app shell (pages, hashed assets, Latin fonts, icons); thumbnails are cached on use.
const files = [];
const walk = directory => { for (const name of readdirSync(directory)) { const path = join(directory, name); if (statSync(path).isDirectory()) walk(path); else files.push(relative(dist, path).split(sep).join("/")); } };
walk(dist);
const isFont = file => /\.woff2?$/.test(file);
const precache = files
  .filter(file => !file.startsWith("generated/") && !["sw.js", "social-preview.png"].includes(file) && !file.endsWith(".map"))
  .filter(file => !isFont(file) || /archivo-latin-wdth-normal.*\.woff2$/.test(file))
  .map(file => file === "index.html" ? base : `${base}${file}`);
const version = createHash("sha256").update(precache.join("\n")).update(files.filter(file => file.startsWith("assets/")).join("\n")).digest("hex").slice(0, 12);
writeFileSync(join(dist, "sw.js"), readFileSync(join(site, "scripts/sw.template.js"), "utf8")
  .replace("__VERSION__", version).replace("__PRECACHE__", JSON.stringify(precache, null, 2)));

if (!existsSync(join(dist, "social-preview.png"))) console.warn("postbuild: social-preview.png is missing from site/public");
console.log(`postbuild: ${pages.length} pages, 404.html, sitemap.xml, robots.txt, sw.js (${precache.length} precached, version ${version}), base ${base}`);
