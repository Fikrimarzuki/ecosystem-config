import { useMemo, useState } from "react";
import { PageHead } from "../components/Shell";
import { ProjectArtwork, ProjectDialog, StatusBadge, useProjectText } from "../components/Project";
import { data, projectById, type Category, type Project, type Status } from "../app/data";
import { useI18n } from "../app/i18n";
import { navigate, useLocation } from "../app/router";

const statuses: Status[] = ["active", "paused", "completed", "archived"];
const normalize = (value: string) => value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();

export default function Registry() {
  const { t, text } = useI18n();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const query = params.get("q") ?? "";
  const category = (params.get("category") ?? "") as Category | "";
  const status = (params.get("status") ?? "") as Status | "";
  const layout = params.get("layout") === "list" ? "list" : "cards";
  const selected = projectById.get(params.get("project") ?? "") ?? null;
  const [draft, setDraft] = useState(query);

  // Filters live in the URL so a filtered view can be shared and survives a reload.
  const update = (changes: Record<string, string | null>, replace = true) => {
    const next = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(changes)) if (value) next.set(key, value); else next.delete(key);
    const search = next.toString();
    navigate(`${location.pathname}${search ? `?${search}` : ""}`, { replace });
  };

  const results = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    return data.projects.filter(project => (!category || project.category === category) && (!status || project.status === status)
      && words.every(word => normalize([project.name, text(project.tagline), text(project.description), t.categories[project.category], ...(project.technologies ?? [])].join(" ")).includes(word)))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query, category, status, text, t]);

  return (
    <div className="container page">
      <PageHead title={t.registry.title} lead={t.registry.lead(data.stats.described, data.stats.projects)} />
      <form className="toolbar" role="search" onSubmit={event => { event.preventDefault(); update({ q: draft.trim() || null }); }}>
        <label className="field">{t.registry.search}
          <input className="input" type="search" value={draft} placeholder={t.registry.placeholder}
            onChange={event => { setDraft(event.target.value); update({ q: event.target.value.trim() || null }); }} />
        </label>
        <label className="field">{t.registry.destination}
          <select className="select" value={category} onChange={event => update({ category: event.target.value || null })}>
            <option value="">{t.blueprint.allCategories}</option>
            {data.categories.map(id => <option key={id} value={id}>{t.categories[id]} ({data.stats.byCategory[id] ?? 0})</option>)}
          </select>
        </label>
        <label className="field">{t.blueprint.status}
          <select className="select" value={status} onChange={event => update({ status: event.target.value || null })}>
            <option value="">{t.blueprint.allStatuses}</option>
            {statuses.filter(id => data.projects.some(project => project.status === id)).map(id => <option key={id} value={id}>{t.statuses[id]}</option>)}
          </select>
        </label>
        <div className="segmented" role="group" aria-label={t.registry.layout}>
          <button type="button" aria-pressed={layout === "cards"} onClick={() => update({ layout: null })}>{t.registry.cards}</button>
          <button type="button" aria-pressed={layout === "list"} onClick={() => update({ layout: "list" })}>{t.registry.rows}</button>
        </div>
      </form>
      <div className="result-bar">
        <span role="status">{t.registry.results(results.length)}</span>
        {(query || category || status) && <button type="button" className="button quiet small" onClick={() => { setDraft(""); update({ q: null, category: null, status: null }); }}>{t.registry.clearFilters}</button>}
      </div>
      {results.length === 0
        ? <div className="empty"><p>{t.registry.none}</p><button type="button" className="button" onClick={() => { setDraft(""); update({ q: null, category: null, status: null }); }}>{t.registry.clearFilters}</button></div>
        : layout === "cards"
          ? <ul className="card-grid">{results.map(project => <li key={project.id}><ProjectCard project={project} onOpen={() => update({ project: project.id }, false)} /></li>)}</ul>
          : <ul className="row-list">{results.map(project => <ProjectRow key={project.id} project={project} onOpen={() => update({ project: project.id }, false)} />)}</ul>}
      <ProjectDialog project={selected} onClose={() => update({ project: null })} />
    </div>
  );
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const { t } = useI18n();
  const { summary } = useProjectText(project);
  return (
    <article className="project-card" aria-labelledby={`card-${project.id}`}>
      <ProjectArtwork project={project} />
      <div className="card-body">
        <div className="card-meta"><StatusBadge status={project.status} /><span>{t.categories[project.category]}</span></div>
        <h2 className="card-title" id={`card-${project.id}`}>{project.name}</h2>
        <p className="card-summary">{summary || <span className="muted small">{t.registry.noSummary}</span>}</p>
        <div className="card-actions">
          <button type="button" className="button small" onClick={onOpen} aria-label={`${t.registry.details}: ${project.name}`}>{t.registry.details}</button>
          {project.website[0] && <a className="button small quiet" href={project.website[0].url} rel="noopener" aria-label={`${t.registry.visit}: ${project.name}`}>{t.registry.visit}</a>}
        </div>
      </div>
    </article>
  );
}

function ProjectRow({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const { t } = useI18n();
  const { summary } = useProjectText(project);
  return (
    <li className="row-item">
      <ProjectArtwork project={project} />
      <div className="stack" style={{ gap: 4 }}>
        <h2 className="card-title">{project.name}</h2>
        <div className="card-meta"><StatusBadge status={project.status} /><span>{t.categories[project.category]}</span></div>
      </div>
      <p className="card-summary row-summary">{summary || <span className="muted small">{t.registry.noSummary}</span>}</p>
      <div className="card-actions row-actions">
        <button type="button" className="button small" onClick={onOpen} aria-label={`${t.registry.details}: ${project.name}`}>{t.registry.details}</button>
        {project.website[0] && <a className="button small quiet" href={project.website[0].url} rel="noopener" aria-label={`${t.registry.visit}: ${project.name}`}>{t.registry.visit}</a>}
      </div>
    </li>
  );
}
