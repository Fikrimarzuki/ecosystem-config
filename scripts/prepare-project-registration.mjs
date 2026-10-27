// Review only: validates an isolated registration without writing sources,
// assigning memberships or generating eligibility/publication permissions.
import { validateConfig } from "./validate.mjs";

export function prepareProjectRegistration(config, record) {
  if (!validateConfig(config).ok) throw new Error("Cannot prepare registration from invalid configuration");
  if (!record || typeof record.id !== "string" || !/^[a-z][a-zA-Z0-9]*$/.test(record.id) || Object.hasOwn(config.projects, record.id)) {
    throw new Error("Registration requires a new exact project identity");
  }
  const { id, ...project } = record;
  const candidate = structuredClone(config);
  candidate.projects[id] = structuredClone(project);
  const result = validateConfig(candidate);
  if (!result.ok) throw new Error(`Invalid project registration proposal: ${result.errors.join("; ")}`);
  return candidate;
}
