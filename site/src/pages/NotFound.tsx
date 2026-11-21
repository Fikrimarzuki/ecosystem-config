import { useI18n } from "../app/i18n";
import { href, routePaths } from "../app/router";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="container page">
      <div className="page-head">
        <h1>{t.notFound.title}</h1>
        <p className="lead">{t.notFound.text}</p>
        <div className="actions"><a className="button primary" href={href("")}>{t.notFound.home}</a><a className="button" href={href(routePaths.guides)}>{t.nav.guides}</a></div>
      </div>
    </div>
  );
}
