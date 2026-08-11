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
  // nach Klasse gruppieren
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

export default function UtilitiesBuffsTab({ utilityIndex, boonProviders, effects }) {
  const [selected, setSelected] = useState(null); // { type: 'utility'|'boon', key: string }
  const [filterText, setFilterText] = useState("");

  const boons = effects?.boons || [];

  function selectItem(type, key) {
    setSelected({ type, key });
    setFilterText("");
  }

  function isActive(type, key) {
    return selected?.type === type && selected?.key === key;
  }

  let providers = [];
  let title = "Auswahl links treffen";
  if (selected?.type === "utility") {
    providers = utilityIndex?.[selected.key] || [];
    title = UTILITY_CATEGORY_LABELS[selected.key];
  } else if (selected?.type === "boon") {
    providers = boonProviders?.[selected.key] || [];
    title = selected.key;
  }

  return (
    <div className="grid-cols" style={{ gridTemplateColumns: "1fr 2fr" }}>
      <div className="panel">
        <div className="label" style={{ color: "var(--accent)", marginBottom: 10 }}>
          Utility-Kategorien
        </div>
        {Object.keys(UTILITY_CATEGORY_LABELS).map((key) => (
          <button
            key={key}
            onClick={() => selectItem("utility", key)}
            className={`trait-btn ${isActive("utility", key) ? "selected" : ""}`}
            style={{ width: "100%", marginBottom: 4, fontSize: 12.5 }}
          >
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
            onClick={() => selectItem("boon", b.name)}
            className={`trait-btn ${isActive("boon", b.name) ? "selected" : ""}`}
            style={{ width: "100%", marginBottom: 4, fontSize: 12.5 }}
          >
            <Icon src={b.icon} size={20} />
            {b.name}
            <span style={{ marginLeft: "auto", color: "var(--text-muted)" }}>{boonProviders?.[b.name]?.length ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="label" style={{ color: "var(--accent)", marginBottom: 10 }}>
          {title}
        </div>
        {selected ? (
          <>
            {providers.length > 8 && (
              <input
                type="text"
                placeholder="Nach Name oder Klasse filtern…"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="select"
                style={{ marginBottom: 12 }}
              />
            )}
            <ProviderList providers={providers} filterText={filterText} />
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: "var(--text-muted)" }}>
            Wähle links eine Utility-Kategorie oder einen Boon, um zu sehen, welche Klassen und Fähigkeiten ihn bereitstellen.
          </div>
        )}
      </div>
    </div>
  );
}
