import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from "react";
import { data, type Category } from "../app/data";
import { useI18n } from "../app/i18n";
import { href, routePaths } from "../app/router";
import { prefersReducedMotion } from "../app/theme";

// Exploded axonometric drawing of the registry, drawn from real data:
//   base tier   = the destinations, one block each, height proportional to publicly described projects;
//   middle tier = Ecosystem Config (sources assembled, validated and tested);
//   top tier    = the generated files and shared assets, with their documented consumer counts.
// The entrance animation runs once (CSS); reduced motion shows the final drawing immediately.

const C = Math.cos(Math.PI / 6), S = 0.5;
const iso = (x: number, y: number, z: number): [number, number] => [(x - y) * C, (x + y) * S - z];
const pts = (list: [number, number, number][]) => list.map(([x, y, z]) => iso(x, y, z).map(v => v.toFixed(1)).join(",")).join(" ");
const CELL = 150, BLOCK = 104, CORE_Z = 300, CORE_T = 14, TOP_Z = 450, TILE_T = 10;
const GRID = 2 * CELL + BLOCK;

type Part = { id: string; kind: "block" | "core" | "tile"; x0: number; y0: number; x1: number; y1: number; z0: number; z1: number; category?: Category };

function box({ x0, y0, x1, y1, z0, z1 }: Part) {
  return {
    top: pts([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]),
    left: pts([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]),
    right: pts([[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]]),
  };
}

/** Outer outline of a block: what the highlight traces. */
function silhouette({ x0, y0, x1, y1, z0, z1 }: Part) {
  return pts([[x0, y0, z1], [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], [x0, y1, z1]]);
}

/** Measurement ticks along the two front ground edges (every 50 units, a longer one every 150). */
function ticks(part: Part) {
  const marks: { key: string; a: [number, number]; b: [number, number]; major: boolean }[] = [];
  for (let u = 0, i = 0; part.x0 + u <= part.x1; u += 50, i += 1) {
    const x = part.x0 + u, major = i % 3 === 0;
    marks.push({ key: `x${i}`, a: iso(x, part.y1, 0), b: iso(x, part.y1 + (major ? 16 : 9), 0), major });
  }
  for (let u = 0, i = 0; part.y0 + u <= part.y1; u += 50, i += 1) {
    const y = part.y0 + u, major = i % 3 === 0;
    marks.push({ key: `y${i}`, a: iso(part.x1, y, 0), b: iso(part.x1 + (major ? 16 : 9), y, 0), major });
  }
  return marks;
}

