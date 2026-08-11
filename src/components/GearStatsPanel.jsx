import { computeDerivedStats, averageHitDamage, addTraitBonuses } from "../lib/stats";

const ATTR_LABELS = {
  Power: "Power", Precision: "Precision", Toughness: "Toughness", Vitality: "Vitality",
  Ferocity: "Ferocity", ConditionDamage: "Condition Damage", Expertise: "Expertise",
  Concentration: "Concentration", HealingPower: "Healing Power",
};

// welcher (API-interne) Bonus-Key wirkt sich auf welches Anzeige-Attribut aus
const REVERSE_MAP = { BoonDuration: "Concentration", ConditionDuration: "Expertise", CritDamage: "Ferocity" };

function traitDeltaFor(attr, traitBonuses) {
  let delta = 0;
  for (const [k, v] of Object.entries(traitBonuses)) {
    if ((REVERSE_MAP[k] || k) === attr) delta += v;
  }
  return delta;
}

function AttrRow({ attr, gearValue, traitDelta }) {
  return (
    <div className="stat-row">
      <span className="label">{ATTR_LABELS[attr] || attr}</span>
      <span>
        <span className="value">{Math.round(gearValue)}</span>
        {traitDelta > 0 && (
          <span className="sub" style={{ color: "var(--positive)", fontWeight: 600 }}>
            {" "}
            +{Math.round(traitDelta)}
          </span>
        )}
      </span>
    </div>
  );
}

function DerivedRow({ label, gearOnly, withTraits, unit = "", sub }) {
  const delta = withTraits - gearOnly;
  const changed = Math.abs(delta) > 0.05;
  return (
    <div className="stat-row">
      <span className="label">{label}</span>
      <span>
        <span className="value">
          {gearOnly.toFixed(unit === "%" ? 1 : 0)}
          {unit}
        </span>
        {changed && (
          <span style={{ color: "var(--positive)", fontWeight: 600, fontSize: 13, marginLeft: 4 }}>
            {delta > 0 ? "+" : ""}
            {delta.toFixed(unit === "%" ? 1 : 0)}
            {unit}
          </span>
        )}
        {sub && <span className="sub">{sub}</span>}
      </span>
    </div>
  );
}

export default function GearStatsPanel({ professionName, gearTotal, traitBonuses, triggeredEffects }) {
  const total = addTraitBonuses(gearTotal, traitBonuses);
  const derivedGear = computeDerivedStats(gearTotal, professionName);
  const derivedTotal = computeDerivedStats(total, professionName);
  const avgDmg = averageHitDamage(total.Power, derivedTotal.critChance, derivedTotal.critDamage);

  const primaryAttrs = ["Power", "Precision", "Toughness", "Vitality"];
  const secondaryAttrs = ["Ferocity", "ConditionDamage", "Expertise", "Concentration", "HealingPower"];

  return (
    <div>
      <div className="label" style={{ marginBottom: 6, color: "var(--accent)" }}>
        Rohattribute
        <span style={{ color: "var(--positive)", marginLeft: 8, fontWeight: 400 }}>■ Talent-Bonus</span>
      </div>
      {primaryAttrs.map((attr) => (
        <AttrRow key={attr} attr={attr} gearValue={gearTotal[attr]} traitDelta={traitDeltaFor(attr, traitBonuses)} />
      ))}
      {secondaryAttrs.map((attr) => (
        <AttrRow key={attr} attr={attr} gearValue={gearTotal[attr]} traitDelta={traitDeltaFor(attr, traitBonuses)} />
      ))}

      <div className="label" style={{ margin: "16px 0 6px", color: "var(--accent)" }}>
        Abgeleitete Werte
      </div>
      <DerivedRow label="Critical Chance" gearOnly={derivedGear.critChance} withTraits={derivedTotal.critChance} unit="%" />
      <DerivedRow label="Critical Damage" gearOnly={derivedGear.critDamage} withTraits={derivedTotal.critDamage} unit="%" />
      <DerivedRow label="Boon Duration" gearOnly={derivedGear.boonDuration} withTraits={derivedTotal.boonDuration} unit="%" />
      <DerivedRow label="Condition Duration" gearOnly={derivedGear.conditionDuration} withTraits={derivedTotal.conditionDuration} unit="%" />
      <DerivedRow label="Armor" gearOnly={derivedGear.armor} withTraits={derivedTotal.armor} />
      <DerivedRow label="Health" gearOnly={derivedGear.health} withTraits={derivedTotal.health} />

      <div className="hero-stat">
        <div className="label" style={{ color: "var(--accent)" }}>
          Effektive Lebenspunkte
        </div>
        <div className="value">
          {derivedTotal.eHP.toLocaleString("de-DE")}
          {derivedTotal.eHP !== derivedGear.eHP && (
            <span style={{ color: "var(--positive)", fontSize: 14, marginLeft: 6 }}>
              (Basis: {derivedGear.eHP.toLocaleString("de-DE")})
            </span>
          )}
        </div>
        <div className="sub">eHP ≈ Health × Armor ÷ 2597 (Referenz-Golem)</div>
      </div>

      <div className="hero-stat">
        <div className="label" style={{ color: "var(--accent)" }}>
          Ø-Schaden/Treffer (Beispiel-Skill)
        </div>
        <div className="value">{Math.round(avgDmg).toLocaleString("de-DE")}</div>
        <div className="sub">Koeff. 1.0, Waffenstärke 1047,5, gg. 2597 Armor</div>
      </div>

      {triggeredEffects.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div className="label" style={{ marginBottom: 6 }}>
            Getriggerte Heilungen (nicht in Stats)
          </div>
          {triggeredEffects.map((e, i) => (
            <div key={i} style={{ fontSize: 11, color: "var(--text-muted)" }}>
              {e.traitName}: heilt {e.amount}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
