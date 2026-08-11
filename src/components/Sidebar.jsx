import GearStatsPanel from "./GearStatsPanel";
import AvailableBuffsPanel from "./AvailableBuffsPanel";

export default function Sidebar({ professionName, gearTotal, rarity, traitBonuses, triggeredEffects, availableBuffs, effects, activeTraits }) {
  return (
    <div className="panel sidebar-panel">
      <div className="label" style={{ color: "var(--accent)", marginBottom: 12 }}>
        Stats (live)
      </div>
      <GearStatsPanel
        professionName={professionName}
        gearTotal={gearTotal}
        rarity={rarity}
        traitBonuses={traitBonuses}
        triggeredEffects={triggeredEffects}
      />

      <div className="label" style={{ color: "var(--accent)", margin: "18px 0 8px" }}>
        Verfügbare Buffs (aus Talenten)
      </div>
      <AvailableBuffsPanel availableBuffs={availableBuffs} effects={effects} />

      <details style={{ marginTop: 18 }}>
        <summary className="label" style={{ color: "var(--accent)", cursor: "pointer" }}>
          Aktive Talente ({activeTraits.length})
        </summary>
        <div style={{ marginTop: 8 }}>
          {activeTraits.map((t) => (
            <div key={t.id} style={{ fontSize: 11.5, padding: "3px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: t.slot === "Minor" ? "var(--text-muted)" : "var(--accent)" }}>
                {t.slot === "Minor" ? "○" : "●"} {t.name}
              </span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
