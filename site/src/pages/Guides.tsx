import { useEffect, useMemo, useState } from "react";
import guideIndex from "../generated/guide-index.json";
import { repositoryUrl } from "../app/data";
import { useI18n } from "../app/i18n";
import { guideHref, useLocation } from "../app/router";

type Guide = (typeof guideIndex)[number] & { html: string };
const sectionOrder = ["reference", "building", "approvals", "records"];
let cache: Promise<Guide[]> | null = null;
const loadGuides = () => (cache ??= import("../generated/guides.json").then(module => module.default as Guide[]));

function GuideNav({ current, query }: { current?: string; query: string }) {
  const { t } = useI18n();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const visible = guideIndex.filter(guide => words.every(word => [guide.title, guide.summary, ...guide.headings.map(h => h.text)].join(" ").toLowerCase().includes(word)));
  return (
    <>
      {sectionOrder.map(section => {
        const items = visible.filter(guide => guide.section === section);
        if (!items.length) return null;
        return (
          <div key={section}>
            <h2>{t.guides.sections[section]}</h2>
            <ul>{items.map(guide => <li key={guide.slug}><a href={guideHref(guide.slug)} aria-current={guide.slug === current ? "page" : undefined} lang="en">{guide.title}</a></li>)}</ul>
          </div>
        );
      })}
      {!visible.length && <p className="muted small" style={{ marginTop: 12 }}>{t.guides.none}</p>}
    </>
  );
}

export function GuidesIndex() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  return (
    <div className="container page">
      <div className="page-head"><h1>{t.guides.title}</h1><p className="lead">{t.guides.lead}</p></div>
      <label className="field" style={{ maxWidth: 420, marginBottom: 24 }}>{t.guides.filter}
        <input className="input" type="search" value={query} onChange={event => setQuery(event.target.value)} />
      </label>
      {sectionOrder.map(section => {
        const words = query.toLowerCase().split(/\s+/).filter(Boolean);
        const items = guideIndex.filter(guide => guide.section === section && words.every(word => [guide.title, guide.summary, ...guide.headings.map(h => h.text)].join(" ").toLowerCase().includes(word)));
        if (!items.length) return null;
        return (
          <section key={section} className="section" style={{ marginTop: 40 }} aria-labelledby={`section-${section}`}>
            <h2 id={`section-${section}`} style={{ marginBottom: 12 }}>{t.guides.sections[section]}</h2>
            <div className="guide-list">{items.map(guide => <a key={guide.slug} className="guide-link" href={guideHref(guide.slug)} lang="en"><h3>{guide.title}</h3><p>{guide.summary}</p></a>)}</div>
          </section>
        );
      })}
    </div>
  );
}

export function GuidePage({ slug }: { slug: string }) {
  const { t, language } = useI18n();
  const location = useLocation();
  const [guides, setGuides] = useState<Guide[] | null>(null);
  useEffect(() => { let live = true; loadGuides().then(list => { if (live) setGuides(list); }); return () => { live = false; }; }, []);
  const guide = useMemo(() => guides?.find(item => item.slug === slug), [guides, slug]);
  const meta = guideIndex.find(item => item.slug === slug)!;
  useEffect(() => {
    if (!guide || !location.hash) return;
    document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  }, [guide, location.hash]);
  return (
    <div className="container page">
      <div className="guides-layout">
        <nav className="guides-nav" aria-label={t.guides.all}><GuideNav current={slug} query="" /></nav>
        <article className="prose" lang="en">
          {language === "id" && <p className="notice" lang="id">{t.guides.englishOnly}</p>}
          {guide ? <div dangerouslySetInnerHTML={{ __html: guide.html }} /> : <><h1>{meta.title}</h1><p className="muted" role="status">{t.guides.loading}</p></>}
          <div className="guide-foot"><a href={`${repositoryUrl}/edit/main/docs/${slug}.md`} rel="noopener">{t.guides.edit}</a></div>
        </article>
        {meta.headings.length > 1 && (
          <nav className="toc" aria-label={t.guides.onPage}>
            <h2>{t.guides.onPage}</h2>
            <ul>{meta.headings.map(heading => <li key={heading.id} className={`level-${heading.level}`}><a href={`#${heading.id}`}>{heading.text}</a></li>)}</ul>
          </nav>
        )}
      </div>
    </div>
  );
}
