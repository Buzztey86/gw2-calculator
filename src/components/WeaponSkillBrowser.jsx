import { useState } from "react";
import Icon from "./Icon";
import { getEffectiveFacts } from "../lib/build-model";
import { estimateSustainedDPS } from "../lib/dpsEstimate";

// Extrahiert Label + Anzeigewert pro Fact-Typ, getrennt, damit Basis- und
// Talent-Wert einzeln verglichen und unterschiedlich eingefärbt werden können.
function factParts(f) {
  switch (f.type) {
    case "Damage":
      return { label: "Damage", value: `${f.hit_count}× hit, coeff. ${f.dmg_multiplier}` };
    case "Time":
      return { label: f.text || "Duration", value: `${f.duration}s` };
    case "Distance":
      return { label: f.text || "Distance", value: `${f.distance}` };
    case "Number":
      return { label: f.text || "Value", value: `${f.value}` };
    case "Recharge":
      return { label: "Recharge", value: `${f.value}s` };
    case "Buff":
      return { label: f.status, value: `${f.duration ? f.duration + "s" : ""}${f.apply_count > 1 ? " ×" + f.apply_count : ""}` };
    case "ComboField":
      return { label: "Combo Field", value: f.field_type };
    case "Percent":
      return { label: f.text || "Amount", value: `${f.percent}%` };
    case "AttributeAdjust":
      return { label: f.text || f.target, value: `${f.value}` };
    default:
      return { label: f.text || f.type, value: "" };
  }
}

function FactLine({ base, effective, changed }) {
  const baseParts = factParts(base);
  const effParts = factParts(effective);
  return (
    <div className="fact-line">
      <span style={{ color: "var(--text-muted)" }}>{effParts.label}: </span>
      {changed ? (
        <>
          <span style={{ textDecoration: "line-through", color: "var(--text-muted)" }}>{baseParts.value}</span>
          <span style={{ color: "var(--text-muted)" }}> → </span>
          <span style={{ color: "var(--accent)", fontWeight: 600 }}>{effParts.value}</span>
        </>
      ) : (
        <span>{effParts.value}</span>
      )}
    </div>
  );
}

function SkillCard({ skill, activeTraitIds, traitsById }) {
  const { combined, traitedBy } = getEffectiveFacts(skill, activeTraitIds, traitsById);
  return (
    <div className="skill-row" style={{ flexDirection: "column", cursor: "default" }}>
      <div style={{ display: "flex", gap: 10, width: "100%" }}>
        <span className="slot-label">{skill.slot?.replace("Weapon_", "").replace("Profession_", "F") || ""}</span>
        <Icon src={skill.icon} size={30} />
        <div style={{ flex: 1 }}>
          <div className="name">{skill.name}</div>
          <div className="desc">{skill.description}</div>
        </div>
      </div>
      <div style={{ width: "100%", marginTop: 6, paddingLeft: 40 }}>
        {combined.map((c, i) => (
          <FactLine key={i} base={c.base} effective={c.effective} changed={c.changed} />
        ))}
        {traitedBy.length > 0 && <div className="traited-note">✦ Modified by: {traitedBy.join(", ")}</div>}
      </div>
    </div>
  );
}

function DPSEstimatePanel({ weaponSkills, utilitySkillObjects, activeTraitIds, traitsById, total, derived, weaponStrength }) {
  if (!total || !derived) return null;
  const allSkills = [...weaponSkills, ...utilitySkillObjects];
  const skillFactsList = allSkills.map((s) => ({
    name: s.name,
    facts: getEffectiveFacts(s, activeTraitIds, traitsById).facts,
  }));
  const { powerDPS, conditionDPS, totalDPS } = estimateSustainedDPS(skillFactsList, total, derived, weaponStrength);
  if (totalDPS < 1) return null;

  return (
    <div className="hero-stat" style={{ marginBottom: 16 }}>
      <div className="label" style={{ color: "var(--accent)" }}>
        Estimated Sustained DPS (this weapon + utility skills)
      </div>
      <div className="value">{Math.round(totalDPS).toLocaleString("en-US")}</div>
      <div className="sub">
        {Math.round(powerDPS).toLocaleString("en-US")} power + {Math.round(conditionDPS).toLocaleString("en-US")}{" "}
        condition (perfect on-cooldown usage, no rotation/downtime modeled)
      </div>
    </div>
  );
}

export default function WeaponSkillBrowser({
  professionData,
  activeTraitIds,
  traitsById,
  eliteSpec,
  total,
  derived,
  rarity,
  utilitySkillObjects = [],
}) {
  const weapons = professionData.weapons.filter(
    (w) => w.variants.some((v) => v.skills.length > 0) && (!w.requiresSpecialization || w.requiresSpecialization === eliteSpec)
  );
  const [selectedIdx, setSelectedIdx] = useState(0);
  const safeIdx = Math.min(selectedIdx, Math.max(weapons.length - 1, 0));
  const weapon = weapons[safeIdx];
  const variant = weapon?.variants[0];
  const weaponStrength = rarity === "ascended" ? 1100 : 1047.5;

  return (
    <div>
      <div className="weapon-tabs">
        {weapons.map((w, i) => (
          <button
            key={w.weaponType + i}
            className={`weapon-tab ${i === safeIdx ? "active" : ""}`}
            onClick={() => setSelectedIdx(i)}
          >
            {w.weaponType}
            {w.requiresSpecialization ? ` (${w.requiresSpecialization})` : ""}
          </button>
        ))}
      </div>
      <DPSEstimatePanel
        weaponSkills={variant?.skills || []}
        utilitySkillObjects={utilitySkillObjects}
        activeTraitIds={activeTraitIds}
        traitsById={traitsById}
        total={total}
        derived={derived}
        weaponStrength={weaponStrength}
      />
      {variant?.skills.map((skill) => (
        <SkillCard key={skill.id} skill={skill} activeTraitIds={activeTraitIds} traitsById={traitsById} />
      ))}
    </div>
  );
}
