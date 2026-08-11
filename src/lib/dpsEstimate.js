/**
 * dpsEstimate.js — theoretical sustained damage estimate, NOT a rotation
 * simulation. No skill sequencing, no animation-lock, no boon-uptime timing.
 *
 * Model: every skill with a Recharge fact is assumed to be used exactly once
 * per its recharge (perfect on-cooldown usage). Skills without a Recharge
 * fact (autoattack chains) are assumed to be used back-to-back at a fixed
 * 0.75s interval - a commonly-used rough estimate for GW2 weapon-skill cast
 * time when the exact animation length isn't available in the API data.
 * Each skill's DPS contribution = damage-per-use / effective-interval.
 * Condition application (Bleeding/Burning/Poison/Torment) is converted to a
 * DPS contribution the same way: (stacks × duration × tick-damage) / interval.
 *
 * This deliberately ignores real play: no missed cooldowns, perfect uptime,
 * no downtime from movement/dodging/mechanics, no actual player rotation.
 * It answers "how strong is this build on paper", not "what will my
 * logs say" - those require a real rotation and combat log parser.
 */

// Per-stack-per-second tick damage at level 80, wiki-confirmed current formulas
// (Bleeding/Burning/Poisoned pages); Torment derived from the developer-confirmed
// "75% of bleeding stationary / 150% moving" ratio applied to the current bleeding
// formula. Confusion is intentionally excluded - its damage is dominated by the
// target's own skill-activation frequency, which has no meaning without a rotation.
export function conditionTickDamage(conditionDamage) {
  return {
    Bleeding: 22 + 0.06 * conditionDamage,
    Burning: 131 + 0.155 * conditionDamage,
    Poisoned: 33.5 + 0.06 * conditionDamage,
    Torment: 16.5 + 0.045 * conditionDamage, // stationary-target rate (conservative baseline)
  };
}

const DEFAULT_AUTOATTACK_INTERVAL = 0.75;

function skillInterval(facts) {
  const recharge = facts?.find((f) => f.type === "Recharge");
  return recharge ? Math.max(recharge.value, 0.1) : DEFAULT_AUTOATTACK_INTERVAL;
}

function skillPowerDPS(facts, power, critChance, critDamage, weaponStrength) {
  const dmgFact = facts?.find((f) => f.type === "Damage");
  if (!dmgFact) return 0;
  const perHit =
    ((weaponStrength * power * dmgFact.dmg_multiplier) / 2597) * (1 + (critChance / 100) * (critDamage / 100 - 1));
  const hits = dmgFact.hit_count || 1;
  return (perHit * hits) / skillInterval(facts);
}

function skillConditionDPS(facts, tickDamage) {
  let dps = 0;
  for (const f of facts || []) {
    if (f.type !== "Buff" || !tickDamage[f.status]) continue;
    const stacks = f.apply_count || 1;
    const duration = f.duration || 0;
    dps += (stacks * duration * tickDamage[f.status]) / skillInterval(facts);
  }
  return dps;
}

/**
 * @param skillFactsList array of { name, slot, facts } - facts should be the
 *   EFFECTIVE (traited) facts from getEffectiveFacts, so trait modifiers are reflected
 * @param total combined attribute totals (gear+trait+consumables)
 * @param derived output of computeDerivedStats for `total`
 * @param weaponStrength 1047.5 (exotic) or 1100 (ascended), matches sidebar's example-hit calc
 */
export function estimateSustainedDPS(skillFactsList, total, derived, weaponStrength = 1047.5) {
  const tickDamage = conditionTickDamage(total.ConditionDamage || 0);

  // Manche Klassen (z.B. Thief mit Initiative) nutzen keine klassischen Skill-Abklingzeiten fuer
  // Waffen-Skills 2-5, sondern eine begrenzte Ressource - die GW2-API liefert dafuer keine
  // strukturierten Kosten-Facts (verifiziert per Live-API-Abfrage, nicht nur Vermutung). Wenn KEIN
  // Skill im aktuellen Set einen Recharge-Fact hat, gilt das generell als "Recharge unbekannt":
  // nur die kostenlose Autoattack-Kette (Slot "Weapon_1") wird gezaehlt, der Rest ausgeschlossen
  // statt faelschlich als spammable behandelt zu werden.
  const weaponSlotSkills = skillFactsList.filter((s) => s.slot?.startsWith("Weapon_"));
  const hasAnyRecharge = weaponSlotSkills.some((s) => s.facts?.some((f) => f.type === "Recharge"));
  const resourceBased = weaponSlotSkills.length > 0 && !hasAnyRecharge;
  const relevantSkills = resourceBased
    ? skillFactsList.filter((s) => !s.slot?.startsWith("Weapon_") || s.slot === "Weapon_1")
    : skillFactsList;

  let powerDPS = 0;
  let conditionDPS = 0;
  const perSkill = [];
  for (const { name, facts } of relevantSkills) {
    const p = skillPowerDPS(facts, total.Power, derived.critChance, derived.critDamage, weaponStrength);
    const c = skillConditionDPS(facts, tickDamage);
    if (p > 0 || c > 0) perSkill.push({ name, power: p, condition: c });
    powerDPS += p;
    conditionDPS += c;
  }
  return { powerDPS, conditionDPS, totalDPS: powerDPS + conditionDPS, perSkill, resourceBased };
}
