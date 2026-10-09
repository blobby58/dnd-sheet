import { useLocalStorage } from "./useLocalStorage";
import {
  ABILITIES,
  ABILITY_NAMES,
  defaultCharacter,
  type Ability,
  type Character,
} from "./types";
import { abilityModifier, formatModifier, proficiencyBonus } from "./rules";
import "./App.css";

export default function App() {
  const [character, setCharacter] = useLocalStorage<Character>(
    "character",
    defaultCharacter
  );

  // Generic updater: `field` must be a key of Character, and `value`
  // must match that field's type. TypeScript checks this for you.
  function update<K extends keyof Character>(field: K, value: Character[K]) {
    setCharacter((prev) => ({ ...prev, [field]: value }));
  }

  function updateScore(ability: Ability, score: number) {
    setCharacter((prev) => ({
      ...prev,
      abilityScores: { ...prev.abilityScores, [ability]: score },
    }));
  }

  const prof = proficiencyBonus(character.level);
  const initiative = abilityModifier(character.abilityScores.dex);

  return (
    <main className="sheet">
      <header className="header">
        <input
          className="name"
          value={character.name}
          onChange={(e) => update("name", e.target.value)}
        />
        <label>
          Class
          <input
            value={character.className}
            onChange={(e) => update("className", e.target.value)}
          />
        </label>
        <label>
          Level
          <input
            type="number"
            min={1}
            max={20}
            value={character.level}
            onChange={(e) => update("level", Number(e.target.value))}
          />
        </label>
      </header>

      <section className="abilities">
        {ABILITIES.map((ability) => {
          const score = character.abilityScores[ability];
          return (
            <div key={ability} className="ability">
              <span className="ability-name">{ABILITY_NAMES[ability]}</span>
              <span className="modifier">
                {formatModifier(abilityModifier(score))}
              </span>
              <input
                type="number"
                min={1}
                max={30}
                value={score}
                onChange={(e) => updateScore(ability, Number(e.target.value))}
              />
            </div>
          );
        })}
      </section>

      <section className="stats">
        <div className="stat">
          <span>Proficiency</span>
          <strong>{formatModifier(prof)}</strong>
        </div>
        <div className="stat">
          <span>Initiative</span>
          <strong>{formatModifier(initiative)}</strong>
        </div>
        <div className="stat">
          <span>HP</span>
          <div className="hp">
            <input
              type="number"
              value={character.currentHp}
              onChange={(e) => update("currentHp", Number(e.target.value))}
            />
            /
            <input
              type="number"
              value={character.maxHp}
              onChange={(e) => update("maxHp", Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      <button onClick={() => setCharacter(defaultCharacter)}>
        Reset character
      </button>
    </main>
  );
}