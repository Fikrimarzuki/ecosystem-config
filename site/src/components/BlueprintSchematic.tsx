import { useCallback, useLayoutEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import { ASSETS_ID, categoryId } from "../app/blueprint";
import { HUB_ID, data, projectById } from "../app/data";
import { useI18n } from "../app/i18n";
import { DIST_ID, DIST_READERS_ID, PROD_ID, SOURCES_ID, type Relation, type Subject } from "../app/relations";
import { explain, legendOf, nodeLabel } from "./BlueprintPanel";

type View = { nodes: Set<string>; edges: Set<string>; focus: string | null; active: boolean };
type Props = {
  relations: Relation[]; view: View; selected: Subject | null;
  onSelect: (subject: Subject | null) => void; onHover: (subject: Subject | null, point?: { x: number; y: number }) => void;
};
type Wire = { relation: Relation; d: string };

const statusOf = (id: string) => projectById.get(id)?.status;
/** File paths may wrap only after "/" or ".", never mid-word. */
const Path = ({ value }: { value: string }) => <code>{value.split(/(?<=[/.])/).flatMap((part, index) => index ? [<wbr key={index} />, part] : [part])}</code>;

type BoxContext = { register: (id: string) => (element: HTMLElement | null) => void; stateOf: (id: string) => string | undefined; selected: Subject | null; selectNode: (id: string) => void };
function Box({ ctx, id, title, note, count, children, className = "" }: { ctx: BoxContext; id: string; title: ReactNode; note?: ReactNode; count?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <div className={`sch-box ${className}`} ref={ctx.register(id)} data-state={ctx.stateOf(id)} data-status={statusOf(id)}>
      <button type="button" className="sch-main" aria-pressed={ctx.selected?.kind === "node" && ctx.selected.id === id} onClick={() => ctx.selectNode(id)}>
        <span className="sch-title">{title}</span>
        {count !== undefined && <span className="sch-count">{count}</span>}
        {note && <span className="sch-note">{note}</span>}
      </button>
      {children}
    </div>
  );
}

/** Orthogonal route between two boxes (coordinates relative to the schematic). */
function route(a: DOMRect, b: DOMRect, origin: DOMRect) {
  const ax = a.left - origin.left, ay = a.top - origin.top, bx = b.left - origin.left, by = b.top - origin.top;
  const aCx = ax + a.width / 2, aCy = ay + a.height / 2, bCx = bx + b.width / 2, bCy = by + b.height / 2;
  if (by >= ay + a.height - 2) {          // target below: leave from the bottom, bus just above the target
    const y = by - 14;
    return `M${aCx},${ay + a.height} V${y} H${bCx} V${by}`;
  }
  if (by + b.height <= ay + 2) {          // target above
    const y = by + b.height + 14;
    return `M${aCx},${ay} V${y} H${bCx} V${by + b.height}`;
  }
  if (bx >= ax + a.width - 2) {           // target to the right
    const x = (ax + a.width + bx) / 2;
    return `M${ax + a.width},${aCy} H${x} V${bCy} H${bx}`;
  }
  const x = (bx + b.width + ax) / 2;      // target to the left
  return `M${ax},${aCy} H${x} V${bCy} H${bx + b.width}`;
}

export default function BlueprintSchematic({ relations, view, selected, onSelect, onHover }: Props) {
  const { t } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const boxes = useRef(new Map<string, HTMLElement>());
  const [wires, setWires] = useState<Wire[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [open, setOpen] = useState<Set<string>>(new Set());

  const measure = useCallback(() => {
    const element = root.current;
    if (!element) return;
    const origin = element.getBoundingClientRect();
    setSize({ w: origin.width, h: origin.height });
    setWires(relations.flatMap(relation => {
      const a = boxes.current.get(relation.source), b = boxes.current.get(relation.target);
      return a && b ? [{ relation, d: route(a.getBoundingClientRect(), b.getBoundingClientRect(), origin) }] : [];
    }));
  }, [relations]);
  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(() => measure());
    if (root.current) observer.observe(root.current);
    return () => observer.disconnect();
  }, [measure, open]);

  const register = (id: string) => (element: HTMLElement | null) => { if (element) boxes.current.set(id, element); else boxes.current.delete(id); };
  const stateOf = (id: string) => !view.active ? undefined : id === view.focus ? "focus" : view.nodes.has(id) ? "linked" : "dim";
  const toggle = (id: string) => setOpen(current => { const next = new Set(current); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const selectNode = (id: string) => onSelect(selected?.kind === "node" && selected.id === id ? null : { kind: "node", id });

  const ctx: BoxContext = { register, stateOf, selected, selectNode };

  const wireProps = (relation: Relation) => {
    const subject: Subject = { kind: "edge", id: relation.id };
    const label = `${t.blueprint.rel[legendOf(relation.kind)]}: ${nodeLabel(relation.source, t)} → ${nodeLabel(relation.target, t)}. ${explain(relation, t)}`;
    return {
      role: "button", tabIndex: 0, "aria-label": label,
      onMouseEnter: (event: MouseEvent) => onHover(subject, { x: event.clientX, y: event.clientY }),
      onMouseMove: (event: MouseEvent) => onHover(subject, { x: event.clientX, y: event.clientY }),
      onMouseLeave: () => onHover(null),
      onFocus: (event: FocusEvent<SVGGElement>) => { const box = event.currentTarget.getBoundingClientRect(); onHover(subject, { x: box.left + box.width / 2, y: box.top }); },
      onBlur: () => onHover(null),
      onClick: () => onSelect(selected?.kind === "edge" && selected.id === relation.id ? null : subject),
      onKeyDown: (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(subject); } },
    };
  };

  const distReaders = data.consumers.filter(consumer => consumer.artifact === "dist/ecosystem.json").map(consumer => projectById.get(consumer.projectId)!).sort((a, b) => a.name.localeCompare(b.name));
  const prodReaders = data.consumers.filter(consumer => consumer.artifact === "config/production.json").map(consumer => consumer.projectId);

  return (
    <div className="sch" ref={root}>
      <svg className="sch-wires" width={size.w} height={size.h} aria-hidden={wires.length === 0 || undefined}>
        <defs>
          <marker id="sch-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L8,4 L0,8 Z" /></marker>
        </defs>
        {wires.map(({ relation, d }) => {
          const state = !view.active ? undefined : view.edges.has(relation.id) ? "on" : "dim";
          return (
            <g key={relation.id} className={`sch-wire ${legendOf(relation.kind)}`} data-state={state} {...wireProps(relation)}>
              <path className="sch-wire-line" d={d} markerEnd="url(#sch-arrow)" />
              <path className="sch-wire-hit" d={d} />
            </g>
          );
        })}
      </svg>
      <div className="sch-grid">
        <section className="sch-area sources" aria-label={t.schematic.sources[0]}>
          <p className="sch-heading">{t.schematic.sources[0]}</p>
          <Box ctx={ctx} id={SOURCES_ID} title="config/" note={t.schematic.sources[1]} count={t.schematic.files(data.stats.projects + Object.values(data.stats.career).reduce((a, b) => a + b, 0) + data.stats.origins + data.stats.concepts)} />
        </section>
        <section className="sch-area core" aria-label={t.schematic.core[0]}>
          <p className="sch-heading">{t.schematic.core[0]}</p>
          <Box ctx={ctx} id={HUB_ID} className="core-box" title="Ecosystem Config" note={t.schematic.core[1]} count={t.assembly.schemas(data.stats.schemas ?? 0)} />
        </section>
        <section className="sch-area outputs" aria-label={t.schematic.outputs}>
          <p className="sch-heading">{t.schematic.outputs}</p>
          <Box ctx={ctx} id={DIST_ID} className="file" title={<Path value="dist/ecosystem.json" />} note={t.schematic.dist[1]} />
          <Box ctx={ctx} id={PROD_ID} className="file" title={<Path value="config/production.json" />} note={t.schematic.prod[1]} />
          <Box ctx={ctx} id={ASSETS_ID} className="file" title={<Path value="assets/" />} note={t.schematic.assets[1]} count={t.schematic.files(data.stats.thumbnails)} />
        </section>
        <section className="sch-area consumers" aria-label={t.schematic.consumersTitle}>
          <p className="sch-heading">{t.schematic.consumersTitle}</p>
          <Box ctx={ctx} id={DIST_READERS_ID} title={t.assembly.consumers(distReaders.length)} note={<Path value="dist/ecosystem.json" />}>
            <button type="button" className="sch-expand" aria-expanded={open.has(DIST_READERS_ID)} onClick={() => toggle(DIST_READERS_ID)}>
              {open.has(DIST_READERS_ID) ? t.schematic.hideConsumers : t.schematic.showConsumers}
            </button>
            {open.has(DIST_READERS_ID) && <div className="sch-items">{distReaders.map(project => (
              <button key={project.id} type="button" className="sch-item" data-state={stateOf(project.id)} onClick={() => selectNode(project.id)}>{project.name}</button>
            ))}</div>}
          </Box>
          {prodReaders.map(id => <Box ctx={ctx} key={id} id={id} className="consumer" title={nodeLabel(id, t)} note={<Path value="config/production.json" />} />)}
        </section>
        <section className="sch-area siblings" aria-label={t.schematic.siblings}>
          <p className="sch-heading">{t.schematic.siblings}</p>
          <div className="sch-row">
            {projectById.has("ecosystemAssets") && <Box ctx={ctx} id="ecosystemAssets" title={t.schematic.ecosystemAssets[0]} note={t.schematic.ecosystemAssets[1]} />}
            {projectById.has("ecosystemSkills") && <Box ctx={ctx} id="ecosystemSkills" className="detached" title={t.schematic.skills[0]} note={t.schematic.skills[1]} />}
          </div>
        </section>
        <section className="sch-area destinations" aria-label={t.schematic.destinations}>
          <p className="sch-heading">{t.schematic.destinations}</p>
          <div className="sch-dest-grid">
            {data.categories.map(category => {
              const id = categoryId(category);
              const members = data.projects.filter(project => project.category === category && project.id !== HUB_ID).sort((a, b) => a.name.localeCompare(b.name));
              return (
                <Box ctx={ctx} key={category} id={id} className="dest" title={t.categories[category]} count={members.length}>
                  <button type="button" className="sch-expand" aria-expanded={open.has(id)} onClick={() => toggle(id)}>
                    {open.has(id) ? t.schematic.hideProjects : t.schematic.showProjects(members.length)}
                  </button>
                  {open.has(id) && <div className="sch-items">{members.map(project => (
                    <button key={project.id} type="button" className="sch-item" data-state={stateOf(project.id)} data-status={project.status} onClick={() => selectNode(project.id)}>{project.name}</button>
                  ))}</div>}
                </Box>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
