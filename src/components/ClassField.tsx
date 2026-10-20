import { useId } from "react";
import { SRD_CLASSES, findSrdClass } from "../srd";
import type { SrdClass } from "../types";

const CUSTOM = "__custom";

// Pick an SRD class, or "Custom…" to type any name (homebrew, multiclass...).
// Custom is simply any name that isn't an SRD class, so nothing extra is stored.
export function ClassField({
  value,
  onChange,
  onPickSrd,
}: {
  value: string;
  onChange: (name: string) => void;
  onPickSrd: (cls: SrdClass) => void;
}) {
  const id = useId();
  const srd = findSrdClass(value);
  return (
    <span className="field class-field">
      <label htmlFor={id} className="field-label">
        Class
      </label>
      <span className="class-picker">
        <select
          id={id}
          value={srd?.key ?? CUSTOM}
          onChange={(e) => {
            const picked = SRD_CLASSES.find((c) => c.key === e.target.value);
            if (picked) {
              onChange(picked.name);
              onPickSrd(picked);
            } else {
              onChange("");
            }
          }}
        >
          {SRD_CLASSES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.name}
            </option>
          ))}
          <option value={CUSTOM}>Custom…</option>
        </select>
        {!srd && (
          <input
            aria-label="Custom class name"
            value={value}
            placeholder="Class name"
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </span>
    </span>
  );
}
