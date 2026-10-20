import { TextArea } from "./fields";
import { setField, type SheetProps } from "./sheetProps";

export function NotesTab({ c, update }: SheetProps) {
  return (
    <div className="notes">
      <TextArea
        label="Features & traits"
        value={c.features}
        placeholder="Class features, species traits, feats…"
        rows={12}
        onChange={(v) => setField(update, "features", v)}
      />
      <TextArea
        label="Proficiencies & languages"
        value={c.otherProficiencies}
        placeholder="Armour, weapons, tools, languages…"
        rows={12}
        onChange={(v) => setField(update, "otherProficiencies", v)}
      />
      <TextArea
        label="Notes"
        value={c.notes}
        placeholder="Backstory, allies, quests, session notes…"
        rows={12}
        onChange={(v) => setField(update, "notes", v)}
      />
    </div>
  );
}
