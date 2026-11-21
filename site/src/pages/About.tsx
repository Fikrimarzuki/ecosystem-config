import { PageHead } from "../components/Shell";
import { legacyRegistryUrl, registryUrl, repositoryUrl } from "../app/data";
import { useI18n } from "../app/i18n";
import { guideHref } from "../app/router";

export default function About() {
  const { t } = useI18n();
  return (
    <div className="container page">
      <PageHead title={t.about.title} lead={t.about.lead} />
      <ol className="pipeline" aria-label={t.about.pipeline}>
        {t.about.pipelineSteps.map(([title, text]) => <li key={title}><h2 className="step-title">{title}</h2><p className="muted small">{text}</p></li>)}
      </ol>
      <div className="two-col section">
        <section aria-labelledby="owns"><h2 id="owns">{t.about.owns}</h2><ul className="ruled-list" style={{ marginTop: 16 }}>{t.about.ownsList.map(item => <li key={item}>{item}</li>)}</ul></section>
        <section aria-labelledby="not"><h2 id="not">{t.about.not}</h2><ul className="ruled-list" style={{ marginTop: 16 }}>{t.about.notList.map(item => <li key={item}>{item}</li>)}</ul></section>
      </div>
      <section className="section" aria-labelledby="privacy" style={{ maxWidth: "48rem" }}>
        <h2 id="privacy">{t.about.privacy}</h2>
        <p className="muted" style={{ marginTop: 12 }}>{t.about.privacyText}</p>
        <p style={{ marginTop: 12 }}><a href={guideHref("projects")}>{t.nav.guides}: Projects and deployments</a></p>
      </section>
      <section className="section" aria-labelledby="endpoints" style={{ maxWidth: "48rem" }}>
        <h2 id="endpoints">{t.about.endpoints}</h2>
        <p className="muted" style={{ margin: "10px 0 12px" }}>{t.about.endpointsNote}</p>
        <div className="endpoint"><strong>dist/ecosystem.json</strong><a href={registryUrl}><code>{registryUrl}</code></a></div>
        <div className="endpoint"><strong>config/production.json</strong><a href={legacyRegistryUrl}><code>{legacyRegistryUrl}</code></a></div>
        <div className="endpoint"><strong>schema/</strong><a href={`${repositoryUrl}/tree/main/schema`}><code>{`${repositoryUrl}/tree/main/schema`}</code></a></div>
      </section>
    </div>
  );
}
