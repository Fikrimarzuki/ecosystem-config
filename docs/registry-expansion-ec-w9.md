# Registry expansion EC-W9 (2026-11-28)

[Documentation index](README.md)

The owner approved ten implemented projects for public discoverability in Gateway Projects and the A–Z Showcase. All ten are `listing: hidden`, so none joins a planet. Repositories stay private and unlinked, and no technologies are shown for them.

| Project | Category | Website | Record |
| --- | --- | --- | --- |
| FM Auth | platforms | fm-auth.fikrimarzuki.work | new |
| FM Mail | tools | fm-mail.fikrimarzuki.work | new |
| FM Logs | tools | fm-logs.fikrimarzuki.work | new |
| Journigo | products | journigo.fikrimarzuki.work | new |
| Zentralynk | platforms | zentralynk.fikrimarzuki.work | new |
| Reelfrym | tools | reelfrym.fikrimarzuki.work | new |
| Relyxee | products | relyxee.fikrimarzuki.work | new |
| Forgebox | tools | forgebox.fikrimarzuki.work | promoted from Concepts |
| Oh Baby Grow | products | ohbabygrow.fikrimarzuki.work | existing; deployment, summary and thumbnail added |
| Linstem | platforms | linstem.fikrimarzuki.work | existing; unchanged |

Every status is `active`: none has been declared completed or paused. Each website answered over HTTPS on 2026-11-28, and its main application route loaded.

## Other changes

* Forgebox's concept record, title-only Concepts grant and concept A–Z entry were retired.
* Kenali Academy's description now says that two early-childhood games are playable. Only its presentation fingerprint was re-approved.

## Thumbnails

Nine are new 1280×720 WebP captures of the public landing pages listed above, taken on 2026-11-28. They show only each site's own illustrative sample content. Journigo's hero photograph is third-party stock that the application credits in its repository. Linstem keeps its existing capture.

## Evidence

Eligibility decisions and grants were produced with `scripts/review-showcase-eligibility.mjs` and `scripts/review-showcase.mjs`, using Gateway's own catalog presentation and artwork digests. Before writing, that pipeline reproduced every existing project grant except Kenali's intended change.

Totals: 78 projects, 82 A–Z memberships and grants, 45 eligibility decisions, 0 Concepts title grants.

## Publication order

1. Review, commit and push this repository.
2. In Gateway, refresh the pinned snapshot against that exact published revision, check it, run the targeted tests, then commit and push.

Gateway's policy change must ship together with this revision: a Gateway build that reads the new registry without it fails closed, and the previous deployment stays live.
