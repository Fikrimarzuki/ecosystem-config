# Registry refresh, 2026-11-21 — sixteen projects, websites, thumbnails and A–Z

**Local only and not published.** Nothing was staged, committed, pushed or deployed. Gateway's checked-in snapshot is still pinned
to the previously published revision and does **not** reflect this change.

Starting state: `main` at `1689c7b`, clean, 52 project records, 59 A–Z memberships and grants, 22 eligibility decisions.
Final local state: 68 project records, 74 memberships and grants, 37 eligibility decisions, 3 concepts (Vynote left Concepts).

## What changed

* **16 new hidden project records** (`listing: hidden`, so none joins a planet). Gateway's explicit Portfolio allowlist, not `listing`, publishes them.
* **Vynote was promoted from a concept to a project** with the same id. Its concept file, membership, eligibility decision and grant were removed and replaced by the project equivalents. No duplicate remains.
* **Codyssey** had no canonical record (only a Gateway fallback entry in Learning). It is now registered, keeps `learning` and keeps the owner-stated **Paused** status.
* **Hearthside** keeps its id, Paused status, hidden listing, private repository and A–Z membership. Only its thumbnail was replaced (the old one showed a stale "not deployed" notice). Its source fingerprint is unchanged; its presentation fingerprint was re-approved for the new artwork and the released link.
* No schema change. Website type is recorded with existing `tags` (`landing-page`, `web-app`, `browser-demo`, `prototype`); development status stays in `status`.

## Projects

Repository existence was checked with read-only `git ls-remote`; every repository below returns 404 anonymously, so all are recorded `private`.

| Id | Name | Category | Status | Repository | Subdomain | Website, as checked 2026-11-21 |
| --- | --- | --- | --- | --- | --- | --- |
| `quillio` | Quillio | tools | active | `web-quillio` | `quillio` | Interactive notebook landing page; `/local` is a placeholder (no editor yet) |
| `xpenz` | Xpenz | products | active | `web-xpenz` | `xpenz` | Working local-first app with landing page |
| `zevorama` | Zevorama | tools | active | `app-zevorama` | `zevorama` | Product landing page; download page says no public release |
| `havernia` | Havernia | tools | active | `extension-havernia` | `havernia` | Coming-soon product landing page (noindex); not installable |
| `buddyChamp` | BuddyChamp | learning | active | `web-buddychamp` | `buddychamp` | Public demo with fictional data; sign-in not open (noindex) |
| `beacon` | Beacon | tools | active | `tool-beacon` | `beacon` | Marketing and docs site (noindex); pre-release, self-hosted only |
| `ecosystemIdeas` | Ecosystem Ideas | products | active | `ecosystem-idea` | `ideas` | Working local-first public preview (Alchemy Aquarium); Idea Garden not built |
| `orynth` | Orynth | games | active | `game-orynth` | `orynth` | Teaser site; no public demo or download |
| `ilyst` | Ilyst | products | active | `web-ilyst` | `ilyst` | Working local-first app with landing page |
| `vynote` | Vynote | tools | active | `app-vynote` | `vynote` | Product landing page; no public installer |
| `codyssey` | Codyssey | learning | **paused** | `app-codyssey` | `codyssey` | Product landing page; no store listing |
| `platformLab` | Platform Lab | learning | active | `lab-platform` | `platform` | Learning workbench (reference drafts, catalog, local progress); simulators are not deployed |
| `kenali` | Kenali Academy | learning | active | `web-kenali` | `kenali` | Prototype shell (noindex); no lessons released |
| `keranjoo` | Keranjoo | platforms | active | none | `keranjoo` | **Hostname does not resolve (NXDOMAIN)** |
| `urusaha` | Urusaha | platforms | active | none | `urusaha` | **Hostname does not resolve (NXDOMAIN)** |
| `yunivisi` | Yunivisi | platforms | active | none | `yunivisi` | **Hostname does not resolve (NXDOMAIN)** |

Notes:

* The spelling is Keranjoo / `keranjoo`. No `keranjo` record or hostname exists.
* Keranjoo, Urusaha and Yunivisi have no GitHub repository (`ls-remote` reports "Repository not found"), so no `repository` is registered. Their owner-confirmed deployments are recorded canonically; Gateway withholds the links until DNS and deployment are verified.
* Orynth's repository `game-orynth` exists on GitHub but is not present locally, so its source was not inspected. Its description and `Godot` technology come from the live website only.
* Ecosystem Ideas' GitHub repository is `ecosystem-idea` (singular); the local folder is `ecosystem-ideas`.
* Descriptions state each project's real availability (prototype, no public installer, demo data). Technologies are canonical metadata only; Gateway does not publish them for hidden projects.

