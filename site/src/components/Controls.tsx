import type { ReactNode } from "react";

// One control system for the whole site: same height, radius, focus ring and chevron everywhere.
// Native <select> is kept for its accessible, platform-appropriate menu (especially on phones).

export function SelectField<T extends string>({ label, value, onChange, children }: { label: string; value: T; onChange: (value: T) => void; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="select-wrap">
        <select className="control" value={value} onChange={event => onChange(event.target.value as T)}>{children}</select>
        <svg className="select-chevron" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
      </span>
    </label>
  );
}

export function SearchField({ label, value, onChange, placeholder, controls }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; controls?: string }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="search-wrap">
        <svg className="search-icon" viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5 14 14" /></svg>
        <input className="control" type="search" value={value} placeholder={placeholder} aria-controls={controls} onChange={event => onChange(event.target.value)} />
      </span>
    </label>
  );
}

export function Segmented<T extends string>({ label, value, options, onChange, size = "md" }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (value: T) => void; size?: "sm" | "md" }) {
  return (
    <div className={`segmented ${size}`} role="group" aria-label={label}>
      {options.map(option => (
        <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}>{option.label}</button>
      ))}
    </div>
  );
}
