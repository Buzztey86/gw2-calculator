import {
  STAT_COMBOS,
  STAT_COMBO_ROLE,
  getAllSlots,
  fillAllSlots,
  infusionSlotsByType,
  summarizeRuneBonus,
} from "../lib/stats";
import Icon from "./Icon";
import SearchableSelect from "./SearchableSelect";

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
  const comboOptions = combos.map((c) => ({ value: c, label: `${c} (${STAT_COMBO_ROLE[c]})` }));
  const comboOptionsPlain = combos.map((c) => ({ value: c, label: c }));
  const slotCount = totalInfusionSlots(rarity, weaponSetup);
  const sigilSlotLabels = weaponSetup === "2h" ? ["Sigil 1", "Sigil 2"] : ["Sigil (Main Hand)", "Sigil (Off-Hand)"];

  function handleSlotChange(slotKey, prefixName) {
    setSlotSelections({ ...slotSelections, [slotKey]: prefixName });
  }

  function handleQuickFill(prefixName) {
    if (prefixName) setSlotSelections(fillAllSlots(prefixName, weaponSetup));
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

  const sigilSelectOptions = sigilOptions.map((s) => ({ value: String(s.id), label: s.name, icon: s.icon, title: s.effect }));
  const relicSelectOptions = relicOptions.map((r) => ({ value: String(r.id), label: r.name, icon: r.icon, title: r.description }));
  const runeSelectOptions = runeOptions.map((r) => ({
    value: r.name,
    label: r.name,
    icon: r.icon,
    title: summarizeRuneBonus(r.statBonuses),
  }));
  const infusionSelectOptions = infusionOptions.map((i) => ({ value: String(i.id), label: i.name, icon: i.icon }));
  const foodSelectOptions = foodOptions.map((f) => ({ value: String(f.id), label: f.name, icon: f.icon, title: f.fullDescription }));
  const utilitySelectOptions = utilityOptions.map((u) => ({ value: String(u.id), label: u.name, icon: u.icon, title: u.fullDescription }));

  return (
    <div>
      <Section title="Equipment (Mix & Match per Slot)" defaultOpen>
        <div className="label" style={{ marginBottom: 6 }}>
          Quality
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
          Weapon Setup
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            className={`weapon-tab ${weaponSetup === "2h" ? "active" : ""}`}
            onClick={() => handleWeaponSetupChange("2h")}
          >
            Two-Handed Weapon
          </button>
          <button
            className={`weapon-tab ${weaponSetup === "1h+1h" ? "active" : ""}`}
            onClick={() => handleWeaponSetupChange("1h+1h")}
          >
            2× One-Handed Weapons
          </button>
        </div>

        <div className="label" style={{ marginBottom: 6 }}>
          Quick Select (set all slots at once)
        </div>
        <div style={{ marginBottom: 20 }}>
          <SearchableSelect options={comboOptions} value="" onChange={handleQuickFill} placeholder="– select full set –" />
        </div>

        <div className="label" style={{ marginBottom: 10 }}>
          Individual Slots (Mix & Match)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
          {slots.map((slot) => (
            <div key={slot.key}>
              <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 3 }}>{slot.label}</div>
              <SearchableSelect
                options={comboOptionsPlain}
                value={slotSelections[slot.key] || ""}
                onChange={(v) => handleSlotChange(slot.key, v)}
                emptyLabel="– none –"
              />
            </div>
          ))}
        </div>
      </Section>

      <Section title="Weapon Upgrades" subtitle={`${sigilOptions.length} sigils · ${relicOptions.length} relics available`}>
        {sigilSlotLabels.map((label, i) => (
          <div key={label} style={{ marginBottom: 12 }}>
            <div className="label" style={{ marginBottom: 6 }}>
              {label}
            </div>
            <SearchableSelect
              options={sigilSelectOptions}
              value={selectedSigils[i] ? String(selectedSigils[i]) : ""}
              onChange={(v) => handleSigilChange(i, v)}
              emptyLabel="– no sigil –"
            />
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
        <SearchableSelect
          options={relicSelectOptions}
          value={selectedRelic ? String(selectedRelic) : ""}
          onChange={(v) => setSelectedRelic(v ? Number(v) : null)}
          emptyLabel="– no relic –"
        />
        {selectedRelic && (
          <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 4 }}>
            {relicOptions.find((r) => r.id === selectedRelic)?.description}
          </div>
        )}
        <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 8 }}>
          Sigil/relic effects are mostly trigger effects (on crit, weapon swap, skill use …) and are not
          included in the attribute calculation – only the rune and infusions provide permanent stat bonuses.
        </div>
      </Section>

      <Section title="Rune" subtitle={`all ${runeOptions.length} Superior Runes, 6-piece bonus`}>
        <SearchableSelect
          options={runeSelectOptions}
          value={selectedRune || ""}
          onChange={(v) => setSelectedRune(v || null)}
          emptyLabel="– no rune –"
        />
        {selectedRuneObj && (
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "flex-start" }}>
            <Icon src={selectedRuneObj.icon} size={28} />
            <div>
              <div style={{ fontSize: 11.5, color: "var(--positive)", fontWeight: 600 }}>
                Total 6-piece bonus: {summarizeRuneBonus(selectedRuneObj.statBonuses) || "no attribute bonus"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>
                Individual tiers: {(selectedRuneObj.statBonuses || []).join(" · ")}
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section title="Infusions" subtitle="WvW infusions (pure stats, no Agony Resistance needed)">
        {slotCount === 0 ? (
          <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>No infusion slots available for this selection.</div>
        ) : (
          <>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>{slotCount} slots available</div>
            <SearchableSelect
              options={infusionSelectOptions}
              value={selectedInfusion ? String(selectedInfusion) : ""}
              onChange={(v) => setSelectedInfusion(v ? Number(v) : null)}
              emptyLabel="– no infusion –"
            />
            <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 6 }}>
              Applied to all {slotCount} available slots (simplified model).
            </div>
          </>
        )}
      </Section>

      <Section title="Food & Utility" subtitle={`${foodOptions.length} foods · ${utilityOptions.length} utilities, all usable in WvW`}>
        <div className="label" style={{ marginBottom: 6 }}>
          Food
        </div>
        <SearchableSelect
          options={foodSelectOptions}
          value={selectedFood ? String(selectedFood) : ""}
          onChange={(v) => setSelectedFood(v ? Number(v) : null)}
          emptyLabel="– no food –"
        />
        {selectedFood && (
          <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 4, marginBottom: 16 }}>
            {foodOptions.find((f) => f.id === selectedFood)?.fullDescription}
          </div>
        )}

        <div className="label" style={{ marginBottom: 6, marginTop: selectedFood ? 0 : 16 }}>
          Utility (Oil/Stone/Crystal)
        </div>
        <SearchableSelect
          options={utilitySelectOptions}
          value={selectedUtility ? String(selectedUtility) : ""}
          onChange={(v) => setSelectedUtility(v ? Number(v) : null)}
          emptyLabel="– no utility consumable –"
        />
        {selectedUtility && (
          <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 4 }}>
            {utilityOptions.find((u) => u.id === selectedUtility)?.fullDescription}
          </div>
        )}
      </Section>
    </div>
  );
}
