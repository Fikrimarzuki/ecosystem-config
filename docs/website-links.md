# Website link decisions

[Documentation index](README.md)

[config/website-links.json](../config/website-links.json) is the one place that decides whether a project's registered website is linked, and what the link is called. It is assembled as the top-level `websiteLinks` array. This repository's website and Gateway both read it; neither keeps its own list.

| `action` | Meaning | Button |
| --- | --- | --- |
| `app` | The page, or its main button, opens a working application | Open app |
| `demo` | A demonstration, prototype or simulator with sample data | View demo |
| `website` | A landing, informational or pre-release page | Visit website |
| `withheld` | Do not link until the owner releases it | none |

A project without an entry is offered as a website.

## Rules

* A decision never publishes a project, creates a deployment or exposes a repository. It only applies where a project is already shown.
* A private repository is not a reason to withhold a website. Neither is a Paused status or unfinished work.
* `withheld` needs the owner's approval to remove. No project is withheld at present.
* Never capture a live pairing code, sign-in code or account data in a thumbnail. Mask it before the capture.
* Consumers must not treat a registry without `websiteLinks` as permission to link everything.
* Decisions are recorded here, in a public file. Do not add private reasons or notes.

## Changing a decision

1. Check the page yourself: that it loads, and that its main button does what the label will say.
2. Edit the file, then run `pnpm build`, `pnpm validate` and `pnpm test`.
3. Changing an `action` between `app`, `demo` and `website` needs nothing else. Adding or removing `withheld` for an A–Z project changes its Gateway presentation, so re-approve its presentation fingerprint with `scripts/review-showcase.mjs`.

## Verification record (2026-11-28)

All 74 registered deployment URLs returned HTTP 200 and rendered a page. App and demo decisions were confirmed by following each page's main button. Keranjoo, Urusaha and Yunivisi were released: their hostnames had not resolved when they were withheld.

On the same day the owner approved the Momee, Quibiq and FM Watch links. FM Watch's thumbnail showed an expired pairing code, so it was recaptured with the code masked.

The owner then confirmed the Wedding Vendor Scraper landing page at `wedding-vendor-scrapper.fikrimarzuki.work` (the double "p" is intentional). It describes a locally run tool, so its link is `website`, never `app`.
