/**
 * build-model.js — Talent-Auswahl (3-Linien-System) + Traited-Facts-Merge.
 *
 * Identische Logik wie im Projekt-Root lib/build-model.js, hier als
 * ES-Module fürs Frontend. Siehe dortige Kommentare für Details zur
 * AttributeAdjust/Healing-Unterscheidung.
 */

export function availableLines(professionData) {
  return {
    core: professionData.specializations.core,
    elite: professionData.specializations.elite,
  };
}

export function validateBuild(build, professionData) {
  const errors = [];
  const { core, elite } = availableLines(professionData);
  const coreIds = new Set(core.map((s) => s.id));
  const eliteByName = new Map(elite.map((s) => [s.name, s]));
  const activeEliteSpec = build.eliteSpec ? eliteByName.get(build.eliteSpec) : null;

  if (build.eliteSpec && !activeEliteSpec) {
    errors.push(`Unbekannte Elite-Spezialisierung: "${build.eliteSpec}"`);
  }
  if (build.lines.length !== 3) {
    errors.push(`Exactly 3 trait lines must be selected (currently: ${build.lines.length}).`);
  }
  if (new Set(build.lines).size !== build.lines.length) {
    errors.push("A trait line is selected twice.");
  }

  let eliteLinesChosen = 0;
  for (const lineId of build.lines) {
    const isCore = coreIds.has(lineId);
    const isActiveElite = activeEliteSpec && activeEliteSpec.id === lineId;
    if (isActiveElite) eliteLinesChosen++;
    if (!isCore && !isActiveElite) {
      errors.push(`Trait line ${lineId} is not selectable.`);
    }
  }
  if (eliteLinesChosen > 1) errors.push("Only one elite trait line can be active at a time.");

  const specById = new Map([...core, ...elite].map((s) => [s.id, s]));
  for (const lineId of build.lines) {
    const spec = specById.get(lineId);
    if (!spec) continue;
    const chosen = build.selectedMajors[lineId] || [];
    if (chosen.length !== 3) {
      errors.push(`"${spec.name}": exactly 3 major traits must be selected (1 per tier).`);
      continue;
    }
    const tiersSeen = new Set();
    for (const traitId of chosen) {
      const trait = spec.traits.find((t) => t.id === traitId && t.slot === "Major");
      if (!trait) {
        errors.push(`"${spec.name}": trait ID ${traitId} is invalid.`);
        continue;
      }
      if (tiersSeen.has(trait.tier)) {
        errors.push(`"${spec.name}": zwei Major-Traits aus demselben Tier (${trait.tierName}).`);
      }
      tiersSeen.add(trait.tier);
    }
  }

  return { valid: errors.length === 0, errors };
}

export function getActiveTraits(build, professionData) {
  const { core, elite } = availableLines(professionData);
  const specById = new Map([...core, ...elite].map((s) => [s.id, s]));
  const active = [];
  for (const lineId of build.lines) {
    const spec = specById.get(lineId);
    if (!spec) continue;
    active.push(...spec.traits.filter((t) => t.slot === "Minor"));
    const chosenIds = new Set(build.selectedMajors[lineId] || []);
    active.push(...spec.traits.filter((t) => t.slot === "Major" && chosenIds.has(t.id)));
  }
  return active;
}

// Talente, deren AttributeAdjust-Fact strukturell nicht von einem echten Stat-Bonus zu
// unterscheiden ist (kein verräterisches "text"-Feld), aber laut Beschreibung eindeutig an
// eine Bedingung (Formwechsel, Modus, Pet-Stat statt Spieler-Stat) gebunden ist - gefunden beim
// Testen mit vollem Berserker's-Gear auf dem Necromancer (Reaper's Onslaught) und beim
// systematischen Nachprüfen aller 9 Klassen ergänzt.
const CONDITIONAL_TRAIT_EXCLUSIONS = new Set([
  "Fatal Frenzy", // Warrior: "Berserk mode increases power and condition damage" - nur im Berserk-Modus
  "Reaper's Onslaught", // Necromancer: "while in Reaper's Shroud"
  "No Quarter", // Thief: "while under the effects of fury"
  "Fang and Claw", // Ranger: betrifft das Pet, nicht den Spieler selbst
  "Pet's Prowess", // Ranger: betrifft das Pet, nicht den Spieler selbst
]);

