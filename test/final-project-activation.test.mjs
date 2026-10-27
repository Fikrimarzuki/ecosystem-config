import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { assemble } from "../scripts/build.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { showcaseEligibilityFingerprint, showcaseFingerprint } from "../scripts/showcases.mjs";

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
// A4.14: Quibiq, XYZ and Your Space left the lifecycle path. Their canonical status and deployment now drive A–Z,
// through the standard hidden-project grant. Narratives are byte-identical to the A4.13.14 approvals.
const current = {
  quibiq: { status: "paused", subdomain: "quibiq" }, xyz: { status: "paused", subdomain: "xyz" }, yourSpace: { status: "active", subdomain: "yourspace" },
};
test("55 grants are retained and the A4.13.14 projects are no longer lifecycle grants", () => {
  assert.equal(validateConfig(config).ok, true);
  assert.equal(config.showcases.length, 55); assert.equal(config.showcasePublication.length, 55); assert.equal(config.showcaseEligibility.length, 18);
  for (const { id } of approved) {
    assert.equal(config.showcases.filter(item => item.kind === "project" && item.id === id).length, 1);
    assert.equal(config.showcasePublication.filter(item => item.kind === "project" && item.id === id).length, 1);
  }
});
for (const record of approved) {
  test(`registration keeps the approved narrative, drops lifecycle and records its deployment: ${record.name}`, () => {
    const { id, ...facts } = record;
    assert.deepEqual(config.projects[id], { name: facts.name, status: current[id].status, listing: "hidden", destination: "learning",
      deployments: { main: { name: current[id].subdomain, subdomain: current[id].subdomain } }, description: facts.description,
      assets: { thumbnail: `assets/projects/${id}/thumbnail.webp` } });
    const grant = config.showcasePublication.find(item => item.kind === "project" && item.id === id);
    const decision = config.showcaseEligibility.find(item => item.kind === "project" && item.id === id);
    assert.equal(grant.fields, undefined); assert.equal(decision.lifecycle, undefined);
    assert.equal(decision.listing, "hidden"); assert.equal(decision.surface, "az");
    assert.equal(decision.fingerprint, showcaseEligibilityFingerprint(config, decision));
    assert.equal(grant.fingerprint, showcaseFingerprint(config, grant));
  });
  test(`source-bound approval rejects tampering and independently revokes: ${record.name}`, () => {
    const grantFor = c => c.showcasePublication.find(item => item.kind === "project" && item.id === record.id);
    for (const mutate of [
      c => c.projects[record.id].name += " drift", c => c.projects[record.id].status = current[record.id].status === "paused" ? "active" : "paused",
      c => c.projects[record.id].listing = "public", c => c.projects[record.id].deployments.main.subdomain = "drift",
      c => delete c.projects[record.id].assets, c => grantFor(c).id = "gateway", c => grantFor(c).fields = ["title"],
      c => grantFor(c).fingerprint = "sha256:" + "0".repeat(64), c => grantFor(c).presentationFingerprint = 1,
      c => c.showcases = c.showcases.filter(item => item.id !== record.id),
      c => c.showcaseEligibility = c.showcaseEligibility.filter(item => item.id !== record.id),
    ]) { const changed = structuredClone(config); mutate(changed); assert.equal(validateConfig(changed).ok, false); }
    const revoked = structuredClone(config); revoked.showcasePublication = revoked.showcasePublication.filter(item => item.id !== record.id);
    assert.equal(validateConfig(revoked).ok, true); assert.deepEqual(revoked.showcasePublication, config.showcasePublication.filter(item => item.id !== record.id));
    for (const key of ["showcases", "showcaseEligibility"]) revoked[key] = revoked[key].filter(item => item.id !== record.id);
    assert.equal(validateConfig(revoked).ok, true);
  });
}
