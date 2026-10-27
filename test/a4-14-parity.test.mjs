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
  assert.equal(createHash("sha256").update(JSON.stringify(config.showcasePublication.slice(0, 55))).digest("hex"),
    "53c84b59901064a74f1b910d95124d46ee1188ecc0b8281d49b3522cd5ce58c2");
  assert.equal(config.showcasePublication.some(grant => grant.kind === "project" && grant.fields), false);
  const added = ["vaults", "zketchly", "urchinRelay", "ecosystemAssets"];
  assert.deepEqual(config.showcases.slice(55), added.map(id => ({ kind: "project", id })));
  assert.deepEqual(config.showcasePublication.slice(55).map(grant => grant.id), added);
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