// Verräterisches "text"-Label statt eines echten Attributnamens = Fact beschreibt die Größe
// eines getriggerten Effekts (Heilung, Schaden, Barriere, Lebensentzug), keinen permanenten Bonus.
const TRIGGERED_TEXT_PATTERN = /Damage|Heal|Siphon|Barrier/i;

/**
 * Getriggerte Effekte (Heilung, Schaden, Barriere, Lebensentzug) werden getrennt von echten
 * Attribut-Boni gehalten. Naives Summieren hätte in Tests fälschlich hohe Werte erzeugt
 * (z.B. Necromancer "Terror": +555 "Condition Damage" ist tatsächlich die Schadensmagnitude
 * des Furcht-Tick-Effekts, kein permanenter Stat) - viele Traits nutzen denselben Fact-Typ,
 * um die Größe eines Effekts zu beschreiben statt einen permanenten Stat-Bonus.
 */
export function getTraitAttributeBonuses(activeTraits) {
  const bonuses = {};
  const triggeredEffects = [];
  for (const trait of activeTraits) {
    if (CONDITIONAL_TRAIT_EXCLUSIONS.has(trait.name)) continue;
    const perTraitMax = {};
    for (const fact of trait.facts || []) {
      if (fact.type !== "AttributeAdjust" || !fact.target || fact.target === "None") continue;
      if (fact.target === "Healing" || TRIGGERED_TEXT_PATTERN.test(fact.text || "")) {
        triggeredEffects.push({ traitName: trait.name, amount: fact.value });
        continue;
      }
      perTraitMax[fact.target] = Math.max(perTraitMax[fact.target] || 0, fact.value || 0);
    }
    for (const [target, value] of Object.entries(perTraitMax)) {
      bonuses[target] = (bonuses[target] || 0) + value;
    }
  }
  return { bonuses, triggeredEffects };
}

/**
 * Wie getEffectiveFacts, liefert aber zusätzlich den jeweiligen Basiswert
 * (vor Talent-Einfluss) mit zurück, damit die UI Basis- und Talent-Wert
 * getrennt und farblich unterscheidbar anzeigen kann, statt den Basiswert
 * stillschweigend zu überschreiben.
 */
export function getEffectiveFacts(skill, activeTraitIds, traitsById) {
  const baseFacts = (skill.facts || []).map((f) => ({ ...f }));
  const facts = baseFacts.map((f) => ({ ...f }));
  const traitedBy = [];
  const changedIndexes = new Set();

  for (const tf of skill.traitedFacts || []) {
    if (!activeTraitIds.has(tf.requiresTrait)) continue;
    if (tf.overrides == null || !facts[tf.overrides]) continue;
    const { requiresTrait: _requiresTrait, overrides: _overrides, ...substantive } = tf;
    facts[tf.overrides] = { ...facts[tf.overrides], ...substantive };
    changedIndexes.add(tf.overrides);
    const name = traitsById.get(tf.requiresTrait)?.name;
    if (name) traitedBy.push(name);
  }

  const combined = facts.map((f, i) => ({
    base: baseFacts[i],
    effective: f,
    changed: changedIndexes.has(i),
  }));

  return { facts, baseFacts, combined, traitedBy: [...new Set(traitedBy)] };
}

export function pickDefaultMajors(spec) {
  const majors = spec.traits.filter((t) => t.slot === "Major");
  const out = [];
  for (const tier of [1, 2, 3]) {
    const t = majors.find((m) => m.tier === tier);
    if (t) out.push(t.id);
  }
  return out;
}

/**
 * Durchsucht alle aktiven Talente nach Buff-Facts (type === "Buff") und
 * listet, welche Segen/Effekte der Build dadurch bereitstellen kann, inkl.
 * welche(s) Talent(e) jeweils die Quelle sind. Enthält sowohl die 12
 * Standard-Boons als auch klassen-eigene Sondereffekte (z. B. "Symbolic
 * Avenger") - beides sind technisch gleich strukturierte Buff-Facts.
 */
export function getAvailableBuffs(activeTraits) {
  const buffs = new Map(); // status -> { sources: Set<traitName>, fact }
  for (const trait of activeTraits) {
    for (const fact of trait.facts || []) {
      if (fact.type === "Buff" && fact.status) {
        if (!buffs.has(fact.status)) buffs.set(fact.status, { sources: new Set(), fact });
        buffs.get(fact.status).sources.add(trait.name);
      }
    }
  }
  return [...buffs.entries()].map(([status, { sources, fact }]) => ({
    status,
    sources: [...sources],
    fact,
  }));
}
