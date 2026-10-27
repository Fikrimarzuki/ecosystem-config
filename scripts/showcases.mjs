// Shared build-time contract. No grant generation occurs during assembly or validation.
import { createHash } from "node:crypto";

export const showcaseKey = source => source.kind === "work" ? JSON.stringify([source.kind, source.employerId, source.id]) : `${source.kind}:${source.id}`;
/** Qualified lookup only at build time. Source nesting never authorizes attribution. */
export function resolveShowcaseSource(config, source) {
  if (source.kind === "project") return config.projects[source.id];
  if (source.kind === "concept") return config.concepts.find(item => item.id === source.id && item.kind === "concept");
  if (source.kind === "assessment") return config.career.assessments.find(item => item.id === source.id);
  if (source.kind === "engagement") {
    const record = config.career.freelance.find(item => item.id === source.id);
    // Collection membership alone never establishes the engagement type.
    return record?.engagement === "freelance" ? record : undefined;
  }
  if (source.kind === "work") {
    const employer = config.career.experience.find(item => item.id === source.employerId);
    if (employer?.listing !== "public") return undefined;
    return employer.work?.find(item => item.id === source.id);
  }
  return undefined;
}
export const digestShowcase = value => `sha256:${createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex")}`;
const ordered = value => Array.isArray(value) ? value.map(ordered) : value && typeof value === "object"
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, ordered(value[key])])) : value;

const projectFacts = (config, record) => ({ title: record.name, status: record.status, domain: config.domains.primary,
  deployments: record.deployments ?? {}, thumbnail: record.assets?.thumbnail ?? null,
  source: record.repositoryVisibility === "public" ? [config.username, record.repository, record.path ?? null] : null });

export const projectLifecycleFields = ["title", "description.en", "description.id", "lifecycle"];
export const isProjectLifecycleGrant = grant => grant.kind === "project" && Object.hasOwn(grant, "fields");

/** Optional source metadata becomes public only through the separate minimal grant.
 * This is deliberately independent of catalog presentation and operational status. */
export function projectLifecyclePresentation(config, source) {
  const record = source.kind === "project" ? resolveShowcaseSource(config, source) : undefined;
  if (!record || !["planned", "in-progress"].includes(record.lifecycle) ||
      ![record.name, record.description?.en, record.description?.id].every(value => typeof value === "string" && value.trim())) {
    throw new Error("Project lifecycle showcase requires an exact project, bilingual narrative and explicit lifecycle");
  }
  return { title: record.name, description: { en: record.description.en, id: record.description.id },
    status: record.lifecycle, access: { kind: "static" }, deployments: [] };
}
const lifecycleFacts = (config, source) => {
  const record = resolveShowcaseSource(config, source);
  return { presentation: projectLifecyclePresentation(config, source), status: record.status, listing: record.listing };
};

/** Exact minimal concept presentation. No catalog fallback, media, actions, source
 * selectors or technology inference; both locales and lifecycle require approval. */
export function conceptShowcasePresentation(config, source) {
  const record = source.kind === "concept" ? resolveShowcaseSource(config, source) : undefined;
  if (!record || !["planned", "in-progress"].includes(record.status) ||
      ![record.title, record.description?.en, record.description?.id].every(value => typeof value === "string" && value.trim())) {
    throw new Error("Concept showcase requires an exact concept, bilingual narrative and planned/in-progress lifecycle");
  }
  return { title: record.title, description: { en: record.description.en, id: record.description.id },
    status: record.status, access: { kind: "static" }, deployments: [] };
}

/** A separate source-specific decision, never a registry/Universe visibility override. */
export function showcaseEligibilityFingerprint(config, decision) {
  if (decision.kind === "project" && decision.lifecycle === true) {
    const record = resolveShowcaseSource(config, decision);
    if (decision.surface !== "az" || !["public", "hidden"].includes(decision.listing) || record?.listing !== decision.listing) {
      throw new Error("Project lifecycle eligibility must bind its exact listing and az surface");
    }
    return digestShowcase(["gateway-project-lifecycle-eligibility-v1", decision.id, "az", ordered(lifecycleFacts(config, decision))]);
  }
  if (decision.kind === "concept") {
    if (decision.surface !== "az" || Object.hasOwn(decision, "listing")) throw new Error("Concept eligibility is az-only, independent of project listing");
    return digestShowcase(["gateway-showcase-eligibility-v1", "concept", decision.id, "az", ordered(conceptShowcasePresentation(config, decision))]);
  }
  const record = config.projects[decision.id];
  if (decision.kind !== "project" || decision.surface !== "az" || decision.listing !== "hidden" || record?.listing !== "hidden") {
    throw new Error("A–Z eligibility requires a hidden project and an explicit az-only decision");
  }
  return digestShowcase(["gateway-showcase-eligibility-v1", "project", decision.id, "az", "hidden", ordered(projectFacts(config, record))]);
}
function sourceEligibility(config, source) {
  const decisions = (config.showcaseEligibility ?? []).filter(item => item.kind === source.kind && item.id === source.id);
  if (decisions.length !== 1) return undefined;
  const decision = decisions[0];
  try { return decision.fingerprint === showcaseEligibilityFingerprint(config, decision) ? decision : undefined; }
  catch { return undefined; }
}

/** Project evidence binds canonical public facts; Gateway separately verifies its reviewed
 * presentation and image bytes. Private repository names/fields are never approval payloads. */
