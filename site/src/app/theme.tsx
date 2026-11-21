import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Theme = "light" | "dark";
type ThemeState = { theme: Theme; setTheme: (theme: Theme) => void };
const Context = createContext<ThemeState | null>(null);
const colors: Record<Theme, string> = { light: "#FBFAF6", dark: "#0A1628" };

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // One explicit colour once the visitor has chosen, so the browser chrome follows the page.
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) meta.content = colors[theme];
    try { localStorage.setItem("ec.theme", theme); } catch { /* storage unavailable */ }
  }, [theme]);
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTheme() {
  const value = useContext(Context);
  if (!value) throw new Error("useTheme outside ThemeProvider");
  return value;
}

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
