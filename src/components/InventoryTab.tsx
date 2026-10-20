import { useState, type FormEvent } from "react";
import { CURRENCIES, CURRENCY_NAMES, newId, type Item } from "../types";
import { carryingCapacity, totalWeight, wealthInGold } from "../rules";
import { NumberField, Panel } from "./fields";
import type { SheetProps } from "./sheetProps";

function Coins({ c, update }: SheetProps) {
  return (
    <Panel
      title="Coins"
      className="coins-panel"
      actions={<span className="muted">{wealthInGold(c.currency)} gp total</span>}
    >
      <div className="coins">
        {CURRENCIES.map((coin) => (
          <NumberField
            key={coin}
            label={CURRENCY_NAMES[coin]}
            className={`coin coin-${coin}`}
            value={c.currency[coin]}
            min={0}
            max={1_000_000_000}
            onChange={(v) =>
              update((prev) => ({ ...prev, currency: { ...prev.currency, [coin]: v } }))
            }
          />
        ))}
      </div>
    </Panel>
  );
}

function Items({ c, update }: SheetProps) {
  const [name, setName] = useState("");

  function add(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const item: Item = {
      id: newId(),
      name: name.trim(),
      quantity: 1,
      weight: 0,
      equipped: false,
      notes: "",
    };
    update((prev) => ({ ...prev, inventory: [...prev.inventory, item] }));
    setName("");
  }

  function change(id: string, patch: Partial<Item>) {
    update((prev) => ({
      ...prev,
      inventory: prev.inventory.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  }

  const weight = totalWeight(c.inventory);
  const capacity = carryingCapacity(c);
  const over = weight > capacity;

  return (
    <Panel
      title="Equipment"
      className="items-panel"
      actions={
        <span className={over ? "error" : "muted"}>
          {weight} / {capacity} lb
        </span>
      }
    >
      <form className="add-row" onSubmit={add}>
        <label htmlFor="item-name" className="sr-only">
          Item name
        </label>
        <input
          id="item-name"
          value={name}
          placeholder="Item name, e.g. Rope (50 ft)"
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" disabled={!name.trim()}>
          Add item
        </button>
      </form>
      {c.inventory.length === 0 ? (
        <p className="empty">Your pack is empty. Add weapons, armour and gear here.</p>
      ) : (
        <table className="items">
          <thead>
            <tr>
              <th scope="col">Equipped</th>
              <th scope="col">Item</th>
              <th scope="col">Qty</th>
              <th scope="col">Weight (lb)</th>
              <th scope="col">
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {c.inventory.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={`${item.name} equipped`}
                    checked={item.equipped}
                    onChange={(e) => change(item.id, { equipped: e.target.checked })}
                  />
                </td>
                <td>
                  <input
                    aria-label="Item name"
                    value={item.name}
                    onChange={(e) => change(item.id, { name: e.target.value })}
                  />
                  <input
                    aria-label={`${item.name} notes`}
                    className="item-notes"
                    value={item.notes}
                    placeholder="Notes"
                    onChange={(e) => change(item.id, { notes: e.target.value })}
                  />
                </td>
                <td>
                  <NumberField
                    label={`${item.name} quantity`}
                    hideLabel
                    value={item.quantity}
                    min={0}
                    max={99999}
                    onChange={(v) => change(item.id, { quantity: v })}
                  />
                </td>
                <td>
                  <NumberField
                    label={`${item.name} weight`}
                    hideLabel
                    allowDecimal
                    step={0.25}
                    value={item.weight}
                    min={0}
                    max={10000}
                    onChange={(v) => change(item.id, { weight: v })}
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Remove ${item.name}`}
                    onClick={() =>
                      update((prev) => ({
                        ...prev,
                        inventory: prev.inventory.filter((i) => i.id !== item.id),
                      }))
                    }
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {over && <p className="error">You're carrying more than your capacity (Strength × 15).</p>}
    </Panel>
  );
}

export function InventoryTab(props: SheetProps) {
  return (
    <div className="inventory">
      <Items {...props} />
      <Coins {...props} />
    </div>
  );
}
