import {
  STAT_COMBOS,
  STAT_COMBO_ROLE,
  getAllSlots,
  fillAllSlots,
  infusionSlotsByType,
  summarizeRuneBonus,
} from "../lib/stats";
import Icon from "./Icon";

function totalInfusionSlots(rarity, weaponSetup) {
  const slots = getAllSlots(weaponSetup);
  const perType = infusionSlotsByType(rarity);
  return slots.reduce((sum, s) => sum + (perType[s.budgetType] || 0), 0);
}

function Section({ title, subtitle, defaultOpen = false, children }) {
  return (
    <details open={defaultOpen} style={{ marginBottom: 14, borderBottom: "1px solid var(--border)", paddingBottom: 14 }}>
      <summary style={{ cursor: "pointer", listStyle: "none" }}>
        <span className="label" style={{ color: "var(--accent)", display: "inline" }}>
          {title}
        </span>
        {subtitle && <span style={{ color: "var(--text-muted)", fontSize: 11, marginLeft: 8 }}>{subtitle}</span>}
      </summary>
      <div style={{ marginTop: 12 }}>{children}</div>
    </details>
  );
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
  sigilOptions,
  selectedSigils,
  setSelectedSigils,
  relicOptions,
  selectedRelic,
  setSelectedRelic,
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
  const sigilSlotLabels = weaponSetup === "2h" ? ["Sigill 1", "Sigill 2"] : ["Sigill (Haupthand)", "Sigill (Nebenhand)"];

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

  function handleSigilChange(index, sigilId) {
    const next = [...selectedSigils];
    next[index] = sigilId ? Number(sigilId) : null;
    setSelectedSigils(next);
  }

  const selectedRuneObj = runeOptions.find((r) => r.name === selectedRune);

  return (
    <div>
      <Section title="Ausrüstung (Mix & Match pro Slot)" defaultOpen>
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
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
          {slots.map((slot) => (
            <div key={slot.key}>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 3 }}>{slot.label}</div>
              <select value={slotSelections[slot.key] || ""} onChange={(e) => handleSlotChange(slot.key, e.target.value)}>
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
      </Section>

      <Section title="Waffen-Upgrades" subtitle={`${sigilOptions.length} Sigille · ${relicOptions.length} Relics verfügbar`}>
        {sigilSlotLabels.map((label, i) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div className="label" style={{ marginBottom: 6 }}>
              {label}
            </div>
            <select value={selectedSigils[i] || ""} onChange={(e) => handleSigilChange(i, e.target.value)}>
              <option value="">– kein Sigill –</option>
              {sigilOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {selectedSigils[i] && (
              <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 4 }}>
                {sigilOptions.find((s) => s.id === selectedSigils[i])?.effect}
              </div>
            )}
          </div>
        ))}

        <div className="label" style={{ marginBottom: 6, marginTop: 8 }}>
          Relic
        </div>
        <select value={selectedRelic || ""} onChange={(e) => setSelectedRelic(e.target.value ? Number(e.target.value) : null)}>
          <option value="">– kein Relic –</option>
          {relicOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {selectedRelic && (
          <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 4 }}>
            {relicOptions.find((r) => r.id === selectedRelic)?.description}
          </div>
        )}
        <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 8 }}>
          Sigill-/Relic-Effekte sind meist Trigger-Effekte (bei Krit, Waffenwechsel, Skill-Nutzung …) und fließen
          nicht in die Attribut-Rechnung ein – nur die Rune und Infusionen liefern permanente Stat-Boni.
        </div>
      </Section>

      <Section title="Rune" subtitle={`alle ${runeOptions.length} Superior Runes, 6-teiliger Bonus`}>
        <select value={selectedRune || ""} onChange={(e) => setSelectedRune(e.target.value || null)}>
          <option value="">– keine Rune –</option>
          {runeOptions.map((r) => (
            <option key={r.name} value={r.name} title={summarizeRuneBonus(r.statBonuses)}>
              {r.name}
            </option>
          ))}
        </select>
        {selectedRuneObj && (
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "flex-start" }}>
            <Icon src={selectedRuneObj.icon} size={28} />
            <div>
              <div style={{ fontSize: 11.5, color: "var(--positive)", fontWeight: 600 }}>
                6er-Bonus gesamt: {summarizeRuneBonus(selectedRuneObj.statBonuses) || "kein Attribut-Bonus"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>
                Einzelstufen: {(selectedRuneObj.statBonuses || []).join(" · ")}
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section title="Infusionen" subtitle="WvW-Infusionen (reine Stats, keine Agony Resistance nötig)">
        {slotCount === 0 ? (
          <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>Keine Infusionssockel bei dieser Auswahl verfügbar.</div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>{slotCount} Sockel verfügbar</div>
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
            <div style={{ fontSize: 10.5, color: "var(--text-faint)" }}>
              Wird auf alle {slotCount} verfügbaren Sockel angewendet (vereinfachtes Modell).
            </div>
          </>
        )}
      </Section>

      <Section title="Nahrung & Utility" subtitle={`${foodOptions.length} Foods · ${utilityOptions.length} Utilities, alle WvW-nutzbar`}>
        <div className="label" style={{ marginBottom: 6 }}>
          Nahrung (Food)
        </div>
        <select value={selectedFood || ""} onChange={(e) => setSelectedFood(e.target.value ? Number(e.target.value) : null)} style={{ marginBottom: 6 }}>
          <option value="">– keine Nahrung –</option>
          {foodOptions.map((f) => (
            <option key={f.id} value={f.id} title={f.fullDescription}>
              {f.name}
            </option>
          ))}
        </select>
        {selectedFood && (
          <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginBottom: 16 }}>
            {foodOptions.find((f) => f.id === selectedFood)?.fullDescription}
          </div>
        )}

        <div className="label" style={{ marginBottom: 6 }}>
          Utility (Öl/Stein/Kristall)
        </div>
        <select value={selectedUtility || ""} onChange={(e) => setSelectedUtility(e.target.value ? Number(e.target.value) : null)}>
          <option value="">– kein Utility-Konsumgut –</option>
          {utilityOptions.map((u) => (
            <option key={u.id} value={u.id} title={u.fullDescription}>
              {u.name}
            </option>
          ))}
        </select>
        {selectedUtility && (
          <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 4 }}>
            {utilityOptions.find((u) => u.id === selectedUtility)?.fullDescription}
          </div>
        )}
      </Section>
    </div>
  );
}
