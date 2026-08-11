// Klassenspezifische Akzentfarben, gesampelt aus wvw-builds.com (Referenz-Design).
// "muted" = gedämpfte Variante für Rand-Akzente, "solid" = gesättigt für Badges/aktive Zustände.
export const PROFESSION_COLORS = {
  guardian: { muted: "#1f3349", solid: "#5b9db3" },
  warrior: { muted: "#4a3823", solid: "#b8791f" },
  revenant: { muted: "#391e37", solid: "#a33a3a" },
  ranger: { muted: "#2d4227", solid: "#5a8a4a" },
  thief: { muted: "#373b42", solid: "#7d8492" },
  engineer: { muted: "#4c3527", solid: "#ce7f4b" },
  elementalist: { muted: "#4a282a", solid: "#c25b4a" },
  mesmer: { muted: "#4f3150", solid: "#9123a8" },
  necromancer: { muted: "#253f39", solid: "#2e9b7a" },
};

export function professionColor(id, variant = "muted") {
  return PROFESSION_COLORS[id]?.[variant] || "var(--accent)";
}
