const fs = require("fs");
const profs = ["guardian", "warrior", "revenant", "ranger", "thief", "engineer", "elementalist", "mesmer", "necromancer"];

function allSkillsWithSource(data) {
  const skills = [];
  for (const w of data.weapons) for (const v of w.variants) for (const s of v.skills) skills.push({ ...s, sourceType: "weapon", sourceLabel: w.weaponType });
  for (const s of data.coreMechanicSkills) skills.push({ ...s, sourceType: "core-mechanic", sourceLabel: "Core" });
  for (const [type, arr] of Object.entries(data.utilitySkills)) for (const s of arr) skills.push({ ...s, sourceType: "utility-" + type, sourceLabel: type });
  for (const sp of [...data.specializations.core, ...data.specializations.elite]) {
    for (const s of sp.uniqueSkills || []) skills.push({ ...s, sourceType: "elite-unique", sourceLabel: sp.name });
  }
  return skills;
}

const hasAllies = (desc) => /\ballies\b|\ballied\b/i.test(desc || "");
const hasBuffStatus = (s, status) =>
  (s.facts || []).some((f) => f.type === "Buff" && f.status === status) ||
  (s.traitedFacts || []).some((f) => f.status === status);

// Manuell bestätigt (Textanalyse allein reicht hier nicht, siehe Begründung im Chat):
// nur echte Ein-Klick-Wiederbelebungen (Signet-Aktivierung), keine kanalisierten/
// bedingten Rettungs-Skills.
const INSTANT_REVIVE_NAMES = new Set(["Signet of Mercy", "Signet of Undeath", "Signet of Water"]);
// echte "finish a downed foe"-Mechaniken, keine Kombo-"Finisher"-Textfragmente
const STOMP_FINISHER_NAMES = new Set(["Heaven's Palm", "Battle Standard", "Function Gyro"]);
// Fälle, in denen der reine Textabgleich "allies" + Stealth-Fact fälschlich
// anschlägt, weil "allies" sich im Beschreibungstext auf einen anderen Teil
// der Fähigkeit bezieht (z. B. Quickness für Verbündete, Stealth nur für sich
// selbst und nur unter Bedingung).
const STEALTH_FIELD_FALSE_POSITIVES = new Set(["Steal Time"]);
// Fälle, in denen "allies" im Text steht, aber es sich um Mass-Stealth statt
// eines platzierten Feldes handelt
const MASS_STEALTH_NAMES = new Set(["Mass Invisibility"]);

const index = { stealthField: [], massStealth: [], groupStability: [], instantRevive: [], stompFinisher: [] };

for (const prof of profs) {
  const data = JSON.parse(fs.readFileSync("public/data/" + prof + ".json"));
  for (const s of allSkillsWithSource(data)) {
    const entry = { profession: data.name, name: s.name, icon: s.icon, description: s.description, source: s.sourceLabel, sourceType: s.sourceType };

    if (hasBuffStatus(s, "Stealth")) {
      if (MASS_STEALTH_NAMES.has(s.name)) index.massStealth.push(entry);
      else if (hasAllies(s.description) && !STEALTH_FIELD_FALSE_POSITIVES.has(s.name)) index.stealthField.push(entry);
    }
    if (hasBuffStatus(s, "Stability") && hasAllies(s.description)) {
      index.groupStability.push(entry);
    }
    if (INSTANT_REVIVE_NAMES.has(s.name)) index.instantRevive.push(entry);
    if (STOMP_FINISHER_NAMES.has(s.name)) index.stompFinisher.push(entry);
  }
}

// Duplikate (z. B. dieselbe Fähigkeit über mehrere Waffenvarianten) entfernen
for (const key of Object.keys(index)) {
  const seen = new Set();
  index[key] = index[key].filter((e) => {
    const k = e.profession + "::" + e.name;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

fs.writeFileSync("public/data/utility-index.json", JSON.stringify(index, null, 1));
for (const [k, v] of Object.entries(index)) {
  console.log(k + ":", v.length);
  v.forEach((e) => console.log("  ", e.profession.padEnd(13), e.name));
}
