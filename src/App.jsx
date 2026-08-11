import { useEffect, useMemo, useState } from "react";
import ProfessionPicker from "./components/ProfessionPicker";
import TraitLinePicker from "./components/TraitLinePicker";
import WeaponSkillBrowser from "./components/WeaponSkillBrowser";
import GearSlotPicker from "./components/GearSlotPicker";
import UtilitiesBuffsTab from "./components/UtilitiesBuffsTab";
import Sidebar from "./components/Sidebar";
import { useProfessionData, useStaticData } from "./hooks/useGw2Data";
import { validateBuild, getActiveTraits, getTraitAttributeBonuses, pickDefaultMajors, getAvailableBuffs } from "./lib/build-model";
import {
  computeGearAttributesFromSlots,
  fillAllSlots,
  parseRuneBonuses,
  sumInfusionBonuses,
  mergeBonuses,
  infusionSlotsByType,
  getAllSlots,
} from "./lib/stats";
import { professionColor } from "./lib/professionColors";
import { FOOD_OPTIONS, UTILITY_OPTIONS, consumableBonus } from "./lib/consumables";

function defaultLinesFor(professionData) {
  const core = professionData.specializations.core;
  return core.slice(0, 3).map((s) => s.id);
}

function totalInfusionSlots(rarity, weaponSetup) {
  const slots = getAllSlots(weaponSetup);
  const perType = infusionSlotsByType(rarity);
  return slots.reduce((sum, s) => sum + (perType[s.budgetType] || 0), 0);
}

