import { useMemo } from "react";
import { PageHead } from "../components/Shell";
import { SearchField, SelectField } from "../components/Controls";
import { linkLabel, ProjectArtwork, StatusBadge } from "../components/Project";
import { caseThumbnailSrc, data, projectById, type Showcase } from "../app/data";
import { useI18n } from "../app/i18n";
import { href, navigate, routePaths, useLocation } from "../app/router";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const normalize = (value: string) => value.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
/** Same sort rule Gateway documents: ignore only an exact leading "FM " brand. */
const sortKey = (title: string) => title.trim().startsWith("FM ") ? title.trim().slice(3) : title.trim();
const letterOf = (title: string) => { const first = normalize(sortKey(title)).charAt(0).toUpperCase(); return /^[A-Z]$/.test(first) ? first : "#"; };
type Kind = Showcase["kind"];

export default function AZ() {
  const { t, text, language } = useI18n();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const query = params.get("q") ?? "";
  const letter = params.get("letter") ?? "";
  const kind = (params.get("type") ?? "") as Kind | "";
  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(location.search);
    for (const [key, value] of Object.entries(changes)) if (value) next.set(key, value); else next.delete(key);
    const search = next.toString();
    navigate(`${location.pathname}${search ? `?${search}` : ""}`, { replace: true });
  };

  const describe = (entry: Showcase) => entry.kind === "project"
    ? text(projectById.get(entry.projectId)?.description) || text(projectById.get(entry.projectId)?.tagline)
    : text({ en: entry.description.en ?? "", id: entry.description.id });
  const collator = useMemo(() => new Intl.Collator(language, { sensitivity: "base", numeric: true }), [language]);
  const filtered = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    return data.showcases
      .filter(entry => (!kind || entry.kind === kind) && words.every(word => normalize(`${entry.title} ${describe(entry)}`).includes(word)))
      .sort((a, b) => collator.compare(sortKey(a.title), sortKey(b.title)) || collator.compare(a.title, b.title));
  // describe reads the current language through text().
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, kind, collator, text]);
  const available = useMemo(() => new Set(filtered.map(entry => letterOf(entry.title))), [filtered]);
  const shown = letter ? filtered.filter(entry => letterOf(entry.title) === letter) : filtered;
  const groups = useMemo(() => {
    const map = new Map<string, Showcase[]>();
    for (const entry of shown) { const key = letterOf(entry.title); map.set(key, [...(map.get(key) ?? []), entry]); }
    return [...map];
  }, [shown]);
  const kinds = (["project", "concept", "case"] as Kind[]).filter(value => data.showcases.some(entry => entry.kind === value));

  return (
    <div className="container page">
      <PageHead title={t.az.title} lead={t.az.lead(data.showcases.length)}><p className="muted small">{t.az.note}</p></PageHead>
      <div className="az-tools">
        <form className="az-filters" role="search" onSubmit={event => event.preventDefault()}>
          <SearchField label={t.az.search} value={query} placeholder={t.az.placeholder} onChange={value => update({ q: value.trim() ? value : null })} />
          <SelectField label={t.az.typeFilter} value={kind} onChange={value => update({ type: value || null })}>
            <option value="">{t.az.allTypes}</option>
            {kinds.map(value => <option key={value} value={value}>{t.az.types[value]} ({data.showcases.filter(entry => entry.kind === value).length})</option>)}
          </SelectField>
        </form>
        <nav className="az-rail" aria-label={t.az.letters}>
          <button type="button" className="az-letter all" aria-pressed={!letter} onClick={() => update({ letter: null })}>{t.az.all}</button>
          {[...LETTERS, "#"].filter(value => value !== "#" || available.has("#")).map(value => (
            <button key={value} type="button" className="az-letter" aria-pressed={letter === value} disabled={!available.has(value)}
              aria-label={t.az.jump(value)} onClick={() => update({ letter: letter === value ? null : value })}>{value}</button>
          ))}
        </nav>
        <p className="az-count" role="status">{t.az.count(shown.length)}</p>
      </div>
      {groups.length === 0
        ? <div className="empty"><p>{t.az.none}</p><button type="button" className="button" onClick={() => update({ q: null, letter: null, type: null })}>{t.az.clear}</button></div>
        : groups.map(([key, entries]) => (
          <section key={key} className="az-drawer" aria-labelledby={`az-${key}`}>
            <header className="az-drawer-head">
              <h2 id={`az-${key}`} className="az-drawer-letter">{key}</h2>
              <span className="az-drawer-count">{t.az.count(entries.length)}</span>
            </header>
            <ol className="az-cards">{entries.map((entry, index) => <li key={entry.handle}><IndexCard entry={entry} number={`${key}–${String(index + 1).padStart(2, "0")}`} summary={describe(entry)} /></li>)}</ol>
          </section>
        ))}
    </div>
  );
}

function IndexCard({ entry, number, summary }: { entry: Showcase; number: string; summary: string }) {
  const { t } = useI18n();
  const project = entry.kind === "project" ? projectById.get(entry.projectId) : undefined;
  const image = caseThumbnailSrc(entry);
  return (
    <article className="az-card" data-kind={entry.kind} aria-labelledby={`card-${entry.handle}`}>
      {project ? <ProjectArtwork project={project} /> : image
        ? <div className="art"><img src={image} alt="" width={1280} height={720} loading="lazy" decoding="async" /></div>
        : <div className="art"><div className="art-fallback" aria-hidden="true"><span>{entry.title.replace(/^FM\s+/, "").split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase()}</span></div></div>}
      <div className="az-card-body">
        <div className="az-card-meta">
          <span className="az-number" aria-hidden="true">{number}</span>
          <span className="tag">{t.az.types[entry.kind]}</span>
          {project && <StatusBadge status={project.status} />}
          {entry.kind === "concept" && entry.status && <span className="status" data-status="planned">{t.lifecycle[entry.status] ?? entry.status}</span>}
          {entry.kind === "case" && entry.year && <span className="muted small">{entry.year}</span>}
        </div>
        <h3 id={`card-${entry.handle}`} className="az-card-title">{entry.title}</h3>
        {summary ? <p className="card-summary">{summary}</p> : <p className="card-summary muted small">{t.registry.noSummary}</p>}
        {entry.kind === "case" && entry.technologies?.length ? <p className="small muted">{t.az.technologies}: {entry.technologies.join(", ")}</p> : null}
        {project && (
          <div className="card-actions">
            <a className="button small" href={`${href(routePaths.registry)}?project=${project.id}`}>{t.az.details}</a>
            {project.website[0] ? <a className="button small quiet" href={project.website[0].url} rel="noopener">{linkLabel(project, t.registry)}</a> : <span className="muted small">{t.az.noLink}</span>}
          </div>
        )}
      </div>
    </article>
  );
}
