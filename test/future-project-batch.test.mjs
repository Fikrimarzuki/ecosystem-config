import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { assemble } from "../scripts/build.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { conceptShowcasePresentation, showcaseFingerprint, showcaseEligibilityFingerprint, showcasePresentationFingerprint } from "../scripts/showcases.mjs";
const config = assemble();
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
test("first future batch preserves all 47 original grants and adds only three explicit concept approvals", () => {
  assert.equal(config.showcases.length, 55); assert.equal(config.showcasePublication.length, 55); assert.equal(config.showcaseEligibility.length, 18);
  // Re-pinned 2026-11-06 for the FM Journal → FM Blog rename: only grant [38] (project blog) was re-reviewed; every other grant is byte-identical (docs/showcase-publication-approvals.md).
  assert.equal(createHash("sha256").update(JSON.stringify(config.showcasePublication.slice(0, 47))).digest("hex"), "fa24d9592ce603cf279c62a185987cf39e45b2b1ab5d846f12654bdd5fe84947");
  assert.deepEqual(config.showcases.slice(47, 50), approved.map(({ id }) => ({ kind: "concept", id })));
  assert.deepEqual(config.showcasePublication.slice(47, 50).map(x => x.id), approved.map(x => x.id));
});
for (const entry of approved) test(`exact independent approval and revocation: ${entry.title}`, () => {
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
