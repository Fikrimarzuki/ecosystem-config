# Gateway A–Z showcase approvals

`config/showcases.json` selects existing project, assessment, qualified work or
verified freelance engagement identities. Selection
does not publish content, create an ordinary project, add a catalog card, disclose
a Career relationship, or admit a project to a Universe planet.

`config/showcase-publication.json` independently grants the `az` surface. Missing
grants omit the entire showcase; invalid, stale, duplicate, orphaned or hidden
targets reject validation. Missing manifests remain backward compatible and
publish no showcases. Public handles are stable hashes of qualified identities.

The initial selection is exactly AI Session Manager, CareerLens, KodeStep,
Multiple Git Clone, Page Layr and Tinyverse. No release stage is asserted.

A4.12.7 adds only E-commerce Storefront and Node.js Data Converter, bringing the
selection to eight. Both reuse exact approved EN/ID narratives as static cases;
the storefront selects year, Nuxt.js and Pinia, and the converter selects Node.js.
The original six grants and all Career permissions remain unchanged.

Work references extend this same manifest with `kind: work`, a build-only
`employerId` and a local work `id`. The parent must be public, the child must
exist and must not be hidden. The qualified parent participates in work lookup,
deduplication, fingerprints and opaque public handles, never public attribution.
Existing project/assessment digest and handle tuples remain byte-compatible.
Work grants allow only title, description.en, description.id and selected
technologies: no year, employer, classification, assets, actions or relationship.

A4.12.9 adds only Managix Page Builder and Automotive Inventory System, bringing
the selection to ten across eight populated letters. Both are static bilingual
cases with decorative initials. Managix selects Vue.js and Nuxt.js; Automotive
selects React.js, Node.js, Express.js and MySQL. No Career grant is added.

Engagement references use `kind: engagement` and the existing canonical engagement
ID. Eligibility requires a public record with explicit `engagement: freelance`;
the collection name alone is insufficient. The classification participates in
approval evidence but never becomes a public badge or relationship. Engagement
grants allow only title, description.en, description.id and selected technologies.
An optional `publicTitle` is independently bound into the same fingerprint, along
with the selected canonical title. Only the approved override is serialized as
the public `title`; the original title is not added to public search metadata.
An absent override publishes the canonical title only under a matching explicit
title approval. Existing eight fingerprints and opaque handles are unchanged.

The two new narratives are exact owner-approved canonical values. Managix's text
expressly describes a contribution to a company product without employer naming.
Automotive's canonical identity and longer canonical title remain intact; its
override applies only to A–Z. No attribution, gallery/timeline link, source, demo,
media, extra technology, ordinary catalog card or Universe admission is granted.

## Two content authorities

Canonical `fingerprint` evidence uses the domain `gateway-showcase-approval-v1`.
Project evidence binds its public title, lifecycle, domain, deployment definitions,
public source identity and thumbnail reference. Assessment evidence binds exactly
the selected scalar/localized fields and individually selected technologies.
Object keys are recursively sorted; strings are exact UTF-8 values. Array order
is preserved except explicitly unordered field/technology selections.

Project `presentationFingerprint` evidence uses
`gateway-showcase-presentation-v1`. It binds Gateway's existing public catalog
presentation, including its approved bilingual editorial copy, engineering
evidence, exact actions, artwork URL and actual artwork SHA-256. Canonical
validation verifies canonical evidence and the detached presentation-digest
shape; Gateway recomputes and verifies the presentation digest before writing
public output. A canonical build cannot independently validate Gateway-owned
copy it does not contain. Neither authority stores a duplicate description.

Gateway resolves catalog presentation through its existing builder against the
candidate public registry. It never spreads raw canonical records into the
showcase DTO. Project grants reuse only this explicit existing-public allowlist.
Assessment grants currently permit title, year, description.en, description.id
and selected technologies; company, source, demo, images and relationships are
unsupported. AI Session Manager selects only Next.js and TypeScript.

Canonical Career grants remain separate and unchanged. Their existing approval
does not authorize A–Z, and an A–Z grant does not broaden Career publication.

## Explicit review, never automatic repair

`scripts/review-showcase.mjs` is read-only. Pass an assembled canonical config,
a candidate grant JSON and, for project reuse, Gateway evidence JSON containing
`presentation` and `artworkSha256`. Gateway's build-only `catalogPresentations`
and `artworkDigest` exports in `scripts/public-showcases.mjs` produce that evidence
from already-public presentation and actual approved image bytes.

