/**
 * stats.js — Attribut-/Schadensformeln + Item-Budgets + Stat-Kombinationen.
 * Slot-Modell: jeder Ausrüstungsplatz ist einzeln wählbar (Mix & Match),
 * statt eines einzigen globalen Sets.
 */

export const BASE_ATTR = {
  Power: 1000, Precision: 1000, Toughness: 1000, Vitality: 1000,
  Ferocity: 0, ConditionDamage: 0, Expertise: 0, Concentration: 0, HealingPower: 0,
};

// Attribut-Budgets pro Slot-Typ, Exotic, Level 80 (API-verifiziert, siehe gw2-project/README.md)
export const BUDGET_BY_TYPE_EXOTIC = {
  weapon2h: 682.88,
  weapon1h: 341.44,
  amulet: 341.44,
  ring: 256.08,
  accessory: 256.08,
  leggings: 256.08,
  chest: 384.12,
  minorArmor: 128.04, // Kopf/Schulter/Hand/Fuß
  backitem: 128.04,
};

// Ascended = Exotic x 1.05, API-verifiziert (Zojja's Claymore: 717.024 / 682.88 = 1.05 exakt).
export const ASCENDED_MULTIPLIER = 1.05;
export const BUDGET_BY_TYPE_ASCENDED = Object.fromEntries(
  Object.entries(BUDGET_BY_TYPE_EXOTIC).map(([k, v]) => [k, v * ASCENDED_MULTIPLIER])
);

export function budgetByType(rarity) {
  return rarity === "ascended" ? BUDGET_BY_TYPE_ASCENDED : BUDGET_BY_TYPE_EXOTIC;
}

// Infusionsslots pro Slot-Typ. Bei Exotic haben regulaer nur bestimmte
// Fraktal-Trinkets (z.B. "Feedback Loop"-Ring) ueberhaupt einen Sockel - hier
// als optionaler Slot fuer Ring/Amulett/Schmuckstueck nachgebildet. Bei
// Ascended hat grundsaetzlich alles einen Sockel, Ringe sogar zwei.
export const INFUSION_SLOTS_EXOTIC = {
  ring: 1, amulet: 1, accessory: 1,
  weapon2h: 0, weapon1h: 0, leggings: 0, chest: 0, minorArmor: 0, backitem: 0,
};
export const INFUSION_SLOTS_ASCENDED = {
  ring: 2, amulet: 1, accessory: 1,
  weapon2h: 2, weapon1h: 1, leggings: 1, chest: 1, minorArmor: 1, backitem: 1,
};
export function infusionSlotsByType(rarity) {
  return rarity === "ascended" ? INFUSION_SLOTS_ASCENDED : INFUSION_SLOTS_EXOTIC;
}

// Jeder einzelne Ausrüstungsplatz mit Anzeige-Name + zugehörigem Budget-Typ.
// weaponMain/weaponOff hängen vom gewählten Waffen-Setup ab (siehe getWeaponSlots).
export const ARMOR_TRINKET_SLOTS = [
  { key: "head", label: "Head", budgetType: "minorArmor" },
  { key: "shoulders", label: "Shoulders", budgetType: "minorArmor" },
  { key: "chest", label: "Chest", budgetType: "chest" },
  { key: "gloves", label: "Hands", budgetType: "minorArmor" },
  { key: "leggings", label: "Legs", budgetType: "leggings" },
  { key: "boots", label: "Feet", budgetType: "minorArmor" },
  { key: "amulet", label: "Amulet", budgetType: "amulet" },
  { key: "ring1", label: "Ring 1", budgetType: "ring" },
  { key: "ring2", label: "Ring 2", budgetType: "ring" },
  { key: "accessory1", label: "Accessory 1", budgetType: "accessory" },
  { key: "accessory2", label: "Accessory 2", budgetType: "accessory" },
  { key: "backitem", label: "Back Item", budgetType: "backitem" },
];

export function getWeaponSlots(setup) {
  // setup: "2h" oder "1h+1h"
  if (setup === "1h+1h") {
    return [
      { key: "weaponMain", label: "Weapon (Main Hand)", budgetType: "weapon1h" },
      { key: "weaponOff", label: "Weapon (Off-Hand)", budgetType: "weapon1h" },
    ];
  }
  return [{ key: "weaponMain", label: "Weapon (Two-Handed)", budgetType: "weapon2h" }];
}

