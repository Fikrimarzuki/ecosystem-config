# Project ID migration: FM Monorepo

Owner-approved migration, 2026-11-01:

| Field | Former | Current |
| --- | --- | --- |
| Project ID / assembled key | `frontendMonorepo` | `fmMonorepo` |
| Source file | `config/projects/frontendMonorepo.json` | `config/projects/fmMonorepo.json` |

This is one project, not an additional registry entry. The display name remains
FM Monorepo. Completed lifecycle, public listing, Platforms destination, private
repository visibility and the absence of deployments are unchanged. Both assembled
outputs are regenerated together; neither contains the former project key.

IDs remain stable by default. This is an explicit owner-requested exception and
consumers must migrate their references together with the configuration.

## Reviewed consumer impact

- Gateway: Portfolio copy, catalog level, landmark project binding, route fixtures
  and regression tests now use `fmMonorepo`. The landmark's own ID, structure,
  position and capacity are unchanged.
- Gateway accepts the former ID in old URLs and stored navigation targets, and
  canonicalizes them to the new ID. Its build-time public projection also accepts
  the older published registry and pinned offline snapshot. Aliasing occurs after
  permission validation and public-field projection; hidden projects and private
  repository metadata are not exposed. Both IDs together are rejected as ambiguous.
- The pinned Gateway snapshot and historical evidence remain unchanged. Their
  old IDs describe the original immutable revision, not the current source key.
- web-cv builds its catalog dynamically from registry keys; its one hardcoded test
  assertion was updated, with a regression test for the new ID. Its existing
  uncommitted generated data and unrelated changes were preserved.
- Other checked-out consumers contain no runtime references to the former ID.
  Dated documentation can still mention the former ID as historical evidence.

No commit, push or deployment accompanies this local migration. Published remote
configuration stays at its existing revision until publication is separately authorized.

## Local verification

- Canonical build, schema validation and 758 tests pass; both generated outputs are byte-identical and contain only the new key.
- Gateway: 241 configuration/publication, 100 Portfolio/navigation, 52 world/landmark and 26 production browser checks pass. The existing unrelated asset-staging determinism failure was excluded from the targeted world-binding run; its prior report remains unchanged.
- web-cv: 37 catalog/privacy tests pass against its preserved legacy input and a new-ID fixture.
- Gateway typecheck, production webpack build, approved asset emission and lint pass (16 pre-existing lint warnings). No new runtime source references use the former ID outside explicit migration handling.
- The revision-pinned snapshot is unchanged and its original integrity validation passes. Old Portfolio and Universe links, stored navigation targets, visibility protection and ambiguous dual-ID rejection are covered.
