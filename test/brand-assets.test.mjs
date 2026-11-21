// Brand asset tests for the website (site/, Vite + React since the Living Blueprint redesign; formerly VitePress in docs/):
// the approved Config Ecosystem browser icons (favicon.ico, SVG icon, Apple touch icon) are present, are exactly the approved
// files, and are declared once each in the page head. The PWA icons are derived from the approved registry icon. Offline and
// dependency-free: PNG/ICO headers are parsed by hand.
//
// The files are byte-for-byte copies of the approved exports in the `ecosystem-assets` repository
// (projects/configEcosystem/branding/exports/; first copied from commit 6e3bde1, which no longer exists after that
// repository's history was rewritten, and unchanged on its master at 6369cc7). The SHA-256 digests pin them: change the artwork in
// ecosystem-assets, copy the new files here and update the digests in the same commit.
// This test reads files only. It never builds or rewrites the registry, and it asserts no registry data beyond the one
// published icon this branding is the source of.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const read = (relative) => readFile(path.join(ROOT, relative));
const readText = (relative) => readFile(path.join(ROOT, relative), "utf8");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const has = (relative) => existsSync(path.join(ROOT, relative));

const APPROVED = {
  "site/public/favicon.ico": "d27ea82dd850943c86ecb34cc2ab49348b2e33be62614f837ef97f9d6a772827",
  "site/public/icon.svg": "cf864491acdac8fb2571f47aaacb544c22ebc37442f80f925b3eaa9bf65be7c7",
  "site/public/apple-touch-icon.png": "29442472c0a3a51f11371f0512c35403f5ade2b6ba4c98ff28d86c1de514d6eb",
};
// The registry's published 512 pixel icon for this project is the approved icon-512.png.
const REGISTRY_ICON = { path: "assets/projects/configEcosystem/icon.png", sha256: "98cae538e91f761e2224068f39e4f6250f67e59a8b779e82d44bfe28e130ad2e" };

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function pngInfo(bytes, label) {
  assert.ok(bytes.length > 33 && bytes.subarray(0, 8).equals(PNG_SIGNATURE), `${label} is not a PNG`);
  assert.equal(bytes.toString("ascii", 12, 16), "IHDR", `${label}: first chunk is not IHDR`);
  assert.equal(bytes.subarray(bytes.length - 12).toString("hex"), "0000000049454e44ae426082", `${label}: missing IEND trailer`);
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25] };
}

function icoFrames(bytes) {
  assert.equal(bytes.readUInt16LE(0), 0, "ICO reserved field");
  assert.equal(bytes.readUInt16LE(2), 1, "ICO type must be 1 (icon)");
  const count = bytes.readUInt16LE(4), frames = [];
  for (let i = 0; i < count; i += 1) {
    const entry = 6 + i * 16, length = bytes.readUInt32LE(entry + 8), offset = bytes.readUInt32LE(entry + 12);
    assert.ok(offset + length <= bytes.length, `ICO frame ${i} runs past the end of the file`);
    frames.push({ width: bytes[entry] || 256, height: bytes[entry + 1] || 256, bitCount: bytes.readUInt16LE(entry + 6), data: bytes.subarray(offset, offset + length) });
  }
  return frames;
}

/** The <link> tags of the website's HTML template. */
async function headLinks() {
  const html = await readText("site/index.html");
  return { html, links: html.match(/<link\b[^>]*>/g) ?? [] };
}

describe("approved Config Ecosystem icon files", () => {
  for (const [file, digest] of Object.entries(APPROVED)) {
    it(`${file} is the approved export`, async () => {
      assert.ok(has(file), `${file} is missing`);
      assert.equal(sha256(await read(file)), digest);
    });
  }

  it("favicon.ico holds valid 16, 32 and 48 pixel PNG frames", async () => {
    const frames = icoFrames(await read("site/public/favicon.ico"));
    assert.deepEqual(frames.map((frame) => frame.width), [16, 32, 48]);
    for (const frame of frames) {
      assert.equal(frame.height, frame.width);
      assert.equal(frame.bitCount, 32);
      const info = pngInfo(Buffer.from(frame.data), `ico ${frame.width}px frame`);
      assert.deepEqual([info.width, info.height], [frame.width, frame.height]);
    }
  });

  it("icon.svg is a well-formed 512 viewBox graphic", async () => {
    const svg = await readText("site/public/icon.svg");
    assert.match(svg, /^<svg\b[^>]*\bxmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /\bviewBox="0 0 512 512"/);
    assert.equal((svg.match(/<svg\b/g) ?? []).length, 1);
    assert.ok(svg.trimEnd().endsWith("</svg>"));
  });

  it("icon.svg has no scripts, text, embedded images, event handlers or external references", async () => {
    const svg = await readText("site/public/icon.svg");
    assert.doesNotMatch(svg, /<(script|text|image|foreignObject|style|use)\b/i);
    assert.doesNotMatch(svg, /\son[a-z]+\s*=/i);
    assert.doesNotMatch(svg, /(href|src)\s*=|data:|javascript:|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i);
  });

  it("the Apple touch icon is a 180 x 180 opaque PNG", async () => {
    const info = pngInfo(await read("site/public/apple-touch-icon.png"), "apple-touch-icon.png");
    assert.deepEqual([info.width, info.height], [180, 180]);
    // Colour type 2 is RGB with no alpha channel: iOS applies its own rounded corners to an opaque square.
    assert.equal(info.colorType, 2);
  });

  it("the published registry icon is still the approved 512 pixel export", async () => {
    assert.equal(sha256(await read(REGISTRY_ICON.path)), REGISTRY_ICON.sha256);
  });
});

