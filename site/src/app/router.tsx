import { useEffect, useState, type AnchorHTMLAttributes, type MouseEvent } from "react";

// A small history router. Every route is also a real file in the build (see scripts/postbuild.mjs),
// so deep links work on GitHub Pages without a server-side rewrite. Legacy guide URLs keep their
// "<slug>.html" form.
export type Route =
  | { page: "overview" } | { page: "blueprint" } | { page: "registry" } | { page: "connections" }
  | { page: "health" } | { page: "about" } | { page: "guides" } | { page: "guide"; slug: string } | { page: "not-found" };

const base = import.meta.env.BASE_URL;
export const href = (path: string) => `${base}${path.replace(/^\//, "")}`;

export const routePaths = { overview: "", blueprint: "blueprint/", registry: "registry/", connections: "connections/", health: "health/", about: "about/", guides: "README.html" } as const;
export const guideHref = (slug: string) => href(`${slug}.html`);

export function parseRoute(pathname: string, guideSlugs: ReadonlySet<string>): Route {
  let path = decodeURIComponent(pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\//, ""));
  if (path === "" || path === "index.html") return { page: "overview" };
  path = path.replace(/index\.html$/, "");
  for (const page of ["blueprint", "registry", "connections", "health", "about"] as const) {
    if (path === page || path === `${page}/`) return { page };
  }
  if (path === "README.html" || path === "README" || path === "guides/" || path === "guides") return { page: "guides" };
  const slug = path.replace(/\.html$/, "").replace(/\/$/, "");
  if (guideSlugs.has(slug)) return { page: "guide", slug };
  return { page: "not-found" };
}

const listeners = new Set<() => void>();
export function navigate(to: string, { replace = false } = {}) {
  const url = new URL(to, window.location.href);
  if (url.href === window.location.href) return;
  const samePage = url.pathname === window.location.pathname && url.search === window.location.search;
  window.history[replace ? "replaceState" : "pushState"]({}, "", url);
  for (const listener of listeners) listener();
  if (url.hash) requestAnimationFrame(() => document.getElementById(decodeURIComponent(url.hash.slice(1)))?.scrollIntoView());
  else if (!samePage) window.scrollTo({ top: 0 });
}

export function useLocation() {
  const [location, setLocation] = useState(() => ({ pathname: window.location.pathname, search: window.location.search, hash: window.location.hash }));
  useEffect(() => {
    const update = () => setLocation({ pathname: window.location.pathname, search: window.location.search, hash: window.location.hash });
    listeners.add(update);
    window.addEventListener("popstate", update);
    return () => { listeners.delete(update); window.removeEventListener("popstate", update); };
  }, []);
  return location;
}

/** Intercept same-origin, same-base clicks so the app navigates without a reload. */
export function isInternal(anchor: HTMLAnchorElement) {
  if (anchor.target && anchor.target !== "_self") return false;
  if (anchor.hasAttribute("download") || anchor.origin !== window.location.origin) return false;
  return anchor.pathname.startsWith(base) && !/\.(?:json|xml|txt|webp|png|svg|ico|webmanifest)$/.test(anchor.pathname);
}

export function onLinkClick(event: MouseEvent<HTMLElement>) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const anchor = (event.target as HTMLElement).closest("a");
  if (!anchor || !isInternal(anchor)) return;
  event.preventDefault();
  navigate(anchor.href);
}

export function Link(props: AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }) {
  const { to, ...rest } = props;
  return <a {...rest} href={to} />;
}
