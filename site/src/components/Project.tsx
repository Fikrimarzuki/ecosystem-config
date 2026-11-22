import { useEffect, useRef, type KeyboardEvent } from "react";
import { projectById, thumbnailSrc, type Project, type Status } from "../app/data";
import { useI18n } from "../app/i18n";
import { JsonViewer } from "./JsonViewer";

export function StatusBadge({ status }: { status: Status }) {
  const { t } = useI18n();
  return <span className="status" data-status={status}>{t.statuses[status]}</span>;
}

const initials = (name: string) => name.replace(/^FM\s+/, "").split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();

/** The approved screenshot, or a drafted monogram when the registry has none. Decorative: the name is always nearby. */
export function ProjectArtwork({ project, eager = false }: { project: Project; eager?: boolean }) {
  const src = thumbnailSrc(project);
  return (
    <div className="art">
      {src
        ? <img src={src} alt="" width={1280} height={720} loading={eager ? "eager" : "lazy"} decoding="async" />
        : <div className="art-fallback" aria-hidden="true"><span>{initials(project.name)}</span></div>}
    </div>
  );
}

export function useProjectText(project: Project) {
  const { text } = useI18n();
  return { summary: text(project.description) || text(project.tagline), tagline: text(project.tagline) };
}

export function ProjectFacts({ project }: { project: Project }) {
  const { t } = useI18n();
  return (
    <dl className="facts">
      <dt>{t.registry.destination}</dt><dd>{t.categories[project.category]}</dd>
      <dt>{t.registry.website}</dt>
      <dd>{project.website.length
        ? project.website.map(site => <div key={site.key}><a href={site.url} rel="noopener">{site.url.replace(/^https:\/\//, "")}</a></div>)
        : project.websiteWithheld ? t.registry.withheld : t.registry.noWebsite}</dd>
      <dt>{t.registry.repository}</dt>
      <dd>{project.repositoryUrl ? <a href={project.repositoryUrl} rel="noopener">{t.registry.source}</a> : t.registry.privateSource}</dd>
      <dt>{t.registry.consumer}</dt>
      <dd>{project.consumer?.artifact ? t.registry.readsRegistry(project.consumer.artifact) : t.registry.notConsumer}</dd>
      {project.technologies && <><dt>{t.registry.technologies}</dt><dd>{project.technologies.join(", ")}</dd></>}
      {project.related.length > 0 && <><dt>{t.registry.relatedProjects}</dt><dd>{project.related.map(id => projectById.get(id)?.name ?? id).join(", ")}</dd></>}
      <dt>{t.registry.sharedAssets}</dt><dd>{project.sharedAssets.length ? project.sharedAssets.join(", ") : "—"}</dd>
    </dl>
  );
}

export type DialogTab = "overview" | "json";

export function ProjectDialog({ project, tab = "overview", onTab, onClose }: { project: Project | null; tab?: DialogTab; onTab?: (tab: DialogTab) => void; onClose: () => void }) {
  const { t } = useI18n();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (project && !dialog.open) dialog.showModal();
    if (!project && dialog.open) dialog.close();
  }, [project]);
  return (
    <dialog ref={ref} className="dialog" aria-labelledby="project-dialog-title" onClose={onClose}
      onClick={event => { if (event.target === ref.current) onClose(); }}>
      {project && <DialogBody project={project} tab={tab} onTab={onTab} onClose={onClose} closeLabel={t.registry.close} />}
    </dialog>
  );
}

function DialogBody({ project, tab, onTab, onClose, closeLabel }: { project: Project; tab: DialogTab; onTab?: (tab: DialogTab) => void; onClose: () => void; closeLabel: string }) {
  const { t } = useI18n();
  const { summary, tagline } = useProjectText(project);
  return (
    <div className="dialog-inner">
      <div className="dialog-head">
        <div className="stack">
          <div className="card-meta"><StatusBadge status={project.status} /><span>{t.categories[project.category]}</span></div>
          <h2 id="project-dialog-title">{project.name}</h2>
          {tagline && tagline !== summary && <p className="muted">{tagline}</p>}
        </div>
        <button type="button" className="icon-button" onClick={onClose} aria-label={closeLabel}>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 5l10 10M15 5 5 15" /></svg>
        </button>
      </div>
      <div className="tabs" role="tablist" aria-label={t.json.tabs} onKeyDown={(event: KeyboardEvent) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const next: DialogTab = event.key === "Home" || event.key === "ArrowLeft" ? "overview" : "json";
        onTab?.(next); document.getElementById(`project-tab-${next}`)?.focus();
      }}>
        {(["overview", "json"] as DialogTab[]).map(name => (
          <button key={name} id={`project-tab-${name}`} type="button" role="tab" aria-selected={tab === name} aria-controls={`project-panel-${name}`} tabIndex={tab === name ? 0 : -1} onClick={() => onTab?.(name)}>
            {name === "overview" ? t.json.overview : "JSON"}
          </button>
        ))}
      </div>
      {tab === "overview"
        ? <div id="project-panel-overview" role="tabpanel" aria-labelledby="project-tab-overview" className="dialog-panel">
        <ProjectArtwork project={project} eager />
        {summary && <p>{summary}</p>}
        <ProjectFacts project={project} />
        <p className="small muted">{project.visibility === "public" ? t.registry.publicListing : t.registry.showcase}</p>
        {project.website[0] && <div className="actions"><a className="button primary" href={project.website[0].url} rel="noopener">{t.registry.visit}</a></div>}
        </div>
        : <div id="project-panel-json" role="tabpanel" aria-labelledby="project-tab-json" className="dialog-panel"><JsonViewer project={project} /></div>}
    </div>
  );
}
