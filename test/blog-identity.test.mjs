import test from "node:test";
import assert from "node:assert/strict";
import { assemble } from "../scripts/build.mjs";
import { validateConfig } from "../scripts/validate.mjs";
import { showcaseEligibilityFingerprint, showcaseFingerprint } from "../scripts/showcases.mjs";

// FM Journal was renamed FM Blog on 2026-11-06 (docs/showcase-publication-approvals.md). The id, domain and
// repository did not change. "Journal" / "FM Journal" is reserved for a possible future, separate application.
const config = assemble();
const blog = config.projects.blog;
const isBlog = item => item.kind === "project" && item.id === "blog";

test("blog is FM Blog on blog.<domain> from web-blog, still hidden", () => {
  assert.equal(validateConfig(config).ok, true);
  assert.equal(blog.name, "FM Blog");
  assert.equal(blog.repository, "web-blog");
  assert.deepEqual(blog.deployments, { main: { name: "blog", subdomain: "blog" } });
  assert.equal(blog.listing, "hidden");
  assert.doesNotMatch(JSON.stringify(blog), /FM Journal|Logbook|Buku Log/);
});

test("no other project claims the blog's identity or the reserved Journal identity", () => {
  for (const [id, project] of Object.entries(config.projects)) {
    if (id === "blog") continue;
    assert.notEqual(project.repository, "web-blog", id);
    assert.doesNotMatch(project.name, /^(FM )?(Blog|Journal)$/i, id);
    for (const deployment of Object.values(project.deployments ?? {})) {
      assert.notEqual(deployment.subdomain, "blog", id);
      assert.notEqual(deployment.name, "blog", id);
    }
  }
  assert.equal(config.projects.journal, undefined);
});

test("the re-reviewed blog A–Z evidence is current and still fails closed on drift", () => {
  const decision = config.showcaseEligibility.find(isBlog);
  const grant = config.showcasePublication.find(isBlog);
  assert.equal(decision.fingerprint, showcaseEligibilityFingerprint(config, decision));
  assert.equal(grant.fingerprint, showcaseFingerprint(config, grant));
  const drifted = structuredClone(config);
  drifted.projects.blog.name = "FM Journal";
  assert.equal(validateConfig(drifted).ok, false);
});