```sh
node scripts/review-showcase.mjs config/production.json /tmp/candidate-grant.json /tmp/gateway-presentation.json
```

For an assessment, omit the presentation argument. Review exact output privately,
then apply only owner-authorized grants to the permission source. Ordinary
assembly, validation and sync never generate or update evidence. Keep draft
content and confidential client material out of public source files and history.

## Consumer rollout

A4.13.2 admits ten existing Portfolio-only personal projects to A–Z while keeping
their canonical `listing: hidden`: `courses`, `blog`, `links`, `fmStudios`,
`templates`, `watch`, `frontendLab`, `littleRoars`, `securityLab` and
`weddingVendorScraper`. The collection now has 47 memberships/publication grants.
The preceding 37 memberships and grants remain unchanged.

`config/showcase-eligibility.json` is a separate optional manifest. Each decision
names one `project` ID, `surface: az`, `listing: hidden` and its own content-bound
fingerprint. There is no global hidden-listing flag. Duplicate, orphaned, wrong
kind/surface/listing, missing or stale decisions reject validation. A missing
publication grant still omits that showcase; eligibility never publishes content
by itself. Existing snapshots/configurations without this manifest remain valid.

The `gateway-showcase-eligibility-v1` digest binds the exact project identity,
A–Z-only scope, hidden listing and the same selected canonical project facts
used for publication approval. Hidden-project publication digests additionally
bind that eligibility fingerprint and hidden listing; existing public-project
digests are unchanged. The separate presentation/artwork digest remains required
and Gateway checks the exact existing public catalog projection. Raw private
repositories, source descriptions/technologies and relationships are not new
approval payloads or public fields. Ordinary registry/Career/Universe rules do
not consult this eligibility manifest.

Generate an eligibility decision with the read-only
`scripts/review-showcase-eligibility.mjs` helper (assembled config and candidate
decision JSON); it validates the candidate and prints evidence without writing
permissions. Then use the existing `review-showcase.mjs` workflow for the
individual source/presentation publication grant. Neither normal assembly,
validation nor sync repairs/reviews approvals automatically.

Gateway now ignores the exact leading `FM ` brand for A–Z comparison/grouping
only. Published titles, stable handles and grant digests are untouched; no
canonical alias, domain or repository participates in sorting. Existing direct
showcase links with an old F-letter context continue to resolve.

A4.13.1 adds exactly the 27 public `project` identities approved in Gateway's
A4.13.0 Batch A `eligible-review` matrix, bringing A–Z membership and grants to
37. Each uses the exact reviewed existing catalog presentation and an individual
source fingerprint plus detached presentation/artwork fingerprint generated by
`reviewShowcase`. The original ten memberships, grants and public handles remain
unchanged. No hidden-listing project, Origin or pending professional, freelance
or assessment candidate is admitted. No canonical project/Career record, listing,
deployment, asset, relationship or Career permission changes. This approval is
for A–Z only; it adds no ordinary catalog entry or Universe membership.

No technology values or engineering content are added to catalog presentations.
Playdeck retains the engineering content already present in its exact reviewed
presentation. No new attribution, relationship, asset or action is inferred.

Make the compatible Gateway schema/checker/projector available before publishing
the new optional manifests in assembled canonical output. Publish source,
schemas, permissions and generated canonical artifacts together. Gateway's
production synchronization then reads remote canonical data; its checked-in
snapshot is refreshed only through the remote revision-pinned snapshot workflow.
An explicit development local-source sync is for verification, not production
snapshot provenance. Older snapshots intentionally show an empty collection.

## A4.13.9: concept-source compatibility, pending exact owner review

The consumer/validator now supports a separately selected `kind: "concept"` source. This adds no production memberships, eligibility decisions or grants. Existing concept-title grants on other surfaces do not authorize A–Z.

A concept must be an exact registered `kind: "concept"` record (never a placeholder), with nonempty EN/ID descriptions and an explicit `planned` or `in-progress` lifecycle. It requires az-only source-specific eligibility bound to that exact content, independent membership, and an individual grant selecting exactly `title`, `description.en`, `description.id`, and `status`. Both the source and exact static presentation fingerprints are required and validated. Missing locales, partial grants, stale evidence and unsupported lifecycle states fail closed. Grant removal omits the entry; eligibility removal requires removal of dependent membership/grants.