export function getAllSlots(weaponSetup) {
  return [...getWeaponSlots(weaponSetup), ...ARMOR_TRINKET_SLOTS];
}

export const DEFENSE_BY_WEIGHT = {
  Light: { exotic: 920, ascended: 967 },
  Medium: { exotic: 1064, ascended: 1118 },
  Heavy: { exotic: 1211, ascended: 1271 },
};
export const BASE_HEALTH_BY_PROFESSION = {
  Guardian: 11645, Elementalist: 11645, Mesmer: 11645, Necromancer: 11645,
  Engineer: 15922, Ranger: 15922, Revenant: 15922, Thief: 15922, Warrior: 19212,
};
export const ARMOR_WEIGHT_BY_PROFESSION = {
  Guardian: "Heavy", Warrior: "Heavy", Revenant: "Heavy",
  Ranger: "Medium", Thief: "Medium", Engineer: "Medium",
  Elementalist: "Light", Mesmer: "Light", Necromancer: "Light",
};
export const REFERENCE_ARMOR = 2597;

// Alle Stat-Kombinationen, Verhältniswerte direkt aus der offiziellen API (/v2/itemstats).
// Attributnamen hier bereits auf die Anzeige-Namen übersetzt (CritDamage->Ferocity,
// Healing->HealingPower, BoonDuration->Concentration, ConditionDuration->Expertise).
export const STAT_COMBOS = {
  "Berserker's": { Power: 0.35, Precision: 0.25, Ferocity: 0.25 },
  "Assassin's": { Power: 0.25, Precision: 0.35, Ferocity: 0.25 },
  "Marauder": { Power: 0.2, Precision: 0.2, Vitality: 0.2, Ferocity: 0.2 },
  "Dragon's": { Power: 0.3, Precision: 0.165, Vitality: 0.165, Ferocity: 0.3 },
  "Cavalier's": { Power: 0.35, Toughness: 0.25, Ferocity: 0.25 },
  "Knight's": { Power: 0.35, Precision: 0.25, Toughness: 0.25 },
  "Soldier's": { Power: 0.35, Toughness: 0.25, Vitality: 0.25 },
  "Crusader": { Power: 0.3, Toughness: 0.3, Ferocity: 0.165, HealingPower: 0.165 },

  "Viper's": { Power: 0.24, Precision: 0.19, ConditionDamage: 0.24, Expertise: 0.19 },
  "Sinister": { Power: 0.35, Precision: 0.25, ConditionDamage: 0.25 },
  "Grieving": { Power: 0.3, Precision: 0.165, Ferocity: 0.165, ConditionDamage: 0.3 },
  "Rampager's": { Power: 0.25, Precision: 0.35, ConditionDamage: 0.25 },
  "Trailblazer's": { Toughness: 0.24, Vitality: 0.24, ConditionDamage: 0.24, Expertise: 0.19 },
  "Dire": { Toughness: 0.25, Vitality: 0.25, ConditionDamage: 0.35 },

  "Minstrel's": { Toughness: 0.22, Vitality: 0.22, HealingPower: 0.22, Concentration: 0.22 },
  "Harrier's": { Power: 0.3, HealingPower: 0.3, Concentration: 0.3 },
  "Diviner's": { Power: 0.2, Precision: 0.2, Ferocity: 0.2, Concentration: 0.2 },
  "Ritualist's": { Vitality: 0.2, ConditionDamage: 0.2, Concentration: 0.2, Expertise: 0.2 },
  "Commander's": { Power: 0.3, Precision: 0.3, Toughness: 0.165, Concentration: 0.165 },
  "Cleric's": { Power: 0.25, Toughness: 0.25, HealingPower: 0.35 },
  "Magi's": { Precision: 0.25, Vitality: 0.25, HealingPower: 0.35 },
  "Nomad's": { Toughness: 0.35, Vitality: 0.25, HealingPower: 0.25 },

  "Celestial": {
    Power: 0.11, Precision: 0.11, Toughness: 0.11, Vitality: 0.11, Ferocity: 0.11,
    ConditionDamage: 0.11, Expertise: 0.11, Concentration: 0.11, HealingPower: 0.11,
  },
};