## Thumbnails

All are unaltered 1280×720 viewport captures of public pages, light appearance where the site offers it, reduced motion, encoded as WebP quality 82. Captured 2026-11-21.
No credentials, personal data or pairing codes appear. Ecosystem Config and Ecosystem Skills thumbnails are deliberately **unchanged** (their sites are being redesigned).

| Id | Captured page | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `quillio` | `https://quillio.fikrimarzuki.work/` (cover) | 15,144 | `12e8b11c…cd2332` |
| `xpenz` | `https://xpenz.fikrimarzuki.work/en` (hero, made-up demo numbers) | 34,408 | `7d4a7464…a75d` |
| `zevorama` | `https://zevorama.fikrimarzuki.work/` (hero; labelled illustration) | 36,270 | `da2088c0…f3` |
| `havernia` | `https://havernia.fikrimarzuki.work/` (hero with real side-panel capture, synthetic data) | 67,836 | `1f3cf46d…fd` |
| `buddyChamp` | `https://buddychamp.fikrimarzuki.work/en/demo/teacher` (fictional people) | 46,298 | `25e16601…66f` |
| `beacon` | `https://beacon.fikrimarzuki.work/` (hero; labelled illustration) | 40,198 | `0012ce5d…741` |
| `ecosystemIdeas` | `https://ideas.fikrimarzuki.work/` (preview notice dismissed) | 54,102 | `9d757770…c7a` |
| `orynth` | `https://orynth.fikrimarzuki.work/` (hero; "not gameplay" art) | 33,816 | `379f1aa8…096` |
| `ilyst` | `https://ilyst.fikrimarzuki.work/` (hero) | 34,544 | `25001bd7…b78` |
| `vynote` | `https://vynote.fikrimarzuki.work/` (hero) | 34,992 | `67bc3e25…d52` |
| `codyssey` | `https://codyssey.fikrimarzuki.work/en` (hero; conceptual preview) | 55,652 | `79a418a9…fc0` |
| `platformLab` | `https://platform.fikrimarzuki.work/en/` (hero; concept illustration) | 47,936 | `25793f1e…cf78` |
| `kenali` | `https://kenali.fikrimarzuki.work/` (hero) | 38,872 | `e45c50a2…525` |
| `keranjoo` | Local preview of the existing production build (host does not resolve), storefront | 53,542 | `d7b5ef1f…5e7` |
| `urusaha` | Local preview of the existing production build, welcome page | 38,528 | `2082a6f7…fa` |
| `yunivisi` | Local build of the current source into a scratch folder, landing page | 49,118 | `19eca787…a80` |
| `hearthside` | `https://hearthside.fikrimarzuki.work/workspace` (demo workspace, fictional characters) | 67,500 | `770f0011…2e3` |

Three thumbnails come from a local build because the owner-confirmed hosts do not resolve; replace them with a capture of the deployed site once it is live.
Keranjoo's product photos and Yunivisi's portraits are third-party images used in those applications' own pages.

## A–Z evidence

Generated with the existing read-only helpers (`review-showcase-eligibility`, `review-showcase`) against a candidate assembly, with Gateway's own presentation and artwork digests computed by its real build-time pipeline (no Gateway file was modified to do this).

* 16 new memberships, eligibility decisions (`az`, `hidden`) and grants (four-field project grants: `kind`, `id`, `surface`, two fingerprints). Vynote's concept entries were removed.
* Of the 58 other existing grants, exactly one changed: Hearthside's `presentationFingerprint` (released link and new artwork). The other 57 are byte-identical.
* Missing or stale evidence still fails closed; nothing in validation was relaxed.

## Publication sequence

1. Review and commit this repository (sources plus both regenerated outputs).
2. Push, so `main` carries the approved revision.
3. In Gateway, refresh the snapshot against that exact revision (`config:snapshot:refresh`) and validate.
4. Commit Gateway (policy, snapshot and tests together). Deploy only with separate owner authorization.

Until step 3, Gateway's local policy and its pinned snapshot disagree by design, and a Gateway build fails closed rather than publishing mismatched evidence.
