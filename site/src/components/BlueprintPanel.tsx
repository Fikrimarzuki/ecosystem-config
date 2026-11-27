import { ASSETS_ID } from "../app/blueprint";
import { HUB_ID, data, projectById, type Category } from "../app/data";
import { useI18n } from "../app/i18n";
import { DIST_ID, DIST_READERS_ID, PROD_ID, SOURCES_ID, categoryOf, docUrl, isCategory, type Relation, type Subject } from "../app/relations";
import { href, routePaths } from "../app/router";
import { linkLabel, ProjectArtwork, StatusBadge, useProjectText } from "./Project";

type T = ReturnType<typeof useI18n>["t"];
export const legendKinds = ["membership", "consumes", "documented", "related", "assets", "build"] as const;
export type LegendKind = (typeof legendKinds)[number];

export function legendOf(kind: Relation["kind"]): LegendKind {
  if (kind === "membership" || kind === "structure" || kind === "registers") return "membership";
  if (kind === "consumes" || kind === "reads" || kind === "readsDist") return "consumes";
  if (kind === "assets" || kind === "validatesAssets") return "assets";
  if (kind === "assembled" || kind === "generates" || kind === "generatesCopy") return "build";
  return kind;
}

export function nodeLabel(id: string, t: T) {
  if (id === HUB_ID) return "Ecosystem Config";
  if (id === ASSETS_ID) return t.blueprint.assetsNode;
  if (id === SOURCES_ID) return t.schematic.sources[0];
  if (id === DIST_ID) return "dist/ecosystem.json";
  if (id === PROD_ID) return "config/production.json";
  if (id === DIST_READERS_ID) return t.schematic.distConsumers(data.stats.consumersByArtifact["dist/ecosystem.json"] ?? 0);
  if (isCategory(id)) return t.categories[categoryOf(id)];
  return projectById.get(id)?.name ?? id;
}

export function explain(relation: Relation, t: T) {
  const r = t.relation;
  switch (relation.kind) {
    case "assembled": return r.assembled;
    case "generates": return r.generates;
    case "generatesCopy": return r.generatesCopy;
    case "validatesAssets": return r.validatesAssets;
    case "readsDist": return r.readsDist(data.stats.consumersByArtifact["dist/ecosystem.json"] ?? 0);
    case "reads": case "consumes": return r.reads(relation.artifact ?? "dist/ecosystem.json");
    case "registers": { const category = categoryOf(relation.target); return r.registers(data.stats.byCategory[category] ?? 0, t.categories[category]); }
    case "membership": return r.membership(nodeLabel(relation.target, t), nodeLabel(relation.source, t));
    case "structure": return r.structure(nodeLabel(relation.target, t));
    case "related": return r.related;
    case "assets": return r.assets(projectById.get(relation.source)?.sharedAssets.join(", ") ?? "");
    case "documented": return relation.note === "icon-masters" ? r.iconMasters : r.sources3d;
  }
}

/** Where a node leads outside the Blueprint. */
function destination(id: string) {
  if (projectById.has(id)) return `${href(routePaths.registry)}?project=${id}`;
  if (isCategory(id)) return `${href(routePaths.registry)}?category=${categoryOf(id)}`;
  if (id === DIST_ID || id === PROD_ID || id === DIST_READERS_ID) return href(routePaths.connections);
  return href(routePaths.about);
}

type Props = { subject: Subject | null; relations: readonly Relation[]; onSelect: (subject: Subject) => void; onClear: () => void; sheet: boolean };

export function BlueprintPanel({ subject, relations, onSelect, onClear, sheet }: Props) {
  const { t } = useI18n();
  if (!subject) return <Intro relations={relations} />;
  const relation = subject.kind === "edge" ? relations.find(item => item.id === subject.id) : undefined;
  const title = relation ? t.relation.title : nodeLabel(subject.id, t);
  return (
    <aside className={`bp-panel${sheet ? " sheet" : ""}`} aria-label={title} aria-live="polite">
      <div className="dialog-head">
        <h2 className="panel-title">{title}</h2>
        <button type="button" className="icon-button" onClick={onClear} aria-label={t.blueprint.clear}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" /></svg>
        </button>
      </div>
      {relation ? <RelationDetail relation={relation} onSelect={onSelect} /> : <NodeDetail id={subject.id} relations={relations} onSelect={onSelect} />}
    </aside>
  );
}

function Intro({ relations }: { relations: readonly Relation[] }) {
  const { t } = useI18n();
  const present = new Set(relations.map(relation => legendOf(relation.kind)));
  return (
    <aside className="bp-panel" aria-label={t.intro.title}>
      <h2 className="panel-title">{t.intro.title}</h2>
      <p className="small">{t.intro.text}</p>
      <p className="small muted">{t.intro.counts(data.stats.described, data.categories.length, data.stats.consumers)}</p>
      <div>
        <h3 className="panel-subtitle">{t.intro.legend}</h3>
        <ul className="legend">
          {legendKinds.filter(kind => present.has(kind)).map(kind => <li key={kind}><span className={`swatch ${kind}`} aria-hidden="true" />{t.blueprint.rel[kind]}</li>)}
        </ul>
      </div>
      <div>
        <h3 className="panel-subtitle">{t.intro.how}</h3>
        <ul className="how">{t.intro.howList.map(item => <li key={item}>{item}</li>)}</ul>
      </div>
    </aside>
  );
}