describe("website head declarations", () => {
  it("declares the ICO, the SVG icon and the Apple touch icon, each exactly once", async () => {
    const { links } = await headLinks();
    const icons = links.filter((link) => /rel="(icon|apple-touch-icon)"/.test(link));
    assert.equal(icons.length, 3, icons.join("\n"));
    const [ico, svg, apple] = icons;
    assert.match(ico, /type="image\/x-icon"/); assert.match(ico, /href="\/favicon\.ico"/); assert.doesNotMatch(ico, /sizes=/);
    assert.match(svg, /type="image\/svg\+xml"/); assert.match(svg, /href="\/icon\.svg"/); assert.match(svg, /sizes="any"/);
    assert.match(apple, /rel="apple-touch-icon"/); assert.match(apple, /href="\/apple-touch-icon\.png"/); assert.match(apple, /sizes="180x180"/);
  });

  it("every declared icon and the manifest resolve to files in site/public", async () => {
    const { links } = await headLinks();
    const hrefs = links.filter((link) => /rel="(icon|apple-touch-icon|manifest)"/.test(link)).map((link) => /href="\/([\w.-]+)"/.exec(link)?.[1]);
    assert.equal(hrefs.length, 4);
    for (const name of hrefs) assert.ok(has(`site/public/${name}`), name);
  });

  it("keeps title, description, theme colours, canonical URL and Open Graph entries on the configured domain", async () => {
    const { html } = await headLinks();
    assert.match(html, /<title>Ecosystem Config: /);
    assert.match(html, /<meta name="description" content="[^"]+"/);
    assert.match(html, /<link rel="canonical" href="https:\/\/config\.fikrimarzuki\.work\/"/);
    assert.match(html, /<meta property="og:site_name" content="Ecosystem Config"/);
    assert.match(html, /<meta property="og:image" content="https:\/\/config\.fikrimarzuki\.work\/social-preview\.png"/);
    assert.equal((html.match(/<meta name="theme-color"/g) ?? []).length, 2);
  });
});

describe("PWA contract (added by the website redesign)", () => {
  it("the manifest is relative to the site base and uses icons derived from the approved registry icon", async () => {
    const manifest = JSON.parse(await readText("site/public/manifest.webmanifest"));
    assert.equal(manifest.name, "Ecosystem Config");
    assert.equal(manifest.start_url, "./"); assert.equal(manifest.scope, "./"); assert.equal(manifest.display, "standalone");
    for (const icon of manifest.icons) {
      assert.ok(has(`site/public/${icon.src}`), icon.src);
      const [width, height] = icon.sizes.split("x").map(Number);
      const info = pngInfo(await read(`site/public/${icon.src}`), icon.src);
      assert.deepEqual([info.width, info.height], [width, height], icon.src);
    }
    assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
    assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "any"));
  });

  it("the service worker only handles its own origin and replaces old caches", async () => {
    const worker = await readText("site/scripts/sw.template.js");
    assert.match(worker, /url\.origin !== self\.location\.origin/);
    assert.match(worker, /request\.mode === "navigate"/);
    assert.match(worker, /caches\.delete/);
    const code = worker.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    assert.doesNotMatch(code, /raw\.githubusercontent|ecosystem\.json|production\.json/);
  });

  it("no third-party PWA framework is installed", async () => {
    const pkg = JSON.parse(await readText("package.json"));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies });
    assert.deepEqual(deps.filter((name) => /pwa|workbox|serwist/i.test(name)), []);
  });

  it("the registry entry still publishes the same icon and thumbnail paths", async () => {
    const project = JSON.parse(await readText("config/projects/configEcosystem.json"));
    assert.equal(project.assets.icon, REGISTRY_ICON.path);
    assert.equal(project.assets.thumbnail, "assets/projects/configEcosystem/thumbnail.webp");
    assert.deepEqual(project.deployments.main, { name: "config-ecosystem", subdomain: "config" });   // the deployment slug is a public identifier and keeps its name
  });
});
