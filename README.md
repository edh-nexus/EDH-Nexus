# EDH Nexus Deck Synergy

An intent-aware Commander deck evaluator. Players provide a commander, a short description of the deck's intended game plan, and a decklist. The app resolves current card data through Scryfall and returns a transparent synergy score with actionable feedback.

## What it measures

- Plan density
- Commander fit
- Deck fundamentals
- Consistency
- Resilience

The result is an alignment score, not a universal power-level claim. The report explains the evidence behind each category, identifies strengths, and suggests cards or structural changes worth reviewing.

## Local development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite.

## Validation

```bash
npm test
npm run lint
npm run build
```

## Data source

Card names, types, colors, and Oracle text are retrieved from the public [Scryfall API](https://scryfall.com/docs/api). Magic: The Gathering is property of Wizards of the Coast. This project is unofficial and is not endorsed by Wizards of the Coast or Scryfall.

## Current status

This repository contains the web beta of EDH Nexus Deck Synergy. Analysis currently runs in the browser and does not require an account or persistent deck storage.