export default function App() {
  const [professionId, setProfessionId] = useState("guardian");
  const [tab, setTab] = useState("talente");
  const [eliteSpec, setEliteSpec] = useState(null);
  const [lines, setLines] = useState([]);
  const [selectedMajors, setSelectedMajors] = useState({});
  const [weaponSetup, setWeaponSetup] = useState("2h");
  const [slotSelections, setSlotSelections] = useState(() => fillAllSlots("Berserker's", "2h"));
  const [rarity, setRarity] = useState("exotic");
  const [selectedRune, setSelectedRune] = useState(null);
  const [selectedInfusion, setSelectedInfusion] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedUtility, setSelectedUtility] = useState(null);

  const { data, error, loading } = useProfessionData(professionId);
  const professionsIndex = useStaticData("professions-index");
  const gear = useStaticData("gear");
  const professionIcons = useMemo(() => {
    if (!professionsIndex) return {};
    return Object.fromEntries(professionsIndex.map((p) => [p.id, p.icon]));
  }, [professionsIndex]);

  useEffect(() => {
    if (!data) return;
    setEliteSpec(null);
    const defaultLines = defaultLinesFor(data);
    setLines(defaultLines);
    const majors = {};
    for (const lineId of defaultLines) {
      const spec = data.specializations.core.find((s) => s.id === lineId);
      if (spec) majors[lineId] = pickDefaultMajors(spec);
    }
    setSelectedMajors(majors);
  }, [data]);

  const build = useMemo(
    () => ({ professionId, eliteSpec, lines, selectedMajors }),
    [professionId, eliteSpec, lines, selectedMajors]
  );
  const validation = useMemo(() => (data ? validateBuild(build, data) : { valid: false, errors: [] }), [data, build]);
  const activeTraits = useMemo(() => (data ? getActiveTraits(build, data) : []), [data, build]);
  const activeTraitIds = useMemo(() => new Set(activeTraits.map((t) => t.id)), [activeTraits]);
  const traitsById = useMemo(() => new Map(activeTraits.map((t) => [t.id, t])), [activeTraits]);
  const { bonuses: traitBonuses, triggeredEffects } = useMemo(() => getTraitAttributeBonuses(activeTraits), [activeTraits]);
  const availableBuffs = useMemo(() => getAvailableBuffs(activeTraits), [activeTraits]);
  const effects = useStaticData("effects");
  const utilityIndex = useStaticData("utility-index");
  const boonProviders = useStaticData("boon-providers-index");

  const { total: slotTotal } = useMemo(
    () => computeGearAttributesFromSlots(slotSelections, weaponSetup, rarity),
    [slotSelections, weaponSetup, rarity]
  );

  const runeOptions = useMemo(() => gear?.runes || [], [gear]);
  const infusionOptions = useMemo(() => gear?.infusions || [], [gear]);
  const slotCount = useMemo(() => totalInfusionSlots(rarity, weaponSetup), [rarity, weaponSetup]);

  // Ausrüstungs-Boni (Rune + Infusionen) auf das Slot-Ergebnis anwenden
  const gearTotal = useMemo(() => {
    let t = slotTotal;
    const rune = runeOptions.find((r) => r.name === selectedRune);
    if (rune) t = mergeBonuses(t, parseRuneBonuses(rune.statBonuses));
    if (selectedInfusion && slotCount > 0) {
      const ids = Array(slotCount).fill(selectedInfusion);
      t = mergeBonuses(t, sumInfusionBonuses(ids, infusionOptions));
    }
    return t;
  }, [slotTotal, selectedRune, selectedInfusion, slotCount, runeOptions, infusionOptions]);

  // Konsumgüter (Food/Utility) separat, da "percentOf" den bereits berechneten gearTotal braucht
  const totalWithConsumables = useMemo(() => {
    let t = gearTotal;
    const food = FOOD_OPTIONS.find((f) => f.id === selectedFood);
    if (food) t = mergeBonuses(t, consumableBonus(food, t));
    const utility = UTILITY_OPTIONS.find((u) => u.id === selectedUtility);
    if (utility) t = mergeBonuses(t, consumableBonus(utility, t));
    return t;
  }, [gearTotal, selectedFood, selectedUtility]);

  return (
    <div className="app-shell">
      <div className="header">
        <div className="label" style={{ color: "var(--accent)", marginBottom: 6 }}>
          Guild Wars 2 · Gilden-Build-Tool (lokale Vorschau)
        </div>
        <h1>Charakter-Build-Rechner</h1>
        <p>
          Talente, Waffenfähigkeiten und Ausrüstungs-Stats auf Basis echter Guild-Wars-2-Daten. Die Seitenleiste
          zeigt Stats & Buffs immer live, egal welchen Reiter du gerade bearbeitest.
        </p>
      </div>

      <ProfessionPicker selected={professionId} onSelect={setProfessionId} professionIcons={professionIcons} />

      {loading && <div className="loading">Lade {professionId}-Daten…</div>}
      {error && <div className="error-box">Fehler: {error}</div>}

      {data && (
        <div className="main-layout">
          <div className="main-content">
            <div className="tabs">
              <button className={`tab-btn ${tab === "talente" ? "active" : ""}`} onClick={() => setTab("talente")}>
                Talente & Skills
              </button>
              <button className={`tab-btn ${tab === "ausruestung" ? "active" : ""}`} onClick={() => setTab("ausruestung")}>
                Ausrüstung
              </button>
              <button className={`tab-btn ${tab === "utilities" ? "active" : ""}`} onClick={() => setTab("utilities")}>
                Utilities & Buffs
              </button>
            </div>

            {tab === "talente" && (
              <div className="grid-cols grid-2">
                <div className="panel" style={{ borderLeft: `3px solid ${professionColor(professionId, "solid")}` }}>
                  <div className="label" style={{ color: "var(--accent)", marginBottom: 12 }}>
                    Talente (3-Linien-System)
                  </div>
                  <TraitLinePicker
                    professionData={data}
                    eliteSpec={eliteSpec}
                    setEliteSpec={setEliteSpec}
                    lines={lines}
                    setLines={setLines}
                    selectedMajors={selectedMajors}
                    setSelectedMajors={setSelectedMajors}
                    validation={validation}
                  />
                </div>

                <div className="panel" style={{ borderLeft: `3px solid ${professionColor(professionId, "solid")}` }}>
                  <div className="label" style={{ color: "var(--accent)", marginBottom: 12 }}>
                    Waffenfähigkeiten (live nach Talenten)
                  </div>
                  <WeaponSkillBrowser professionData={data} activeTraitIds={activeTraitIds} traitsById={traitsById} />
                </div>
              </div>
            )}

            {tab === "ausruestung" && (
              <div className="panel">
                <div className="label" style={{ color: "var(--accent)", marginBottom: 12 }}>
                  Ausrüstung (Mix & Match pro Slot)
                </div>
                <GearSlotPicker
                  weaponSetup={weaponSetup}
                  setWeaponSetup={setWeaponSetup}
                  slotSelections={slotSelections}
                  setSlotSelections={setSlotSelections}
                  rarity={rarity}
                  setRarity={setRarity}
                  runeOptions={runeOptions}
                  selectedRune={selectedRune}
                  setSelectedRune={setSelectedRune}
                  infusionOptions={infusionOptions}
                  selectedInfusion={selectedInfusion}
                  setSelectedInfusion={setSelectedInfusion}
                  foodOptions={FOOD_OPTIONS}
                  selectedFood={selectedFood}
                  setSelectedFood={setSelectedFood}
                  utilityOptions={UTILITY_OPTIONS}
                  selectedUtility={selectedUtility}
                  setSelectedUtility={setSelectedUtility}
                />
              </div>
            )}

            {tab === "utilities" && (
              <UtilitiesBuffsTab utilityIndex={utilityIndex} boonProviders={boonProviders} effects={effects} />
            )}
          </div>

          <div className="sidebar-col">
            <Sidebar
              professionName={data.name}
              gearTotal={totalWithConsumables}
              rarity={rarity}
              traitBonuses={traitBonuses}
              triggeredEffects={triggeredEffects}
              availableBuffs={availableBuffs}
              effects={effects}
              activeTraits={activeTraits}
            />
          </div>
        </div>
      )}

      <div className="footer-note">
        Lokale Vorschau · Daten aus der offiziellen Guild Wars 2 API · gw2-buildtool
      </div>
    </div>
  );
}
