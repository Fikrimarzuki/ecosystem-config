// Cross-record rules for config/website-links.json. A link decision never creates a deployment or publishes a project.
export function checkWebsiteLinks(config, errors) {
  const seen = new Set();
  for (const { id, action } of config.websiteLinks ?? []) {
    if (seen.has(id)) errors.push(`websiteLinks: duplicate decision for "${id}"`);
    seen.add(id);
    const project = Object.hasOwn(config.projects ?? {}, id) ? config.projects[id] : undefined;
    if (!project) errors.push(`websiteLinks: unknown project "${id}"`);
    // A withholding may precede a deployment, so a later link is not released by default.
    else if (action !== "withheld" && !project.deployments) errors.push(`websiteLinks: "${id}" has no deployment to link`);
  }
}
