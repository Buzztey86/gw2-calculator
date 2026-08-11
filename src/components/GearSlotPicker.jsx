import { STAT_COMBOS, STAT_COMBO_ROLE, getAllSlots, fillAllSlots } from "../lib/stats";

export default function GearSlotPicker({ weaponSetup, setWeaponSetup, slotSelections, setSlotSelections }) {
  const slots = getAllSlots(weaponSetup);
  const combos = Object.keys(STAT_COMBOS);

  function handleSlotChange(slotKey, prefixName) {
    setSlotSelections({ ...slotSelections, [slotKey]: prefixName });
  }

  function handleQuickFill(prefixName) {
    setSlotSelections(fillAllSlots(prefixName, weaponSetup));
  }

  function handleWeaponSetupChange(setup) {
    setWeaponSetup(setup);
    // vorhandene Auswahl für Waffen-Slots übernehmen, wo möglich, Rest auf erste Kombi setzen
    const firstPrefix = slotSelections.weaponMain || Object.keys(STAT_COMBOS)[0];
    const newSlots = getAllSlots(setup);
    const next = { ...slotSelections };
    newSlots.forEach((s) => {
      if (!next[s.key]) next[s.key] = firstPrefix;
    });
    setSlotSelections(next);
  }

  return (
    <div>
      <div className="label" style={{ marginBottom: 6 }}>
        Waffen-Setup
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className={`weapon-tab ${weaponSetup === "2h" ? "active" : ""}`}
          onClick={() => handleWeaponSetupChange("2h")}
        >
          Zweihand-Waffe
        </button>
        <button
          className={`weapon-tab ${weaponSetup === "1h+1h" ? "active" : ""}`}
          onClick={() => handleWeaponSetupChange("1h+1h")}
        >
          2× Einhand-Waffen
        </button>
      </div>

      <div className="label" style={{ marginBottom: 6 }}>
        Schnellauswahl (alle Slots auf einmal setzen)
      </div>
      <select defaultValue="" onChange={(e) => e.target.value && handleQuickFill(e.target.value)} style={{ marginBottom: 20 }}>
        <option value="">– komplettes Set wählen –</option>
        {combos.map((c) => (
          <option key={c} value={c}>
            {c} ({STAT_COMBO_ROLE[c]})
          </option>
        ))}
      </select>

      <div className="label" style={{ marginBottom: 10 }}>
        Einzelne Slots (Mix & Match)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
        {slots.map((slot) => (
          <div key={slot.key}>
            <div style={{ fontSize: 11.5, color: "var(--ink-dim)", marginBottom: 3 }}>{slot.label}</div>
            <select
              value={slotSelections[slot.key] || ""}
              onChange={(e) => handleSlotChange(slot.key, e.target.value)}
            >
              <option value="">– keine –</option>
              {combos.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
