# Ecosystem Config

Central configuration and project registry for my personal developer ecosystem. Formerly named `config-ecosystem`.

[Documentation website](https://config.fikrimarzuki.work/) · [Registry JSON](dist/ecosystem.json) · [Related projects](#related-projects)

This repository is the **single source of truth** for shared public facts: projects, repositories, deployments, domains, profile, assets, career records, early work and future concepts. Applications read this registry at build time so shared values can be updated in one place. Each application owns its presentation.

## What it is, and what it is not

* **A data repository, not a package.** Consumers fetch the committed JSON over HTTPS (GitHub raw URLs) when they build. There is nothing to install as a dependency and no runtime service.
* **Owns:** canonical facts and their JSON Schemas, validation, the two generated registry files, shared asset files, and the consumer registry in [.github/consumers.json](.github/consumers.json).
* **Does not own:** presentation (layout, copy, ordering, previews), consumers' sync code, or their deployment. It never deploys another project: notifications to consumers are proposed in the docs but not active.

## Quick start

Use Node.js 24 and the pnpm version declared in [package.json](package.json) (`corepack enable` makes the declared version the one that runs).

```sh
pnpm install
pnpm build      # assemble the sources into both committed JSON outputs
pnpm validate   # validate the assembled configuration
pnpm test       # schema, semantic, source-tree and contract tests
```

Documentation site (VitePress) while editing the guides: `pnpm docs:dev`, then `pnpm docs:build` and `pnpm docs:preview` to check the production output.

## Repository structure

| Path | Contents |
| --- | --- |
| [config/](config/) | Sources (below) and the generated [config/production.json](config/production.json) |
| [dist/ecosystem.json](dist/ecosystem.json) | The generated registry for new consumers; byte-identical to `config/production.json` |
| [schema/](schema/) | JSON Schemas (draft 2020-12) for each source type and for the assembled output |
| [scripts/](scripts/) | `build.mjs` and `validate.mjs`, plus the collection helpers and the publication fingerprint and review tools |
| [test/](test/) | Node's built-in test runner: schema, semantic, source-tree and contract checks |
| [assets/](assets/) | Shared profile, ecosystem and per-project files (images and the resume PDF) |
| [docs/](docs/) | Reference, integration and publication guides, and the VitePress site |
| [.github/](.github/) | The validation and documentation workflows, and the consumer registry |

## Where to edit

| Content | Source |
| --- | --- |
| Domains, profile and ecosystem identity | [config/global.json](config/global.json) |
| Projects, repositories and deployments | [config/projects/](config/projects/) |
| Employment, professional projects and assessments | [config/career/](config/career/) |
| Curated early-development work | [config/origins/](config/origins/) |
| Future project titles | [config/concepts/](config/concepts/) |
| Shared files | [assets/](assets/) |
| Career publication grants | [config/career-publication.json](config/career-publication.json) |
| Concepts title publication grants | [config/concepts-publication.json](config/concepts-publication.json) |

Collection sources (projects, career, origins, concepts) are JSON files, one per record, whose `id` matches the file name. Assets are PNG, JPEG, WebP, SVG, AVIF or GIF images and a PDF resume, referenced by repository-root-relative paths.

## Validation and changing the configuration

`pnpm build` rejects misplaced or malformed sources, checks every source against its schema, and runs the cross-record rules (unique hostnames and deployment names, relationships, ordering, local asset paths and publication evidence). `pnpm validate` checks the assembled result, and `pnpm test` covers all of it.

To change anything:

1. Edit the source files, never the generated ones.
2. Run `pnpm build`, `pnpm validate` and `pnpm test`.
3. Commit the sources **together with both regenerated outputs**.

CI repeats this on every push and pull request to `main`, and fails if the committed outputs differ from what `pnpm build` produces ([validation workflow](.github/workflows/validate.yml)). Documentation changes are built, link-checked and, on `main`, published to GitHub Pages by the [documentation workflow](.github/workflows/docs.yml).

## Using the registry

New consumers should read [dist/ecosystem.json](dist/ecosystem.json); [config/production.json](config/production.json) remains for existing consumers. The raw URLs are:

```text
https://raw.githubusercontent.com/Fikrimarzuki/ecosystem-config/main/dist/ecosystem.json
https://raw.githubusercontent.com/Fikrimarzuki/ecosystem-config/main/config/production.json
```

Consumers sync the configuration before building, resolve repository and deployment URLs from the canonical fields, and validate what they use. See the [consumer integration guide](docs/consumers/README.md) for the contract, the known consumers and their compatibility. Consumers read `main` unpinned, so a change reaches an application on its next build.

## Related projects

| Project | Relationship |
| --- | --- |
| [Gateway](https://fikrimarzuki.work/) | The interactive portfolio and entry point to the ecosystem. It fetches `config/production.json` at build time and projects a public subset of it (its source repository is private). |
| [ecosystem-skills](https://github.com/Fikrimarzuki/ecosystem-skills) | Curated, reviewed AI agent skills. A sibling project: no data or build dependency in either direction. |
| [ecosystem-assets](https://github.com/Fikrimarzuki/ecosystem-assets) | Shared creative and technical assets, including Gateway's canonical Blender and GLB sources. A sibling project: the `assets/` folder here holds only the small web-facing files the registry references. |

Other applications that consume the registry are listed in [Known consumers](docs/consumers/README.md#known-consumers).

## Documentation

| Guide | Contents |
| --- | --- |
| [Shared configuration](docs/configuration.md) | Naming, domains, profile and ecosystem identity |
| [Projects and deployments](docs/projects.md) | Fields, URLs, visibility, destinations and relationships |
| [Shared assets](docs/assets.md) | File paths, formats and validation |
| [Career, Origins and Concepts](docs/collections.md) | Collection models, ordering and privacy |
| [Development and validation](docs/development.md) | Repository layout, build workflow, CI and current scope |
| [Documentation site](docs/site.md) | Local preview, GitHub Pages deployment and the custom domain |
| [Consumer integration](docs/consumers/README.md) | Sync, compatibility and proposed automation |
| [Career publication approvals](docs/career-publication-approvals.md) | Field grants and reviewed-content fingerprints |
| [Concepts publication approvals](docs/concepts-publication-approvals.md) | Title-only grants and consumer adoption |

Browse the [documentation index](docs/README.md) for all guides.

## Public data, security and limitations

Everything committed here, including Git history and hidden records, should be considered publicly accessible. Never commit secrets, credentials, private contact details, confidential client or employer information, or unapproved screenshots.

* `listing: hidden` controls portfolio visibility; hidden records still appear in full in both generated JSON files.
* Private repository names are included in the JSON. Consumers link repositories only when `repositoryVisibility` is `public`.
* Career and Concepts browser publication requires separate content-bound grants; listing or source presence never grants permission. Career grants remain empty. Exactly three Concepts title grants are active for Forgebox, Hearthside and Momee. Publication grants constrain consumer output; they do not hide canonical records or retract earlier copies.
* There are no automatic notifications or dependent deployments, and consumers fetch `main` rather than a pinned revision.
* **Rename compatibility.** GitHub redirects the former repository and raw-file URLs, but use the new ones: a redirect can disappear if the old name is reused. Two identifiers deliberately keep the former name so that nothing breaks: the schema `$id` URIs (`https://config-ecosystem.invalid/...`, opaque names that consumers vendor) and the project's deployment `name` (`config-ecosystem`, a public slug). The project's `id` is still `configEcosystem`.
