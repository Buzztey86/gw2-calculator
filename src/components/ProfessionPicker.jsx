import Icon from "./Icon";
import { PROFESSION_LIST } from "../hooks/useGw2Data";

export default function ProfessionPicker({ selected, onSelect, professionIcons }) {
  return (
    <div className="profession-grid">
      {PROFESSION_LIST.map((p) => (
        <button
          key={p.id}
          className={`profession-btn ${selected === p.id ? "active" : ""}`}
          onClick={() => onSelect(p.id)}
        >
          <Icon src={professionIcons?.[p.id]} size={32} />
          {p.name}
        </button>
      ))}
    </div>
  );
}
