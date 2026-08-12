# Engine architecture

## Boundaries

The rules engine is a deterministic Rust library. A UI, AI, network layer, or
card importer may request legal actions and submit a chosen action, but may not
mutate game state directly.

```text
Scryfall bulk data -> importer -> immutable card definitions
                                      |
UI / AI -> legal actions -> deterministic engine -> events / state deltas
                                      |
                              Commander rules module
```

The engine stores stable numeric IDs, not object references. Card definitions
are immutable; mutable game objects contain only in-game state and a definition
ID. This keeps snapshots compact and makes replay/debugging practical.

## Hot-path invariants

1. A game event queries an event-specific trigger index instead of scanning the
   battlefield.
2. Identical tokens are stored as a batch. One token is materialized only when
   an effect distinguishes it from the batch.
3. The stack is a contiguous LIFO collection and resolves iteratively.
4. Continuous-effect caches will be invalidated by dependency keys rather than
   recalculated after every action.
5. Mana planning treats mana abilities as transitions with costs and outputs;
   an activated source can therefore fund another source.
6. All iteration affecting game results has an explicit deterministic order.

## Current executable slices

- `mana`: breadth-first payment search, including `{1}, {T}` Signet activation;
- `tokens`: constant-size batches with lazy individualization;
- `stack`: iterative LIFO resolution for deep stacks;
- `triggers`: event-keyed subscriber index;
- `commander`: starting life, commander damage, and tax primitives;
- `catalog`: Scryfall-facing immutable Oracle record boundary.

## Performance budgets

The initial regression scenarios are intentionally hostile:

| Scenario | Invariant |
| --- | --- |
| Create 1,000,000 identical tokens | one batch allocation |
| Individualize one of those tokens | two logical objects, no full expansion |
| Resolve 100,000 stack entries | iterative LIFO resolution |
| Query one event among many trigger types | visit only matching subscribers |

Wall-clock thresholds are not checked in CI because hosted runners vary. CI
checks results and complexity invariants; release profiling records timings and
allocation counts on pinned hardware.

## Card support strategy

Oracle text is display and provenance data, not executable code. The importer
maps Scryfall records to immutable definitions. Common mechanics compile to
typed engine primitives; unusual cards use reviewed scripts against a narrow
API. This avoids pretending that arbitrary English rules text can be executed
reliably.

