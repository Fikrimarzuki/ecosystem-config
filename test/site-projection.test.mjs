import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { assemble } from "../scripts/build.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { approvedCaseArtwork, caseArtworkSources, consumerArtifact, deploymentUrl, projectSite, websiteDecisions } from "../site/scripts/projection.mjs";

// The website is a consumer of the registry. Its build-time projection must never widen publication.
const config = assemble();
const consumers = JSON.parse(readFileSync(new URL("../.github/consumers.json", import.meta.url), "utf8"));
const site = projectSite(config, consumers);
const withheld = [...websiteDecisions(config)].filter(([, action]) => action === "withheld").map(([id]) => id).sort();
const serialized = JSON.stringify(site);
const granted = new Set(config.showcasePublication.filter(grant => grant.kind === "project").map(grant => grant.id));

// Repository names that must never appear: every private registry repository, and every consumer repository the registry does NOT
// list as public. A consumer repository that the registry itself lists as public may appear only as its project's sanctioned
// `repositoryUrl` (the projection builds it from public visibility alone); any other occurrence still fails.
const registryOwner = repository => Object.values(config.projects).find(project => project.repository === repository);
const privateRepositoryNames = () => {
  const names = new Set(Object.values(config.projects).filter(project => project.repositoryVisibility === "private").map(project => project.repository));
  for (const consumer of consumers.consumers) if (registryOwner(consumer.repository)?.repositoryVisibility !== "public") names.add(consumer.repository);
  return names;
};
const publicConsumerNames = () => consumers.consumers.map(consumer => consumer.repository).filter(repository => registryOwner(repository)?.repositoryVisibility === "public");
const withoutSanctionedUrls = (text, projects) => projects.reduce((rest, project) => (project.repositoryUrl ? rest.replaceAll(project.repositoryUrl, "") : rest), text);

test("only publicly listed or owner-approved showcase projects are described", () => {
  for (const project of site.projects) assert(config.projects[project.id].listing === "public" || granted.has(project.id), project.id);
  for (const [id, project] of Object.entries(config.projects)) {
    const described = site.projects.some(item => item.id === id);
    assert.equal(described, project.listing === "public" || granted.has(id), id);
  }
  assert.equal(site.stats.projects, Object.keys(config.projects).length);
  assert.equal(site.stats.described + site.stats.notDescribed, site.stats.projects);
});

test("no private repository or consumer repository name is emitted", () => {
  for (const name of privateRepositoryNames()) assert(!serialized.includes(`"${name}"`) && !serialized.includes(`/${name}`), name);
  const scrubbed = withoutSanctionedUrls(serialized, site.projects);
  for (const name of publicConsumerNames()) assert(!scrubbed.includes(`"${name}"`) && !scrubbed.includes(`/${name}`), `${name}: only its sanctioned repositoryUrl may appear`);
  for (const project of site.projects) {
    assert.equal(Object.hasOwn(project, "repository"), false);
    if (project.repositoryUrl) assert.equal(config.projects[project.id].repositoryVisibility, "public", project.id);
  }
});

test("technologies only for publicly listed projects; withheld website links stay unpublished", () => {
  for (const project of site.projects) {
    if (project.technologies) assert.equal(config.projects[project.id].listing, "public", project.id);
    if (withheld.includes(project.id)) assert.deepEqual(project.website, [], project.id);
    else if (config.projects[project.id].deployments) assert(project.website.length > 0, `${project.id}: registered link is offered`);
    assert.equal(project.websiteAction === undefined, project.website.length === 0, `${project.id}: an action exactly when linked`);
  }
  // Released with the owner's approval (EC-W9.2), including Paused projects with private repositories.
  for (const [id, action] of [["momee", "demo"], ["quibiq", "demo"], ["watch", "app"]]) {
    const project = site.projects.find(item => item.id === id);
    assert.deepEqual(project.website, [{ key: "main", url: `https://${id}.fikrimarzuki.work` }], id);
    assert.equal(project.websiteAction, action, id);
    assert.equal(project.websiteWithheld, false, id); assert.equal(project.repositoryUrl, undefined, id);
  }
  // Released once their hostnames resolved (EC-W9.1).
  for (const id of ["keranjoo", "urusaha", "yunivisi"]) {
    const project = site.projects.find(item => item.id === id);
    assert.deepEqual(project.website, [{ key: "main", url: `https://${id}.fikrimarzuki.work` }], id);
    assert.equal(project.websiteAction, "demo", id);
  }
});

