import { test } from "node:test";
import assert from "node:assert/strict";
import { production, assertValid, assertInvalid } from "./helpers.mjs";

test("A4.5 canonical metadata preserves identities, lifecycle and availability", () => {
  assert.equal(production.projects.fmMonorepo.destination, "labs");
  assert.equal(production.projects.fmMonorepo.status, "completed");
  assert.equal(production.projects.fmMonorepo.repositoryVisibility, "private");
  assert.equal(production.projects.fmMonorepo.deployments, undefined);
  assert.equal(production.projects.watch.destination, "products");
  assert.equal(production.projects.watch.status, "paused");
  assert.equal(production.projects.watch.listing, "hidden");
  assert.equal(production.projects.projects.name, "FM Projects");
  assert.equal(production.projects.projects.deployments.main.name, "projects");
  assert.equal(production.projects.ecosystemSkills.destination, "central-station");
  assert.equal(production.projects.ecosystemSkills.deployments.main.subdomain, "skills");
  assert.equal(production.projects.roadmap.repository, "web-roadmap");
  assert.equal(production.projects.developerRoadmap.repository, "developer-roadmap");
});

test("optional concept metadata is typed, legacy-compatible and does not grant publication", () => {
  // This legacy schema fixture has no independently approved A–Z concept content.
  const legacy = mutate => c => { for (const key of ["showcases", "showcasePublication", "showcaseEligibility"]) c[key] = c[key].filter(item => item.kind !== "concept"); mutate(c); };
  assertValid(legacy(c => { c.concepts[0].description = { en: "A reviewed summary", id: "Ringkasan" }; c.concepts[0].status = "planned"; c.concepts[0].destination = "tools"; }));
  assertValid(legacy(c => { for (const record of c.concepts) { delete record.description; delete record.status; delete record.destination; } }));
  for (const field of ["description", "status", "destination"]) assertInvalid(c => { c.concepts[0][field] = "invalid"; }, new RegExp(field));
  assert(production.conceptsPublication.every(grant => grant.fields.length === 1 && grant.fields[0] === "title"));
});

test("A4.7 scraper keeps its completed/private/hidden identity; EC-W9.3 adds only its website and thumbnail", () => {
  const record = production.projects.weddingVendorScraper;
  assert.equal(record.repository, "lab-wedding-vendor-scraper");
  assert.equal(record.status, "completed");
  assert.equal(record.destination, "labs");
  assert.equal(record.listing, "hidden");
  assert.equal(record.repositoryVisibility, "private");
  // The hostname's double "p" is the owner's intentional spelling; project, repository and deployment names are not renamed.
  assert.equal(record.name, "Wedding Vendor Scraper");
  assert.deepEqual(record.deployments, { main: { name: "wedding-vendor-scraper", subdomain: "wedding-vendor-scrapper" } });
  assert.deepEqual(record.assets, { thumbnail: "assets/projects/weddingVendorScraper/thumbnail.webp" });
  assert.match(record.description.en, /CSV\/JSON exports/);
  assert.match(record.description.id, /ekspor CSV\/JSON/);
  assert.equal(Object.keys(production.projects).length, 78); // EC-W9 adds eight hidden projects (fmAuth, fmMail, fmLogs, journigo, zentralynk, reelfrym, relyxee, forgebox). Before that, 70: M6.1 adds hidden Oh Baby Grow. Before that, 69 included Linstem (hidden). Earlier: 68 = 2026-11 registry refresh adds 16 hidden projects (quillio, xpenz, zevorama, havernia, buddyChamp, beacon, ecosystemIdeas, orynth, ilyst, vynote, codyssey, platformLab, kenali, keranjoo, urusaha, yunivisi). Earlier: 52 = A4.14 +5 hidden (ecosystemAssets, hearthside, momee, vaults, zketchly); + urchinRelay (hidden, Urchin Relay M0.2)
});
