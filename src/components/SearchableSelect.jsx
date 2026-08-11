import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";

/**
 * Durchsuchbares Dropdown als Ersatz für <select>. Erwartet Optionen als
 * [{ value, label, icon?, sublabel?, title? }]. `value` / `onChange` verhalten
 * sich wie bei einem normalen Select (onChange bekommt direkt den neuen Wert).
 */
export default function SearchableSelect({ options, value, onChange, placeholder = "– auswählen –", emptyLabel }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selected = options.find((o) => String(o.value) === String(value));

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  function handleSelect(val) {
    onChange(val);
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="select"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6, overflow: "hidden" }}>
          {selected?.icon && <Icon src={selected.icon} size={18} />}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected ? selected.label : emptyLabel || placeholder}
          </span>
        </span>
        <span style={{ color: "var(--text-faint)", fontSize: 10, flexShrink: 0 }}>▾</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 50,
            background: "var(--surface-2)",
            border: "1px solid var(--border-strong)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            maxHeight: 320,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen…"
            style={{
              margin: 6,
              padding: "6px 8px",
              borderRadius: "var(--radius-sm)",
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontSize: 13,
              fontFamily: "inherit",
            }}
          />
          <div style={{ overflowY: "auto", maxHeight: 260 }}>
            {emptyLabel && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 10px",
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: 12.5,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {emptyLabel}
              </button>
            )}
            {filtered.length === 0 && (
              <div style={{ padding: "8px 10px", fontSize: 12, color: "var(--text-faint)" }}>Keine Treffer.</div>
            )}
            {filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                title={o.title}
                onClick={() => handleSelect(o.value)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 10px",
                  background: String(o.value) === String(value) ? "var(--accent-bg)" : "none",
                  border: "none",
                  color: String(o.value) === String(value) ? "var(--accent)" : "var(--text)",
                  fontSize: 12.5,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {o.icon && <Icon src={o.icon} size={18} />}
                <span style={{ overflow: "hidden" }}>
                  {o.label}
                  {o.sublabel && <span style={{ color: "var(--text-faint)", marginLeft: 6, fontSize: 10.5 }}>{o.sublabel}</span>}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