function Endpoint({ id, onSelect }: { id: string; onSelect: (subject: Subject) => void }) {
  const { t } = useI18n();
  return <button type="button" className="endpoint-button" onClick={() => onSelect({ kind: "node", id })}>{nodeLabel(id, t)}</button>;
}

function RelationDetail({ relation, onSelect }: { relation: Relation; onSelect: (subject: Subject) => void }) {
  const { t } = useI18n();
  const legend = legendOf(relation.kind);
  return (
    <>
      <p className="relation-kind"><span className={`swatch ${legend}`} aria-hidden="true" />{t.blueprint.rel[legend]}</p>
      <dl className="facts">
        <dt>{t.relation.from}</dt><dd><Endpoint id={relation.source} onSelect={onSelect} /></dd>
        <dt>{t.relation.to}</dt><dd><Endpoint id={relation.target} onSelect={onSelect} /></dd>
        <dt>{t.relation.source}</dt><dd><a href={docUrl[relation.doc]} rel="noopener"><code>{t.relation.docs[relation.doc]}</code></a></dd>
      </dl>
      <p>{explain(relation, t)}</p>
      <div className="actions">
        <a className="button small" href={destination(relation.source)}>{t.relation.open}: {nodeLabel(relation.source, t)}</a>
        <a className="button small" href={destination(relation.target)}>{t.relation.open}: {nodeLabel(relation.target, t)}</a>
      </div>
    </>
  );
}

function NodeDetail({ id, relations, onSelect }: { id: string; relations: readonly Relation[]; onSelect: (subject: Subject) => void }) {
  const { t } = useI18n();
  const touching = relations.filter(relation => relation.source === id || relation.target === id);
  return (
    <>
      <NodeBody id={id} onSelect={onSelect} />
      {touching.length > 0 && (
        <div>
          <h3 className="panel-subtitle">{t.blueprint.connected(touching.length)}</h3>
          <ul className="relation-list">
            {touching.slice(0, 80).map(relation => {
              const other = relation.source === id ? relation.target : relation.source;
              return (
                <li key={relation.id}>
                  <button type="button" className="relation-row" onClick={() => onSelect({ kind: "edge", id: relation.id })}>
                    <span className={`swatch ${legendOf(relation.kind)}`} aria-hidden="true" />
                    <span>{nodeLabel(other, t)}</span><span className="muted small">{t.blueprint.rel[legendOf(relation.kind)]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

function NodeBody({ id, onSelect }: { id: string; onSelect: (subject: Subject) => void }) {
  const { t } = useI18n();
  if (projectById.has(id)) return <ProjectSummary id={id} />;
  if (isCategory(id)) {
    const category = categoryOf(id) as Category;
    const members = data.projects.filter(project => project.category === category && project.id !== HUB_ID).sort((a, b) => a.name.localeCompare(b.name));
    return (
      <>
        <p className="small">{t.relation.registers(members.length, t.categories[category])}</p>
        <div className="chips">{members.map(project => <button key={project.id} type="button" className="chip" onClick={() => onSelect({ kind: "node", id: project.id })}>{project.name}</button>)}</div>
        <a className="button small" href={destination(id)}>{t.relation.open}: {t.categories[category]}</a>
      </>
    );
  }
  if (id === ASSETS_ID) return <p className="small">{t.blueprint.assetsNote} {t.health.thumbnails}: {data.stats.thumbnails}.</p>;
  if (id === SOURCES_ID) return <p className="small">{t.schematic.sources[1]}</p>;
  const readers = id === DIST_ID || id === DIST_READERS_ID ? "dist/ecosystem.json" : id === PROD_ID ? "config/production.json" : null;
  if (readers) {
    const list = data.consumers.filter(consumer => consumer.artifact === readers).map(consumer => projectById.get(consumer.projectId)!).sort((a, b) => a.name.localeCompare(b.name));
    return (
      <>
        <p className="small">{id === PROD_ID ? t.schematic.prod[1] : t.schematic.dist[1]} {t.relation.readsDist(list.length)}</p>
        <div className="chips">{list.map(project => <button key={project.id} type="button" className="chip" onClick={() => onSelect({ kind: "node", id: project.id })}>{project.name}</button>)}</div>
      </>
    );
  }
  return null;
}

function ProjectSummary({ id }: { id: string }) {
  const { t } = useI18n();
  const project = projectById.get(id)!;
  const { summary } = useProjectText(project);
  return (
    <>
      <ProjectArtwork project={project} />
      <div className="card-meta"><StatusBadge status={project.status} /><span>{t.categories[project.category]}</span></div>
      <p className="small">{summary || <span className="muted">{t.registry.noSummary}</span>}</p>
      {id === HUB_ID && <p className="small muted">{t.blueprint.hubNote}</p>}
      <div className="actions">
        <a className="button small" href={`${href(routePaths.registry)}?project=${id}`}>{t.registry.details}</a>
        {project.website[0] && <a className="button small quiet" href={project.website[0].url} rel="noopener">{linkLabel(project, t.registry)}</a>}
      </div>
    </>
  );
}
