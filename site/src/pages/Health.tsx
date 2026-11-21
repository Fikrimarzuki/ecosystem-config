import { PageHead } from "../components/Shell";
import { data, repositoryUrl, type Status } from "../app/data";
import { useI18n } from "../app/i18n";

export default function Health() {
  const { t, date } = useI18n();
  const { generated, stats } = data;
  const validation = generated.validation;
  const rows = (pairs: [string, number | string | null | undefined][]) => pairs.flatMap(([label, value]) => [
    <dt key={`${label}-t`}>{label}</dt>, <dd key={`${label}-d`}>{value ?? t.health.unknown}</dd>,
  ]);
  return (
    <div className="container page">
      <PageHead title={t.health.title} lead={t.health.lead} />
      <dl className="stamp">
        <div><dt>{t.health.builtAt}</dt><dd>{generated.builtAt ? date(generated.builtAt) : t.health.unknown}</dd></div>
        <div><dt>{t.health.revision}</dt><dd>{generated.revision
          ? <a href={`${repositoryUrl}/commit/${generated.revision}`}><code>{generated.revision.slice(0, 7)}</code></a> : t.health.unknown}</dd></div>
        <div><dt>{t.health.validation}</dt><dd>{validation
          ? validation.ok ? <span className="check">{t.health.passed}</span> : <span className="fail">{t.health.failed}, {t.health.errors(validation.errors)}</span>
          : t.health.unknown}</dd></div>
      </dl>
      <div className="ledger-grid section" style={{ marginTop: 28 }}>
        <section className="ledger" aria-labelledby="inventory">
          <h2 id="inventory">{t.health.inventory}</h2>
          <dl>{rows([
            [t.health.projects, stats.projects], [t.health.listed, stats.listingPublic], [t.health.described, stats.described],
            [t.health.deployments, stats.deployments], [t.health.thumbnails, stats.thumbnails], [t.health.publicRepos, stats.publicRepositories],
            [t.health.schemas, stats.schemas],
          ])}</dl>
        </section>
        <section className="ledger" aria-labelledby="lifecycle">
          <h2 id="lifecycle">{t.health.statuses}</h2>
          <dl>{rows((["active", "paused", "completed", "archived"] as Status[]).map(status => [t.statuses[status], stats.byStatus[status] ?? 0]))}</dl>
        </section>
        <section className="ledger" aria-labelledby="publication">
          <h2 id="publication">{t.health.publication}</h2>
          <dl>{rows([[t.health.memberships, stats.showcases], [t.health.grants, stats.showcaseGrants], [t.health.eligibility, stats.showcaseEligibility]])}</dl>
        </section>
        <section className="ledger" aria-labelledby="collections">
          <h2 id="collections">{t.health.collections}</h2>
          <dl>{rows([
            [t.health.experience, stats.career.experience], [t.health.freelance, stats.career.freelance], [t.health.assessments, stats.career.assessments],
            [t.health.origins, stats.origins], [t.health.concepts, stats.concepts],
          ])}</dl>
        </section>
        <section className="ledger" aria-labelledby="consumers">
          <h2 id="consumers">{t.health.consumers}</h2>
          <dl>{rows([[t.health.compatible, stats.consumersByStatus.compatible ?? 0], [t.health.blocked, stats.consumersByStatus.blocked ?? 0]])}</dl>
        </section>
      </div>
      <section className="section" aria-labelledby="how" style={{ maxWidth: "48rem" }}>
        <h2 id="how">{t.health.how}</h2>
        <p className="muted" style={{ marginTop: 10 }}>{t.health.howText}</p>
      </section>
    </div>
  );
}
