import { useId, useState, type ReactNode } from "react";

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  hideLabel?: boolean;
  step?: number;
  allowDecimal?: boolean;
}

// A number input that lets you clear it and type freely. The character is
// only updated with valid, in-range values; on blur the box snaps back to
// the real value, so the rules functions never see an empty or 0 score.
export function NumberField({
  label,
  value,
  min,
  max,
  onChange,
  className,
  hideLabel,
  step = 1,
  allowDecimal = false,
}: NumberFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);

  function commit(text: string) {
    setDraft(text);
    if (text.trim() === "") return;
    const n = Number(text);
    if (!Number.isFinite(n)) return;
    const rounded = allowDecimal ? Math.round(n * 100) / 100 : Math.round(n);
    if (rounded >= min && rounded <= max) onChange(rounded);
  }

  return (
    <span className={`field ${className ?? ""}`}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "field-label"}>
        {label}
      </label>
      <input
        id={id}
        type="number"
        inputMode={allowDecimal ? "decimal" : "numeric"}
        min={min}
        max={max}
        step={step}
        value={draft ?? String(value)}
        onChange={(e) => commit(e.target.value)}
        onBlur={() => setDraft(null)}
        onFocus={(e) => e.target.select()}
      />
    </span>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  hideLabel?: boolean;
}

export function TextField({
  label,
  value,
  onChange,
  className,
  placeholder,
  hideLabel,
}: TextFieldProps) {
  const id = useId();
  return (
    <span className={`field ${className ?? ""}`}>
      <label htmlFor={id} className={hideLabel ? "sr-only" : "field-label"}>
        {label}
      </label>
      <input
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </span>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 8,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  const id = useId();
  return (
    <div className="textarea">
      <label htmlFor={id}>
        <h2>{label}</h2>
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function Panel({
  title,
  children,
  className,
  actions,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}) {
  return (
    <section className={`panel ${className ?? ""}`}>
      <header className="panel-head">
        <h2>{title}</h2>
        {actions}
      </header>
      {children}
    </section>
  );
}

// A clickable proficiency dot: empty, filled (proficient), or ringed
// (expertise). `levels` is 2 for saves (no expertise) and 3 for skills.
export function ProficiencyDot({
  state,
  onClick,
  label,
}: {
  state: "none" | "proficient" | "expertise";
  onClick: () => void;
  label: string;
}) {
  const description =
    state === "none" ? "not proficient" : state === "proficient" ? "proficient" : "expertise";
  return (
    <button
      type="button"
      className={`dot dot-${state}`}
      onClick={onClick}
      aria-label={`${label}: ${description}. Click to change.`}
      title={description}
    />
  );
}
