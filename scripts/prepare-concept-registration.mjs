// Review preparation only. Returns an isolated candidate; never writes sources,
// assigns destinations, selects membership or generates publication permissions.
import { validateConfig } from "./validate.mjs";
import { conceptsOrder } from "./concepts.mjs";

export function prepareConceptRegistration(config, record) {
  const before = validateConfig(config);
  if (!before.ok) throw new Error("Cannot prepare registration from invalid configuration");
  if (record?.kind !== "concept" || record.status !== "planned" ||
      ![record.description?.en, record.description?.id].every(value => typeof value === "string" && value.trim())) {
    throw new Error("Planned registration proposal requires a concept and exact nonempty bilingual descriptions");
  }
  const candidate = structuredClone(config);
  candidate.concepts.push(structuredClone(record));
  candidate.concepts.sort(conceptsOrder);
  const result = validateConfig(candidate);
  if (!result.ok) throw new Error(`Invalid registration proposal: ${result.errors.join("; ")}`);
  return candidate;
}
