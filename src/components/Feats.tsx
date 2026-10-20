import { useState, type FormEvent } from "react";
import { newId, type CharacterFeat } from "../types";
import { SRD_FEATS, findSrdFeat } from "../srd";
import { Panel } from "./fields";
import type { SheetProps } from "./sheetProps";

export function Feats({ c, update }: SheetProps) {
  const [srdKey, setSrdKey] = useState(SRD_FEATS[0]?.key ?? "");
  const [customName, setCustomName] = useState("");

  function add(feat: Omit<CharacterFeat, "id">) {
    update((prev) => ({ ...prev, feats: [...prev.feats, { id: newId(), ...feat }] }));
  }

  function change(id: string, patch: Partial<CharacterFeat>) {
    update((prev) => ({
      ...prev,
      feats: prev.feats.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  }

  function remove(id: string) {
    update((prev) => ({ ...prev, feats: prev.feats.filter((f) => f.id !== id) }));
  }

  function addSrd(e: FormEvent) {
    e.preventDefault();
    const feat = findSrdFeat(srdKey);
    if (feat) add({ name: feat.name, srdKey: feat.key, notes: "" });
  }

  function addCustom(e: FormEvent) {
    e.preventDefault();
    if (!customName.trim()) return;
    add({ name: customName.trim(), srdKey: null, notes: "" });
    setCustomName("");
  }

  return (
    <Panel title="Feats" className="feats-panel">
      <div className="feat-adders">
        {SRD_FEATS.length > 0 && (
          <form className="add-row" onSubmit={addSrd}>
            <label htmlFor="srd-feat" className="sr-only">
              SRD feat
            </label>
            <select id="srd-feat" value={srdKey} onChange={(e) => setSrdKey(e.target.value)}>
              {SRD_FEATS.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.name}
                </option>
              ))}
            </select>
            <button type="submit">Add SRD feat</button>
          </form>
        )}
        <form className="add-row" onSubmit={addCustom}>
          <label htmlFor="custom-feat" className="sr-only">
            Custom feat name
          </label>
          <input
            id="custom-feat"
            value={customName}
            placeholder="Custom feat, e.g. Alert"
            onChange={(e) => setCustomName(e.target.value)}
          />
          <button type="submit" disabled={!customName.trim()}>
            Add custom
          </button>
        </form>
      </div>

      {c.feats.length === 0 ? (
        <p className="empty">No feats yet.</p>
      ) : (
        <ul className="feat-list">
          {c.feats.map((feat) => {
            const srd = findSrdFeat(feat.srdKey);
            return (
              <li key={feat.id} className="feat">
                <div className="feat-head">
                  {srd ? (
                    <h3>{srd.name}</h3>
                  ) : (
                    <input
                      className="feat-name"
                      aria-label="Feat name"
                      value={feat.name}
                      onChange={(e) => change(feat.id, { name: e.target.value })}
                    />
                  )}
                  <span className="muted">{srd ? "SRD" : "Custom"}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Remove ${feat.name}`}
                    onClick={() => remove(feat.id)}
                  >
                    ×
                  </button>
                </div>
                {srd ? (
                  <>
                    {srd.prerequisite && (
                      <p className="muted">Prerequisite: {srd.prerequisite}</p>
                    )}
                    {srd.desc && <p>{srd.desc}</p>}
                    {srd.benefits.length > 0 && (
                      <ul className="feat-benefits">
                        {srd.benefits.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <textarea
                    aria-label={`${feat.name || "Feat"} description`}
                    rows={3}
                    value={feat.notes}
                    placeholder="What does this feat do?"
                    onChange={(e) => change(feat.id, { notes: e.target.value })}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
