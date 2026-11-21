import { HUB_ID, type Artifact, type Category, type Project } from "./data";

// Deterministic radial layout of the registry. Every node and edge comes from registry data or from a
// relationship the documentation states; nothing is inferred.
export type NodeKind = "hub" | "category" | "project" | "assets";
export type EdgeKind = "structure" | "membership" | "consumes" | "documented" | "related" | "assets";
export type BlueprintNode = { id: string; kind: NodeKind; x: number; y: number; category?: Category; project?: Project };
export type BlueprintEdge = { id: string; source: string; target: string; kind: EdgeKind; artifact?: Artifact | null; note?: "3d-sources" | "icon-masters" };

export const PROJECT_W = 136, PROJECT_H = 34;
const CATEGORY_RADIUS = 360, FIRST_ROW = 190, ROW_GAP = 104, SPACING = 150;
export const ASSETS_ID = "shared-assets";
export const categoryId = (category: Category) => `category:${category}`;

/** Relationships stated in README.md ("Related projects") and docs/assets.md ("Project icons"). */
const documentedLinks: { source: string; target: string; note: "3d-sources" | "icon-masters" }[] = [
  { source: "ecosystemAssets", target: "gateway", note: "3d-sources" },
  { source: "ecosystemAssets", target: HUB_ID, note: "icon-masters" },
];

export function buildBlueprint(projects: readonly Project[], categories: readonly Category[]) {
  const nodes: BlueprintNode[] = [];
  const edges: BlueprintEdge[] = [];
  const hub = projects.find(project => project.id === HUB_ID);
  nodes.push({ id: HUB_ID, kind: "hub", x: 0, y: 0, project: hub, category: hub?.category });
  nodes.push({ id: ASSETS_ID, kind: "assets", x: 0, y: 150 });
  const step = (2 * Math.PI) / categories.length;
  categories.forEach((category, index) => {
    const angle = -Math.PI / 2 + index * step;
    const [cx, cy] = [Math.cos(angle) * CATEGORY_RADIUS, Math.sin(angle) * CATEGORY_RADIUS];
    nodes.push({ id: categoryId(category), kind: "category", x: cx, y: cy, category });
    edges.push({ id: `structure:${category}`, source: HUB_ID, target: categoryId(category), kind: "structure" });
    const members = projects.filter(project => project.category === category && project.id !== HUB_ID)
      .sort((a, b) => a.name.localeCompare(b.name));
    let placed = 0, row = 0;
    while (placed < members.length) {
      const radius = CATEGORY_RADIUS + FIRST_ROW + row * ROW_GAP;
      const capacity = Math.max(1, Math.min(4, Math.floor((step * radius * 0.92) / SPACING)));
      const inRow = members.slice(placed, placed + capacity);
      inRow.forEach((project, position) => {
        const offset = (position - (inRow.length - 1) / 2) * (SPACING / radius);
        const theta = angle + offset;
        nodes.push({ id: project.id, kind: "project", x: Math.cos(theta) * radius, y: Math.sin(theta) * radius, category, project });
        edges.push({ id: `membership:${project.id}`, source: categoryId(category), target: project.id, kind: "membership" });
      });
      placed += inRow.length; row += 1;
    }
  });
  const present = new Set(nodes.map(node => node.id));
  for (const project of projects) {
    if (project.consumer && project.id !== HUB_ID) edges.push({ id: `consumes:${project.id}`, source: project.id, target: HUB_ID, kind: "consumes", artifact: project.consumer.artifact });
    for (const other of project.related) if (present.has(other) && project.id < other) edges.push({ id: `related:${project.id}:${other}`, source: project.id, target: other, kind: "related" });
    if (project.sharedAssets.length) edges.push({ id: `assets:${project.id}`, source: project.id, target: ASSETS_ID, kind: "assets" });
  }
  for (const link of documentedLinks) if (present.has(link.source) && present.has(link.target)) {
    edges.push({ id: `documented:${link.source}:${link.target}`, source: link.source, target: link.target, kind: "documented", note: link.note });
  }
  return { nodes, edges };
}

/** Undirected adjacency over the given edges. */
export function neighbours(edges: readonly BlueprintEdge[]) {
  const map = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!map.has(edge.source)) map.set(edge.source, new Set());
    if (!map.has(edge.target)) map.set(edge.target, new Set());
    map.get(edge.source)!.add(edge.target); map.get(edge.target)!.add(edge.source);
  }
  return map;
}

export function bounds(nodes: readonly BlueprintNode[]) {
  const xs = nodes.map(node => node.x), ys = nodes.map(node => node.y);
  return { minX: Math.min(...xs) - PROJECT_W, maxX: Math.max(...xs) + PROJECT_W, minY: Math.min(...ys) - PROJECT_H * 2, maxY: Math.max(...ys) + PROJECT_H * 2 };
}
