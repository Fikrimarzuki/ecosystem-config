import { memo, useEffect, useMemo, useRef, type KeyboardEvent } from "react";
import { Handle, Panel, Position, ReactFlow, ReactFlowProvider, useReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import "@xyflow/react/dist/base.css";
import "../styles/map.css";
import { PROJECT_H, PROJECT_W, type BlueprintEdge, type BlueprintNode } from "../app/blueprint";
import { useI18n } from "../app/i18n";
import { prefersReducedMotion } from "../app/theme";

type MapNodeData = { node: BlueprintNode; label: string; state: "idle" | "selected" | "connected" | "dim"; match: boolean };
type MapNode = Node<MapNodeData>;
const size = { hub: [112, 112], category: [156, 40], project: [PROJECT_W, PROJECT_H], assets: [132, 34] } as const;

const centre = { opacity: 0, top: "50%", left: "50%", width: 1, height: 1, minWidth: 0, minHeight: 0, border: 0, transform: "translate(-50%, -50%)" } as const;
function Anchors() {
  return <><Handle type="target" position={Position.Top} style={centre} isConnectable={false} /><Handle type="source" position={Position.Bottom} style={centre} isConnectable={false} /></>;
}

const BlueprintNodeView = memo(function BlueprintNodeView({ data }: NodeProps<MapNode>) {
  const { node, label, state, match } = data;
  return (
    <div className={`map-node ${node.kind}`} data-state={state} data-match={match || undefined} data-status={node.project?.status}>
      <Anchors />
      {node.kind === "project" && <span className="map-dot" aria-hidden="true" />}
      <span className="map-label">{label}</span>
    </div>
  );
});
const nodeTypes = { blueprint: BlueprintNodeView };

type Props = {
  nodes: BlueprintNode[]; edges: BlueprintEdge[]; selected: string | null; connected: Set<string>; matches: Set<string>;
  onSelect: (id: string | null, center?: boolean) => void; focus: { id: string; n: number } | null; reset: number;
};

export default function BlueprintMap(props: Props) {
  return <ReactFlowProvider><MapCanvas {...props} /></ReactFlowProvider>;
}

function MapCanvas({ nodes, edges, selected, connected, matches, onSelect, focus, reset }: Props) {
  const { t } = useI18n();
  const flow = useReactFlow();
  const duration = prefersReducedMotion() ? 0 : 400;
  const labelOf = (node: BlueprintNode) => node.kind === "hub" ? "Ecosystem Config" : node.kind === "assets" ? t.blueprint.assetsNode
    : node.kind === "category" ? t.categories[node.category!] : node.project!.name;

  const flowNodes = useMemo<MapNode[]>(() => nodes.map(node => {
    const [w, h] = size[node.kind];
    const state = !selected ? "idle" : node.id === selected ? "selected" : connected.has(node.id) ? "connected" : "dim";
    const label = labelOf(node);
    return {
      id: node.id, type: "blueprint", position: { x: node.x - w / 2, y: node.y - h / 2 }, width: w, height: h,
      data: { node, label, state, match: matches.has(node.id) },
      draggable: false, connectable: false, selectable: false, focusable: true,
      ariaLabel: node.project ? `${label}, ${t.statuses[node.project.status]}, ${t.categories[node.project.category]}` : label,
    };
  // labelOf only depends on the language dictionary.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [nodes, selected, connected, matches, t]);

  const flowEdges = useMemo<Edge[]>(() => edges.map(edge => {
    const touches = selected && (edge.source === selected || edge.target === selected);
    return {
      id: edge.id, source: edge.source, target: edge.target, type: edge.kind === "consumes" || edge.kind === "documented" ? "simplebezier" : "straight",
      className: `map-edge ${edge.kind}${selected ? (touches ? " active" : " dim") : ""}`, focusable: false, selectable: false,
    };
  }), [edges, selected]);

  const fitted = useRef(false);
  useEffect(() => { if (focus) { const node = nodes.find(item => item.id === focus.id); if (node) flow.setCenter(node.x, node.y, { zoom: 1.15, duration }); } }, [focus]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (fitted.current) flow.fitView({ padding: 0.08, duration }); }, [reset]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const element = (event.target as HTMLElement).closest<HTMLElement>(".react-flow__node");
    if (!element?.dataset.id) return;
    event.preventDefault();
    onSelect(element.dataset.id);
  };

  return (
    <div className="bp-map" onKeyDown={onKeyDown}>
      <ReactFlow nodes={flowNodes} edges={flowEdges} nodeTypes={nodeTypes}
        onInit={instance => { instance.fitView({ padding: 0.08 }); fitted.current = true; }}
        onNodeClick={(_, node) => onSelect(node.id)} onPaneClick={() => onSelect(null)}
        minZoom={0.12} maxZoom={2.2} zoomOnScroll={false} panOnScroll={false} preventScrolling={false} zoomOnDoubleClick={false}
        nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} proOptions={{ hideAttribution: true }}
        ariaLabelConfig={{ "node.a11yDescription.default": t.blueprint.selectHint }}>
        <Panel position="top-left" className="map-controls">
          <button type="button" className="icon-button" onClick={() => flow.zoomIn({ duration })} aria-label={t.blueprint.zoomIn} title={t.blueprint.zoomIn}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M10 4v12M4 10h12" /></svg>
          </button>
          <button type="button" className="icon-button" onClick={() => flow.zoomOut({ duration })} aria-label={t.blueprint.zoomOut} title={t.blueprint.zoomOut}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 10h12" /></svg>
          </button>
          <button type="button" className="icon-button" onClick={() => flow.fitView({ padding: 0.08, duration })} aria-label={t.blueprint.fit} title={t.blueprint.fit}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 7V3h4M13 3h4v4M17 13v4h-4M7 17H3v-4" /></svg>
          </button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
