import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { assemble } from "../scripts/build.mjs";
import { consumerArtifact, deploymentUrl, projectSite, withheldDeploymentIds } from "../site/scripts/projection.mjs";

// The website is a consumer of the registry. Its build-time projection must never widen publication.
const config = assemble();
const consumers = JSON.parse(readFileSync(new URL("../.github/consumers.json", import.meta.url), "utf8"));
const site = projectSite(config, consumers);
const serialized = JSON.stringify(site);
const granted = new Set(config.showcasePublication.filter(grant => grant.kind === "project").map(grant => grant.id));

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
  const privateNames = new Set(Object.values(config.projects).filter(project => project.repositoryVisibility === "private").map(project => project.repository));
  for (const consumer of consumers.consumers) privateNames.add(consumer.repository);
  for (const name of privateNames) assert(!serialized.includes(`"${name}"`) && !serialized.includes(`/${name}`), name);
  for (const project of site.projects) {
    assert.equal(Object.hasOwn(project, "repository"), false);
    if (project.repositoryUrl) assert.equal(config.projects[project.id].repositoryVisibility, "public", project.id);
  }
});

test("technologies only for publicly listed projects; withheld website links stay unpublished", () => {
  for (const project of site.projects) {
    if (project.technologies) assert.equal(config.projects[project.id].listing, "public", project.id);
    if (withheldDeploymentIds.includes(project.id)) assert.deepEqual(project.website, [], project.id);
  }
  for (const id of ["keranjoo", "urusaha", "yunivisi", "momee", "quibiq"]) {
    const project = site.projects.find(item => item.id === id);
    if (project) { assert.deepEqual(project.website, [], id); assert.equal(project.websiteWithheld, true, id); }
  }
  assert.deepEqual(site.projects.find(project => project.id === "hearthside")?.website, [{ key: "main", url: "https://hearthside.fikrimarzuki.work" }]);
});

test("deployment URLs follow the consumer contract", () => {
  assert.equal(deploymentUrl(config, { name: "x", subdomain: "foo" }), `https://foo.${config.domains.primary}`);
  assert.equal(deploymentUrl(config, { name: "x", subdomain: null }), `https://${config.domains.primary}`);
  assert.equal(deploymentUrl(config, { name: "x", url: "https://example.github.io/lab/" }), "https://example.github.io/lab/");
});

test("consumers map to registry projects and their documented artifact", () => {
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
