import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { assemble } from "../scripts/build.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { showcaseEligibilityFingerprint, showcaseFingerprint, showcasePresentationFingerprint, projectLifecyclePresentation } from "../scripts/showcases.mjs";

const config = assemble();
const approved = [
  { id: "quibiq", name: "Quibiq", description: {
    en: "A quiz platform in development, with a local quiz editor and solo play, plus simulated sign-in and host-led live sessions.",
    id: "Platform kuis yang sedang dikembangkan, dengan editor kuis dan permainan solo lokal, serta simulasi masuk akun dan sesi langsung yang dipandu pembawa acara.",
  } },
  { id: "xyz", name: "XYZ", description: {
    en: "A multi-skill learning platform in development, starting with interactive JavaScript challenges and local progress, with learning paths and more skill areas planned.",
    id: "Platform belajar berbagai keterampilan yang sedang dikembangkan, dimulai dengan tantangan JavaScript interaktif dan kemajuan yang disimpan secara lokal, dengan jalur belajar dan bidang keterampilan lain yang direncanakan.",
  } },
  { id: "yourSpace", name: "Your Space", description: {
    en: "A local-first study app in development, with learning plans, focus sessions and progress tracking, alongside customizable room prototypes.",
    id: "Aplikasi belajar berbasis lokal yang sedang dikembangkan, dengan rencana belajar, sesi fokus dan pelacakan kemajuan, serta prototipe ruangan yang dapat disesuaikan.",
  } },
];
test("exactly three new project approvals retain every original 52 grant byte", () => {
  assert.equal(validateConfig(config).ok, true);
  assert.equal(config.showcases.length, 55); assert.equal(config.showcasePublication.length, 55); assert.equal(config.showcaseEligibility.length, 18);
  // Re-pinned 2026-11-06 for the FM Journal → FM Blog rename: only grant [38] (project blog) was re-reviewed; every other grant is byte-identical (docs/showcase-publication-approvals.md).
  assert.equal(createHash("sha256").update(JSON.stringify(config.showcasePublication.slice(0, 52))).digest("hex"), "84866a2ead34aa9d68ce57834b70a2baf3b52857860c1cf2d342845a552b7b7a");
  assert.deepEqual(config.showcases.slice(52), approved.map(({ id }) => ({ kind: "project", id })));
});
for (const record of approved) {
  test(`exact minimal registration and independently valid lifecycle evidence: ${record.name}`, () => {
    const { id, ...facts } = record;
    assert.deepEqual(config.projects[id], { ...facts, status: "active", lifecycle: "in-progress", listing: "hidden", destination: "learning" });
    const grant = config.showcasePublication.find(item => item.kind === "project" && item.id === id);
    const decision = config.showcaseEligibility.find(item => item.kind === "project" && item.id === id);
    assert.deepEqual(grant.fields, ["title", "description.en", "description.id", "lifecycle"]);
    assert.equal(decision.lifecycle, true); assert.equal(decision.listing, "hidden"); assert.equal(decision.surface, "az");
    assert.equal(decision.fingerprint, showcaseEligibilityFingerprint(config, decision));
    assert.equal(grant.fingerprint, showcaseFingerprint(config, grant));
    assert.equal(grant.presentationFingerprint, showcasePresentationFingerprint(grant, projectLifecyclePresentation(config, grant), null));
  });
  test(`source-bound approval rejects tampering and independently revokes: ${record.name}`, () => {
    const grantFor = c => c.showcasePublication.find(item => item.kind === "project" && item.id === record.id);
    for (const mutate of [
      c => c.projects[record.id].name += " drift", c => c.projects[record.id].description.en += " drift",
      c => c.projects[record.id].description.id += " drift", c => c.projects[record.id].lifecycle = "planned",
      c => c.projects[record.id].status = "paused", c => c.projects[record.id].listing = "public",
      c => grantFor(c).id = "gateway", c => grantFor(c).fields = ["title"],
      c => grantFor(c).technologies = ["Unapproved"], c => grantFor(c).preview = "/unapproved.png",
      c => grantFor(c).presentationFingerprint = "sha256:" + "0".repeat(64),
      c => c.showcases = c.showcases.filter(item => item.id !== record.id),
      c => c.showcaseEligibility = c.showcaseEligibility.filter(item => item.id !== record.id),
    ]) { const changed = structuredClone(config); mutate(changed); assert.equal(validateConfig(changed).ok, false); }
    const revoked = structuredClone(config); revoked.showcasePublication = revoked.showcasePublication.filter(item => item.id !== record.id);
    assert.equal(validateConfig(revoked).ok, true); assert.deepEqual(revoked.showcasePublication, config.showcasePublication.filter(item => item.id !== record.id));
    for (const key of ["showcases", "showcaseEligibility"]) revoked[key] = revoked[key].filter(item => item.id !== record.id);
    assert.equal(validateConfig(revoked).ok, true);
  });
}
