# D&D Character Sheet

An interactive D&D 5e character sheet that does the maths for you and rolls your dice. It runs entirely in the browser: characters are saved automatically on your device, and nothing is sent to a server.

## Features

- **Classes:** pick any of the 12 SRD 5.1 classes to fill in its hit die and saving throws, or type a custom/homebrew class.
- **Feats:** add the SRD 5.1 feat (Grappler) with its full text, or your own custom feats with descriptions.
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
| `npm run fetch-srd` | Re-downloads SRD 5.1 classes and feats into `src/data/` |

## How the code is organised

| File | Purpose |
|---|---|
| `src/types.ts` | The character data model and game constants |
| `src/rules.ts` | Pure functions for the 5e rules (modifiers, bonuses, rests...) |
| `src/dice.ts` | Dice notation parser and roller |
| `src/storage.ts` | Saving, loading, import/export, and cleaning up old or invalid data |
| `src/useCharacters.ts` | React hook holding all characters |
| `src/srd.ts` | Bundled SRD 5.1 classes and feats, read from `src/data/` |
| `src/data/` | Trimmed SRD 5.1 JSON written by `npm run fetch-srd` (committed) |
| `scripts/fetch-srd.ts` | Downloads SRD data from the Open5e API; `srd-transform.ts` trims it |
| `src/components/` | The UI, one file per section plus shared pieces |

The character only stores what the player chooses. Everything that can be calculated is derived in `rules.ts`, so numbers can never get out of sync.

## Licence notes

This work includes material taken from the System Reference Document 5.1 ("SRD 5.1") by Wizards of the Coast LLC and available at https://dnd.wizards.com/resources/systems-reference-document. The SRD 5.1 is licensed under the Creative Commons Attribution 4.0 International License available at https://creativecommons.org/licenses/by/4.0/legalcode.

Class and feat data is downloaded from the [Open5e](https://open5e.com) API, using only the SRD 5.1 document (`srd-2014`), and trimmed to the fields the sheet uses. The app reads the saved copy in `src/data/` and never calls the API at runtime.

This project is not affiliated with or endorsed by Wizards of the Coast.
