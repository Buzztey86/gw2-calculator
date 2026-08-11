import Icon from "./Icon";

function TraitTierGrid({ spec, selectedIds, onToggle }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div className="trait-line-header">
        <Icon src={spec.icon} size={22} />
        <span className="name">{spec.name}</span>
      </div>
      {[1, 2, 3].map((tier) => {
        const majors = spec.traits.filter((t) => t.slot === "Major" && t.tier === tier);
        return (
          <div key={tier} className="trait-tier-row">
            {majors.map((t) => (
              <button
                key={t.id}
                className={`trait-btn ${selectedIds.includes(t.id) ? "selected" : ""}`}
                title={t.description}
                onClick={() => onToggle(tier, t.id)}
              >
                <Icon src={t.icon} size={20} />
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        );
      })}
      <div className="minor-traits-row">
        {spec.traits
          .filter((t) => t.slot === "Minor")
          .map((t) => (
            <div key={t.id} title={`${t.name} (automatisch aktiv): ${t.description}`}>
              <Icon src={t.icon} size={18} />
            </div>
          ))}
      </div>
    </div>
  );
}

export default function TraitLinePicker({
  professionData,
  eliteSpec,
  setEliteSpec,
  lines,
  setLines,
  selectedMajors,
  setSelectedMajors,
  validation,
}) {
  const core = professionData.specializations.core;
  const elite = professionData.specializations.elite;
  const activeEliteSpec = elite.find((s) => s.name === eliteSpec);
  const availableSpecs = [...core, ...(activeEliteSpec ? [activeEliteSpec] : [])];
  const specById = new Map(availableSpecs.map((s) => [s.id, s]));

  function handleEliteChange(name) {
    setEliteSpec(name || null);
  }

  function handleLineChange(slotIndex, newLineId) {
    const newLines = [...lines];
    newLines[slotIndex] = newLineId;
    setLines(newLines);
    // Default-Majors für die neu gewählte Linie setzen, falls noch keine gewählt
    const spec = specById.get(newLineId);
    if (spec && !selectedMajors[newLineId]) {
      const majors = spec.traits.filter((t) => t.slot === "Major");
      const defaults = [1, 2, 3].map((tier) => majors.find((m) => m.tier === tier)?.id).filter(Boolean);
      setSelectedMajors({ ...selectedMajors, [newLineId]: defaults });
    }
  }

  function handleToggleMajor(lineId, tier, traitId) {
    const spec = specById.get(lineId);
    const others = (selectedMajors[lineId] || []).filter((id) => {
      const t = spec.traits.find((tt) => tt.id === id);
      return t?.tier !== tier;
    });
    setSelectedMajors({ ...selectedMajors, [lineId]: [...others, traitId] });
  }

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div className="label" style={{ marginBottom: 6 }}>
          Elite-Spezialisierung
        </div>
        <select value={eliteSpec || ""} onChange={(e) => handleEliteChange(e.target.value)}>
          <option value="">Keine (nur Core-Linien)</option>
          {elite.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {!validation.valid && (
        <div className="error-box">
          {validation.errors.map((e, i) => (
            <div key={i}>⚠ {e}</div>
          ))}
        </div>
      )}
      {validation.valid && <div className="valid-box">✓ Build gültig</div>}

      {[0, 1, 2].map((slotIndex) => {
        const lineId = lines[slotIndex];
        return (
          <div key={slotIndex} className="line-select-row">
            <span className="label" style={{ minWidth: 60 }}>
              Linie {slotIndex + 1}
            </span>
            <select value={lineId || ""} onChange={(e) => handleLineChange(slotIndex, Number(e.target.value))}>
              <option value="">– wählen –</option>
              {availableSpecs
                .filter((s) => !lines.includes(s.id) || s.id === lineId)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.elite ? " (Elite)" : ""}
                  </option>
                ))}
            </select>
          </div>
        );
      })}

      <div style={{ marginTop: 16 }}>
        {lines
          .map((lineId) => specById.get(lineId))
          .filter(Boolean)
          .map((spec) => (
            <TraitTierGrid
              key={spec.id}
              spec={spec}
              selectedIds={selectedMajors[spec.id] || []}
              onToggle={(tier, traitId) => handleToggleMajor(spec.id, tier, traitId)}
            />
          ))}
      </div>
    </div>
  );
}
