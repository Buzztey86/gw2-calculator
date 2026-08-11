const fs = require("fs");
const profs = ["guardian", "warrior", "revenant", "ranger", "thief", "engineer", "elementalist", "mesmer", "necromancer"];

const BOONS = ["Aegis", "Alacrity", "Fury", "Might", "Protection", "Quickness", "Regeneration", "Resistance", "Resolution", "Stability", "Swiftness", "Vigor"];

function allEntriesWithSource(data) {
  const entries = [];
  for (const w of data.weapons) {
    for (const v of w.variants) {
      for (const s of v.skills) entries.push({ ...s, kind: "skill", sourceType: "weapon", sourceLabel: w.weaponType });
    }
  }
  for (const s of data.coreMechanicSkills) entries.push({ ...s, kind: "skill", sourceType: "core-mechanic", sourceLabel: "Core" });
  for (const [type, arr] of Object.entries(data.utilitySkills)) {
    for (const s of arr) entries.push({ ...s, kind: "skill", sourceType: "utility-" + type, sourceLabel: type });
  }
  for (const sp of [...data.specializations.core, ...data.specializations.elite]) {
    for (const s of sp.uniqueSkills || []) entries.push({ ...s, kind: "skill", sourceType: "elite-unique", sourceLabel: sp.name });
    for (const t of sp.traits || []) entries.push({ ...t, kind: "trait", sourceType: "trait", sourceLabel: sp.name });
  }
  return entries;
}

const index = {}; // boonName -> [{profession, name, icon, description, source, sourceType, kind}]
for (const b of BOONS) index[b] = [];

for (const prof of profs) {
  const data = JSON.parse(fs.readFileSync("public/data/" + prof + ".json"));
  for (const e of allEntriesWithSource(data)) {
    const grantedBoons = new Set();
    for (const f of e.facts || []) {
      if (f.type === "Buff" && BOONS.includes(f.status)) grantedBoons.add(f.status);
    }
    for (const f of e.traitedFacts || []) {
      if (BOONS.includes(f.status)) grantedBoons.add(f.status);
    }
    for (const boon of grantedBoons) {
      index[boon].push({
        profession: data.name,
        name: e.name,
        icon: e.icon,
        description: e.description,
        source: e.sourceLabel,
        sourceType: e.sourceType,
        kind: e.kind,
      });
    }
  }
}

// Duplikate entfernen (z. B. identischer Trait über mehrere Facts erfasst)
for (const boon of Object.keys(index)) {
  const seen = new Set();
  index[boon] = index[boon].filter((e) => {
    const k = e.profession + "::" + e.name + "::" + e.kind;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

fs.writeFileSync("public/data/boon-providers-index.json", JSON.stringify(index));
for (const [k, v] of Object.entries(index)) console.log(k.padEnd(14), v.length);
