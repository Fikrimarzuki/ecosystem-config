import { useEffect, useState, type ReactNode } from "react";
import { data, registryUrl, repositoryUrl } from "../app/data";
import { useI18n, type Language } from "../app/i18n";
import { href, routePaths, type Route } from "../app/router";
import { useTheme } from "../app/theme";

// The brand links home, so Overview is not repeated in the navigation.
const navOrder = ["blueprint", "registry", "az", "connections", "health", "about", "guides"] as const;

function activePage(route: Route) {
  return route.page === "guide" ? "guides" : route.page;
}

export function Header({ route }: { route: Route }) {
  const { t, language, setLanguage } = useI18n();
  // The menu belongs to the route it was opened on, so navigating closes it without an effect.
  const [openOn, setOpenOn] = useState<Route | null>(null);
  const open = openOn === route;
  const setOpen = (value: boolean | ((current: boolean) => boolean)) => setOpenOn(typeof value === "function" ? (value(open) ? route : null) : value ? route : null);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpenOn(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);
  const current = activePage(route);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href={href("")} aria-current={route.page === "overview" ? "page" : undefined} aria-label={`${t.brand}, ${t.nav.overview}`}>
          <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" width={30} height={30} />
          <span className="brand-name">{t.brand}<span className="brand-note">{t.brandNote}</span></span>
        </a>
        <nav className="main-nav" id="main-nav" aria-label={t.primaryNav} data-open={open}>
          <ul>
            {navOrder.map(page => (
              <li key={page}><a href={href(routePaths[page])} aria-current={current === page ? "page" : undefined}>{t.nav[page]}</a></li>
            ))}
          </ul>
        </nav>
        <div className="header-tools">
          <div className="segmented sm" role="group" aria-label={t.language}>
            {(["en", "id"] as Language[]).map(code => (
              <button key={code} type="button" aria-pressed={language === code} lang={code} onClick={() => setLanguage(code)}
                title={code === "en" ? "English" : "Bahasa Indonesia"}>{code.toUpperCase()}</button>
            ))}
          </div>
          <ThemeToggle />
          <button type="button" className="icon-button menu-button" aria-expanded={open} aria-controls="main-nav"
            aria-label={open ? t.closeMenu : t.menu} onClick={() => setOpen(value => !value)}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              {open ? <path d="M5 5l10 10M15 5 5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

/** One icon button. It shows the current theme (sun or moon) and is labelled with the action it performs. */
function ThemeToggle() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  const next = theme === "light" ? "dark" : "light";
  const label = next === "dark" ? t.toDark : t.toLight;
  return (
    <button type="button" className="icon-button theme-toggle" data-theme={theme} aria-label={label} data-tooltip={label} onClick={() => setTheme(next)}>
      {theme === "light"
        ? <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="3.6" /><path d="M10 1.8v2.1M10 16.1v2.1M1.8 10h2.1M16.1 10h2.1M4.2 4.2l1.5 1.5M14.3 14.3l1.5 1.5M4.2 15.8l1.5-1.5M14.3 5.7l1.5-1.5" /></svg>
        : <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16.2 12.6A6.6 6.6 0 0 1 7.4 3.8a6.6 6.6 0 1 0 8.8 8.8Z" /></svg>}
    </button>
  );
}

export function Footer() {
  const { t, date } = useI18n();
  return (
    <footer className="site-footer">
      <div className="container footer-inner">
        <div className="stack">
          <strong>{t.brand}</strong>
          <span>{t.footer.tagline}</span>
          {data.generated.builtAt && <span className="small">{t.footer.snapshot(date(data.generated.builtAt))}</span>}
        </div>
        <ul>
          <li><a href={registryUrl}>{t.footer.registry}</a></li>
          <li><a href={repositoryUrl}>{t.footer.source}</a></li>
          <li><a href={`https://${data.generated.domain}/`}>{t.footer.gateway}</a></li>
        </ul>
      </div>
    </footer>
  );
}

export function OfflineNotice() {
  const { t, date } = useI18n();
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    // navigator.onLine can report "online" with no route to the server, so confirm with an uncached HEAD request
    // (the service worker only answers GET, so this always reaches the network).
    const update = () => {
      if (!navigator.onLine) { setOnline(false); return; }
      fetch(`${import.meta.env.BASE_URL}robots.txt?online=${Date.now()}`, { method: "HEAD", cache: "no-store" })
        .then(response => setOnline(response.ok || response.status < 500), () => setOnline(false));
    };
    update();
    window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (online) return null;
  return <div className="offline-notice" role="status">{t.offline(date(data.generated.builtAt))}</div>;
}

export function PageHead({ title, lead, children }: { title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <div className="page-head">
      <h1>{title}</h1>
      {lead && <p className="lead">{lead}</p>}
      {children}
    </div>
  );
}
