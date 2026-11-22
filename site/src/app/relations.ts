import { ASSETS_ID, categoryId, type BlueprintEdge } from "./blueprint";
import { HUB_ID, data, projectById, type Artifact, type Category } from "./data";

// One relationship model for every Blueprint mode. Each relationship names the document that records it,
// and nothing here is inferred: the schematic links follow README.md, docs/assets.md, .github/consumers.json
// and the project records (destination, related, assets).
export type RelationKind =
  | BlueprintEdge["kind"]
  | "assembled" | "generates" | "generatesCopy" | "validatesAssets" | "readsDist" | "reads" | "registers";
export type Relation = {
  id: string; source: string; target: string; kind: RelationKind;
  artifact?: Artifact | null; note?: "3d-sources" | "icon-masters"; doc: "readme" | "assets" | "consumers" | "registry" | "development";
};
export type Subject = { kind: "node"; id: string } | { kind: "edge"; id: string };

export const SOURCES_ID = "s:sources", DIST_ID = "s:dist", PROD_ID = "s:prod", DIST_READERS_ID = "s:consumers-dist";

const docOf: Record<BlueprintEdge["kind"], Relation["doc"]> = {
  structure: "registry", membership: "registry", consumes: "consumers", documented: "readme", related: "registry", assets: "registry",
};
export const fromNetworkEdge = (edge: BlueprintEdge): Relation => ({
  id: edge.id, source: edge.source, target: edge.target, kind: edge.kind, artifact: edge.artifact, note: edge.note,
  doc: edge.kind === "documented" ? (edge.note === "icon-masters" ? "assets" : "readme") : docOf[edge.kind],
});

/** The schematic: sources → core → generated files → consumers; core → destinations; siblings with documented links. */
export function schematicRelations(): Relation[] {
  const prodReaders = data.consumers.filter(consumer => consumer.artifact === "config/production.json").map(consumer => consumer.projectId);
  const links: Relation[] = [
    { id: "sl:assembled", source: SOURCES_ID, target: HUB_ID, kind: "assembled", doc: "readme" },
    { id: "sl:dist", source: HUB_ID, target: DIST_ID, kind: "generates", doc: "readme" },
    { id: "sl:prod", source: HUB_ID, target: PROD_ID, kind: "generatesCopy", doc: "readme" },
    { id: "sl:assets", source: HUB_ID, target: ASSETS_ID, kind: "validatesAssets", doc: "assets" },
    { id: "sl:reads-dist", source: DIST_ID, target: DIST_READERS_ID, kind: "readsDist", artifact: "dist/ecosystem.json", doc: "consumers" },
    ...prodReaders.map((id): Relation => ({ id: `sl:reads:${id}`, source: PROD_ID, target: id, kind: "reads", artifact: "config/production.json", doc: "consumers" })),
    ...data.categories.map((category): Relation => ({ id: `sl:register:${category}`, source: HUB_ID, target: categoryId(category), kind: "registers", doc: "registry" })),
  ];
  if (projectById.has("ecosystemAssets")) {
    links.push({ id: "sl:icon-masters", source: "ecosystemAssets", target: ASSETS_ID, kind: "documented", note: "icon-masters", doc: "assets" });
    if (prodReaders.includes("gateway")) links.push({ id: "sl:3d-sources", source: "ecosystemAssets", target: "gateway", kind: "documented", note: "3d-sources", doc: "readme" });
  }
  return links;
}

export const docUrl: Record<Relation["doc"], string> = {
  readme: "https://github.com/Fikrimarzuki/ecosystem-config/blob/main/README.md",
  assets: "https://github.com/Fikrimarzuki/ecosystem-config/blob/main/docs/assets.md",
  consumers: "https://github.com/Fikrimarzuki/ecosystem-config/blob/main/.github/consumers.json",
  registry: "https://github.com/Fikrimarzuki/ecosystem-config/tree/main/config/projects",
  development: "https://github.com/Fikrimarzuki/ecosystem-config/blob/main/docs/development.md",
};

export const isCategory = (id: string) => id.startsWith("category:");
export const categoryOf = (id: string) => id.slice(9) as Category;

/** Highlight sets for a subject over a set of relations. */
export function highlight(subject: Subject | null, relations: readonly Relation[]) {
  const nodes = new Set<string>(), edges = new Set<string>();
  if (!subject) return { focus: null as string | null, nodes, edges, active: false };
  if (subject.kind === "edge") {
    const relation = relations.find(item => item.id === subject.id);
    if (relation) { edges.add(relation.id); nodes.add(relation.source); nodes.add(relation.target); }
    return { focus: null, nodes, edges, active: true };
  }
  nodes.add(subject.id);
  for (const relation of relations) if (relation.source === subject.id || relation.target === subject.id) {
    edges.add(relation.id); nodes.add(relation.source); nodes.add(relation.target);
  }
  return { focus: subject.id, nodes, edges, active: true };
}
