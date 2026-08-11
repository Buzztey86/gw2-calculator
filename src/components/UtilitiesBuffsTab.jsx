import { useState } from "react";
import Icon from "./Icon";

const UTILITY_CATEGORY_LABELS = {
  stealthField: "Stealth-Feld (Gruppe)",
  massStealth: "Mass-Stealth",
  groupStability: "Gruppen-Stability",
  instantRevive: "Instant-Wiederbelebung",
  stompFinisher: "Downed-Finisher / Instant-Kill",
};

const KIND_LABEL = { skill: "Skill", trait: "Talent" };

function Checkbox({ checked }) {
  return (
    <span
      style={{
        width: 14,
        height: 14,
        borderRadius: 3,
        border: `1px solid ${checked ? "var(--accent)" : "var(--border-strong)"}`,
        background: checked ? "var(--accent)" : "transparent",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {checked && (
        <svg width="9" height="9" viewBox="0 0 16 16" fill="none">
          <path d="M2 8.5L6 12L14 3" stroke="var(--bg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

function ProviderList({ providers, filterText }) {
  const filtered = filterText
    ? providers.filter(
        (p) =>
          p.name.toLowerCase().includes(filterText.toLowerCase()) ||
          p.profession.toLowerCase().includes(filterText.toLowerCase())
      )
    : providers;

  if (!filtered || filtered.length === 0) {
    return <div style={{ fontSize: 12, color: "var(--text-muted)" }}>Keine Einträge gefunden.</div>;
  }
  const byProf = {};
  for (const p of filtered) {
    (byProf[p.profession] = byProf[p.profession] || []).push(p);
  }
  return (
    <div>
      {Object.entries(byProf).map(([prof, items]) => (
        <div key={prof} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, marginBottom: 6 }}>
            {prof} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({items.length})</span>
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: "1px solid var(--border)" }}>
              <Icon src={item.icon} size={26} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12.5, color: "var(--text)" }}>
                  {item.name}
                  <span style={{ color: "var(--accent)", fontSize: 10, marginLeft: 6 }}>
                    {KIND_LABEL[item.kind] || ""} · {item.source}
                  </span>
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>{item.description}</div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function itemKey(item) {
  return `${item.type}:${item.key}`;
}

export default function UtilitiesBuffsTab({ utilityIndex, boonProviders, effects }) {
  const [selectedItems, setSelectedItems] = useState([]); // [{ type, key }]
  const [filterText, setFilterText] = useState("");

  const boons = effects?.boons || [];

  function toggleItem(type, key) {
    const k = `${type}:${key}`;
    setSelectedItems((prev) => (prev.some((i) => itemKey(i) === k) ? prev.filter((i) => itemKey(i) !== k) : [...prev, { type, key }]));
  }

  function isActive(type, key) {
    return selectedItems.some((i) => i.type === type && i.key === key);
  }

  function labelFor(item) {
    return item.type === "utility" ? UTILITY_CATEGORY_LABELS[item.key] : item.key;
  }

  function providersFor(item) {
    return item.type === "utility" ? utilityIndex?.[item.key] || [] : boonProviders?.[item.key] || [];
  }

  const totalResults = selectedItems.reduce((sum, item) => sum + providersFor(item).length, 0);

  return (
    <div className="grid-cols" style={{ gridTemplateColumns: "1fr 2fr" }}>
      <div className="panel">
        <div className="label" style={{ color: "var(--accent)", marginBottom: 10 }}>
          Utility-Kategorien
        </div>
        {Object.keys(UTILITY_CATEGORY_LABELS).map((key) => (
          <button
            key={key}
            onClick={() => toggleItem("utility", key)}
            className={`trait-btn ${isActive("utility", key) ? "selected" : ""}`}
            style={{ width: "100%", marginBottom: 4, fontSize: 12.5 }}
          >
            <Checkbox checked={isActive("utility", key)} />
            {UTILITY_CATEGORY_LABELS[key]}
            <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>{utilityIndex?.[key]?.length ?? 0}</span>
          </button>
        ))}

        <div className="label" style={{ color: "var(--accent)", margin: "18px 0 10px" }}>
          Boons
        </div>
        {boons.map((b) => (
          <button
            key={b.name}
            onClick={() => toggleItem("boon", b.name)}
            className={`trait-btn ${isActive("boon", b.name) ? "selected" : ""}`}
            style={{ width: "100%", marginBottom: 4, fontSize: 12.5 }}
          >
            <Checkbox checked={isActive("boon", b.name)} />
            <Icon src={b.icon} size={20} />
            {b.name}
            <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>{boonProviders?.[b.name]?.length ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="panel">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div className="label" style={{ color: "var(--accent)" }}>
            {selectedItems.length === 0
              ? "Auswahl links treffen"
              : `${selectedItems.length} ausgewählt · ${totalResults} Einträge`}
          </div>
          {selectedItems.length > 0 && (
            <button
              onClick={() => setSelectedItems([])}
              style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 11.5, cursor: "pointer", padding: 0 }}
            >
              Auswahl leeren
            </button>
          )}
        </div>

        {selectedItems.length > 0 ? (
          <>
            {totalResults > 8 && (
              <input
                type="text"
                placeholder="Nach Name oder Klasse filtern…"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="select"
                style={{ marginBottom: 12 }}
              />
            )}
            {selectedItems.map((item) => (
              <div key={itemKey(item)} style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: "var(--text)",
                    marginBottom: 8,
                    paddingBottom: 6,
                    borderBottom: "1px solid var(--border-strong)",
                  }}
                >
                  {labelFor(item)}
                </div>
                <ProviderList providers={providersFor(item)} filterText={filterText} />
              </div>
            ))}
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            Wähle links eine oder mehrere Utility-Kategorien bzw. Boons, um zu sehen, welche Klassen und Fähigkeiten
            sie bereitstellen.
          </div>
        )}
      </div>
    </div>
  );
}
