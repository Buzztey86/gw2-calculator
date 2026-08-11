import {
  STAT_COMBOS,
  STAT_COMBO_ROLE,
  getAllSlots,
  fillAllSlots,
  infusionSlotsByType,
} from "../lib/stats";

function totalInfusionSlots(rarity, weaponSetup) {
  const slots = getAllSlots(weaponSetup);
  const perType = infusionSlotsByType(rarity);
  return slots.reduce((sum, s) => sum + (perType[s.budgetType] || 0), 0);
}

export default function GearSlotPicker({
  weaponSetup,
  setWeaponSetup,
  slotSelections,
  setSlotSelections,
  rarity,
  setRarity,
  runeOptions,
  selectedRune,
  setSelectedRune,
  infusionOptions,
  selectedInfusion,
  setSelectedInfusion,
  foodOptions,
  selectedFood,
  setSelectedFood,
  utilityOptions,
  selectedUtility,
  setSelectedUtility,
}) {
  const slots = getAllSlots(weaponSetup);
  const combos = Object.keys(STAT_COMBOS);
  const slotCount = totalInfusionSlots(rarity, weaponSetup);

  function handleSlotChange(slotKey, prefixName) {
    setSlotSelections({ ...slotSelections, [slotKey]: prefixName });
  }

  function handleQuickFill(prefixName) {
    setSlotSelections(fillAllSlots(prefixName, weaponSetup));
  }

  function handleWeaponSetupChange(setup) {
    setWeaponSetup(setup);
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
        Qualität
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className={`weapon-tab ${rarity === "exotic" ? "active" : ""}`} onClick={() => setRarity("exotic")}>
          Exotic
        </button>
        <button className={`weapon-tab ${rarity === "ascended" ? "active" : ""}`} onClick={() => setRarity("ascended")}>
          Ascended
        </button>
      </div>

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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", marginBottom: 20 }}>
        {slots.map((slot) => (
          <div key={slot.key}>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 3 }}>{slot.label}</div>
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

      <div className="label" style={{ marginBottom: 10, color: "var(--accent)" }}>
        Rune (6-teiliges Set, wirkt auf alle Rüstungsteile)
      </div>
      <select value={selectedRune || ""} onChange={(e) => setSelectedRune(e.target.value || null)} style={{ marginBottom: 20 }}>
        <option value="">– keine Rune –</option>
        {runeOptions.map((r) => (
          <option key={r.name} value={r.name}>
            {r.name}
          </option>
        ))}
      </select>

      <div className="label" style={{ marginBottom: 10, color: "var(--accent)" }}>
        Infusionen
        {slotCount > 0 && (
          <span style={{ color: "var(--text-muted)", fontWeight: 400, marginLeft: 6 }}>
            ({slotCount} Sockel verfügbar
            {rarity === "exotic" ? " · Ring/Amulett/Schmuckstück mit Fraktal-Sockel" : ""})
          </span>
        )}
      </div>
      {slotCount === 0 ? (
        <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginBottom: 20 }}>
          Keine Infusionssockel bei dieser Auswahl verfügbar.
        </div>
      ) : (
        <>
          <select
            value={selectedInfusion || ""}
            onChange={(e) => setSelectedInfusion(e.target.value ? Number(e.target.value) : null)}
            style={{ marginBottom: 6 }}
          >
            <option value="">– keine Infusion –</option>
            {infusionOptions.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
          <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginBottom: 20 }}>
            Wird auf alle {slotCount} verfügbaren Sockel angewendet (vereinfachtes Modell).
          </div>
        </>
      )}

      <div className="label" style={{ marginBottom: 10, color: "var(--accent)" }}>
        Nahrung (Food)
      </div>
      <select value={selectedFood || ""} onChange={(e) => setSelectedFood(e.target.value ? Number(e.target.value) : null)} style={{ marginBottom: 20 }}>
        <option value="">– keine Nahrung –</option>
        {foodOptions.map((f) => (
          <option key={f.id} value={f.id}>
            {f.name}
          </option>
        ))}
      </select>

      <div className="label" style={{ marginBottom: 10, color: "var(--accent)" }}>
        Utility (Öl/Stein)
      </div>
      <select value={selectedUtility || ""} onChange={(e) => setSelectedUtility(e.target.value ? Number(e.target.value) : null)}>
        <option value="">– kein Utility-Konsumgut –</option>
        {utilityOptions.map((u) => (
          <option key={u.id} value={u.id}>
            {u.name}
          </option>
        ))}
      </select>
    </div>
  );
}