// Kurze Rollen-Beschreibung je Kombination, nur für die Anzeige/Sortierung.
export const STAT_COMBO_ROLE = {
  "Berserker's": "Power DPS", "Assassin's": "Power DPS", "Marauder": "Power DPS (+Vitality)",
  "Dragon's": "Power DPS (+Vitality)", "Cavalier's": "Power DPS (tanky)", "Knight's": "Power DPS (tanky)",
  "Soldier's": "Power Survival", "Crusader": "Power Hybrid-Heal",
  "Viper's": "Condition Hybrid", "Sinister": "Condition DPS", "Grieving": "Condition Hybrid",
  "Rampager's": "Condition Hybrid (older)", "Trailblazer's": "Condition Survival", "Dire": "Condition Survival",
  "Minstrel's": "Heal-Support", "Harrier's": "Quickness/Alacrity-DPS-Support", "Diviner's": "Quickness/Alacrity-DPS",
  "Ritualist's": "Condition-Support", "Commander's": "Tanky Boon-Support", "Cleric's": "Heal (older)",
  "Magi's": "Heal (older)", "Nomad's": "Pure Tank",
  "Celestial": "Generalist (all attributes)",
};

export function computeGearAttributesFromSlots(slotSelections, weaponSetup, rarity = "exotic") {
  const slots = getAllSlots(weaponSetup);
  const budgets = budgetByType(rarity);
  const total = { ...BASE_ATTR };
  const perSlotContribution = {}; // slotKey -> {attr: value}
  for (const slot of slots) {
    const prefixName = slotSelections[slot.key];
    if (!prefixName) continue;
    const ratios = STAT_COMBOS[prefixName];
    if (!ratios) continue;
    const budget = budgets[slot.budgetType];
    const contrib = {};
    Object.entries(ratios).forEach(([attr, ratio]) => {
      const val = ratio * budget;
      total[attr] = (total[attr] || 0) + val;
      contrib[attr] = val;
    });
    perSlotContribution[slot.key] = contrib;
  }
  return { total, perSlotContribution };
}

// Komfortfunktion: alle Slots auf dieselbe Kombination setzen ("volles Set").
export function fillAllSlots(prefixName, weaponSetup) {
  const slots = getAllSlots(weaponSetup);
  const out = {};
  for (const slot of slots) out[slot.key] = prefixName;
  return out;
}

// interne API-Attributnamen für Talent-Boni (facts nutzen die API-eigene Benennung)
const INTERNAL_NAME_MAP = { BoonDuration: "Concentration", ConditionDuration: "Expertise", CritDamage: "Ferocity" };

export function addTraitBonuses(total, traitBonuses) {
  const out = { ...total };
  Object.entries(traitBonuses).forEach(([target, value]) => {
    const attr = INTERNAL_NAME_MAP[target] || target;
    out[attr] = (out[attr] || 0) + value;
  });
  return out;
}

export function computeDerivedStats(total, professionName, rarity = "exotic") {
  const critChance = Math.min(100, 5 + (total.Precision - 1000) / 21);
  const critDamage = 150 + total.Ferocity / 15;
  const boonDuration = total.Concentration / 15;
  const conditionDuration = total.Expertise / 15;
  const weight = ARMOR_WEIGHT_BY_PROFESSION[professionName] || "Medium";
  const defense = DEFENSE_BY_WEIGHT[weight][rarity === "ascended" ? "ascended" : "exotic"];
  const armor = defense + total.Toughness;
  const baseHealth = BASE_HEALTH_BY_PROFESSION[professionName] || 15922;
  const health = (baseHealth - 10000) + total.Vitality * 10;
  const eHP = Math.round(health * (armor / REFERENCE_ARMOR));
  return { critChance, critDamage, boonDuration, conditionDuration, armor, health, eHP };
}

export function averageHitDamage(power, critChance, critDamage, weaponStrength = 1047.5, coefficient = 1.0, targetArmor = REFERENCE_ARMOR) {
  const baseHit = (weaponStrength * power * coefficient) / targetArmor;
  const avgCritMult = 1 + (critChance / 100) * (critDamage / 100 - 1);
  return baseHit * avgCritMult;
}

