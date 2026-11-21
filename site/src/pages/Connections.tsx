import { PageHead } from "../components/Shell";
import { data, legacyRegistryUrl, projectById, registryUrl, type Artifact } from "../app/data";
import { useI18n } from "../app/i18n";
import { href, routePaths } from "../app/router";

export default function Connections() {
  const { t } = useI18n();
  const groups: { artifact: Artifact; url: string; note: string }[] = [
    { artifact: "dist/ecosystem.json", url: registryUrl, note: t.connections.artifactDist },
    { artifact: "config/production.json", url: legacyRegistryUrl, note: t.connections.artifactLegacy },
  ];
  const siblings = [
    { id: "gateway", copy: t.connections.gateway },
    { id: "ecosystemAssets", copy: t.connections.assets },
    { id: "ecosystemSkills", copy: t.connections.skills },
  ];
  return (
    <div className="container page">
      <PageHead title={t.connections.title} lead={t.connections.lead} />
      <Schematic />
      <section className="section" aria-labelledby="artifacts-title">
        <div className="section-head"><h2 id="artifacts-title">{t.connections.artifacts}</h2><p className="muted">{t.connections.noNotify}</p></div>
        <div className="artifact-grid">
          {groups.map(group => {
            const readers = data.consumers.filter(consumer => consumer.artifact === group.artifact)
              .map(consumer => ({ consumer, project: projectById.get(consumer.projectId)! }))
              .sort((a, b) => a.project.name.localeCompare(b.project.name));
            return (
              <article key={group.artifact} className="artifact">
                <div className="stack" style={{ gap: 6 }}>
                  <a className="artifact-path" href={group.url}>{group.artifact}</a>
                  <p className="muted small">{group.note}</p>
                </div>
                <h3>{t.connections.readers(readers.length)}</h3>
                <ul className="consumer-list">
                  {readers.map(({ consumer, project }) => (
                    <li key={project.id}>
                      <a href={`${href(routePaths.registry)}?project=${project.id}`}>
                        <span>{project.name}</span>
                        {consumer.status !== "compatible" && <span className="consumer-flag">{t.connections.blocked}</span>}
                      </a>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </section>
      <section className="section" aria-labelledby="siblings-title">
        <div className="section-head"><h2 id="siblings-title">{t.connections.siblings}</h2></div>
        <div className="sibling-grid">
          {siblings.map(({ id, copy: [title, text] }) => (
            <div key={id} className="sibling">
              <h3>{projectById.has(id) ? <a href={`${href(routePaths.registry)}?project=${id}`}>{title}</a> : title}</h3>
              <p className="muted">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Schematic of the documented flow: sources → registry → two artifacts → consumers; siblings alongside. */
function Schematic() {
  const { t } = useI18n();
  const dist = data.stats.consumersByArtifact["dist/ecosystem.json"] ?? 0, legacy = data.stats.consumersByArtifact["config/production.json"] ?? 0;
  return (
    <figure className="plate" style={{ padding: "12px 12px 0" }}>
      <svg className="schematic" viewBox="0 0 900 300" role="img" aria-label={`${t.connections.artifacts}: dist/ecosystem.json (${t.connections.readers(dist)}), config/production.json (${t.connections.readers(legacy)}).`}>
        <rect className="box" x="20" y="110" width="170" height="80" rx="8" />
        <text x="105" y="145" textAnchor="middle" fontWeight="650">config/</text>
        <text className="caption" x="105" y="168" textAnchor="middle">{t.connections.schematic.sources}</text>
        <path className="wire" d="M190 150 H270" />
        <rect className="hub-box" x="270" y="100" width="190" height="100" rx="10" />
        <text className="hub-text" x="365" y="145" textAnchor="middle">Ecosystem Config</text>
        <text className="hub-text" x="365" y="168" textAnchor="middle" fontWeight="450" fontSize="13">{t.connections.schematic.pipeline}</text>
        <path className="wire" d="M460 130 C 520 130, 520 70, 560 70" />
        <path className="wire" d="M460 170 C 520 170, 520 230, 560 230" />
        <rect className="box" x="560" y="40" width="190" height="60" rx="8" />
        <text x="655" y="68" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="13">dist/ecosystem.json</text>
        <text className="caption" x="655" y="88" textAnchor="middle">{t.connections.readers(dist)}</text>
        <rect className="box" x="560" y="200" width="190" height="60" rx="8" />
        <text x="655" y="228" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="13">config/production.json</text>
        <text className="caption" x="655" y="248" textAnchor="middle">{t.connections.readers(legacy)}</text>
        <path className="wire" d="M750 70 H 830" /><path className="wire" d="M750 230 H 830" />
        <text className="caption" x="836" y="74">{t.connections.schematic.build}</text><text className="caption" x="836" y="234">{t.connections.schematic.build}</text>
        <path className="wire dashed" d="M365 200 V 270 H 300" />
        <text className="caption" x="292" y="274" textAnchor="end">{t.connections.schematic.assets}</text>
      </svg>
    </figure>
  );
}
