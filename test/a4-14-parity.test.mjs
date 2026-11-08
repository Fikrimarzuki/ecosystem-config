import test from "node:test";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { assemble } from "../scripts/build.mjs";
import { validateConfig } from "../scripts/validate.mjs";

// A4.14: owner-approved metadata, deployment domains and thumbnails. Statuses here are the approved canonical values.
const config = assemble();
const p = config.projects;
const sub = id => p[id].deployments.main.subdomain;

test("approved names, subdomains and statuses", () => {
  const expected = {
    courses: ["FM Courses", "courses", "completed"], learning: ["FM Learning", "learn", "active"],
    ecosystemAssets: ["Ecosystem Assets", "assets", "completed"], hearthside: ["Hearthside", "hearthside", "paused"],
    momee: ["Momee", "momee", "paused"], quibiq: ["Quibiq", "quibiq", "paused"], xyz: ["XYZ", "xyz", "paused"],
    yourSpace: ["Your Space", "yourspace", "active"], watch: ["FM Watch", "watch", "paused"], roadmap: ["FM Roadmap", "roadmap", "active"],
    vaults: ["FM Vaults", "vaults", "active"], zketchly: ["Zketchly", "zketchly", "active"], urchinRelay: ["Urchin Relay", "urchinrelay", "active"],
  };
  for (const [id, [name, subdomain, status]] of Object.entries(expected)) {
    assert.deepEqual([p[id].name, sub(id), p[id].status], [name, subdomain, status], id);
  }
  assert.equal(p.ecosystemAssets.repositoryVisibility, "public");
  assert.equal(p.roadmap.repository ?? "web-roadmap", "web-roadmap");
  assert.notEqual(p.roadmap.name, p.developerRoadmap.name);
});
test("recent projects are hidden (no planet), private unless verified public, and never invent lifecycle", () => {
  for (const id of ["ecosystemAssets", "hearthside", "momee", "vaults", "zketchly", "urchinRelay"]) {
    assert.equal(p[id].listing, "hidden", id); assert.equal(p[id].lifecycle, undefined, id);
  }
  for (const id of ["quibiq", "xyz", "yourSpace"]) assert.equal(p[id].lifecycle, undefined, id);
  for (const id of ["vaults", "zketchly", "urchinRelay", "hearthside", "momee"]) assert.equal(p[id].repositoryVisibility, "private", id);
  assert.equal(p.vaults.repository, "web-vaults"); assert.equal(p.zketchly.repository, "web-zketchly"); assert.equal(p.urchinRelay.repository, "tool-urchin-relay");
  assert.equal(Object.keys(p).filter(id => id === "urchinRelay").length, 1);
});
test("no public record gained a planet: only previously public projects are public", () => {
  const publicIds = Object.entries(p).filter(([, project]) => project.listing === "public").map(([id]) => id);
  for (const id of ["ecosystemAssets", "hearthside", "momee", "vaults", "zketchly", "urchinRelay", "quibiq", "xyz", "yourSpace", "courses"]) assert.equal(publicIds.includes(id), false, id);
  assert.equal(publicIds.length, 32); // unchanged from before A4.14
});
test("Hearthside and Momee left Concepts; other concepts are untouched", () => {
  assert.deepEqual(config.concepts.map(item => item.id), ["forgebox", "comingSoon", "ohBabyGrow", "vynote"]);
  assert.deepEqual(config.conceptsPublication.map(item => item.id), ["forgebox"]);
});
test("A–Z publication grants: the original 55 are preserved exactly; A4.14B adds exactly the four approved projects", () => {
  assert.equal(config.showcases.length, 59); assert.equal(config.showcasePublication.length, 59); assert.equal(config.showcaseEligibility.length, 22);
  const sha = grants => createHash("sha256").update(JSON.stringify(grants)).digest("hex");
  // P9C: the owner approved live links for seven of the original 55, so exactly their presentation fingerprints were re-approved.
  const released = {
    courses: ["sha256:351c93f5d14cb49d15c85d05ce10f7b14059657716ed91e145dbad47aac77298", "sha256:3d026a47fc9b101901bd3dfcaa4e33fd51cc73dd22f22c96fac974c97568648f"],
    fmStudios: ["sha256:883951177e3cea292e869c9b2c6b5bad59d60c152397cdb7dce075cfd9d71ffc", "sha256:882b537d2114464cf29f16edaba4571e9d94d17043ddd811ff452b792a584ff9"],
    frontendLab: ["sha256:06d4f09115b11129d733281943b96a3d52a9727063ac7b5ceafa0b0228e19a6e", "sha256:895cab18c3af40b5bc0ad22ea55b9d9b8e9de36118dc4973be8cb683d157becc"],
    littleRoars: ["sha256:0c39a6ad846573179da58d2fab1d721fa521be3f77efbe39b900995158e841aa", "sha256:a1e48d69c559208997d34abf78668520ecbc010ae8184a4404ac9a51eff3cdf8"],
    securityLab: ["sha256:37af59c9c44c266f7a8c9509ecb3a8c3abe2386dcf5131ab33795d7e1d3b79e1", "sha256:decc82429b7486d804718fd209a09fea80cf703bd812b176d6c73da232c4638b"],
    xyz: ["sha256:16df88bcc9bf40f3ddce80d1553353571579557329290081e02a7ad30c8dfa76", "sha256:3c29f2b35e286954d1b9c61b33c642bf9a60cef4e991ed1e8cfe14c634aa477d"],
    yourSpace: ["sha256:806df87259e28703c450c940ca6f66606604057f6f1baa0adfa14b6dfb00c787", "sha256:9fc23cd97605782c8d19ff9650d77cf5b8b22a8468d9763d0b9db4d20f984e1c"],
  };
  const original = config.showcasePublication.slice(0, 55);
  assert.equal(sha(original), "6377d6fda4dd4d1d92369d1b390531eb9e156537dab343b4b2a338bece091b6f");
  for (const [id, [, approved]] of Object.entries(released)) assert.equal(original.find(grant => grant.id === id)?.presentationFingerprint, approved, id);
  // Restoring only those seven presentation values and JavaScriptia's two fingerprints reproduces the pre-P9C pin, so no other grant or field (source fingerprints included) changed.
  // JavaScriptia's canonical thumbnail was refreshed (2026-11-09), which legitimately re-approved both of its fingerprints (the source facts include the thumbnail).
  const refreshed = { javascriptia: { before: ["sha256:1a989201621af4902ba88e62049532bf255375157652dbe759eff42be5bf6c83", "sha256:16cfd4107e8dfc53035d86865570f8f097bef78cc25af755b48fbe54875e8c84"], after: ["sha256:57f906fe141778fe1e05017b1431f059c63274272220da93a4a6226319c7656a", "sha256:d408f0b0222ee842a76a9b9abc9c4718a81632aa992199872b252b7db0b1634c"] } };
  for (const [id, { after }] of Object.entries(refreshed)) { const grant = original.find(item => item.id === id); assert.deepEqual([grant?.fingerprint, grant?.presentationFingerprint], after, id); }
  const restored = original.map(grant => Object.hasOwn(refreshed, grant.id) ? { ...grant, fingerprint: refreshed[grant.id].before[0], presentationFingerprint: refreshed[grant.id].before[1] }
    : Object.hasOwn(released, grant.id) ? { ...grant, presentationFingerprint: released[grant.id][0] } : grant);
  assert.equal(sha(restored), "53c84b59901064a74f1b910d95124d46ee1188ecc0b8281d49b3522cd5ce58c2");
  for (const grant of config.showcasePublication.filter(grant => grant.kind === "project" && !grant.fields)) {
    assert.deepEqual(Object.keys(grant).sort(), ["fingerprint", "id", "kind", "presentationFingerprint", "surface"], `${grant.id} carries no extra (link) fields`);
  }
  assert.equal(config.showcasePublication.some(grant => grant.kind === "project" && grant.fields), false);
  const added = ["vaults", "zketchly", "urchinRelay", "ecosystemAssets"];
  assert.deepEqual(config.showcases.slice(55), added.map(id => ({ kind: "project", id })));
  assert.deepEqual(config.showcasePublication.slice(55).map(grant => grant.id), added);
  // P9C: the four A4.14B grants keep their source fingerprints; their presentation fingerprints are the approved live-link ones.
  assert.deepEqual(config.showcasePublication.slice(55).map(grant => [grant.fingerprint, grant.presentationFingerprint]), [
    ["sha256:fc50e93819b76b331b7445f3e73909362cb1ce70e7bb207209642ef290cf5968", "sha256:8f3e7b1aaf99883d7e6b37c8b36e910273c4ed0d10d96e6eee162ea0c399993c"],
    ["sha256:563c4440022802a73d90cf5802fd634731cbb6172a2d21f6067bb266d911ea28", "sha256:0498e1ca326c5c6f14062cc5c17d0000929b1a15551c49e451b9901bec2d3423"],
    ["sha256:68a3f06b8f6145c953d8518a8a9441a7a5c3e714ba7ec8853b53bd27f4c791d1", "sha256:b0a7e56d6cadf62aa79eb34dfd99aeb5217a46c7345094c57c5f6fe5e023944a"],
    ["sha256:44fabe58fe807a710c1c345f29e80f8af34862ab597232e4fb091fe142e1fd02", "sha256:ac419d97b5c996e076a4be073ef2f63c4200d82268a773f7ac0edccea30e848c"],
  ]);
  assert.deepEqual(config.showcaseEligibility.slice(18).map(item => [item.id, item.surface, item.listing]), added.map(id => [id, "az", "hidden"]));
  for (const id of added) assert.equal(config.projects[id].listing, "hidden", id);
  assert.equal(validateConfig(config).ok, true);
});
test("every thumbnail is a 1280x720 WebP of at most 150 KB", () => {
  const ids = Object.entries(p).filter(([, project]) => project.assets?.thumbnail).map(([id]) => id);
  for (const id of ["courses", "cv", "ecosystemAssets", "ecosystemSkills", "frontendLab", "games", "gateway", "hearthside", "learning", "littleRoars", "momee", "playnest", "quibiq", "roadmap", "securityLab", "support", "watch", "xyz", "yourSpace", "vaults", "zketchly", "urchinRelay"]) {
    assert(ids.includes(id), `${id} has a thumbnail`);
  }
  for (const id of ids) {
    const bytes = readFileSync(new URL(`../${p[id].assets.thumbnail}`, import.meta.url));
    assert(bytes.length <= 150 * 1024, `${id} ${bytes.length}`);
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF"); assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
    const chunk = bytes.toString("ascii", 12, 16);
    const [w, h] = chunk === "VP8 " ? [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff]
      : chunk === "VP8X" ? [bytes.readUIntLE(24, 3) + 1, bytes.readUIntLE(27, 3) + 1] : [0, 0];
    assert.deepEqual([w, h], [1280, 720], id);
  }
});
test("thumbnail folders contain only the registered files", () => {
  for (const id of readdirSync(new URL("../assets/projects", import.meta.url))) {
    for (const file of readdirSync(new URL(`../assets/projects/${id}`, import.meta.url))) assert.match(file, /^(thumbnail\.webp|icon\.png)$/, `${id}/${file}`);
  }
});
