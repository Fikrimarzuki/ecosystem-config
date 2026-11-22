import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { PageHead } from "../components/Shell";
import { SearchField, Segmented, SelectField } from "../components/Controls";
import { BlueprintPanel, explain, legendOf, nodeLabel } from "../components/BlueprintPanel";
import { buildBlueprint, type BlueprintNode, type EdgeKind } from "../app/blueprint";
import { HUB_ID, data, projectById, type Category, type Status } from "../app/data";
import { useI18n } from "../app/i18n";
import { fromNetworkEdge, highlight, schematicRelations, type Subject } from "../app/relations";

const BlueprintMap = lazy(() => import("../components/BlueprintMap"));
const BlueprintSchematic = lazy(() => import("../components/BlueprintSchematic"));
type Mode = "schematic" | "network" | "list";
type Relations = Record<Exclude<EdgeKind, "structure">, boolean>;
const relationKinds: (keyof Relations)[] = ["membership", "consumes", "documented", "related", "assets"];
const defaultRelations: Relations = { membership: true, consumes: true, documented: true, related: true, assets: false };
const normalize = (value: string) => value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const MODE_KEY = "ec.blueprint.mode";

function initialMode(): Mode {
  try { const saved = localStorage.getItem(MODE_KEY); if (saved === "schematic" || saved === "network" || saved === "list") return saved; } catch { /* storage unavailable */ }
  return window.matchMedia("(max-width: 760px)").matches ? "list" : "schematic";
}

