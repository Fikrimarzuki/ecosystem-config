# Documentation site

[Documentation](README.md) · [Repository overview](../README.md)

The website at `https://config.fikrimarzuki.work/` is a static Vite + React + TypeScript application in `site/`. Its visual direction is called *Living Blueprint*. It shows the registry as an architectural plan: an Overview with an animated exploded drawing of the registry, an Ecosystem Blueprint (Schematic, Network and List views), a project Registry, the A–Z Showcase, consumers and connections, a build-time Health snapshot, an About page and these guides.

The Markdown guides stay in `docs/` and remain the source: edit a guide once and it updates both GitHub and the website.

## What the site is, and what it is not

* **A consumer of the registry, not an endpoint.** At build time, `site/scripts/build-data.mjs` reads the committed `dist/ecosystem.json` and `.github/consumers.json`. It runs the same validator as CI and writes a public projection to the ignored `site/src/generated/`. The registry files are still served only from the repository's raw URLs. The site never publishes another copy of them, and the service worker never handles those URLs.
* **Privacy by projection** (`site/scripts/projection.mjs`, tested by `test/site-projection.test.mjs`):
  * A project is described only when it is `listing: public` or has an owner-approved A–Z project grant. Any other record contributes to counts only.
  * Repository names are never emitted. A repository link appears only for `repositoryVisibility: public`.
  * Technologies are shown for publicly listed projects only.
  * Website links follow the registered deployments, except the ones the owner has withheld (`withheldDeploymentIds`, kept in step with Gateway's `withheldPortfolioDeploymentIds`).
* **A–Z Showcase** (`/a-z/`) lists only entries with both a membership and a publication grant. Concepts and Career-derived case studies show exactly their granted fields; Career-derived entries share one generic type and an opaque handle, so no employer, record kind or canonical id is published.
  * A text grant never publishes an image. A case study shows one only when the owner approved that exact file: `approvedCaseArtwork` in `site/scripts/projection.mjs` binds each approval to the file's SHA-256, and the image is served under the entry's opaque handle. After replacing an approved image, review it and update its digest.
* **Real data only.** The Blueprint draws destinations, registry consumers, `related` links and the two relationships the documentation states:
  * Ecosystem Assets holds Gateway's 3D sources.
  * Ecosystem Assets holds the icon masters.

  The Health page is a build-time snapshot: the build time, the source revision, the validation result and record counts. It is not monitoring.

## Local development

Use Node.js 24 and the pnpm version declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm site:dev          # build-time data + Vite dev server
pnpm site:typecheck    # TypeScript
pnpm site:lint         # ESLint (website only)
pnpm site:build        # data, typecheck, Vite build and postbuild
pnpm site:preview      # serve site/dist
```

`docs:dev`, `docs:build` and `docs:preview` remain as aliases. `site:build` runs `site/scripts/postbuild.mjs` after Vite, which writes:

* **One real HTML file per route**, with its own title, description, canonical URL and Open Graph tags. GitHub Pages has no rewrites, so every deep link is a real file. The former guide URLs keep their form (`/projects.html`, `/consumers/integration.html`), and `/README.html` is the guide index.
* **`404.html`**, which carries `noindex`.
* **`sitemap.xml` and `robots.txt`**, on the configured domain (`SITE_ORIGIN` overrides it for previews).
* **`sw.js`**, an offline-capable app shell:
  * Pages are network-first.
  * Hashed assets are cached on first use.
  * Every deploy replaces the previous caches.

  The registry data inside the site is a build-time snapshot. When offline, the site says so and shows the date the snapshot was built.

Generated output (`site/dist/`, `site/src/generated/`, `site/public/generated/`) is ignored by Git. `dist/ecosystem.json` remains the committed registry artifact.

Base path: `DOCS_BASE` sets it (default `/`). CI passes the real path from GitHub Pages: `/` on the custom domain, `/ecosystem-config/` for pull-request builds.

## GitHub Pages deployment

In the repository's **Settings → Pages**, select **GitHub Actions** as the build source. The [Documentation workflow](../.github/workflows/docs.yml) builds the site on relevant pushes to `main`, which include:

* the guides, the site and the project assets;
* `dist/ecosystem.json` and `.github/consumers.json`, because the site shows them.

The workflow then deploys `site/dist` with GitHub's Pages actions. Pull requests lint and build without deploying. You can also start the workflow manually from the Actions tab.

## Custom domain

The site is published at `https://config.fikrimarzuki.work/`. To set the domain up again, or to use another:

1. Verify `fikrimarzuki.work` for GitHub Pages in the account settings.
2. Add `config.fikrimarzuki.work` as the repository's Pages custom domain.
3. Add a DNS `CNAME` for `config` pointing to `fikrimarzuki.github.io` at your DNS provider.
4. Enable **Enforce HTTPS** when the certificate is available, then rerun the Documentation workflow so the build uses the root base path.

For a root-path build locally, use `DOCS_BASE=/ pnpm site:build`. Because this deployment uses GitHub Actions, configure the domain in Pages settings; a source `CNAME` file is not needed.

See [GitHub's custom-domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) for the current DNS and verification steps.
