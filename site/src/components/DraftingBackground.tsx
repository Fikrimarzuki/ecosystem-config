import { useEffect } from "react";

/** Decorative drafting layer. Hidden from assistive technology, inert to pointer and focus, and paused while the page is hidden. */
export function DraftingBackground() {
  useEffect(() => {
    const root = document.documentElement;
    const sync = () => { if (document.hidden) root.setAttribute("data-idle", ""); else root.removeAttribute("data-idle"); };
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => { document.removeEventListener("visibilitychange", sync); root.removeAttribute("data-idle"); };
  }, []);
  return (
    <div className="draft-bg" aria-hidden="true">
      <svg focusable="false">
        {/* Occasional line traces (elbow routes drawn with pathLength-normalised lines). */}
        <g className="draft-line draft-trace-a draft-wide"><line x1="3%" y1="62%" x2="3%" y2="78%" pathLength="1" /><line x1="3%" y1="78%" x2="13%" y2="78%" pathLength="1" /></g>
        <g className="draft-line draft-trace-b"><line x1="97%" y1="16%" x2="97%" y2="30%" pathLength="1" /><line x1="97%" y1="16%" x2="88%" y2="16%" pathLength="1" /></g>
        <g className="draft-line draft-trace-c draft-wide"><line x1="46%" y1="94%" x2="58%" y2="94%" pathLength="1" /><line x1="58%" y1="94%" x2="58%" y2="88%" pathLength="1" /></g>
        {/* Coordinate markers: positioned with nested <svg x y> so the offsets are plain user units (calc() is not valid in SVG attributes). */}
        <svg x="5%" y="30%" overflow="visible" className="draft-wide"><path className="draft-cross" d="M-7 0H7M0 -7V7" /><text className="draft-text" x="12" y="-8">+040,+112</text></svg>
        <svg x="95%" y="72%" overflow="visible"><path className="draft-cross" d="M-7 0H7M0 -7V7" /><circle className="draft-ring" cx="0" cy="0" r="14" /><text className="draft-text" x="-78" y="22">+408,+236</text></svg>
        {/* A single measurement annotation. */}
        <svg x="22%" y="97%" overflow="visible" className="draft-dim draft-wide"><line x1="0" y1="0" x2="12%" y2="0" /><line x1="0" y1="-5" x2="0" y2="5" /><line x1="12%" y1="-5" x2="12%" y2="5" /><text className="draft-text" x="6%" y="-8" textAnchor="middle">240</text></svg>
      </svg>
      <div className="draft-sweep" />
    </div>
  );
}
