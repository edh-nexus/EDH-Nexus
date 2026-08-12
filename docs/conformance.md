# Clean-room conformance

Forge is a behavioral reference, not a source-code dependency.

For each supported interaction:

1. Write a neutral game-state fixture and expected rules outcome from the
   Comprehensive Rules and current Oracle text.
2. Run the fixture manually or through an external harness against Forge.
3. Record only inputs, observable outputs, Forge version, and disagreements.
4. Implement the behavior independently in EDH Nexus.
5. Keep the fixture as a deterministic regression test.

Do not copy Forge classes, algorithms, card scripts, comments, or tests. A
disagreement is not automatically a Forge bug: first resolve the expected
outcome against the Comprehensive Rules and Gatherer/Scryfall Oracle data.

The repository does not yet declare a project license. Choose one before a
public release or accepting outside contributions.