export default function Blueprint() {
  const { t, text } = useI18n();
  const full = useMemo(() => buildBlueprint(data.projects, data.categories), []);
  const schematic = useMemo(() => schematicRelations(), []);
  const [mode, setModeState] = useState<Mode>(initialMode);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "">("");
  const [status, setStatus] = useState<Status | "">("");
  const [relations, setRelations] = useState<Relations>(defaultRelations);
  const [chosen, setChosen] = useState<Subject | null>(() => {
    const id = new URLSearchParams(window.location.search).get("project");
    return id && projectById.has(id) ? { kind: "node", id } : null;
  });
  const [hover, setHover] = useState<{ subject: Subject; x: number; y: number } | null>(null);
  const [focus, setFocus] = useState<{ id: string; n: number } | null>(null);
  const [reset, setReset] = useState(0);
  const sheet = typeof window !== "undefined" && window.matchMedia("(max-width: 980px)").matches;

  const setMode = (next: Mode) => { setModeState(next); setHover(null); try { localStorage.setItem(MODE_KEY, next); } catch { /* storage unavailable */ } };

  // Network and List share the radial model; filters apply to both.
  const visibleNodes = useMemo(() => full.nodes.filter(node => {
    if (node.kind !== "project") return node.kind !== "category" || !category || node.category === category;
    return (!category || node.category === category) && (!status || node.project?.status === status);
  }), [full.nodes, category, status]);
  const visibleIds = useMemo(() => new Set(visibleNodes.map(node => node.id)), [visibleNodes]);
  const networkRelations = useMemo(() => full.edges.filter(edge => (edge.kind === "structure" || relations[edge.kind])
    && visibleIds.has(edge.source) && visibleIds.has(edge.target)).map(fromNetworkEdge), [full.edges, relations, visibleIds]);
  const activeRelations = mode === "schematic" ? schematic : networkRelations;

  // A selection that the current mode cannot show is simply not shown.
  const known = (subject: Subject | null) => !subject ? null
    : subject.kind === "edge" ? (activeRelations.some(relation => relation.id === subject.id) ? subject : null)
    : mode === "schematic" || visibleIds.has(subject.id) || !projectById.has(subject.id) ? subject : null;
  const selected = known(chosen);
  const view = useMemo(() => highlight(hover?.subject ?? selected, activeRelations), [hover, selected, activeRelations]);

  const matches = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return data.projects.filter(project => project.id !== HUB_ID && (mode === "schematic" || visibleIds.has(project.id)) && words.every(word =>
      normalize([project.name, text(project.tagline), t.categories[project.category]].join(" ")).includes(word))).slice(0, 8);
  }, [query, visibleIds, text, t, mode]);
  const matchIds = useMemo(() => new Set(matches.map(project => project.id)), [matches]);

  const select = useCallback((subject: Subject | null, center = false) => {
    setChosen(subject); setHover(null);
    if (subject?.kind === "node" && center) setFocus(previous => ({ id: subject.id, n: (previous?.n ?? 0) + 1 }));
  }, []);
  const onHover = useCallback((subject: Subject | null, point?: { x: number; y: number }) => setHover(subject && point ? { subject, ...point } : null), []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { setChosen(null); setHover(null); } };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const resetAll = () => { setQuery(""); setCategory(""); setStatus(""); setChosen(null); setRelations(defaultRelations); setReset(n => n + 1); };
  const projectCount = visibleNodes.filter(node => node.kind === "project").length;
  const totalProjects = full.nodes.filter(node => node.kind === "project").length;
  const hoverRelation = hover?.subject.kind === "edge" ? activeRelations.find(relation => relation.id === hover.subject.id) : undefined;
  const filtersApply = mode !== "schematic";

  return (
    <div className="container page">
      <PageHead title={t.blueprint.title} lead={t.blueprint.lead} />
      <div className="bp-shell">
        <form className="bp-controls" role="search" onSubmit={event => { event.preventDefault(); if (matches[0]) select({ kind: "node", id: matches[0].id }, true); }}>
          <SearchField label={t.blueprint.search} value={query} onChange={setQuery} placeholder={t.blueprint.searchPlaceholder} controls={query ? "bp-matches" : undefined} />
          <SelectField label={t.registry.destination} value={category} onChange={setCategory}>
            <option value="">{t.blueprint.allCategories}</option>
            {data.categories.map(id => <option key={id} value={id}>{t.categories[id]}</option>)}
          </SelectField>
          <SelectField label={t.blueprint.status} value={status} onChange={setStatus}>
            <option value="">{t.blueprint.allStatuses}</option>
            {(["active", "paused", "completed", "archived"] as Status[]).filter(id => data.stats.byStatus[id]).map(id => <option key={id} value={id}>{t.statuses[id]}</option>)}
          </SelectField>
          <div className="field">
            <span className="field-label" id="bp-mode-label">{t.modes.label}</span>
            <Segmented label={t.modes.label} value={mode} onChange={setMode}
              options={[{ value: "schematic", label: t.modes.schematic }, { value: "network", label: t.modes.network }, { value: "list", label: t.modes.list }]} />
          </div>
        </form>
        {query && (
          <div id="bp-matches" role="region" aria-live="polite" aria-label={t.blueprint.search}>
            {matches.length
              ? <div className="chips">{matches.map(project => <button key={project.id} type="button" className="chip" aria-pressed={selected?.kind === "node" && selected.id === project.id} onClick={() => select({ kind: "node", id: project.id }, true)}>{project.name}</button>)}</div>
              : <p className="muted small">{t.blueprint.noMatch}</p>}
          </div>
        )}
        <div className="bp-relations">
          {filtersApply && (
            <fieldset>
              <legend>{t.blueprint.relations}</legend>
              {relationKinds.map(kind => (
                <button key={kind} type="button" className="chip" aria-pressed={relations[kind]} onClick={() => setRelations(current => ({ ...current, [kind]: !current[kind] }))}>
                  <span className={`swatch ${kind}`} aria-hidden="true" />{t.blueprint.rel[kind]}
                </button>
              ))}
            </fieldset>
          )}
          <button type="button" className="button quiet small" onClick={resetAll}>{t.blueprint.reset}</button>
          {filtersApply && <span className="muted small" role="status" style={{ marginLeft: "auto" }}>{t.blueprint.showing(projectCount, totalProjects)}</span>}
        </div>
        <div className="bp-stage" data-mode={mode}>
          <Suspense fallback={<div className="bp-loading" role="status">{t.blueprint.loading}</div>}>
            {mode === "schematic" && <BlueprintSchematic relations={schematic} view={view} selected={selected} onSelect={subject => select(subject)} onHover={onHover} />}
            {mode === "network" && <BlueprintMap nodes={visibleNodes} relations={networkRelations} view={view} matches={matchIds} onSelect={subject => select(subject)} onHover={onHover} focus={focus} reset={reset} />}
            {mode === "list" && <BlueprintList nodes={visibleNodes} selected={selected} onSelect={id => select({ kind: "node", id })} />}
          </Suspense>
          <BlueprintPanel subject={selected} relations={activeRelations} onSelect={subject => select(subject, true)} onClear={() => select(null)} sheet={sheet && selected !== null} />
        </div>
        {hoverRelation && hover && (
          <div className="bp-tooltip" role="tooltip" style={{ left: Math.min(hover.x + 14, window.innerWidth - 300), top: hover.y + 16 }}>
            <strong><span className={`swatch ${legendOf(hoverRelation.kind)}`} aria-hidden="true" />{t.blueprint.rel[legendOf(hoverRelation.kind)]}</strong>
            <span>{nodeLabel(hoverRelation.source, t)} → {nodeLabel(hoverRelation.target, t)}</span>
            <span className="muted">{explain(hoverRelation, t)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function BlueprintList({ nodes, selected, onSelect }: { nodes: BlueprintNode[]; selected: Subject | null; onSelect: (id: string) => void }) {
  const { t, text } = useI18n();
  const isSelected = (id: string) => selected?.kind === "node" && selected.id === id;
  const categories = data.categories.filter(category => nodes.some(node => node.kind === "category" && node.category === category));
  return (
    <div className="bp-list">
      <p className="muted small">{t.blueprint.listCaption}</p>
      <div>
        <h2>{t.blueprint.hub}</h2>
        <ul><li><button type="button" aria-pressed={isSelected(HUB_ID)} onClick={() => onSelect(HUB_ID)}><strong>Ecosystem Config</strong><span className="sub">{t.blueprint.hubNote}</span></button></li></ul>
      </div>
      {categories.map(category => {
        const members = nodes.filter(node => node.kind === "project" && node.category === category);
        return (
          <section key={category} aria-labelledby={`list-${category}`}>
            <h2 id={`list-${category}`}>{t.categories[category]} <span className="muted small">{members.length}</span></h2>
            <ul>
              {members.map(node => (
                <li key={node.id}>
                  <button type="button" aria-pressed={isSelected(node.id)} onClick={() => onSelect(node.id)}>
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
