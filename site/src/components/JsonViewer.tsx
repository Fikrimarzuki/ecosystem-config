import { useMemo, useRef, useState, type ReactNode } from "react";
import { data, repositoryUrl, type Project } from "../app/data";
import { useI18n } from "../app/i18n";
import { Segmented } from "./Controls";

// The viewer serialises the exact object the site's single public projection (site/scripts/projection.mjs) produced for this
// project. It adds no fields, removes none and holds no allowlist of its own, so it can never show more than the projection allows.
// Source metadata is shown beside the JSON, never inside it, and only when the build recorded it.

const TOKEN = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],:])/g;

/** Syntax highlighting as React elements (no HTML injection). */
export function highlight(source: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0, index = 0;
  for (const match of source.matchAll(TOKEN)) {
    const at = match.index ?? 0;
    if (at > last) out.push(source.slice(last, at));
    const [text, key, string, literal, number] = match;
    const kind = key ? "key" : string ? "str" : literal ? "lit" : number ? "num" : "punct";
    out.push(<span key={index++} className={`j-${kind}`}>{key ? <>{key.slice(0, key.lastIndexOf('"') + 1)}<span className="j-punct">{key.slice(key.lastIndexOf('"') + 1)}</span></> : text}</span>);
    last = at + text.length;
  }
  if (last < source.length) out.push(source.slice(last));
  return out;
}

export const serialize = (project: Project, compact: boolean) => JSON.stringify(project, null, compact ? undefined : 2);

export function JsonViewer({ project }: { project: Project }) {
  const { t, date } = useI18n();
  const [compact, setCompact] = useState(false);
  const [status, setStatus] = useState<"" | "copied" | "failed">("");
  const timer = useRef<number | undefined>(undefined);
  const text = useMemo(() => serialize(project, compact), [project, compact]);
  const tokens = useMemo(() => highlight(text), [text]);
  const { generated } = data;

  const announce = (value: "copied" | "failed") => { setStatus(value); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setStatus(""), 2500); };
  const copy = async () => {
    const plain = serialize(project, compact);
    try { await navigator.clipboard.writeText(plain); announce("copied"); return; } catch { /* fall back below */ }
    try {
      const area = document.createElement("textarea");
      area.value = plain; area.setAttribute("readonly", ""); area.style.cssText = "position:fixed;opacity:0;top:0;left:0";
      document.body.appendChild(area); area.select();
      const ok = document.execCommand("copy"); area.remove(); announce(ok ? "copied" : "failed");
    } catch { announce("failed"); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([serialize(project, false) + "\n"], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url; link.download = `${project.id}.json`; document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="json-viewer">
      <p className="small muted">{t.json.note}</p>
      <dl className="json-meta">
        <div><dt>{t.json.version}</dt><dd>{generated.version}</dd></div>
        {generated.revision && <div><dt>{t.json.revision}</dt><dd><a href={`${repositoryUrl}/commit/${generated.revision}`} rel="noopener"><code>{generated.revision.slice(0, 7)}</code></a></dd></div>}
        {generated.builtAt && <div><dt>{t.json.snapshot}</dt><dd>{date(generated.builtAt)}</dd></div>}
      </dl>
      <div className="json-toolbar">
        <Segmented size="sm" label={t.json.format} value={compact ? "compact" : "formatted"} onChange={value => setCompact(value === "compact")}
          options={[{ value: "formatted", label: t.json.formatted }, { value: "compact", label: t.json.compact }]} />
        <button type="button" className="button small" onClick={copy}>{t.json.copy}</button>
        <button type="button" className="button small" onClick={download}>{t.json.download}</button>
        <span className="json-status" role="status" aria-live="polite">{status === "copied" ? t.json.copied : status === "failed" ? t.json.copyFailed : ""}</span>
      </div>
      <pre className={`json-code${compact ? " wrap" : ""}`} tabIndex={0} aria-label={`${t.json.label}: ${project.name}`} lang="en"><code>{tokens}</code></pre>
    </div>
  );
}
