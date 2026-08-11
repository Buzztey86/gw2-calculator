import { useEffect, useMemo, useState } from "react";
import ProfessionPicker from "./components/ProfessionPicker";
import TraitLinePicker from "./components/TraitLinePicker";
import WeaponSkillBrowser from "./components/WeaponSkillBrowser";
import GearSlotPicker from "./components/GearSlotPicker";
import UtilitiesBuffsTab from "./components/UtilitiesBuffsTab";
import Sidebar from "./components/Sidebar";
import { useProfessionData, useStaticData } from "./hooks/useGw2Data";
import { validateBuild, getActiveTraits, getTraitAttributeBonuses, pickDefaultMajors, getAvailableBuffs } from "./lib/build-model";
import { computeGearAttributesFromSlots, fillAllSlots } from "./lib/stats";

function defaultLinesFor(professionData) {
  const core = professionData.specializations.core;
  return core.slice(0, 3).map((s) => s.id);
}

export default function App() {
  const [professionId, setProfessionId] = useState("guardian");
  const [tab, setTab] = useState("talente");
  const [eliteSpec, setEliteSpec] = useState(null);
  const [lines, setLines] = useState([]);
  const [selectedMajors, setSelectedMajors] = useState({});
  const [weaponSetup, setWeaponSetup] = useState("2h");
  const [slotSelections, setSlotSelections] = useState(() => fillAllSlots("Berserker's", "2h"));

  const { data, error, loading } = useProfessionData(professionId);
  const professionsIndex = useStaticData("professions-index");
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

  const { total: gearTotal } = useMemo(
    () => computeGearAttributesFromSlots(slotSelections, weaponSetup),
    [slotSelections, weaponSetup]
  );

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
                <div className="panel">
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

                <div className="panel">
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
              gearTotal={gearTotal}
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