This first contract supports static details and initial-letter thumbnails only. There are no concept technology, image, repository, website, relationship, attribution or deployment permissions. Attempts to add such fields fail schema validation. Absence of an action does not establish Not Deployed.

The existing explicit `review-showcase-eligibility.mjs` and `review-showcase.mjs` helpers can review a synthetic or later owner-approved concept. Concept review requires its exact explicit presentation and no artwork digest. The helpers print evidence and never write grants. They must not be run to approve unreviewed production proposals. No such production approval was issued in A4.13.9.

Keep all existing project digest formats and the 47 production presentations unchanged. A future registered project with generic `status: active` still needs a separately reviewed public lifecycle model before displaying In Development; concept support does not reinterpret project status or change project identity to gain eligibility. Production activation remains a separate exact-content owner decision.

## A4.13.10 — first future-project batch

The owner approved Forgebox, Hearthside and Momee individually for A–Z only.
Each registered `concept` now has its own membership, source-specific eligibility
and grant generated with the existing review helpers. Every grant selects exactly
`title`, `description.en`, `description.id` and `status`, binds both source and
static presentation fingerprints, and permits no media, technologies or actions.
Forgebox is `planned`; Hearthside and Momee are `in-progress`.

The revised canonical descriptions carry the exact A–Z-approved wording. The
independent title-only Concepts grants are unchanged. Gateway retains the prior
A4.5 catalog summaries in its existing editorial publication policy, so this A–Z
approval does not rewrite the ordinary catalog. The previous 47 showcase grants
remain exact; the collection now contains 50 individually authorized entries.
Other concepts and pending candidates receive no new permission.

## A4.13.12 — approved planned-concept activation

The owner approved the exact `ohBabyGrow` and `vynote` concept registrations
(orders 50/60, planned lifecycle, no destination) and their bilingual A–Z text.
Their memberships, independent eligibility decisions and four-field grants were
created with the canonical review helpers after catalog compatibility passed.
Each source and static-presentation fingerprint validates independently; no
technology, media, action, attribution or relationship permission was added.

Gateway binds these two sources to their existing editorial catalog slots while
retaining the independently reviewed catalog descriptions, grouping, order,
search terms, handles and complete catalog checksum. A–Z uses its separately
approved narratives. Public planned thumbnails use one initial, O and V; the
previous 50 thumbnails and all existing grants remain unchanged. The local A–Z
collection now has 52 individually authorized showcases; the catalog remains 50.
Other candidates receive no new permission. Remote publication and production
synchronization remain separate, unexecuted release steps.

### Optional project lifecycle (A4.13.13)

`projects[id].lifecycle` accepts `planned` or `in-progress`, independently of
operational `status`, deployments, listing and destination. Its absence is valid.
Adding it does not authorize public content or reinterpret existing project grants.
Legacy project source/eligibility fingerprints retain their exact v1 material.

A minimal project lifecycle showcase uses an individual grant with exactly
`["title", "description.en", "description.id", "lifecycle"]`. Title selects the
canonical `name`; both descriptions must exist. It additionally requires an A–Z
membership and a source-specific eligibility decision with `lifecycle: true` and
the exact current `listing` (`public` or `hidden`). Legacy hidden eligibility
without this flag cannot authorize the new path. The new eligibility and approval
hash domains bind the exact identity, minimal bilingual/lifecycle presentation,
operational status and listing; the approval also binds eligibility evidence.
The detached presentation fingerprint binds the exact static presentation and
null artwork. Review helpers generate these fingerprints; validation never does.

The public DTO uses `status` for the authorized lifecycle, `access: {kind:"static"}`
and empty deployments. It exposes no source ID, operational status, listing,
destination, repository, technology, media, relationship or action. Changes to
withheld fields do not authorize their projection. Changing approved content,
lifecycle, operational status or listing invalidates eligibility and approval;
presentation drift invalidates the detached fingerprint. Missing grants omit the
entry; stale or inconsistent permissions fail validation. Complete revocation
removes the grant, eligibility and membership together.

`prepare-project-registration.mjs` validates an isolated registration proposal
without writing sources or issuing permissions. No new lifecycle project is
registered or authorized by A4.13.13. Catalog bindings require independent review;
A–Z lifecycle does not change catalog copy or status.

### Final project activation (A4.13.14)

