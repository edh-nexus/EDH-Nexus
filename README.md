# EDH Nexus

EDH Nexus is a performance-first, deterministic Magic: The Gathering rules
engine built specifically for multiplayer Commander.

This is a clean implementation. Forge is used as a behavioral reference and
conformance oracle; its source code is not copied into this project.

## Why this exists

The initial engineering targets are the failure modes that make large
Commander games painful in existing simulators:

- token-heavy battlefields must scale with token *groups*, not raw token count;
- deep stacks must resolve iteratively without recursion or repeated full-board scans;
- triggers must be selected through event indexes;
- mana payment must model activation costs, including Signet-style sources;
- card definitions must remain immutable and use current Scryfall Oracle data;
- the same action log must always produce the same game state.

## Repository layout

- `crates/engine`: UI-independent rules and state core;
- `docs/architecture.md`: boundaries, invariants, and performance model;
- `docs/conformance.md`: clean-room Forge comparison process;
- `docs/roadmap.md`: incremental delivery plan;
- root web files: the pre-existing EDH life-tracker prototype, currently kept
  separate from the engine.

## Run the scaffold

```sh
cargo test --workspace
cargo clippy --workspace --all-targets -- -D warnings
cargo run -p edh-nexus-engine --bin bench-scenarios --release
```

The benchmark binary is dependency-free and prints machine-readable CSV. It is
a regression smoke test, not a substitute for statistically rigorous profiling.

## Project status

This first milestone proves the architecture with executable tests. It is not
yet a complete Magic rules implementation and does not parse arbitrary Oracle
text. Card behavior will be added in tested, data-driven primitives with a
scripted escape hatch for exceptional cards.

Magic: The Gathering is owned by Wizards of the Coast. EDH Nexus is an
independent, unofficial project and is not endorsed by Wizards of the Coast.

