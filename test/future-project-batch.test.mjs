import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { assemble } from "../scripts/build.mjs";
import { beforeEcW9 } from "./helpers/republished-evidence.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { conceptShowcasePresentation, showcaseFingerprint, showcaseEligibilityFingerprint, showcasePresentationFingerprint } from "../scripts/showcases.mjs";
import { beforeEcW7 } from "./helpers/republished-evidence.mjs";
const current = assemble();
// The concept batch is exercised on the manifests as they were before EC-W9 promoted Forgebox, the last committed concept.
const config = beforeEcW9(current);
const approved = [
  {
    "id": "forgebox",
    "title": "Forgebox",
    "description": {
      "en": "A planned creative sandbox for building 3D worlds and designing playable game experiences.",
      "id": "Sandbox kreatif yang direncanakan untuk membangun dunia 3D dan merancang pengalaman permainan yang dapat dimainkan."
    },
    "status": "planned"
  },
  {
    "id": "hearthside",
    "title": "Hearthside",
    "description": {
      "en": "A virtual workspace in development, with customizable rooms and avatars for meeting and working together.",
      "id": "Ruang kerja virtual yang sedang dikembangkan, dengan ruangan dan avatar yang dapat disesuaikan untuk bertemu dan bekerja bersama."
    },
    "status": "in-progress"
  },
  {
    "id": "momee",
    "title": "Momee",
    "description": {
      "en": "An interactive bilingual storybook adventure in development for parents and young children.",
      "id": "Petualangan buku cerita interaktif dwibahasa yang sedang dikembangkan untuk orang tua dan anak kecil."
    },
    "status": "in-progress"
  }
];
test("first future batch keeps its three grants in place; Hearthside and Momee were promoted to projects in A4.14", () => {
  assert.equal(config.showcases.length, 73); assert.equal(config.showcasePublication.length, 73); assert.equal(config.showcaseEligibility.length, 36); // 2026-11 registry refresh: +16 projects, Vynote concept replaced by its project (59 + 16 - 1)
  // Re-pinned 2026-11-06 for the FM Journal → FM Blog rename: only grant [38] (project blog) was re-reviewed; every other grant is byte-identical (docs/showcase-publication-approvals.md).
  // EC-W5 (2026-11-22): the Ecosystem Config thumbnail was replaced with a capture of the redesigned website, which re-approved only its presentation fingerprint; restoring the prior value reproduces this pin.
  assert.equal(createHash("sha256").update(JSON.stringify(beforeEcW7(config.showcasePublication.slice(0, 47)).map(grant => grant.kind === "project" && grant.id === "configEcosystem" ? { ...grant, presentationFingerprint: "sha256:973f7ea22e4f94cf619729a0973455b5ed6b3fac8dc67229c9e0458040c0b900" } : grant))).digest("hex"), "a0f10925ed066bc62145e216ce20de90e515b1b9fcb0828dba8741d821a418f8");
  // Re-pinned 2026-11-21: the earlier value pre-dated P9C, which re-approved seven presentation fingerprints (see a4-14-parity). This value equals published revision 1689c7b, so the 2026-11 refresh left these 47 grants byte-identical.
  assert.deepEqual(config.showcases.slice(47, 50), approved.map(({ id }) => ({ kind: id === "forgebox" ? "concept" : "project", id })));
  assert.deepEqual(config.showcasePublication.slice(47, 50).map(x => x.id), approved.map(x => x.id));
});
for (const entry of approved.filter(item => item.id === "forgebox")) test(`exact independent approval and revocation: ${entry.title}`, () => {
  const source = { kind: "concept", id: entry.id }, record = config.concepts.find(x => x.id === entry.id);
  assert.deepEqual({ id: record.id, title: record.title, description: record.description, status: record.status }, entry);
  const grant = config.showcasePublication.find(x => x.kind === "concept" && x.id === entry.id), decision = config.showcaseEligibility.find(x => x.kind === "concept" && x.id === entry.id);
  assert.deepEqual(grant.fields, ["title", "description.en", "description.id", "status"]);
  assert.equal(grant.fingerprint, showcaseFingerprint(config, grant));
  assert.equal(decision.fingerprint, showcaseEligibilityFingerprint(config, decision));
  assert.equal(grant.presentationFingerprint, showcasePresentationFingerprint(source, conceptShowcasePresentation(config, source), null));
  const revoked = structuredClone(config); revoked.showcasePublication = revoked.showcasePublication.filter(x => x.id !== entry.id || x.kind !== "concept");
  assert.equal(validateConfig(revoked).ok, true);
  for (const mutate of [
    c => c.concepts.find(x => x.id === entry.id).description.en += " changed",
    c => c.concepts.find(x => x.id === entry.id).description.id += " changed",
    c => c.concepts.find(x => x.id === entry.id).status = entry.status === "planned" ? "in-progress" : "planned",
    c => c.showcaseEligibility = c.showcaseEligibility.filter(x => x.id !== entry.id),
    c => c.showcasePublication.find(x => x.id === entry.id).fields.push("technologies"),
    c => c.showcasePublication.find(x => x.id === entry.id).preview = "/unapproved.svg",
    c => c.showcasePublication.find(x => x.id === entry.id).access = { kind: "live", href: "https://unapproved.invalid" },
  ]) { const candidate = structuredClone(config); mutate(candidate); assert.equal(validateConfig(candidate).ok, false); }
});

// A4.14: promoted to hidden projects. Their A–Z grant keeps the same subject; presentation is the standard project path.
for (const [id, status, subdomain] of [["hearthside", "paused", "hearthside"], ["momee", "paused", "momee"]]) test(`promoted project keeps its independent A–Z approval and revocation: ${id}`, () => {
  assert.equal(config.concepts.some(x => x.id === id), false);
  assert.deepEqual(config.projects[id].deployments, { main: { name: subdomain, subdomain } });
  assert.equal(config.projects[id].status, status); assert.equal(config.projects[id].listing, "hidden");
  const grant = config.showcasePublication.find(x => x.kind === "project" && x.id === id), decision = config.showcaseEligibility.find(x => x.kind === "project" && x.id === id);
  assert.equal(grant.fields, undefined);
  assert.equal(grant.fingerprint, showcaseFingerprint(config, grant));
  assert.equal(decision.fingerprint, showcaseEligibilityFingerprint(config, decision));
  const revoked = structuredClone(config); revoked.showcasePublication = revoked.showcasePublication.filter(x => x.id !== id);
  assert.equal(validateConfig(revoked).ok, true);
  const drift = structuredClone(config); drift.projects[id].status = "active"; assert.equal(validateConfig(drift).ok, false);
});
