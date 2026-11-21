import { useMemo } from "react";
import { buildBlueprint, bounds } from "../app/blueprint";
import { data } from "../app/data";
import { useI18n } from "../app/i18n";

/** The Overview's drawing: the real registry, drawn once (no interaction). Callouts carry real counts. */
export function BlueprintPlate() {
  const { t } = useI18n();
  const { nodes, edges } = useMemo(() => buildBlueprint(data.projects, data.categories), []);
  const box = bounds(nodes);
  const pad = 40;
  const view = `${box.minX - pad} ${box.minY - pad} ${box.maxX - box.minX + pad * 2} ${box.maxY - box.minY + pad * 2}`;
  const at = new Map(nodes.map(node => [node.id, node]));
  const callouts = [
    { text: t.overview.plateProjects(data.stats.projects), x: box.minX + 10, y: box.minY + 30 },
    { text: t.overview.plateConsumers(data.stats.consumers), x: box.minX + 10, y: box.maxY - 20 },
  ];
  return (
    <figure className="plate">
      <svg viewBox={view} role="img" aria-labelledby="plate-title plate-desc">
        <title id="plate-title">{t.blueprint.title}</title>
        <desc id="plate-desc">{t.overview.plateCaption} {t.overview.plateProjects(data.stats.projects)}. {t.overview.plateConsumers(data.stats.consumers)}. {t.overview.plateCategories(data.categories.length)}.</desc>
        <g>
          {edges.filter(edge => edge.kind === "structure" || edge.kind === "membership").map(edge => {
            const a = at.get(edge.source)!, b = at.get(edge.target)!;
            return <line key={edge.id} className={`plate-line ${edge.kind} draw`} pathLength={1} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />;
          })}
        </g>
        {nodes.filter(node => node.kind === "category").map(node => (
          <g key={node.id}>
            <circle className="plate-category" cx={node.x} cy={node.y} r={20} />
            <text className="plate-label" x={node.x} y={node.y < 0 ? node.y - 26 : node.y + 46} textAnchor="middle">{t.categories[node.category!]}</text>
          </g>
        ))}
        {nodes.filter(node => node.kind === "project").map(node => (
          <circle key={node.id} className={`plate-dot${node.project?.consumer ? " consumer" : ""}`} data-status={node.project?.status} cx={node.x} cy={node.y} r={12} />
        ))}
        <circle className="plate-hub-ring" cx={0} cy={0} r={64} />
        <circle className="plate-hub-ring faint" cx={0} cy={0} r={360} />
        <circle className="plate-hub" cx={0} cy={0} r={40} />
        {callouts.map(callout => <text key={callout.text} className="plate-callout" x={callout.x} y={callout.y}>{callout.text}</text>)}
      </svg>
      <figcaption>
        <span>{t.overview.plateCaption}</span>
        <span>{t.overview.plateCategories(data.categories.length)}, {t.overview.plateDeployments(data.stats.deployments)}</span>
        <ul className="plate-legend">
          <li><svg viewBox="0 0 12 12" aria-hidden="true"><circle className="plate-dot consumer" cx="6" cy="6" r="4.5" /></svg>{t.blueprint.rel.consumes}</li>
          <li><svg viewBox="0 0 12 12" aria-hidden="true"><circle className="plate-dot" cx="6" cy="6" r="4.5" /></svg>{t.statuses.active}</li>
          <li><svg viewBox="0 0 12 12" aria-hidden="true"><circle className="plate-dot" data-status="paused" cx="6" cy="6" r="4.5" /></svg>{t.statuses.paused}</li>
          <li><svg viewBox="0 0 12 12" aria-hidden="true"><circle className="plate-dot" data-status="completed" cx="6" cy="6" r="4.5" /></svg>{t.statuses.completed}</li>
        </ul>
      </figcaption>
    </figure>
  );
}