export function AssemblyDrawing() {
  const { t } = useI18n();
  const [active, setActive] = useState<string | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  // Once the entrance has played, its animations are removed so nothing keeps running; the drawing stays interactive throughout.
  const [settled, setSettled] = useState(() => prefersReducedMotion());
  useEffect(() => {
    if (settled) return;
    const timer = window.setTimeout(() => setSettled(true), 3400);
    return () => window.clearTimeout(timer);
  }, [settled]);
  const current = pinned ?? active;
  const s = data.stats;
  const distReaders = s.consumersByArtifact["dist/ecosystem.json"] ?? 0;
  const prodReaders = s.consumersByArtifact["config/production.json"] ?? 0;

  const parts = useMemo<Part[]>(() => {
    const blocks = data.categories.slice(0, 9).map((category, index): Part => {
      const row = Math.floor(index / 3), col = index % 3;
      const count = data.stats.byCategory[category] ?? 0;
      return { id: `dest:${category}`, kind: "block", category, x0: col * CELL, y0: row * CELL, x1: col * CELL + BLOCK, y1: row * CELL + BLOCK, z0: 0, z1: 16 + count * 8 };
    });
    return [
      ...blocks.sort((a, b) => (a.x0 + a.y0) - (b.x0 + b.y0)),
      { id: "core", kind: "core", x0: -24, y0: -24, x1: GRID + 24, y1: GRID + 24, z0: CORE_Z, z1: CORE_Z + CORE_T },
      { id: "dist", kind: "tile", x0: 0, y0: 30, x1: 190, y1: 170, z0: TOP_Z, z1: TOP_Z + TILE_T },
      { id: "prod", kind: "tile", x0: 214, y0: 30, x1: GRID, y1: 170, z0: TOP_Z, z1: TOP_Z + TILE_T },
      { id: "assets", kind: "tile", x0: 107, y0: 214, x1: 297, y1: 340, z0: TOP_Z, z1: TOP_Z + TILE_T },
    ];
  }, []);

  const describe = (id: string): { title: string; text: string; to: string } => {
    if (id === "core") return { title: t.assembly.core.title, text: t.assembly.core.text(s.schemas ?? 0), to: href(routePaths.about) };
    if (id === "dist") return { title: t.assembly.dist.title, text: t.assembly.dist.text(distReaders), to: href(routePaths.connections) };
    if (id === "prod") return { title: t.assembly.prod.title, text: t.assembly.prod.text(prodReaders), to: href(routePaths.connections) };
    if (id === "assets") return { title: t.assembly.assets.title, text: t.assembly.assets.text(s.thumbnails), to: href(routePaths.connections) };
    const category = id.slice(5) as Category;
    return { title: t.categories[category], text: t.assembly.destination(t.categories[category], s.byCategory[category] ?? 0), to: `${href(routePaths.registry)}?category=${category}` };
  };

  // Every projected point, for a tight viewBox with room for annotations.
  const corners = parts.flatMap(part => [[part.x0, part.y0, part.z1], [part.x1, part.y0, part.z0], [part.x0, part.y1, part.z0], [part.x1, part.y1, part.z0], [part.x0, part.y0, part.z0]] as [number, number, number][]).map(([x, y, z]) => iso(x, y, z));
  const minX = Math.min(...corners.map(p => p[0])) - 90, maxX = Math.max(...corners.map(p => p[0])) + 190;
  const minY = Math.min(...corners.map(p => p[1])) - 70, maxY = Math.max(...corners.map(p => p[1])) + 40;
  const core = parts.find(part => part.id === "core")!;

  const interact = (id: string) => ({
    role: "button", tabIndex: 0, "aria-label": `${describe(id).title}. ${describe(id).text}`,
    "data-active": current === id || undefined, "data-dim": (current && current !== id) || undefined,
    onMouseEnter: () => setActive(id), onMouseLeave: () => setActive(null), onFocus: () => setActive(id), onBlur: () => setActive(null),
    onClick: () => setPinned(value => value === id ? null : id),
    onKeyDown: (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setPinned(value => value === id ? null : id); } if (event.key === "Escape") setPinned(null); },
  });

  const ids = parts.map(part => part.id);
  const order = (index: number) => ({ "--d": index } as CSSProperties);
  const guideCorners: [number, number][] = [[core.x0, core.y0], [core.x1, core.y0], [core.x1, core.y1], [core.x0, core.y1]];
  const [dimTopX, dimTopY] = iso(core.x0, core.y1, CORE_Z);
  const [dimBaseX, dimBaseY] = iso(core.x0, core.y1, 0);

  return (
    <figure className="assembly" data-settled={settled || undefined}>
      <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} role="group" aria-label={t.assembly.label}>
        {/* Construction guides: ground outline and the vertical lines of the exploded view. */}
        <g className="asm-guides">
          <polygon className="asm-guide" style={order(0)} points={pts([[core.x0, core.y0, 0], [core.x1, core.y0, 0], [core.x1, core.y1, 0], [core.x0, core.y1, 0]])} />
          {guideCorners.map(([x, y], index) => { const [ax, ay] = iso(x, y, 0), [bx, by] = iso(x, y, TOP_Z); return <line key={index} className="asm-guide" style={order(index + 1)} x1={ax} y1={ay} x2={bx} y2={by} />; })}
          {ticks(core).map((mark, index) => <line key={mark.key} className={`asm-tick${mark.major ? " major" : ""}`} style={{ "--d": index } as CSSProperties} x1={mark.a[0]} y1={mark.a[1]} x2={mark.b[0]} y2={mark.b[1]} />)}
          <line className="asm-dimension" x1={dimBaseX - 34} y1={dimBaseY} x2={dimTopX - 34} y2={dimTopY} />
          <line className="asm-dimension tick" x1={dimBaseX - 42} y1={dimBaseY} x2={dimBaseX - 26} y2={dimBaseY} />
          <line className="asm-dimension tick" x1={dimTopX - 42} y1={dimTopY} x2={dimTopX - 26} y2={dimTopY} />
          <text className="asm-note" transform={`translate(${dimTopX - 46},${(dimTopY + dimBaseY) / 2}) rotate(-90)`} textAnchor="middle">{t.assembly.exploded}</text>
        </g>
        {/* Destination tier */}
        {parts.filter(part => part.kind === "block").map((part, index) => {
          const faces = box(part), [cx, cy] = iso((part.x0 + part.x1) / 2, (part.y0 + part.y1) / 2, part.z1);
          const [ux, uy] = iso((part.x0 + part.x1) / 2, (part.y0 + part.y1) / 2, CORE_Z);
          return (
            <g key={part.id} className="asm-part asm-block" style={order(index)} {...interact(part.id)}>
              <line className="asm-link" style={order(index)} x1={cx} y1={cy} x2={ux} y2={uy} pathLength={1} />
              <polygon className="face right" points={faces.right} /><polygon className="face left" points={faces.left} /><polygon className="face top" points={faces.top} /><polygon className="asm-trace" points={silhouette(part)} pathLength={1} />
            </g>
          );
        })}
        {/* Core tier */}
        {[core].map(part => {
          const faces = box(part);
          return (
            <g key="core" className="asm-part asm-core" {...interact("core")}>
              <polygon className="face right" points={faces.right} /><polygon className="face left" points={faces.left} /><polygon className="face top" points={faces.top} /><polygon className="asm-trace" points={silhouette(part)} pathLength={1} />
              <g transform={`matrix(${C},${S},${-C},${S},0,${-(CORE_Z + CORE_T)})`}>
                <text className="asm-plate-title" x={part.x0 + 26} y={part.y1 - 30}>Ecosystem Config</text>
                <text className="asm-plate-text" x={part.x0 + 26} y={part.y1 - 10}>build, validate, test</text>
              </g>
            </g>
          );
        })}
        {/* Output tier */}
        {parts.filter(part => part.kind === "tile").map((part, index) => {
          const faces = box(part), [bx, by] = iso((part.x0 + part.x1) / 2, (part.y0 + part.y1) / 2, TOP_Z), [cx, cy] = iso((part.x0 + part.x1) / 2, (part.y0 + part.y1) / 2, CORE_Z + CORE_T);
          const label = part.id === "dist" ? "dist/ecosystem.json" : part.id === "prod" ? "config/production.json" : "assets/";
          return (
            <g key={part.id} className="asm-part asm-tile" style={order(index)} {...interact(part.id)}>
              <line className="asm-link up" style={order(index)} x1={bx} y1={by} x2={cx} y2={cy} pathLength={1} />
              <polygon className="face right" points={faces.right} /><polygon className="face left" points={faces.left} /><polygon className="face top" points={faces.top} /><polygon className="asm-trace" points={silhouette(part)} pathLength={1} />
              <g transform={`matrix(${C},${S},${-C},${S},0,${-(TOP_Z + TILE_T)})`}>
                <text className="asm-tile-text" x={part.x0 + 14} y={(part.y0 + part.y1) / 2 + 6}>{label}</text>
              </g>
            </g>
          );
        })}
        {/* Module callouts sit above every tier so the drawing never hides a destination name. */}
        <g className="asm-callouts" aria-hidden="true">
          {parts.filter(part => part.kind === "block").map(part => {
            const [cx, cy] = iso((part.x0 + part.x1) / 2, (part.y0 + part.y1) / 2, part.z1);
            // Pointer target for the module even where the core plate overlaps it (keyboard uses the module itself).
            return <text key={part.id} className="asm-label" data-dim={(current && current !== part.id) || undefined} data-active={current === part.id || undefined} x={cx} y={cy + 4} textAnchor="middle"
              onMouseEnter={() => setActive(part.id)} onMouseLeave={() => setActive(null)} onClick={() => setPinned(value => value === part.id ? null : part.id)}>{t.categories[part.category!]} <tspan className="asm-count">{s.byCategory[part.category!] ?? 0}</tspan></text>;
          })}
        </g>
        {/* Annotations with real counts */}
        {(() => {
          const [dx, dy] = iso(190, 30, TOP_Z + TILE_T), [px, py] = iso(GRID, 30, TOP_Z + TILE_T), [gx, gy] = iso(core.x1, core.y1, CORE_Z);
          return (
            <g className="asm-notes">
              <path className="asm-leader" pathLength={1} d={`M${dx},${dy} L${dx + 60},${dy - 40} H${maxX - 20}`} />
              <text className="asm-note" x={maxX - 24} y={dy - 48} textAnchor="end">{t.assembly.consumers(distReaders)}</text>
              <path className="asm-leader" pathLength={1} d={`M${px},${py} L${px + 40},${py + 26} H${maxX - 20}`} />
              <text className="asm-note" x={maxX - 24} y={py + 18} textAnchor="end">{t.assembly.consumers(prodReaders)}</text>
              <path className="asm-leader" pathLength={1} d={`M${gx},${gy} L${gx + 30},${gy + 30} H${maxX - 20}`} />
              <text className="asm-note" x={maxX - 24} y={gy + 22} textAnchor="end">{t.assembly.projects(s.projects)}, {t.assembly.destinations(data.categories.length)}</text>
              <text className="asm-note faint" x={maxX - 24} y={gy + 44} textAnchor="end">{t.assembly.schemas(s.schemas ?? 0)}, {t.assembly.approvals(s.showcaseGrants)}</text>
            </g>
          );
        })()}
      </svg>
      {/* Every possible message is laid out in the same grid cell; only the current one is visible. The caption's height is
          therefore the tallest message in the current language and width, and never changes on hover, focus or selection. */}
      <figcaption className="asm-inspector">
        {[{ id: "", title: "", text: "", to: "" }, ...ids.map(id => ({ id, ...describe(id) }))].map(entry => {
          const visible = (current ?? "") === entry.id;
          return (
            <div key={entry.id || "hint"} className="asm-message" data-visible={visible || undefined} aria-hidden={!visible || undefined} {...(visible ? { "aria-live": "polite" as const } : {})}>
              {entry.id
                ? <><strong>{entry.title}</strong><span>{entry.text}</span><a href={entry.to} tabIndex={visible ? 0 : -1}>{t.assembly.open}: {entry.title}</a></>
                : <span className="muted">{t.assembly.hint}</span>}
            </div>
          );
        })}
      </figcaption>
    </figure>
  );
}
