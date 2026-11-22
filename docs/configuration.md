# Shared configuration

[Documentation](README.md) · [Repository overview](../README.md)

Why this registry exists, how repository and deployment names relate, and where shared identity belongs.

## Why?

My projects are spread across multiple GitHub repositories and deployments, but many of them link to each other.

Instead of hardcoding values such as:

```text
https://play.fikrimarzuki.work
https://page-layr.fikrimarzuki.work
https://tinyverse.fikrimarzuki.work
```

inside multiple applications, those applications can consume this shared configuration.

When a shared value such as the primary domain changes, it can be updated here and propagated to dependent projects.

## Naming Layers

The ecosystem intentionally separates three concepts:

```text
GitHub repository → Deployment → Public domain
```

Example:

```text
game-tinyverse → tinyverse → tinyverse.fikrimarzuki.work
```

GitHub repository prefixes describe what a repository is internally and are not automatically exposed through deployment names or public URLs.

### Public display names

The umbrella ecosystem brand is **FM Work** (`ecosystem.name`). A project's `name` is its public display name, and it is a separate concept from its repository, package, deployment `name` and domain: changing one never implies changing the others.

* **General-purpose products** take an **FM** prefix once the owner has approved the name (FM Tools, FM DevTools, FM Links, FM Roadmap, FM Monorepo, FM Watch, FM Studios).
* **Independent products** keep a distinctive name without the prefix (Gateway, Playnest, Tinyverse, Little Roars, JavaScriptia, Hearthside, Momee, Codyssey, Scriptoria).
* **Personal identity** stays separate from product branding: the CV is a personal portfolio, not "FM CV".

A candidate FM name is not approved until the owner says so, and an unapproved candidate stays as it is in the registry.

## Shared Configuration

Common values are defined once:

```json
{
  "version": 1,
  "username": "Fikrimarzuki",
  "domains": {
    "primary": "fikrimarzuki.work"
  }
}
```

Project URLs and repository URLs can then be derived from this configuration.

For example:

```text
username   = Fikrimarzuki
repository = app-playdeck

→ github.com/Fikrimarzuki/app-playdeck
```

```text
subdomain      = playdeck
primary domain = fikrimarzuki.work

→ playdeck.fikrimarzuki.work
```

### Profile and ecosystem identity

Two optional objects in `config/global.json` carry shared identity. They are additive: `version`, `username`, `domains` and `projects` are unchanged.

```json
{
  "profile": {
    "name": "Fikri Marzuki",
    "links": {
      "github": "https://github.com/Fikrimarzuki"
    }
  },
  "ecosystem": {
    "name": "FM Work"
  }
}
```

* `profile` is the personal identity of the owner. `name` is required; `title` (a non-blank string) and `email` (a valid email address) are optional. `links` holds the canonical social links, keyed by platform (`github`, `linkedin`, `website`, or any other key). Each value must be an absolute `https://` URL. New platforms need no schema or code change; add only links that really exist.
* `ecosystem` is the shared brand identity (`name` is required), separate from the person.

### Shared public contact

An optional `contact` object in `config/global.json` is the one canonical **public** contact for every ecosystem site:

```json
{
  "contact": {
    "supportEmail": "marzuki.fikri@gmail.com",
    "supportUrl": "https://support.fikrimarzuki.work/"
  }
}
```

* `supportEmail` is the public address that receives support and request mail: an inbox that is actually read. It is **not** an email-sending identity: a Resend sender such as `support@...` that only appears in a `From` header is not a receiving inbox and must not be listed unless mail to it is delivered and read.
* `supportUrl` is the Support website. `scripts/validate.mjs` requires it to equal the Support project's `main` deployment, so it cannot drift from the registry.
* Both fields are required when `contact` is present, and no other fields are allowed. Never put API keys, private recipient addresses, sender credentials or tokens here: everything in the config is public. The private recipient that Support's server uses stays in Support's deployment environment (`SUPPORT_EMAIL`).

Consumers read `contact` at build time (see the [integration guide](consumers/integration.md#contact)); none should hardcode the address or require its own environment variable for it.

Consumers (Gateway, CV, Support, ...) should read these fields instead of hardcoding names and social URLs, and render whichever links are present. Content that only one app needs (page copy, layout, labels) stays in that app. To change shared metadata, edit `config/global.json`, run `pnpm build`, and commit the regenerated files.