// --- Runen: 6-teiliger Bonus aus den API-Statwerten (kumulativ je Stat, daher Maximum je Attribut nehmen) ---
export function parseRuneBonuses(statBonusStrings) {
  const bonuses = {};
  for (const s of statBonusStrings || []) {
    const m = s.match(/^\+?(\d+(?:\.\d+)?)%?\s+(.+)$/);
    if (!m) continue;
    const value = Number(m[1]);
    const rawName = m[2].trim();
    const isPercent = s.includes("%");
    const nameMap = {
      Power: "Power", Precision: "Precision", Toughness: "Toughness", Vitality: "Vitality",
      Ferocity: "Ferocity", "Condition Damage": "ConditionDamage", Expertise: "Expertise",
      Concentration: "Concentration", "Healing Power": "HealingPower", Healing: "HealingPower",
    };
    let attr = nameMap[rawName];
    // Manche Runen geben Segens-/Zustandsdauer direkt in % statt über Concentration/Expertise-Punkte -
    // hier näherungsweise in Attributpunkte umgerechnet (15 Punkte = 1%), damit sie in derselben
    // Rechnung landen wie alle anderen Boni (leichte Vereinfachung, im Tooltip transparent gemacht).
    if (!attr && isPercent && /Boon Duration/i.test(rawName)) attr = "Concentration";
    if (!attr && isPercent && /Condition Duration/i.test(rawName)) attr = "Expertise";
    if (!attr) continue;
    const effectiveValue = isPercent && (attr === "Concentration" || attr === "Expertise") && !nameMap[rawName] ? value * 15 : value;
    bonuses[attr] = Math.max(bonuses[attr] || 0, effectiveValue);
  }
  return bonuses;
}

/** Für Tooltips: fasst den Bonus als lesbaren String zusammen, z.B. "+100 Power, +125 Ferocity". */
export function summarizeRuneBonus(statBonusStrings) {
  const bonuses = parseRuneBonuses(statBonusStrings);
  const labels = { Power: "Power", Precision: "Precision", Toughness: "Toughness", Vitality: "Vitality",
    Ferocity: "Ferocity", ConditionDamage: "Condition Damage", Expertise: "Expertise",
    Concentration: "Concentration", HealingPower: "Healing Power" };
  return Object.entries(bonuses)
    .map(([attr, val]) => `+${Math.round(val)} ${labels[attr] || attr}`)
    .join(", ");
}

// --- Infusionen: Summe aller ausgewählten Infusionen (Agony Resistance wird ignoriert, betrifft nur Fraktal-Ueberleben, nicht die angezeigten Attribute) ---
const INFUSION_NAME_MAP = { BoonDuration: "Concentration", ConditionDuration: "Expertise", Healing: "HealingPower", CritDamage: "Ferocity" };
export function sumInfusionBonuses(selectedInfusions, infusionCatalog) {
  const bonuses = {};
  for (const infId of selectedInfusions) {
    const inf = infusionCatalog.find((i) => i.id === infId);
    if (!inf) continue;
    for (const [stat, value] of Object.entries(inf.stats || {})) {
      if (stat === "AgonyResistance") continue;
      const attr = INFUSION_NAME_MAP[stat] || stat;
      bonuses[attr] = (bonuses[attr] || 0) + value;
    }
  }
  return bonuses;
}

// generische Merge-Funktion für alle "einfachen" Bonusquellen (Rune, Food, Infusion, Trait bereits ueber addTraitBonuses)
export function mergeBonuses(total, bonuses) {
  const out = { ...total };
  for (const [attr, value] of Object.entries(bonuses)) {
    out[attr] = (out[attr] || 0) + value;
  }
  return out;
}

// Berechnet den Attribut-Bonus eines Food-/Utility-Eintrags aus den neuen
// WvW-Katalogen (flat + percentEffects statt des alten einfachen Formats).
export function wvwConsumableBonus(item, currentTotal) {
  if (!item) return {};
  const out = { ...(item.flat || {}) };
  for (const eff of item.percentEffects || []) {
    out[eff.attr] = (out[eff.attr] || 0) + (currentTotal[eff.ofAttr] || 0) * eff.pct;
  }
  return out;
}
