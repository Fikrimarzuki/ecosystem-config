// Public projection of the canonical registry for the Ecosystem Config website.
// Pure and side-effect free so it can be unit-tested (test/site-projection.test.mjs).
//
// Privacy rules (the website is a consumer like any other; it owns its presentation):
// * A project is described only when it is `listing: public`, or when the owner approved it for
//   public discoverability through an A–Z project grant (config/showcase-publication.json).
//   Every other record contributes to counts only.
// * Repository names are never emitted. A repository link is emitted only for `repositoryVisibility: public`.
// * Technologies are emitted for `listing: public` projects only.
// * Website links come from registered deployments, except where the owner withheld the link
//   (mirrors web-gateway lib/portfolio-policy.mjs `withheldPortfolioDeploymentIds`).
// * Consumers are named by their registry project, never by repository.

/** Owner-withheld website links (keep in step with web-gateway's withheldPortfolioDeploymentIds). */
export const withheldDeploymentIds = Object.freeze([
  "watch", "weddingVendorScraper", "momee", "quibiq", "keranjoo", "urusaha", "yunivisi",
]);

/** Display order of canonical destinations. Labels are localized in the app. */
export const categoryOrder = Object.freeze([
  "games", "learning", "tools", "products", "platforms", "career", "labs", "central-station", "sun", "moon",
]);

export function deploymentUrl(config, deployment) {
  if (deployment.url) return deployment.url;
  return deployment.subdomain === null ? `https://${config.domains.primary}` : `https://${deployment.subdomain}.${config.domains.primary}`;
}

/** Which registry artifact a consumer reads, taken from its documented notes. */
export function consumerArtifact(consumer) {
  // The first artifact a consumer's notes name is the one it syncs (later mentions are comparisons).
  const text = (consumer.notes ?? []).join(" ");
  const found = ["dist/ecosystem.json", "config/production.json"].map(name => [name, text.indexOf(name)]).filter(([, at]) => at >= 0);
  return found.sort((a, b) => a[1] - b[1])[0]?.[0] ?? null;
}

const localized = value => value ? { en: value.en, ...(value.id ? { id: value.id } : {}) } : undefined;

/**
 * @param {object} config assembled canonical registry (dist/ecosystem.json)
 * @param {{ consumers: object[] }} consumerRegistry .github/consumers.json
 * @param {{ thumbnails?: Set<string>, validation?: { ok: boolean, errors: number }, revision?: string|null, builtAt?: string, schemas?: number }} [facts]
 */
export function projectSite(config, consumerRegistry, facts = {}) {
  const granted = new Set((config.showcasePublication ?? []).filter(grant => grant.kind === "project").map(grant => grant.id));
  const byRepository = new Map();
  for (const [id, project] of Object.entries(config.projects)) if (project.repository) {
    if (!byRepository.has(project.repository)) byRepository.set(project.repository, []);
    byRepository.get(project.repository).push(id);
  }
  const consumers = [];
  let unmappedConsumers = 0;
  for (const consumer of consumerRegistry.consumers ?? []) {
    const ids = byRepository.get(consumer.repository) ?? [];
    const id = ids.find(candidate => config.projects[candidate].listing === "public" || granted.has(candidate));
    if (!id) { unmappedConsumers += 1; continue; }
    consumers.push({ projectId: id, status: consumer.status, artifact: consumerArtifact(consumer), notify: Boolean(consumer.notify) });
  }
  const consumerOf = new Map(consumers.map(consumer => [consumer.projectId, consumer]));

  const described = Object.entries(config.projects).filter(([id, project]) => project.listing === "public" || granted.has(id));
  const describedIds = new Set(described.map(([id]) => id));
  const projects = described.map(([id, project]) => {
    const isPublic = project.listing === "public";
    const website = withheldDeploymentIds.includes(id) ? [] : Object.entries(project.deployments ?? {}).map(([key, deployment]) => ({
      key, url: deploymentUrl(config, deployment),
    }));
    return {
      id, name: project.name, status: project.status, category: project.destination,
      visibility: isPublic ? "public" : "showcase",
      ...(project.tagline ? { tagline: localized(project.tagline) } : {}),
      ...(project.description ? { description: localized(project.description) } : {}),
      ...(isPublic && project.technologies ? { technologies: [...project.technologies] } : {}),
      website,
      websiteWithheld: withheldDeploymentIds.includes(id) && Object.keys(project.deployments ?? {}).length > 0,
      ...(project.repositoryVisibility === "public" ? { repositoryUrl: `https://github.com/${config.username}/${project.repository}${project.path ? `/tree/main/${project.path}` : ""}` } : {}),
      thumbnail: Boolean(project.assets?.thumbnail && (facts.thumbnails?.has(id) ?? true)),
      sharedAssets: Object.keys(project.assets ?? {}).filter(key => key !== "media").sort(),
      related: (project.related ?? []).filter(other => describedIds.has(other)),
      consumer: consumerOf.has(id) ? { artifact: consumerOf.get(id).artifact, status: consumerOf.get(id).status } : null,
      azShowcase: granted.has(id),
    };
  });

  const count = (items, key) => items.reduce((total, item) => ({ ...total, [item[key]]: (total[item[key]] ?? 0) + 1 }), {});
  const all = Object.values(config.projects);
  const career = config.career ?? {};
  return {
    generated: {
      builtAt: facts.builtAt ?? null, revision: facts.revision ?? null, version: config.version,
      validation: facts.validation ?? null, ecosystem: config.ecosystem?.name ?? null, domain: config.domains.primary,
    },
    projects,
    categories: categoryOrder.filter(id => projects.some(project => project.category === id)),
    consumers,
    stats: {
      projects: all.length,
      listingPublic: all.filter(project => project.listing === "public").length,
      described: projects.length,
      notDescribed: all.length - projects.length,
      byStatus: count(all, "status"),
      byCategory: count(projects, "category"),
      consumers: consumers.length + unmappedConsumers,
      consumersByStatus: count(consumerRegistry.consumers ?? [], "status"),
      consumersByArtifact: count(consumers, "artifact"),
      showcases: (config.showcases ?? []).length,
      showcaseGrants: (config.showcasePublication ?? []).length,
      showcaseEligibility: (config.showcaseEligibility ?? []).length,
      deployments: all.reduce((total, project) => total + Object.keys(project.deployments ?? {}).length, 0),
      thumbnails: all.filter(project => project.assets?.thumbnail).length,
      publicRepositories: all.filter(project => project.repositoryVisibility === "public").length,
      career: Object.fromEntries(Object.entries(career).map(([key, list]) => [key, Array.isArray(list) ? list.length : 0])),
      origins: (config.origins ?? []).length,
      concepts: (config.concepts ?? []).filter(concept => concept.kind === "concept").length,
      schemas: facts.schemas ?? null,
    },
  };
}
