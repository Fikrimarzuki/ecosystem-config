import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { PageHead } from "../components/Shell";
import { ProjectArtwork, StatusBadge, useProjectText } from "../components/Project";
import { ASSETS_ID, buildBlueprint, neighbours, type BlueprintEdge, type BlueprintNode, type EdgeKind } from "../app/blueprint";
import { HUB_ID, data, projectById, type Category, type Status } from "../app/data";
import { useI18n } from "../app/i18n";
import { href, routePaths } from "../app/router";

const BlueprintMap = lazy(() => import("../components/BlueprintMap"));
type Relations = Record<Exclude<EdgeKind, "structure">, boolean>;
const relationKinds: (keyof Relations)[] = ["membership", "consumes", "documented", "related", "assets"];
const normalize = (value: string) => value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Blueprint() {
  const { t, text } = useI18n();
  const full = useMemo(() => buildBlueprint(data.projects, data.categories), []);
  const narrow = typeof window !== "undefined" && window.matchMedia("(max-width: 760px)").matches;
  const [view, setView] = useState<"map" | "list">(narrow ? "list" : "map");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [status, setStatus] = useState<Status | "">("");
  const [relations, setRelations] = useState<Relations>({ membership: true, consumes: true, documented: true, related: true, assets: false });
  const [chosen, setSelected] = useState<string | null>(() => {
    const id = new URLSearchParams(window.location.search).get("project");
    return id && projectById.has(id) ? id : null;
  });
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  const [reset, setReset] = useState(0);

  const visibleNodes = useMemo(() => full.nodes.filter(node => {
    if (node.kind !== "project") return node.kind !== "category" || !category || node.category === category;
    return (!category || node.category === category) && (!status || node.project?.status === status);
  }), [full.nodes, category, status]);
  const visibleIds = useMemo(() => new Set(visibleNodes.map(node => node.id)), [visibleNodes]);
  // A selection hidden by a filter is simply not shown; clearing the filter brings it back.
  const selected = chosen && visibleIds.has(chosen) ? chosen : null;
  const visibleEdges = useMemo(() => full.edges.filter(edge => (edge.kind === "structure" || relations[edge.kind])
    && visibleIds.has(edge.source) && visibleIds.has(edge.target)), [full.edges, relations, visibleIds]);
  const adjacency = useMemo(() => neighbours(visibleEdges), [visibleEdges]);
  const connected = useMemo(() => selected ? adjacency.get(selected) ?? new Set<string>() : new Set<string>(), [adjacency, selected]);

  const matches = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return data.projects.filter(project => visibleIds.has(project.id) && words.every(word =>
      normalize([project.name, text(project.tagline), t.categories[project.category]].join(" ")).includes(word))).slice(0, 8);
  }, [query, visibleIds, text, t]);
  const matchIds = useMemo(() => new Set(matches.map(project => project.id)), [matches]);

  const select = useCallback((id: string | null, center = false) => {
    setSelected(id);
    if (id && center) setFocus(previous => ({ id, n: (previous?.n ?? 0) + 1 }));
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setSelected(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const resetAll = () => { setQuery(""); setCategory(""); setStatus(""); setSelected(null); setRelations({ membership: true, consumes: true, documented: true, related: true, assets: false }); setReset(n => n + 1); };
  const projectCount = visibleNodes.filter(node => node.kind === "project").length;
  const totalProjects = full.nodes.filter(node => node.kind === "project").length;
  const node = selected ? full.nodes.find(item => item.id === selected) ?? null : null;

  return (
    <div className="container page">
      <PageHead title={t.blueprint.title} lead={t.blueprint.lead} />
      <div className="bp-shell">
        <form className="bp-controls" role="search" onSubmit={event => { event.preventDefault(); if (matches[0]) select(matches[0].id, true); }}>
          <label className="field">{t.blueprint.search}
            <input className="input" type="search" value={query} placeholder={t.blueprint.searchPlaceholder} aria-controls={query ? "bp-matches" : undefined}
              onChange={event => setQuery(event.target.value)} />
          </label>
          <label className="field">{t.registry.destination}
            <select className="select" value={category} onChange={event => setCategory(event.target.value as Category | "")}>
              <option value="">{t.blueprint.allCategories}</option>
              {data.categories.map(id => <option key={id} value={id}>{t.categories[id]}</option>)}
            </select>
          </label>
          <label className="field">{t.blueprint.status}
            <select className="select" value={status} onChange={event => setStatus(event.target.value as Status | "")}>
              <option value="">{t.blueprint.allStatuses}</option>
              {(["active", "paused", "completed", "archived"] as Status[]).filter(id => data.stats.byStatus[id]).map(id => <option key={id} value={id}>{t.statuses[id]}</option>)}
            </select>
          </label>
          <div className="segmented" role="group" aria-label={t.blueprint.view}>
            <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}>{t.blueprint.map}</button>
            <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>{t.blueprint.list}</button>
          </div>
        </form>
        {query && (
          <div id="bp-matches" role="region" aria-live="polite" aria-label={t.blueprint.search}>
            {matches.length
              ? <div className="chips">{matches.map(project => <button key={project.id} type="button" className="chip" aria-pressed={selected === project.id} onClick={() => select(project.id, true)}>{project.name}</button>)}</div>
              : <p className="muted small">{t.blueprint.noMatch}</p>}
          </div>
        )}
        <div className="bp-relations">
          <fieldset>
            <legend>{t.blueprint.relations}</legend>
            {relationKinds.map(kind => (
              <button key={kind} type="button" className="chip" aria-pressed={relations[kind]} onClick={() => setRelations(current => ({ ...current, [kind]: !current[kind] }))}>
                <span className={`swatch ${kind}`} aria-hidden="true" />{t.blueprint.rel[kind]}
              </button>
            ))}
          </fieldset>
          <button type="button" className="button quiet small" onClick={resetAll}>{t.blueprint.reset}</button>
          <span className="muted small" role="status" style={{ marginLeft: "auto" }}>{t.blueprint.showing(projectCount, totalProjects)}</span>
        </div>
        <div className="bp-stage">
          {view === "map"
            ? <Suspense fallback={<div className="bp-loading" role="status">{t.blueprint.loading}</div>}>
                <BlueprintMap nodes={visibleNodes} edges={visibleEdges} selected={selected} connected={connected} matches={matchIds}
                  onSelect={select} focus={focus} reset={reset} />
              </Suspense>
            : <BlueprintList nodes={visibleNodes} selected={selected} onSelect={id => select(id)} />}
          <DetailPanel node={node} edges={visibleEdges} connected={connected} onSelect={id => select(id, true)} onClear={() => setSelected(null)} />
        </div>
      </div>
    </div>
  );
}

function BlueprintList({ nodes, selected, onSelect }: { nodes: BlueprintNode[]; selected: string | null; onSelect: (id: string) => void }) {
  const { t, text } = useI18n();
  const categories = data.categories.filter(category => nodes.some(node => node.kind === "category" && node.category === category));
  return (
    <div className="bp-list">
      <p className="muted small">{t.blueprint.listCaption}</p>
      <div>
        <h2>{t.blueprint.hub}</h2>
        <ul><li><button type="button" aria-pressed={selected === HUB_ID} onClick={() => onSelect(HUB_ID)}><strong>Ecosystem Config</strong><span className="sub">{t.blueprint.hubNote}</span></button></li></ul>
      </div>
      {categories.map(category => {
        const members = nodes.filter(node => node.kind === "project" && node.category === category);
        return (
          <section key={category} aria-labelledby={`list-${category}`}>
            <h2 id={`list-${category}`}>{t.categories[category]} <span className="muted small">{members.length}</span></h2>
            <ul>
              {members.map(node => (
                <li key={node.id}>
                  <button type="button" aria-pressed={selected === node.id} onClick={() => onSelect(node.id)}>
                    <strong>{node.project!.name}</strong>
                    <span className="sub">{t.statuses[node.project!.status]}{node.project!.consumer ? `, ${t.blueprint.rel.consumes.toLowerCase()}` : ""}</span>
                    {node.project!.tagline && <span className="sub">{text(node.project!.tagline)}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function label(id: string, t: ReturnType<typeof useI18n>["t"]) {
  if (id === ASSETS_ID) return t.blueprint.assetsNode;
  if (id.startsWith("category:")) return t.categories[id.slice(9) as Category];
  return projectById.get(id)?.name ?? id;
}

function DetailPanel({ node, edges, connected, onSelect, onClear }: { node: BlueprintNode | null; edges: BlueprintEdge[]; connected: Set<string>; onSelect: (id: string) => void; onClear: () => void }) {
  const { t } = useI18n();
  const narrow = typeof window !== "undefined" && window.matchMedia("(max-width: 980px)").matches;
  if (!node) return <aside className="bp-panel" aria-label={t.blueprint.relations}><p className="muted">{t.blueprint.selectHint}</p></aside>;
  const relationOf = (other: string) => edges.find(edge => (edge.source === node.id && edge.target === other) || (edge.target === node.id && edge.source === other));
  return (
    <aside className={`bp-panel${narrow ? " sheet" : ""}`} aria-label={label(node.id, t)} aria-live="polite">
      <div className="dialog-head">
        <h2 style={{ fontSize: "1.3rem" }}>{node.id === HUB_ID ? "Ecosystem Config" : label(node.id, t)}</h2>
        <button type="button" className="icon-button" onClick={onClear} aria-label={t.blueprint.clear}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" /></svg>
        </button>
      </div>
      {node.kind === "project" || node.kind === "hub" ? <ProjectSummary id={node.id} /> : <p className="muted">{node.kind === "assets" ? t.blueprint.assetsNote : `${data.stats.byCategory[node.category!] ?? 0} ${t.health.projects.toLowerCase()}`}</p>}
      {node.kind === "hub" && <p className="muted small">{t.blueprint.hubNote}</p>}
      <div>
        <h3 style={{ fontSize: "1rem", marginBottom: 6 }}>{t.blueprint.connected(connected.size)}</h3>
        <ul>
          {[...connected].sort((a, b) => label(a, t).localeCompare(label(b, t))).slice(0, 60).map(id => {
            const edge = relationOf(id);
            return <li key={id}><button type="button" className="button quiet small" style={{ padding: "2px 0", minHeight: 0 }} onClick={() => onSelect(id)}>{id === HUB_ID ? "Ecosystem Config" : label(id, t)}</button>
              {edge && edge.kind !== "structure" && <span className="muted small"> ({t.blueprint.rel[edge.kind]}{edge.artifact ? `: ${edge.artifact}` : ""})</span>}</li>;
          })}
        </ul>
      </div>
    </aside>
  );
}

function ProjectSummary({ id }: { id: string }) {
  const { t } = useI18n();
  const project = projectById.get(id)!;
  const { summary } = useProjectText(project);
  return (
    <>
      <ProjectArtwork project={project} />
      <div className="card-meta"><StatusBadge status={project.status} /><span>{t.categories[project.category]}</span></div>
      {summary && <p className="small">{summary}</p>}
      <div className="actions">
        <a className="button small" href={`${href(routePaths.registry)}?project=${id}`}>{t.registry.details}</a>
        {project.website[0] && <a className="button small quiet" href={project.website[0].url} rel="noopener">{t.registry.visit}</a>}
      </div>
    </>
  );
}
