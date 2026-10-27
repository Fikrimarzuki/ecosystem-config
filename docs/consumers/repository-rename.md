# Repository rename consumer audit

Verified on 2026-10-31. The canonical GitHub repository is
[`Fikrimarzuki/ecosystem-config`](https://github.com/Fikrimarzuki/ecosystem-config).

All 19 registered consumers now use the renamed repository directly. Seventeen
needed source URL changes; `web-links` and `web-templates` already used the new URL.
`learn-kodestep` and `app-pagelayr` were cloned into the workspace to include them.

## Sources and verification

| Consumer | Remote artifact | Passing checks |
| --- | --- | --- |
| `web-gateway` | `config/production.json` | Live production config/asset sync, snapshot validation and 239 contract tests |
| `web-cv` | `config/production.json` | Live config/asset sync and all 426 unit tests |
| `web-support` | `dist/ecosystem.json` | Live config/thumbnail sync and all 106 unit tests |
| `web-tools` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `web-devtools` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `web-roadmap` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `web-projects` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `game-tinyverse` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `web-learning` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `app-fm-studios` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `app-hearthside` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `web-playnest` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `learn-kodestep` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `web-games` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `game-javascriptia` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `app-pagelayr` | `config/production.json` | Live sync and consumer contract tests |
| `app-playdeck` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `web-links` | `dist/ecosystem.json` | Live sync and consumer contract tests |
| `web-templates` | `dist/ecosystem.json` | Live sync and consumer contract tests |

The live syncs used each consumer's actual updated script and fetched current
remote data. The raw registry endpoint returned HTTP 200. Gateway's revision
lookup also uses the renamed GitHub API path, and its snapshot was refreshed
through the existing remote-only command. Its source revision is
`a8e170ebe88b5cfc312cf701876713a49d70b01c`. CV's committed snapshot was also
refreshed through its sync command; its Ecosystem Config card now resolves the
canonical documentation deployment at `https://config.fikrimarzuki.work`.

Local checkout examples now use `../ecosystem-config`. The related asset
repository's current integration instructions and relative repository link were
updated as well. Historical milestone evidence retains the names used when it
was recorded.

## Stable identifiers

The project ID `configEcosystem`, deployment name `config-ecosystem`, asset
paths under `assets/projects/configEcosystem/`, and schema `$id` values under
`https://config-ecosystem.invalid/` remain compatible. They are identifiers,
not stale GitHub fetch URLs. Vendored schemas remain unchanged.

The snapshot refresh reads existing canonical publication grants; it does not
create or modify grants. Updated tests explicitly construct missing-grant legacy
fixtures and account for unavailable optional artwork. The CLI fixture also
copies its thumbnail module and resolves its executable path through macOS
temporary-directory symlinks.

These are local working-tree changes. No commits, pushes, deployments,
notifications, or automation settings were changed.

## Addendum (2026-11-01, A4.2): committed state of the consumers

Read from each repository's Git `HEAD` and working tree; no consumer was modified. The 19 audited consumers were later joined by `web-watch` (already on the new URL) and, in the consumer registry, by five repositories that already used the new URL in their committed sync scripts: `game-little-roars`, `lab-frontend`, `lab-security`, `web-blog` and `web-courses`.

* **Committed on the new URL:** `web-gateway`, `web-support`, `web-links`, `web-templates`, `web-watch`, `web-blog`, `web-courses`, `lab-frontend`, `lab-security`, `game-little-roars`.
* **Still on `config-ecosystem` in committed `HEAD`** (the new URL exists only as an uncommitted working-tree change): `web-cv`, `web-tools`, `web-devtools`, `web-roadmap`, `web-projects`, `game-tinyverse`, `web-learning`, `app-fm-studios`, `app-hearthside`, `web-playnest`, `learn-kodestep`, `web-games`, `game-javascriptia`, `app-pagelayr` and `app-playdeck`. They keep working only while GitHub redirects the old name (the old raw URL answered HTTP 200 on 2026-11-01).

The earlier statement that every consumer "now uses the renamed repository directly" therefore describes working trees, not committed code, for those fifteen.
