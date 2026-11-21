import guideIndex from "../generated/guide-index.json";
import { BlueprintPlate } from "../components/BlueprintPlate";
import { data } from "../app/data";
import { useI18n } from "../app/i18n";
import { guideHref, href, routePaths } from "../app/router";

const featuredGuides = ["configuration", "projects", "consumers/integration", "showcase-publication-approvals"];

export default function Overview() {
  const { t } = useI18n();
  const max = Math.max(...Object.values(data.stats.byCategory).map(Number));
  const guides = featuredGuides.map(slug => guideIndex.find(guide => guide.slug === slug)).filter(guide => guide !== undefined);
  return (
    <div className="container page">
      <section className="hero" aria-labelledby="overview-title">
        <div className="hero-copy">
          <h1 id="overview-title" className="display">{t.overview.title}</h1>
          <p className="lead">{t.overview.lead}</p>
          <div className="actions">
            <a className="button primary" href={href(routePaths.blueprint)}>{t.overview.explore}</a>
            <a className="button" href={href(routePaths.guides)}>{t.overview.readGuides}</a>
          </div>
        </div>
        <BlueprintPlate />
      </section>

      <section className="section" aria-labelledby="flow-title">
        <div className="section-head"><h2 id="flow-title">{t.overview.flowTitle}</h2></div>
        <ol className="flow">
          {t.overview.flow.map(([title, text]) => <li key={title}><h3>{title}</h3><p className="muted">{text}</p></li>)}
        </ol>
      </section>

      <section className="section" aria-labelledby="categories-title">
        <div className="section-head"><h2 id="categories-title">{t.overview.categoriesTitle}</h2><p className="muted">{t.overview.categoriesLead}</p></div>
        <div className="category-ledger">
          {data.categories.map(category => {
            const count = data.stats.byCategory[category] ?? 0;
            return (
              <a key={category} className="category-row" href={`${href(routePaths.registry)}?category=${category}`}>
                <span className="category-name">{t.categories[category]}</span>
                <span className="category-track" aria-hidden="true"><span className="category-fill" style={{ width: `${(count / max) * 100}%` }} /></span>
                <span className="category-count">{count}</span>
              </a>
            );
          })}
        </div>
      </section>

      <section className="section" aria-labelledby="guides-title">
        <div className="section-head"><h2 id="guides-title">{t.overview.guidesTitle}</h2><p className="muted">{t.overview.guidesLead}</p></div>
        <div className="guide-list">
          {guides.map(guide => (
            <a key={guide.slug} className="guide-link" href={guideHref(guide.slug)} lang="en"><h3>{guide.title}</h3><p>{guide.summary}</p></a>
          ))}
        </div>
      </section>
    </div>
  );
}
