/**
 * buildCode.js — echtes GW2-Chat-Link-Format für Build-Templates (Typ 0x0D),
 * community-dokumentiert unter https://wiki.guildwars2.com/wiki/Chat_link_format
 * und von Tools wie gw2skills.net verwendet. Gegen einen echten, veröffentlichten
 * Build-Code (MetaBattle "Core Spear Engi") verifiziert - Palette-IDs lösen
 * korrekt zu Elixir H/Flamethrower/Grenade Kit/Elixir S/Supply Crate auf.
 *
 * Bewusste Lücken (nicht Teil dieses Tools' Datenmodell, werden beim Export
 * als Null-Bytes geschrieben, beim Import ignoriert):
 * - Ranger-Pets, Revenant-Legenden (16 profession-spezifische Bytes)
 * - Waffen-Array / Weaponmaster-Training-Skill-Varianten (Abschnitt am Ende)
 * - Unterwasser-Skills (werden identisch zu Boden-Skills geschrieben)
 */

const PROFESSION_CODES = {
  guardian: 1, warrior: 2, engineer: 3, ranger: 4, thief: 5,
  elementalist: 6, mesmer: 7, necromancer: 8, revenant: 9,
};
const CODE_TO_PROFESSION = Object.fromEntries(Object.entries(PROFESSION_CODES).map(([k, v]) => [v, k]));

/** Liest nur das Klassen-Byte, ohne Profession-Daten zu benötigen - nötig, um vor
 * dem vollen Dekodieren ggf. erst die richtige Klasse zu laden. */
export function peekProfessionFromCode(code) {
  const trimmed = code.trim().replace(/^\[&/, "").replace(/\]$/, "");
  const bytes = base64ToBytes(trimmed);
  if (bytes.length < 2 || bytes[0] !== 0x0d) throw new Error("Das ist kein GW2-Build-Template-Code.");
  const professionId = CODE_TO_PROFESSION[bytes[1]];
  if (!professionId) throw new Error("Unbekannter Klassen-Code im Build-Code.");
  return professionId;
}

