import Icon from "./Icon";

function findEffectMeta(statusName, effects) {
  if (!effects) return null;
  const all = [...effects.boons, ...effects.conditions, ...effects.auras, ...effects.other];
  return all.find((e) => e.name === statusName) || null;
}

function isCondition(statusName, effects) {
  return effects?.conditions.some((c) => c.name === statusName) || false;
}

export default function AvailableBuffsPanel({ availableBuffs, effects }) {
  // Nur echte Buffs (Segen für sich/Verbündete, Auren, Sondereffekte) - keine
  // Zustände, die der Build am Gegner verursacht (z. B. Vulnerability, Burning).
  const filtered = availableBuffs.filter((b) => !isCondition(b.status, effects));

  if (filtered.length === 0) {
    return <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>Keine der aktiven Talente gewähren aktuell einen Segen/Effekt.</div>;
  }

  return (
    <div>
      {filtered.map(({ status, sources, fact }) => {
        const meta = findEffectMeta(status, effects);
        const isStandardBoon = effects?.boons.some((b) => b.name === status);
        return (
          <div key={status} style={{ display: "flex", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--line)" }}>
            <Icon src={meta?.icon} size={26} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, color: isStandardBoon ? "var(--gold)" : "var(--ink)", fontWeight: 600 }}>
                {status}
                {isStandardBoon && <span style={{ color: "var(--ink-dim)", fontWeight: 400 }}> (Boon)</span>}
              </div>
              <div style={{ fontSize: 10.5, color: "var(--ink-dim)" }}>
                {meta?.description || fact.description || ""}
              </div>
              <div style={{ fontSize: 10, color: "var(--teal)", marginTop: 2 }}>via {sources.join(", ")}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
