import { useEffect, useMemo, useState } from "react";
import ProfessionPicker from "./components/ProfessionPicker";
import TraitLinePicker from "./components/TraitLinePicker";
import WeaponSkillBrowser from "./components/WeaponSkillBrowser";
import GearSlotPicker from "./components/GearSlotPicker";
import UtilitiesBuffsTab from "./components/UtilitiesBuffsTab";
import UtilitySkillPicker from "./components/UtilitySkillPicker";
import BuildCodeBar from "./components/BuildCodeBar";
import Sidebar from "./components/Sidebar";
import { useProfessionData, useStaticData, PROFESSION_LIST } from "./hooks/useGw2Data";
import { validateBuild, getActiveTraits, getTraitAttributeBonuses, pickDefaultMajors, getAvailableBuffs } from "./lib/build-model";
import {
  computeGearAttributesFromSlots,
  fillAllSlots,
  parseRuneBonuses,
  sumInfusionBonuses,
  mergeBonuses,
  wvwConsumableBonus,
  infusionSlotsByType,
  getAllSlots,
} from "./lib/stats";
import { professionColor } from "./lib/professionColors";
import { decodeBuildCode, peekProfessionFromCode } from "./lib/buildCode";

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
  const [selectedSigils, setSelectedSigils] = useState([null, null]);
  const [selectedRelic, setSelectedRelic] = useState(null);
  const [selectedInfusion, setSelectedInfusion] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [selectedUtility, setSelectedUtility] = useState(null);
  const [selectedHeal, setSelectedHeal] = useState(null);
  const [selectedUtilities, setSelectedUtilities] = useState([]);
  const [selectedElite, setSelectedElite] = useState(null);
  const [skillTab, setSkillTab] = useState("waffen");
  const [pendingImportCode, setPendingImportCode] = useState(null);
  const [importStatus, setImportStatus] = useState(null); // { ok: bool, message: string }
  const [lastData, setLastData] = useState(null); // letzte erfolgreich geladene Klassendaten, um Aufblitzen beim Wechsel zu vermeiden

  const { data, error, loading } = useProfessionData(professionId);
  // Zeigt die zuletzt geladenen Klassendaten weiter an, waehrend beim Klassenwechsel (z.B. durch
  // Import) kurz neu geladen wird - verhindert, dass die komplette Oberflaeche (inkl. der
  // Build-Code-Leiste selbst) sichtbar verschwindet und wieder auftaucht.
  const displayData = data && data.id === professionId ? data : lastData;
  const isSwitchingProfession = displayData && displayData.id !== professionId;
  const professionsIndex = useStaticData("professions-index");
  const allRunes = useStaticData("all-runes");
  const allSigils = useStaticData("all-sigils");
  const allRelics = useStaticData("all-relics");
  const wvwFoods = useStaticData("wvw-foods");
  const wvwUtilities = useStaticData("wvw-utilities");
  const wvwInfusions = useStaticData("wvw-infusions");
  const paletteMap = useStaticData("skill-palette-map");

  const professionIcons = useMemo(() => {
    if (!professionsIndex) return {};
    return Object.fromEntries(professionsIndex.map((p) => [p.id, p.icon]));
  }, [professionsIndex]);

  useEffect(() => {
    if (data) setLastData(data);
  }, [data]);

  useEffect(() => {
    if (!data || data.id !== professionId) return;
    if (pendingImportCode) {
      try {
        const decoded = decodeBuildCode(pendingImportCode, { [professionId]: data }, paletteMap);
        setEliteSpec(decoded.eliteSpec);
        setLines(decoded.lines);
        setSelectedMajors(decoded.selectedMajors);
        setSelectedHeal(decoded.selectedHeal);
        setSelectedUtilities(decoded.selectedUtilities);
        setSelectedElite(decoded.selectedElite);
        const profLabel = PROFESSION_LIST.find((p) => p.id === professionId)?.name || professionId;
        setImportStatus({
          ok: true,
          message: `Import erfolgreich: ${profLabel}${decoded.eliteSpec ? " · " + decoded.eliteSpec : ""}, ${decoded.lines.length} Talentlinien übernommen.`,
        });
      } catch (err) {
        setImportStatus({ ok: false, message: "Import fehlgeschlagen: " + err.message });
      }
      setPendingImportCode(null);
      return;
    }
    setEliteSpec(null);
    setSelectedHeal(null);
    setSelectedUtilities([]);
    setSelectedElite(null);
    const defaultLines = defaultLinesFor(data);
    setLines(defaultLines);
    const majors = {};
    for (const lineId of defaultLines) {
      const spec = data.specializations.core.find((s) => s.id === lineId);
      if (spec) majors[lineId] = pickDefaultMajors(spec);
    }
    setSelectedMajors(majors);
  }, [data, pendingImportCode, professionId, paletteMap]);

  function handleImportBuildCode(code) {
    const targetProfession = peekProfessionFromCode(code); // wirft bei ungültigem Code
    setImportStatus(null);
    setPendingImportCode(code);
    if (targetProfession !== professionId) {
      setProfessionId(targetProfession);
    }
    // Ist die Zielklasse schon aktiv, greift der obige useEffect beim naechsten Render
    // (data ist schon da), da pendingImportCode sich geaendert hat.
  }

  const build = useMemo(
    () => ({ professionId, eliteSpec, lines, selectedMajors, selectedHeal, selectedUtilities, selectedElite }),
    [professionId, eliteSpec, lines, selectedMajors, selectedHeal, selectedUtilities, selectedElite]
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

  const runeOptions = useMemo(() => allRunes || [], [allRunes]);
  const sigilOptions = useMemo(() => allSigils || [], [allSigils]);
  const relicOptions = useMemo(() => allRelics || [], [allRelics]);
  const foodOptions = useMemo(() => wvwFoods || [], [wvwFoods]);
  const utilityOptions = useMemo(() => wvwUtilities || [], [wvwUtilities]);
  const infusionOptions = useMemo(() => wvwInfusions || [], [wvwInfusions]);
  const slotCount = useMemo(() => totalInfusionSlots(rarity, weaponSetup), [rarity, weaponSetup]);

  // Ausrüstungs-Boni (Rune + Infusionen) auf das Slot-Ergebnis anwenden.
  // Sigille/Relic geben ueberwiegend Trigger-Effekte, keine permanenten Stats - fliessen bewusst nicht ein.
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
    const food = foodOptions.find((f) => f.id === selectedFood);
    if (food) t = mergeBonuses(t, wvwConsumableBonus(food, t));
    const utility = utilityOptions.find((u) => u.id === selectedUtility);
    if (utility) t = mergeBonuses(t, wvwConsumableBonus(utility, t));
    return t;
  }, [gearTotal, selectedFood, selectedUtility, foodOptions, utilityOptions]);

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

      {loading && !displayData && <div className="loading">Lade {professionId}-Daten…</div>}
      {error && <div className="error-box">Fehler: {error}</div>}

      {displayData && (
        <div className="main-layout" style={{ opacity: isSwitchingProfession ? 0.5 : 1, transition: "opacity 0.15s" }}>
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
              <>
                <BuildCodeBar
                  build={build}
                  professionData={displayData}
                  paletteMap={paletteMap}
                  onImport={handleImportBuildCode}
                  importStatus={importStatus}
                />
                <div className="grid-cols grid-2">
                  <div className="panel" style={{ borderLeft: `3px solid ${professionColor(professionId, "solid")}` }}>
                    <div className="label" style={{ color: "var(--accent)", marginBottom: 12 }}>
                      Talente (3-Linien-System)
                    </div>
                    <TraitLinePicker
                      professionData={displayData}
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
                    <div className="weapon-tabs" style={{ marginBottom: 10 }}>
                      <button
                        className={`weapon-tab ${skillTab === "waffen" ? "active" : ""}`}
                        onClick={() => setSkillTab("waffen")}
                      >
                        Waffenfähigkeiten
                      </button>
                      <button
                        className={`weapon-tab ${skillTab === "utility" ? "active" : ""}`}
                        onClick={() => setSkillTab("utility")}
                      >
                        Utility-Skills
                      </button>
                    </div>
                    {skillTab === "waffen" ? (
                      <WeaponSkillBrowser professionData={displayData} activeTraitIds={activeTraitIds} traitsById={traitsById} eliteSpec={eliteSpec} />
                    ) : (
                      <UtilitySkillPicker
                        professionData={displayData}
                        selectedHeal={selectedHeal}
                        setSelectedHeal={setSelectedHeal}
                        selectedUtilities={selectedUtilities}
                        setSelectedUtilities={setSelectedUtilities}
                        selectedElite={selectedElite}
                        setSelectedElite={setSelectedElite}
                        activeTraitIds={activeTraitIds}
                        traitsById={traitsById}
                      />
                    )}
                  </div>
                </div>
              </>
            )}

            {tab === "ausruestung" && (
              <div className="panel">
                <div className="label" style={{ color: "var(--accent)", marginBottom: 12 }}>
                  Ausrüstung
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
                  sigilOptions={sigilOptions}
                  selectedSigils={selectedSigils}
                  setSelectedSigils={setSelectedSigils}
                  relicOptions={relicOptions}
                  selectedRelic={selectedRelic}
                  setSelectedRelic={setSelectedRelic}
                  infusionOptions={infusionOptions}
                  selectedInfusion={selectedInfusion}
                  setSelectedInfusion={setSelectedInfusion}
                  foodOptions={foodOptions}
                  selectedFood={selectedFood}
                  setSelectedFood={setSelectedFood}
                  utilityOptions={utilityOptions}
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
              professionName={displayData.name}
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
