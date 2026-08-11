// Konsumgüter (Food & Utility/Oils), Beispielauswahl mit echten Werten
// aus der offiziellen GW2-API. "flat" = fester Attributbonus, "percentOf" =
// Bonus als Prozentsatz eines anderen (aktuellen) Attributs - z. B.
// Furious Sharpening Stone: Power/Ferocity = 3% der aktuellen Precision.

export const FOOD_OPTIONS = [
  {
    id: 41569,
    name: "Bowl of Sweet and Spicy Butternut Squash Soup",
    kind: "flat",
    stats: { Power: 100, Ferocity: 70 },
    icon: "images/gear/bowl_of_sweet_and_spicy_butternut_squash_soup.png",
  },
  {
    id: 36793,
    name: "Bowl of Tropical Fruit Salad",
    kind: "flat",
    stats: { HealingPower: 100, ConditionDamage: 70 },
    icon: "images/gear/bowl_of_tropical_fruit_salad.png",
  },
];

export const UTILITY_OPTIONS = [
  {
    id: 67530,
    name: "Furious Sharpening Stone",
    kind: "percentOf",
    // je Ziel-Attribut: 3% des aktuellen Wertes des Quell-Attributs
    effects: [
      { attr: "Power", ofAttr: "Precision", pct: 0.03 },
      { attr: "Ferocity", ofAttr: "Precision", pct: 0.03 },
    ],
    icon: "images/gear/furious_sharpening_stone.png",
  },
];

/**
 * Berechnet den Attribut-Bonus eines Food-/Utility-Items. Für "percentOf"
 * braucht es die bereits berechneten Basis-Attribute (Gear + Runen), da der
 * Bonus von deren aktuellem Wert abhängt.
 */
export function consumableBonus(item, currentTotal) {
  if (!item) return {};
  if (item.kind === "flat") return { ...item.stats };
  if (item.kind === "percentOf") {
    const out = {};
    for (const eff of item.effects) {
      out[eff.attr] = (out[eff.attr] || 0) + (currentTotal[eff.ofAttr] || 0) * eff.pct;
    }
    return out;
  }
  return {};
}
