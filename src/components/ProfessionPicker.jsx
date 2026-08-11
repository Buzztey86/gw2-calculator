import Icon from "./Icon";
import { PROFESSION_LIST } from "../hooks/useGw2Data";
import { professionColor } from "../lib/professionColors";

export default function ProfessionPicker({ selected, onSelect, professionIcons }) {
  return (
    <div className="profession-grid">
      {PROFESSION_LIST.map((p) => {
        const isActive = selected === p.id;
        return (
          <button
            key={p.id}
            className={`profession-btn ${isActive ? "active" : ""}`}
            onClick={() => onSelect(p.id)}
            style={
              isActive
                ? { borderColor: professionColor(p.id, "solid"), background: professionColor(p.id, "muted"), color: "var(--text)" }
                : { borderLeft: `3px solid ${professionColor(p.id, "muted")}` }
            }
          >
            <Icon src={professionIcons?.[p.id]} size={32} />
            {p.name}
          </button>
        );
      })}
    </div>
  );
}
