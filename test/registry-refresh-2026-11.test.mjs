import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { assemble } from "../scripts/build.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { showcaseEligibilityFingerprint, showcaseFingerprint } from "../scripts/showcases.mjs";

// 2026-11 registry refresh: sixteen owner-approved projects for Gateway Portfolio and A–Z. All are hidden records
// (no planet); Gateway's explicit Portfolio allowlist, not `listing`, decides Portfolio publication.
const config = assemble();
const p = config.projects;
const refreshed = {
  quillio: { name: "Quillio", sub: "quillio", dest: "tools", repo: "web-quillio" },
  xpenz: { name: "Xpenz", sub: "xpenz", dest: "products", repo: "web-xpenz" },
  zevorama: { name: "Zevorama", sub: "zevorama", dest: "tools", repo: "app-zevorama" },
  havernia: { name: "Havernia", sub: "havernia", dest: "tools", repo: "extension-havernia" },
  buddyChamp: { name: "BuddyChamp", sub: "buddychamp", dest: "learning", repo: "web-buddychamp" },
  beacon: { name: "Beacon", sub: "beacon", dest: "tools", repo: "tool-beacon" },
  ecosystemIdeas: { name: "Ecosystem Ideas", sub: "ideas", dest: "products", repo: "ecosystem-idea" },
  orynth: { name: "Orynth", sub: "orynth", dest: "games", repo: "game-orynth" },
  ilyst: { name: "Ilyst", sub: "ilyst", dest: "products", repo: "web-ilyst" },
  vynote: { name: "Vynote", sub: "vynote", dest: "tools", repo: "app-vynote" },
  codyssey: { name: "Codyssey", sub: "codyssey", dest: "learning", repo: "app-codyssey" },
  platformLab: { name: "Platform Lab", sub: "platform", dest: "learning", repo: "lab-platform" },
  kenali: { name: "Kenali Academy", sub: "kenali", dest: "learning", repo: "web-kenali" },
  // No GitHub repository exists for these three (checked 2026-11-21), so none is registered.
  keranjoo: { name: "Keranjoo", sub: "keranjoo", dest: "platforms" },
  urusaha: { name: "Urusaha", sub: "urusaha", dest: "platforms" },
  yunivisi: { name: "Yunivisi", sub: "yunivisi", dest: "platforms" },
};

test("sixteen refreshed projects: identity, category, private repository and owner-confirmed subdomain", () => {
  for (const [id, expected] of Object.entries(refreshed)) {
    const project = p[id];
    assert.equal(project.name, expected.name, id);
    assert.equal(project.listing, "hidden", id);            // no planet; Gateway allowlists Portfolio separately
    assert.equal(project.destination, expected.dest, id);
    assert.equal(project.lifecycle, undefined, id);
    assert.equal(project.deployments.main.subdomain, expected.sub, id);
    assert.equal(project.repository, expected.repo, id);
    assert.equal(project.repositoryVisibility, expected.repo ? "private" : undefined, id);
    assert.equal(project.description.en.length > 40 && project.description.id.length > 40, true, id);
    assert.equal(project.assets.thumbnail, `assets/projects/${id}/thumbnail.webp`, id);
  }
  assert.equal(p.keranjoo.deployments.main.subdomain, "keranjoo"); // never the misspelling "keranjo"
  assert.equal(Object.values(p).some(project => project.deployments?.main?.subdomain === "keranjo"), false);
  assert.equal(Object.keys(p).length, 68);
});
test("honest lifecycle: Codyssey keeps its owner-stated Paused status; Hearthside stays Paused", () => {
  assert.equal(p.codyssey.status, "paused");
  assert.equal(p.hearthside.status, "paused");
  assert.equal(p.hearthside.listing, "hidden");
  assert.equal(p.hearthside.repository, "app-hearthside");
  assert.equal(p.hearthside.deployments.main.subdomain, "hearthside");
});
test("public descriptions never overstate availability", () => {
  const text = id => `${p[id].description.en} ${p[id].description.id}`.toLowerCase();
  for (const id of ["keranjoo", "urusaha", "yunivisi"]) assert.match(p[id].description.en, /showcase/i, id);
  for (const id of Object.keys(refreshed)) assert.doesNotMatch(text(id), /production-ready|available now|available on|download now|on the app store|on google play/, id);
  assert.match(p.zevorama.description.en, /no public download/i);
  assert.match(p.vynote.description.en, /no public installer/i);
  assert.match(p.havernia.description.en, /not yet installable/i);
  assert.match(p.orynth.description.en, /no public demo or download/i);
  assert.match(p.beacon.description.en, /no hosted service/i);
});
test("Vynote was promoted from a concept without duplicates", () => {
  assert.equal(config.concepts.some(concept => concept.id === "vynote"), false);
  for (const list of [config.showcases, config.showcasePublication, config.showcaseEligibility]) {
    assert.equal(list.filter(item => item.id === "vynote").length, 1);
    assert.equal(list.find(item => item.id === "vynote").kind, "project");
  }
});
test("every refreshed project has exactly one membership, one hidden eligibility decision and one project grant", () => {
  for (const id of [...Object.keys(refreshed), "hearthside"]) {
    const grants = config.showcasePublication.filter(item => item.id === id);
    const decisions = config.showcaseEligibility.filter(item => item.id === id);
    assert.equal(config.showcases.filter(item => item.id === id).length, 1, id);
    assert.equal(grants.length, 1, id); assert.equal(decisions.length, 1, id);
    assert.deepEqual(Object.keys(grants[0]).sort(), ["fingerprint", "id", "kind", "presentationFingerprint", "surface"], id);
    assert.deepEqual(Object.keys(decisions[0]).sort(), ["fingerprint", "id", "kind", "listing", "surface"], id);
    assert.equal(decisions[0].listing, "hidden", id);
    assert.equal(decisions[0].fingerprint, showcaseEligibilityFingerprint(config, decisions[0]), id);
    assert.equal(grants[0].fingerprint, showcaseFingerprint(config, grants[0]), id);
  }
  assert.equal(new Set(config.showcases.map(item => `${item.kind}:${item.id}`)).size, 74);
  assert.equal(validateConfig(config).ok, true);
});
test("no refreshed project joined a planet and none exposes a private repository or extra public field", () => {
  const publicIds = Object.entries(p).filter(([, project]) => project.listing === "public").map(([id]) => id);
  assert.equal(publicIds.length, 32);
  for (const id of Object.keys(refreshed)) assert.equal(publicIds.includes(id), false, id);
  for (const id of Object.keys(refreshed)) assert.equal(p[id].links, undefined, id); // no extra links beyond the registered deployment
});
test("Ecosystem Config's thumbnail is the EC-W5 capture of the redesigned site; Ecosystem Skills stays deferred", () => {
  const sha = path => createHash("sha256").update(readFileSync(new URL(`../${path}`, import.meta.url))).digest("hex");
  assert.equal(sha(p.configEcosystem.assets.thumbnail), "811b9bd5067ef6eca8aa31f075dbba2ef0859c491f1d5f2c3861b6f43f8d60a6");
  assert.equal(sha(p.ecosystemSkills.assets.thumbnail), "a09a1a98162313c7dd873098f3e931191a82f0a9bd17650502bc83fab5410096");
});
