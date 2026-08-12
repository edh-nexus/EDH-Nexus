# Roadmap

## Milestone 0: measurable core

- deterministic IDs, zones, stack, event index, and action boundary;
- token batching and lazy individualization;
- Signet-aware mana-payment proof;
- Commander life, tax, and commander-damage primitives;
- CI and hostile-scenario benchmark binary.

## Milestone 1: rules kernel

- priority, turn structure, state-based actions, replacement effects, and
  simultaneous-event ordering;
- object identity across zone changes;
- dependency-aware continuous effects;
- replay log and serializable conformance fixtures.

Exit criterion: deterministic two-player fixtures for the core turn loop and
stack, plus four-player priority rotation.

## Milestone 2: Commander vertical slice

- deck/color-identity validation;
- command-zone replacement choice and commander tax;
- commander damage and multiplayer elimination;
- 100-card starter corpus selected to cover reusable mechanics.

Exit criterion: a complete scripted four-player game can replay identically.

## Milestone 3: card pipeline

- versioned Scryfall bulk-data import with `oracle_id` identity and provenance;
- typed mechanic compiler plus sandboxed exceptional-card scripts;
- compatibility report showing supported, partial, and unsupported cards.

## Milestone 4: clients and AI

- stable engine API for the existing web client;
- legal-action interface for humans and bots;
- AI evaluation separated from rules legality;
- profiling gates for token, trigger, continuous-effect, and stack workloads.

