import * as s from "../admin.css";
import type { CompetencyOption } from "./types";

interface Props {
  label: string;
  required?: boolean;
  options: CompetencyOption[];
  values: string[];
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  open: boolean;
  onToggle: () => void;
  onBlur: () => void;
}

export default function CompetencyPicker({
  label,
  required,
  options,
  values,
  onSelect,
  onRemove,
  search,
  onSearchChange,
  open,
  onToggle,
  onBlur,
}: Props) {
  const selected = values
    .map((id) => options.find((o) => o.id === id))
    .filter(Boolean) as CompetencyOption[];
  const visibleOptions = options.filter((o) =>
    !search || `${o.id} ${o.name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ marginBottom: 14, position: "relative" }}>
      <label className={s.label}>
        {label} {required && <span style={{ color: "#E53E3E" }}>*</span>}
      </label>
      <div
        className={s.input}
        onClick={onToggle}
        style={{ cursor: "pointer", userSelect: "none", display: "flex", justifyContent: "space-between", alignItems: "center", minHeight: 38 }}
      >
        {selected.length ? (
          <span style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {selected.slice(0, 3).map((c) => (
              <span
                key={c.id}
                className={s.metaPill}
                style={{ cursor: "pointer" }}
                onClick={(e) => { e.stopPropagation(); onRemove(c.id); }}
                title="Remove"
              >
                {c.id}
              </span>
            ))}
            {selected.length > 3 && (
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 700 }}>
                +{selected.length - 3} more
              </span>
            )}
          </span>
        ) : (
          <span style={{ color: "#a0aec0", fontSize: 13 }}>Select competencies…</span>
        )}
        <span style={{ fontSize: 10, color: "#a0aec0" }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{
          position: "absolute", zIndex: 50, top: "100%", left: 0, right: 0,
          background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 10,
          boxShadow: "0 4px 20px rgba(0,0,0,0.12)", overflow: "hidden",
        }}>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #f0f0f0" }}>
            <input
              className={s.input}
              autoFocus
              placeholder="Search by id or name…"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              onBlur={onBlur}
              style={{ marginBottom: 0 }}
            />
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto" }}>
            {visibleOptions.length === 0 && (
              <div style={{ padding: "10px 14px", fontSize: 12, color: "#a0aec0" }}>No results</div>
            )}
            {visibleOptions.map((o) => (
              <div
                key={o.id}
                onMouseDown={() => onSelect(o.id)}
                style={{
                  padding: "8px 14px", fontSize: 13, cursor: "pointer",
                  background: values.includes(o.id) ? "#f0f4ff" : "transparent",
                  borderLeft: values.includes(o.id) ? "3px solid #6366f1" : "3px solid transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                onMouseLeave={(e) => (e.currentTarget.style.background = values.includes(o.id) ? "#f0f4ff" : "transparent")}
              >
                <span style={{ fontWeight: 600, color: "#6366f1", marginRight: 6 }}>{o.id}</span>
                {o.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
