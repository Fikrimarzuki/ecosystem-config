import { lazy, Suspense, useEffect, useMemo } from "react";
import guideIndex from "./generated/guide-index.json";
import { Footer, Header, OfflineNotice } from "./components/Shell";
import { useI18n } from "./app/i18n";
import { onLinkClick, parseRoute, useLocation, type Route } from "./app/router";
import Overview from "./pages/Overview";

const Blueprint = lazy(() => import("./pages/Blueprint"));
const Registry = lazy(() => import("./pages/Registry"));
const Connections = lazy(() => import("./pages/Connections"));
const Health = lazy(() => import("./pages/Health"));
const About = lazy(() => import("./pages/About"));
const GuidesIndex = lazy(() => import("./pages/Guides").then(module => ({ default: module.GuidesIndex })));
const GuidePage = lazy(() => import("./pages/Guides").then(module => ({ default: module.GuidePage })));
const NotFound = lazy(() => import("./pages/NotFound"));

const guideSlugs = new Set(guideIndex.map(guide => guide.slug));

function Page({ route }: { route: Route }) {
  switch (route.page) {
    case "overview": return <Overview />;
    case "blueprint": return <Blueprint />;
    case "registry": return <Registry />;
    case "connections": return <Connections />;
    case "health": return <Health />;
    case "about": return <About />;
    case "guides": return <GuidesIndex />;
    case "guide": return <GuidePage slug={route.slug} />;
    default: return <NotFound />;
  }
}

export default function App() {
  const { t } = useI18n();
  const location = useLocation();
  const route = useMemo(() => parseRoute(location.pathname, guideSlugs), [location.pathname]);
  useEffect(() => {
    const titles: Partial<Record<Route["page"], string>> = {
      blueprint: t.blueprint.title, registry: t.registry.title, connections: t.connections.title, health: t.health.title,
      about: t.about.title, guides: t.guides.title, "not-found": t.notFound.title,
    };
    const name = route.page === "guide" ? guideIndex.find(guide => guide.slug === route.slug)?.title : titles[route.page];
    document.title = name ? `${name} | Ecosystem Config` : `Ecosystem Config: ${t.overview.title.replace(/\.$/, "")}`;
  }, [route, t]);
  // Move focus to the new page's main region after client-side navigation (not on first load).
  useEffect(() => {
    if (!sessionStorage.getItem("ec.nav")) { sessionStorage.setItem("ec.nav", "1"); return; }
    if (!location.hash) document.getElementById("main")?.focus({ preventScroll: true });
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div onClick={onLinkClick}>
      <a className="skip-link" href="#main">{t.skip}</a>
      <OfflineNotice />
      <Header route={route} />
      <main id="main" tabIndex={-1} style={{ outline: "none" }}>
        <Suspense fallback={<div className="container page" aria-busy="true" />}>
          <Page route={route} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