function bytesToBase64(bytes) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
function base64ToBytes(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function buildPaletteMaps(paletteEntries) {
  // paletteEntries: [[paletteId, skillId], ...]
  const skillToPalette = new Map();
  const paletteToSkill = new Map();
  for (const [pid, sid] of paletteEntries) {
    skillToPalette.set(sid, pid);
    paletteToSkill.set(pid, sid);
  }
  return { skillToPalette, paletteToSkill };
}

/**
 * @param build {professionId, eliteSpec, lines, selectedMajors, selectedHeal, selectedUtilities, selectedElite}
 * @param professionData aktuelle Klassen-JSON (für Spezialisierungs-/Trait-Auflösung)
 * @param paletteMap {[ProfessionNameCapitalized]: {code, skillsByPalette}} aus skill-palette-map.json
 */
export function encodeBuildCode(build, professionData, paletteMap) {
  const profCode = PROFESSION_CODES[build.professionId];
  if (!profCode) throw new Error("Unbekannte Klasse für Build-Code.");

  const profKey = Object.keys(paletteMap).find((k) => k.toLowerCase() === build.professionId);
  const { skillToPalette } = buildPaletteMaps(paletteMap[profKey]?.skillsByPalette || []);

  const allSpecs = [...professionData.specializations.core, ...professionData.specializations.elite];
  const specById = new Map(allSpecs.map((s) => [s.id, s]));

  const bytes = [];
  bytes.push(0x0d, profCode);

  for (let i = 0; i < 3; i++) {
    const lineId = build.lines[i];
    const spec = lineId ? specById.get(lineId) : null;
    if (!spec) {
      bytes.push(0, 0);
      continue;
    }
    const chosenIds = new Set(build.selectedMajors[lineId] || []);
    let choiceByte = 0;
    for (const trait of spec.traits) {
      if (trait.slot !== "Major" || !chosenIds.has(trait.id)) continue;
      const choiceValue = (trait.order ?? 0) + 1; // order 0/1/2 -> 1/2/3 (oben/mitte/unten)
      const shift = (trait.tier - 1) * 2; // Tier1->Bit0-1, Tier2->Bit2-3, Tier3->Bit4-5
      choiceByte |= choiceValue << shift;
    }
    bytes.push(spec.id & 0xff, choiceByte & 0xff);
  }

  function pushSkill(skillId) {
    const pid = skillId ? skillToPalette.get(skillId) || 0 : 0;
    bytes.push(pid & 0xff, (pid >> 8) & 0xff);
  }
  // je Skill zweimal (Boden + Wasser) - Wasser wird hier identisch zu Boden geschrieben,
  // da dieses Tool keine separate Unterwasser-Auswahl anbietet.
  pushSkill(build.selectedHeal);
  pushSkill(build.selectedHeal);
  const utils = build.selectedUtilities || [];
  for (let i = 0; i < 3; i++) {
    pushSkill(utils[i]);
    pushSkill(utils[i]);
  }
  pushSkill(build.selectedElite);
  pushSkill(build.selectedElite);

  for (let i = 0; i < 16; i++) bytes.push(0); // Pet/Legende - nicht Teil dieses Tools
  bytes.push(0); // Waffen-Array-Länge: 0
  bytes.push(0); // Skill-Varianten-Länge: 0

  return `[&${bytesToBase64(bytes)}]`;
}

export function decodeBuildCode(code, professionDataByProfession, paletteMap) {
  const trimmed = code.trim().replace(/^\[&/, "").replace(/\]$/, "");
  let bytes;
  try {
    bytes = base64ToBytes(trimmed);
  } catch {
    throw new Error("Ungültiger Build-Code (kein lesbares Base64).");
  }
  if (bytes.length < 44 || bytes[0] !== 0x0d) {
    throw new Error("Das ist kein GW2-Build-Template-Code (falscher Typ oder zu kurz).");
  }
  const professionId = CODE_TO_PROFESSION[bytes[1]];
  if (!professionId) throw new Error("Unbekannter Klassen-Code im Build-Code.");

  const professionData = professionDataByProfession[professionId];
  if (!professionData) {
    throw new Error(`Daten für ${professionId} sind noch nicht geladen - bitte kurz warten und erneut versuchen.`);
  }
  const allSpecs = [...professionData.specializations.core, ...professionData.specializations.elite];
  const specById = new Map(allSpecs.map((s) => [s.id, s]));

  const lines = [];
  const selectedMajors = {};
  let eliteSpec = null;
  for (let i = 0; i < 3; i++) {
    const specId = bytes[2 + i * 2];
    const choiceByte = bytes[3 + i * 2];
    if (!specId) continue;
    const spec = specById.get(specId);
    if (!spec) continue;
    lines.push(specId);
    if (spec.elite) eliteSpec = spec.name;
    const majors = [];
    for (let tier = 1; tier <= 3; tier++) {
      const choiceValue = (choiceByte >> ((tier - 1) * 2)) & 0x3;
      if (choiceValue === 0) continue;
      const trait = spec.traits.find((t) => t.slot === "Major" && t.tier === tier && (t.order ?? 0) === choiceValue - 1);
      if (trait) majors.push(trait.id);
    }
    selectedMajors[specId] = majors;
  }

  const profKey = Object.keys(paletteMap).find((k) => k.toLowerCase() === professionId);
  const { paletteToSkill } = buildPaletteMaps(paletteMap[profKey]?.skillsByPalette || []);
  function readSkill(offset) {
    const pid = bytes[offset] | (bytes[offset + 1] << 8);
    return pid ? paletteToSkill.get(pid) || null : null;
  }
  const selectedHeal = readSkill(8); // nur terrestrisch (Index 0 von 10)
  const selectedUtilities = [readSkill(12), readSkill(16), readSkill(20)].filter(Boolean);
  const selectedElite = readSkill(24);

  return { professionId, eliteSpec, lines, selectedMajors, selectedHeal, selectedUtilities, selectedElite };
}
