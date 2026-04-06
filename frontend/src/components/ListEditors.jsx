import { useState } from "react";
import { X, Plus } from "lucide-react";

// Pairs list editor — rows of { code, description }
export const PairsListEditor = ({ label, value, onChange }) => {
  const rows = value ?? [];

  const update = (idx, field, val) => {
    const next = rows.map((r, i) => i === idx ? { ...r, [field]: val } : r);
    onChange(next);
  };

  const remove = (idx) => onChange(rows.filter((_, i) => i !== idx));

  const add = () => onChange([...rows, { code: "", description: "" }]);

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <input
            type="text"
            className="input input-sm input-bordered w-28 font-mono"
            placeholder="Code"
            value={row.code}
            onChange={(e) => update(idx, "code", e.target.value)}
          />
          <input
            type="text"
            className="input input-sm input-bordered flex-1"
            placeholder="Description"
            value={row.description}
            onChange={(e) => update(idx, "description", e.target.value)}
          />
          <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => remove(idx)}>
            <X className="size-3" />
          </button>
        </div>
      ))}
      <button type="button" className="btn btn-ghost btn-xs self-start gap-1 opacity-60 hover:opacity-100" onClick={add}>
        <Plus className="size-3" /> Add {label}
      </button>
    </div>
  );
};

// Chip list editor — simple array of strings, no word bank
export const ChipListEditor = ({ value, onChange, placeholder }) => {
  const [input, setInput] = useState("");
  const chips = value ?? [];

  const add = (val) => {
    const v = val.trim();
    if (!v || chips.includes(v)) return;
    onChange([...chips, v]);
    setInput("");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5 min-h-8">
        {chips.map((v) => (
          <span key={v} className="badge badge-accent text-white gap-1">
            {v}
            <button type="button" className="hover:opacity-70" onClick={() => onChange(chips.filter((c) => c !== v))}>
              <X className="size-3" />
            </button>
          </span>
        ))}
        {chips.length === 0 && <span className="text-sm opacity-40 italic">None</span>}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          className="input input-sm input-bordered flex-1 max-w-xs"
          placeholder={placeholder ?? "Add…"}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(input); } }}
        />
        <button type="button" className="btn btn-sm btn-primary" disabled={!input.trim()} onClick={() => add(input)}>
          Add
        </button>
      </div>
    </div>
  );
};
