import Icon from "./Icon";
import { getEffectiveFacts } from "../lib/build-model";

function factText(f) {
  switch (f.type) {
    case "Damage":
      return `Schaden: ${f.hit_count}× Treffer, Koeff. ${f.dmg_multiplier}`;
    case "Time":
      return `${f.text}: ${f.duration}s`;
    case "Distance":
      return `${f.text}: ${f.distance}`;
    case "Number":
      return `${f.text}: ${f.value}`;
    case "Recharge":
      return `Abklingzeit: ${f.value}s`;
    case "Buff":
      return `${f.status}${f.duration ? ` (${f.duration}s)` : ""}${f.apply_count > 1 ? ` ×${f.apply_count}` : ""}`;
    case "ComboField":
      return `Kombo-Feld: ${f.field_type}`;
    case "Percent":
      return `${f.text}: ${f.percent}%`;
    case "AttributeAdjust":
      return `${f.text || f.target}: ${f.value}`;
    default:
      return f.text || f.type;
  }
}

function SkillEntry({ skill, checked, disabled, onToggle, activeTraitIds, traitsById }) {
  const { facts, traitedBy } = getEffectiveFacts(skill, activeTraitIds, traitsById);
  return (
    <div
      onClick={() => !disabled && onToggle(skill.id)}
      style={{
        display: "flex",
        gap: 10,
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled && !checked ? 0.4 : 1,
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          marginTop: 3,
          borderRadius: 3,
          border: `1px solid ${checked ? "var(--accent)" : "var(--border-strong)"}`,
          background: checked ? "var(--accent)" : "transparent",
          flexShrink: 0,
        }}
      />
      <Icon src={skill.icon} size={28} />
      <div style={{ flex: 1 }}>
        <div className="name">{skill.name}</div>
        <div className="desc">{skill.description}</div>
        {checked && (
          <div style={{ marginTop: 4 }}>
            {facts.map((f, i) => (
              <div key={i} style={{ fontSize: 10.5, color: "var(--text-muted)" }}>
                {factText(f)}
              </div>
            ))}
            {traitedBy.length > 0 && <div style={{ fontSize: 10, color: "var(--accent)", marginTop: 2 }}>✦ via {traitedBy.join(", ")}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UtilitySkillPicker({
  professionData,
  selectedHeal,
  setSelectedHeal,
  selectedUtilities,
  setSelectedUtilities,
  selectedElite,
  setSelectedElite,
  activeTraitIds,
  traitsById,
}) {
  const { heal, utility, elite } = professionData.utilitySkills;

  function toggleUtility(id) {
    setSelectedUtilities((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return [...prev.slice(1), id];
      return [...prev, id];
    });
  }

  return (
    <div>
      <div className="label" style={{ color: "var(--accent)", marginBottom: 6 }}>
        Heilskill (1 von {heal.length})
      </div>
      <div style={{ marginBottom: 16 }}>
        {heal.map((s) => (
          <SkillEntry
            key={s.id}
            skill={s}
            checked={selectedHeal === s.id}
            onToggle={() => setSelectedHeal(selectedHeal === s.id ? null : s.id)}
            activeTraitIds={activeTraitIds}
            traitsById={traitsById}
          />
        ))}
      </div>

      <div className="label" style={{ color: "var(--accent)", marginBottom: 6 }}>
        Utility-Skills ({selectedUtilities.length}/3 von {utility.length})
      </div>
      <div style={{ marginBottom: 16 }}>
        {utility.map((s) => (
          <SkillEntry
            key={s.id}
            skill={s}
            checked={selectedUtilities.includes(s.id)}
            onToggle={toggleUtility}
            activeTraitIds={activeTraitIds}
            traitsById={traitsById}
          />
        ))}
      </div>

      <div className="label" style={{ color: "var(--accent)", marginBottom: 6 }}>
        Elite-Skill (1 von {elite.length})
      </div>
      <div>
        {elite.map((s) => (
          <SkillEntry
            key={s.id}
            skill={s}
            checked={selectedElite === s.id}
            onToggle={() => setSelectedElite(selectedElite === s.id ? null : s.id)}
            activeTraitIds={activeTraitIds}
            traitsById={traitsById}
          />
        ))}
      </div>
    </div>
  );
}