test("link decisions: owner-withheld set is exact, and a registry without decisions never releases links", () => {
  // EC-W9.3: nothing is withheld any more; the mechanism stays, exercised below on a copy.
  assert.deepEqual(withheld, []);
  const held = structuredClone(config); held.websiteLinks.find(entry => entry.id === "momee").action = "withheld";
  const heldMomee = projectSite(held, consumers).projects.find(project => project.id === "momee");
  assert.deepEqual([heldMomee.website, heldMomee.websiteWithheld], [[], true]);
  const scraper = site.projects.find(project => project.id === "weddingVendorScraper");
  assert.deepEqual(scraper.website, [{ key: "main", url: "https://wedding-vendor-scrapper.fikrimarzuki.work" }]);
  assert.deepEqual([scraper.websiteAction, scraper.category, scraper.repositoryUrl, scraper.technologies], ["website", "labs", undefined, undefined]);
  assert(!JSON.stringify(site).includes("lab-wedding-vendor-scraper"));
  const missing = structuredClone(config); delete missing.websiteLinks;
  assert.throws(() => websiteDecisions(missing), /websiteLinks/);
  for (const mutate of [
    c => c.websiteLinks.push({ id: "momee", action: "app" }),
    c => c.websiteLinks.push({ id: "notAProject", action: "website" }),
    c => delete c.projects.forgebox.deployments,
  ]) { const candidate = structuredClone(config); mutate(candidate); assert.equal(validateConfig(candidate).ok, false); }
});

test("deployment URLs follow the consumer contract", () => {
  assert.equal(deploymentUrl(config, { name: "x", subdomain: "foo" }), `https://foo.${config.domains.primary}`);
  assert.equal(deploymentUrl(config, { name: "x", subdomain: null }), `https://${config.domains.primary}`);
  assert.equal(deploymentUrl(config, { name: "x", url: "https://example.github.io/lab/" }), "https://example.github.io/lab/");
});

test("consumers map to registry projects and their documented artifact", () => {
  // EC-W9 granted Oh Baby Grow A–Z, so its consumer entry now maps to a described project like every other one.
  assert(site.consumers.some(consumer => consumer.projectId === "ohBabyGrow"));
  assert.equal(site.consumers.length, consumers.consumers.length);
  assert.equal(consumerArtifact({ notes: ["Syncs config/production.json; unlike dist/ecosystem.json readers…"] }), "config/production.json");
  assert.equal(site.consumers.find(consumer => consumer.projectId === "gateway").artifact, "config/production.json");
  for (const consumer of site.consumers) assert(site.projects.some(project => project.id === consumer.projectId), consumer.projectId);
});

test("the website reads the registry; it never becomes a registry endpoint", () => {
  assert(!existsSync(new URL("../site/public/ecosystem.json", import.meta.url)));
  assert(!existsSync(new URL("../site/public/config", import.meta.url)));
  const postbuild = readFileSync(new URL("../site/scripts/postbuild.mjs", import.meta.url), "utf8");
  assert(!/ecosystem\.json|production\.json/.test(postbuild), "postbuild must not emit registry copies");
});

test("A–Z Showcase: exactly the entries with membership and grant, granted fields only, no Career attribution", () => {
  const key = entry => JSON.stringify([entry.kind, entry.kind === "work" ? entry.employerId : null, entry.id]);
  const granted = new Set(config.showcasePublication.map(key));
  assert.equal(site.showcases.length, config.showcases.filter(member => granted.has(key(member))).length);
  assert.equal(new Set(site.showcases.map(entry => entry.handle)).size, site.showcases.length);
  for (const entry of site.showcases) {
    assert(["project", "concept", "case"].includes(entry.kind), entry.kind);
    if (entry.kind === "case") {
      assert.deepEqual(Object.keys(entry).filter(field => !["handle", "kind", "title", "year", "description", "technologies", "thumbnail"].includes(field)), [], entry.title);
    }
    if (entry.kind === "project") assert(site.projects.some(project => project.id === entry.projectId), entry.projectId);
  }
  const careerIds = [...config.career.assessments, ...config.career.freelance, ...config.career.experience.flatMap(record => [record, ...(record.work ?? [])])].map(record => record.id);
  const showcaseText = JSON.stringify(site.showcases);
  for (const id of careerIds) assert(!showcaseText.includes(`"${id}"`), `career id ${id} is not published`);
  assert(!/employer|engagement|assessment|"work"/i.test(showcaseText.replace(/"description":\{[^}]*\}/g, "")), "no Career classification is published");
  // The engagement uses its approved public title override only.
  assert(site.showcases.some(entry => entry.title === "Automotive Inventory System"));
  assert(!showcaseText.includes("Automotive Spare Parts Inventory Management System"));
  // Revoking a grant removes the entry; a membership alone never publishes.
  const revoked = structuredClone(config); revoked.showcasePublication = revoked.showcasePublication.filter(grant => grant.id !== "forgebox");
  assert(!projectSite(revoked, consumers).showcases.some(entry => entry.title === "Forgebox"));
});