The owner approved `project/quibiq`, `project/xyz` and `project/yourSpace` with
operational status active, lifecycle in-progress, listing hidden, Learning
destination, and exact bilingual narratives. Each has one independent lifecycle
eligibility decision, membership and minimal four-field A–Z grant. The real
review helpers generated eligibility, source and detached presentation evidence;
all original 52 authorizations are preserved. Local modular source now assembles
55 valid showcases. Owner-generated JSON files are preserved; new assembled
outputs were built and verified only in isolation.

Catalog publication remains independent: Quibiq is excluded. XYZ and Your Space
bind to their existing planned catalog slots with the previously approved copy,
not the new A–Z narrative or lifecycle. No Universe membership, technology,
repository, deployment, media, attribution, relationship or external action was
authorized by this activation. Publishing and production synchronization remain
separate future release steps.

### FM Journal → FM Blog rename re-review (2026-11-06)

The owner renamed project `blog` from FM Journal to **FM Blog**. The same
application kept its id, repository (`web-blog`), domain
(`blog.fikrimarzuki.work`), Paused status, Platforms destination, hidden listing
and A–Z membership. The source record changed its name, tagline (the "Developer's
Logbook" tagline is retired) and bilingual description. The thumbnail was
recaptured because the old screenshot showed the FM Journal name.

The source and presentation digests bind the name, description and artwork, so
the previous blog evidence went stale and assembly failed closed. The owner
authorized re-issuing only the blog evidence for the rename. The evidence was
generated with the existing read-only helpers against a candidate assembly:
`reviewShowcaseEligibility` for the decision, and `reviewShowcase` with Gateway
presentation evidence computed by Gateway's own `projectPublicEcosystem`,
`attachThumbnails`, `catalogPresentations` and `artworkDigest`, without
modifying web-gateway. As a check, the same procedure reproduced the previous
presentation digest exactly before the rename.

| Evidence | Before (FM Journal) | After (FM Blog) |
| --- | --- | --- |
| Eligibility | `sha256:18652580…f9c3c4` | `sha256:9f6ad0acab4c54de1eab5022a6328fd4573ebe407ba7d52564a163eb88170159` |
| Source | `sha256:4fcf83a7…fc3c4` | `sha256:290f8459f371d8b87a6aceaab54e1ddf737e55f862f867a23951c5dd60ea91b6` |
| Presentation/artwork | `sha256:3add5839…a20a7` | `sha256:1b37f3d31a8eda46945c15216d47b845a7a63d4c5e675ed00690ad2d3503dc74` |

Every other grant, decision and membership is byte-identical. The three tests
that pin earlier grant prefixes (47, 50 and 52 grants) were re-pinned with an
annotation; `test/blog-identity.test.mjs` checks the new identity and that
drift still fails closed. "Journal" / "FM Journal" is reserved for a possible
future, separate application, which needs its own id, subdomain and repository.

Thumbnail provenance (`assets/projects/blog/thumbnail.webp`):

| Field | Value |
| --- | --- |
| Source | Local production build of web-blog (`next start`), not yet deployed |
| Page title | FM Blog: Technical writing and project stories |
| Context | Signed out, no interactions, light appearance, reduced motion |
| Viewport | 1280×720, unaltered capture, WebP quality 82, 40,358 bytes |
| SHA-256 | `9d1786002209275f5d4a17da232d66d2178c36556ffe3c0211b042caf1489543` |

Before canonical is published, web-gateway needs a compatible follow-up: its
tests and fixtures still name FM Journal (for example
`tests/fixtures/az-approved-personal-presentations.json`), and
`lib/portfolio-content.ts` still has the old blog copy. Publish order is the
same as before: compatible Gateway first, then canonical.

## A4.14 — ecosystem parity (local, unpublished)

Owner-approved names, subdomains and statuses were applied; no membership or grant was added. Hearthside and Momee were
promoted from concepts to hidden project records (no planet), keeping their A–Z membership and Concepts titles removed;
Quibiq, XYZ and Your Space dropped `lifecycle` and now present their canonical `status` through the standard hidden-project
grant. 55 memberships and 55 grants remain. Eighteen grants and ten eligibility decisions were re-reviewed with the
explicit review helpers (new name, status, deployment or thumbnail bytes); the other 37 are byte-identical. Order is
preserved. FM Vaults, Zketchly, Urchin Relay and Ecosystem Assets are hidden records with no A–Z or Portfolio grant.
Thumbnails (22 refreshed/added, 1280×720 WebP ≤ 150 KB) live in `assets/projects/<id>/thumbnail.webp`; no icon changed.