export function showcaseFingerprint(config, grant) {
  let value;
  if (isProjectLifecycleGrant(grant)) {
    const eligibility = sourceEligibility(config, grant);
    if (grant.surface !== "az" || eligibility?.lifecycle !== true || !Array.isArray(grant.fields) ||
        grant.fields.length !== projectLifecycleFields.length || new Set(grant.fields).size !== projectLifecycleFields.length ||
        projectLifecycleFields.some(field => !grant.fields.includes(field))) {
      throw new Error("Project lifecycle requires source-specific eligibility and every approved bilingual/lifecycle field");
    }
    return digestShowcase(["gateway-project-lifecycle-approval-v1", grant.id, grant.surface,
      ordered({ ...lifecycleFacts(config, grant), eligibility: eligibility.fingerprint })]);
  }
  if (grant.kind === "project") {
    const record = config.projects[grant.id];
    const eligibility = record?.listing === "hidden" ? sourceEligibility(config, grant) : undefined;
    if (!record || (record.listing !== "public" && !eligibility)) throw new Error("Showcase requires a public project or valid source-specific A–Z eligibility");
    value = projectFacts(config, record);
    // Preserve all public-project v1 digests. Hidden approvals additionally bind
    // the listing boundary and the independently revocable eligibility evidence.
    if (eligibility) value = { ...value, listing: "hidden", eligibility: eligibility.fingerprint };
  } else if (grant.kind === "concept") {
    const eligibility = sourceEligibility(config, grant);
    const fields = ["title", "description.en", "description.id", "status"];
    if (!eligibility || !Array.isArray(grant.fields) || grant.fields.length !== fields.length ||
        new Set(grant.fields).size !== fields.length || fields.some(field => !grant.fields.includes(field))) {
      throw new Error("Concept showcase requires independent eligibility and every approved bilingual/lifecycle field");
    }
    value = { presentation: conceptShowcasePresentation(config, grant), eligibility: eligibility.fingerprint };
  } else {
    const record = resolveShowcaseSource(config, grant);
    if (!record || record.listing === "hidden" || (grant.kind !== "work" && record.listing !== "public")) throw new Error("Showcase requires eligible Career content");
    value = { fields: Object.fromEntries([...grant.fields].sort().map(field => {
      const result = field.split(".").reduce((object, key) => object?.[key], record);
      if (result === undefined) throw new Error("Missing showcase field");
      return [field, result];
    })), technologies: [...(grant.technologies ?? [])].sort().map(technology => {
      if (!record.technologies?.includes(technology)) throw new Error("Unknown showcase technology");
      return technology;
    }) };
    if (grant.kind === "engagement") {
      // Bind the verified classification and original title alongside the exact
      // A–Z override. Neither selector nor original title is a public DTO field.
      value.engagement = record.engagement;
      if (grant.publicTitle !== undefined) value.publicTitle = grant.publicTitle;
    }
  }
  // Preserve every existing v1 project/assessment digest. Work adds its qualified
  // parent only for this newly supported kind; identical local IDs cannot share grants.
  return digestShowcase(["gateway-showcase-approval-v1", grant.kind,
    ...(grant.kind === "work" ? [grant.employerId] : []), grant.id, grant.surface, ordered(value)]);
}

/** Detached approval of Gateway's existing public presentation, including actual art bytes. */
export function showcasePresentationFingerprint(source, presentation, artworkSha256 = null) {
  return digestShowcase(["gateway-showcase-presentation-v1", source.kind, source.id, "az", ordered(presentation), artworkSha256]);
}

export function checkShowcases(config, errors) {
  const members = config.showcases ?? [], grants = config.showcasePublication ?? [];
  const selected = new Set(), approved = new Set();
  for (const member of members) {
    const key = showcaseKey(member);
    if (selected.has(key)) errors.push("Duplicate showcase membership");
    selected.add(key);
    const record = resolveShowcaseSource(config, member);
    const eligible = member.kind === "concept" ? Boolean(record && sourceEligibility(config, member)) : member.kind === "project" ? record?.listing === "public" || Boolean(sourceEligibility(config, member))
      : record && record.listing !== "hidden" && (member.kind === "work" || record.listing === "public");
    if (!eligible) errors.push("Unknown or hidden showcase member without valid A–Z eligibility");
  }
  const eligibleIds = new Set();
  for (const decision of config.showcaseEligibility ?? []) {
    const key = showcaseKey(decision);
    if (!selected.has(key)) errors.push("A–Z eligibility must reference selected membership");
    if (eligibleIds.has(key)) errors.push("Duplicate A–Z eligibility decision");
    eligibleIds.add(key);
    try {
      if (decision.fingerprint !== showcaseEligibilityFingerprint(config, decision)) errors.push("Missing, invalid or stale A–Z eligibility");
    } catch { errors.push("Invalid A–Z eligibility target"); }
  }
  for (const grant of grants) {
    const key = showcaseKey(grant);
    if (!selected.has(key)) errors.push("Showcase grant must reference selected membership");
    if (approved.has(key)) errors.push("Duplicate showcase grant");
    approved.add(key);
    try {
      if (grant.fingerprint !== showcaseFingerprint(config, grant)) errors.push("Missing, invalid or stale showcase approval");
      if (grant.kind === "concept" && grant.presentationFingerprint !== showcasePresentationFingerprint(grant, conceptShowcasePresentation(config, grant), null)) {
        errors.push("Missing, invalid or stale concept presentation approval");
      }
      if (isProjectLifecycleGrant(grant) && grant.presentationFingerprint !== showcasePresentationFingerprint(grant, projectLifecyclePresentation(config, grant), null)) {
        errors.push("Missing, invalid or stale project lifecycle presentation approval");
      }
    } catch { errors.push("Invalid showcase approval target"); }
  }
}
