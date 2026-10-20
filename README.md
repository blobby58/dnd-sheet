# D&D Character Sheet

An interactive D&D 5e character sheet that does the maths for you and rolls your dice. It runs entirely in the browser: characters are saved automatically on your device, and nothing is sent to a server.

## Features

- **Overview:** ability scores and modifiers, saving throws, all 18 skills with proficiency and expertise, HP with damage/heal/temp buttons, AC, initiative, speed, passive Perception, conditions and exhaustion.
- **Combat:** attacks with to-hit and damage worked out from your stats, critical damage, death saves, hit dice and long rests.
- **Spells:** spellcasting ability, save DC, spell attack, spell slots and a spell list grouped by level.
- **Inventory:** equipment with weight against your carrying capacity, and coins.
- **Notes:** features, proficiencies, languages and free-form notes.
- **Dice:** click any bonus to roll it, with advantage and disadvantage. The dice tray also rolls any notation, like `4d6+2`, and keeps a history.
- **Multiple characters:** create, duplicate and delete characters, export them to a file for backup, import them on another device, and print.

## Running it locally

You need [Node.js](https://nodejs.org) 24 or later.

```
npm install
npm run dev
```

Then open http://localhost:5173.

| Command | What it does |
|---|---|
| `npm run dev` | Starts the development server with live reload |
| `npm test` | Runs the unit tests once |
| `npm run test:watch` | Re-runs tests when files change |
| `npm run lint` | Checks the code with ESLint |
| `npm run build` | Builds the site into `dist/` for hosting |

## How the code is organised

| File | Purpose |
|---|---|
| `src/types.ts` | The character data model and game constants |
| `src/rules.ts` | Pure functions for the 5e rules (modifiers, bonuses, rests...) |
| `src/dice.ts` | Dice notation parser and roller |
| `src/storage.ts` | Saving, loading, import/export, and cleaning up old or invalid data |
| `src/useCharacters.ts` | React hook holding all characters |
| `src/components/` | The UI, one file per tab plus shared pieces |

The character only stores what the player chooses. Everything that can be calculated is derived in `rules.ts`, so numbers can never get out of sync.

## Licence notes

Rules content comes from the D&D 5e System Reference Document, which Wizards of the Coast released under [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/). This project is not affiliated with or endorsed by Wizards of the Coast.