test("A–Z case-study artwork: only the approved files, under opaque handles", () => {
  assert.deepEqual(site.showcases.filter(entry => entry.kind === "case" && entry.thumbnail).map(entry => entry.title).sort(),
    ["AI Session Manager", "Automotive Inventory System", "Managix Page Builder"]);
  const sources = caseArtworkSources(config);
  assert.equal(sources.length, approvedCaseArtwork.size);
  for (const { path, sha256 } of sources) assert.equal(createHash("sha256").update(readFileSync(new URL(`../${path}`, import.meta.url))).digest("hex"), sha256, path);
  // A record with artwork but no image approval stays a monogram, and no registry path is published.
  assert(!JSON.stringify(site).includes("assets/career/"));
  const added = structuredClone(config);
  added.career.assessments.find(record => record.id === "evermosFrontend").assets = { thumbnail: "assets/career/assessments/evermosFrontend/thumbnail.webp" };
  assert.deepEqual(caseArtworkSources(added), sources);
  // The build withholds a file that no longer matches (facts list only verified handles).
  assert(projectSite(config, consumers, { caseArtwork: new Set() }).showcases.every(entry => !entry.thumbnail));
});

test("JSON viewer: every project record is exactly the public projection, with no withheld field", () => {
  // Guard, not a second allowlist: the viewer serialises the projection's own object, so this only proves the projection's output.
  const allowed = new Set(["id", "name", "status", "category", "visibility", "tagline", "description", "technologies", "website", "websiteAction", "websiteWithheld",
    "repositoryUrl", "thumbnail", "sharedAssets", "related", "consumer", "azShowcase"]);
  const privateNames = privateRepositoryNames();
  for (const project of site.projects) {
    const json = JSON.stringify(project, null, 2), compact = JSON.stringify(project);
    assert.deepEqual(JSON.parse(json), JSON.parse(compact), `${project.id}: formatted and compact are the same record`);
    for (const key of Object.keys(project)) assert(allowed.has(key), `${project.id}: unexpected field ${key}`);
    for (const name of privateNames) assert(!json.includes(name), `${project.id}: private repository ${name}`);
    for (const name of publicConsumerNames()) assert(!withoutSanctionedUrls(json, [project]).includes(name), `${project.id}: public consumer repository ${name} outside its sanctioned repositoryUrl`);
    assert(!/repository"|repositoryVisibility|\/Users\/|\.env|secret|password|token/i.test(json.replace(/"description":\s*\{[^}]*\}/g, "")), `${project.id}: internal field or secret-like text`);
    const record = config.projects[project.id];
    if (project.technologies) assert.equal(record.listing, "public", `${project.id}: technologies only for publicly listed projects`);
    if (withheld.includes(project.id)) for (const deployment of Object.values(record.deployments ?? {})) assert(!json.includes(deploymentUrl(config, deployment)), `${project.id}: withheld link`);
    for (const site_ of project.website) assert(Object.values(record.deployments ?? {}).some(deployment => deploymentUrl(config, deployment) === site_.url), `${project.id}: link is a registered deployment`);
  }
  // Records that are not described never reach the viewer's data.
  assert(!JSON.stringify(site).includes('"wedding"'));
});

test("JSON viewer source adds no field list or transform of its own", () => {
  const source = readFileSync(new URL("../site/src/components/JsonViewer.tsx", import.meta.url), "utf8");
  assert(/JSON\.stringify\(project, null,/.test(source), "serialises the projection object directly");
  assert(!/pick|omit|delete |allowlist|allowed\s*=|config\/|dist\/ecosystem/.test(source.replace(/\/\/.*$/gm, "")), "no filtering or direct registry access in the viewer");
});
