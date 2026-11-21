#!/usr/bin/env node
// Build-time data for the website. Reads the committed registry artifact and the Markdown guides;
// writes only ignored, generated files under site/. It never writes the registry or its outputs.
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import MarkdownIt from "markdown-it";
import { validateConfig } from "../../scripts/validate.mjs";
import { projectSite } from "./projection.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const site = join(root, "site");
const docsRoot = join(root, "docs");
const repository = "https://github.com/Fikrimarzuki/ecosystem-config";
const generated = join(site, "src/generated");
const publicGenerated = join(site, "public/generated");

const readJson = path => JSON.parse(readFileSync(path, "utf8"));
const git = args => { try { return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch { return null; } };

// ── Registry projection ──────────────────────────────────────────────────────
const config = readJson(join(root, "dist/ecosystem.json"));
const consumers = readJson(join(root, ".github/consumers.json"));
const result = validateConfig(config);
const facts = {
  validation: { ok: result.ok, errors: result.ok ? 0 : result.errors.length },
  revision: process.env.GITHUB_SHA || git(["rev-parse", "HEAD"]),
  builtAt: new Date().toISOString(),
  schemas: readdirSync(join(root, "schema")).filter(name => name.endsWith(".schema.json")).length,
};
const data = projectSite(config, consumers, facts);

rmSync(publicGenerated, { recursive: true, force: true });
mkdirSync(join(publicGenerated, "projects"), { recursive: true });
for (const project of data.projects) {
  const path = config.projects[project.id].assets?.thumbnail;
  if (!project.thumbnail || !path) continue;
  const source = join(root, path);
  if (!existsSync(source) || !path.endsWith(".webp")) { project.thumbnail = false; continue; }
  copyFileSync(source, join(publicGenerated, "projects", `${project.id}.webp`));
}

// ── Guides ───────────────────────────────────────────────────────────────────
const sections = {
  reference: ["README", "configuration", "projects", "assets", "collections"],
  building: ["development", "site", "consumers/README", "consumers/integration", "consumers/github-actions", "consumers/project-id-migrations", "consumers/repository-rename"],
  approvals: ["career-publication-approvals", "concepts-publication-approvals", "showcase-publication-approvals"],
};
const sectionOf = slug => Object.entries(sections).find(([, slugs]) => slugs.includes(slug))?.[0] ?? "records";

function listGuides(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return ["diagnostics", "public", ".vitepress"].includes(entry.name) ? [] : listGuides(path);
    return entry.name.endsWith(".md") && !(directory === docsRoot && entry.name === "index.md") ? [path] : [];
  });
}

const githubSlug = text => text.toLowerCase().trim().replace(/<[^>]+>/g, "").replace(/[^\p{L}\p{N}\s_-]/gu, "").replace(/\s/g, "-");

function render(path) {
  const slug = relative(docsRoot, path).split(sep).join("/").replace(/\.md$/, "");
  const md = new MarkdownIt({ html: false, linkify: false, typographer: false });
  const seen = new Map(), headings = [];
  md.core.ruler.push("heading_ids", state => {
    for (let index = 0; index < state.tokens.length; index += 1) {
      const token = state.tokens[index];
      if (token.type !== "heading_open") continue;
      const text = state.tokens[index + 1].children.filter(child => ["text", "code_inline"].includes(child.type)).map(child => child.content).join("");
      const base = githubSlug(text), count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      const id = count ? `${base}-${count}` : base;
      token.attrSet("id", id);
      if (["h2", "h3"].includes(token.tag)) headings.push({ level: Number(token.tag[1]), id, text });
    }
  });
  const fallbackLink = md.renderer.rules.link_open ?? ((tokens, index, options, env, self) => self.renderToken(tokens, index, options));
  md.renderer.rules.link_open = (tokens, index, options, env, self) => {
    const token = tokens[index], href = token.attrGet("href") ?? "";
    if (/^https?:/i.test(href)) token.attrSet("rel", "noopener");
    else if (href && !/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(href)) {
      const [target, fragment] = href.split("#");
      const absolute = resolve(dirname(path), decodeURIComponent(target));
      const inDocs = relative(docsRoot, absolute).split(sep).join("/");
      const outside = inDocs.startsWith("../") || inDocs === "diagnostics" || inDocs.startsWith("diagnostics/");
      if (outside || !absolute.endsWith(".md") && !(existsSync(absolute) && statSync(absolute).isDirectory() && existsSync(join(absolute, "README.md")))) {
        const repositoryPath = relative(root, absolute).split(sep).join("/");
        if (repositoryPath.startsWith("../") || !existsSync(absolute)) throw new Error(`Invalid repository link in ${slug}.md: ${href}`);
        const kind = statSync(absolute).isDirectory() ? "tree" : "blob";
        token.attrSet("href", `${repository}/${kind}/main/${repositoryPath}${fragment ? `#${fragment}` : ""}`);
        token.attrSet("rel", "noopener");
      } else {
        const page = absolute.endsWith(".md") ? target.replace(/\.md$/, ".html") : `${target.replace(/\/?$/, "/")}README.html`;
        if (!existsSync(absolute.endsWith(".md") ? absolute : join(absolute, "README.md"))) throw new Error(`Broken guide link in ${slug}.md: ${href}`);
        token.attrSet("href", `${page}${fragment ? `#${fragment}` : ""}`);
      }
    }
    return fallbackLink(tokens, index, options, env, self);
  };
  md.renderer.rules.table_open = () => '<div class="table-scroll" tabindex="0"><table>\n';
  md.renderer.rules.table_close = () => "</table></div>\n";
  const source = readFileSync(path, "utf8");
  const html = md.render(source);
  const title = source.match(/^#\s+(.+)$/m)?.[1].replace(/`/g, "").trim() ?? slug;
  const summary = source.split("\n").map(line => line.trim()).find(line => line && !line.startsWith("#") && !line.startsWith("[") && !line.startsWith("|") && !line.startsWith("```"))?.replace(/[`*_]|\[([^\]]+)\]\([^)]+\)/g, "$1").slice(0, 220) ?? "";
  return { slug, title, summary, section: sectionOf(slug), headings, html };
}

const guides = listGuides(docsRoot).map(render).sort((a, b) => {
  const order = slug => Object.values(sections).flat().indexOf(slug);
  const [x, y] = [order(a.slug), order(b.slug)];
  return x === -1 && y === -1 ? a.title.localeCompare(b.title) : x === -1 ? 1 : y === -1 ? -1 : x - y;
});

mkdirSync(generated, { recursive: true });
writeFileSync(join(generated, "site-data.json"), JSON.stringify(data, null, 2) + "\n");
writeFileSync(join(generated, "guides.json"), JSON.stringify(guides) + "\n");
writeFileSync(join(generated, "guide-index.json"), JSON.stringify(guides.map(({ slug, title, summary, section, headings }) => ({ slug, title, summary, section, headings }))) + "\n");
console.log(`Site data: ${data.projects.length}/${data.stats.projects} projects described, ${data.consumers.length} consumers, ${guides.length} guides, validation ${facts.validation.ok ? "ok" : "FAILED"}.`);
if (!facts.validation.ok) process.exitCode = 1;
