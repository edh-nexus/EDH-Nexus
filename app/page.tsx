"use client";

import { useMemo, useState } from "react";

type ScryfallCard = {
  name: string;
  type_line: string;
  oracle_text?: string;
  mana_value: number;
  keywords?: string[];
  card_faces?: Array<{ oracle_text?: string; type_line?: string }>;
};

type Role = "ramp" | "draw" | "interaction" | "protection" | "recursion" | "wipe";
type Result = {
  score: number;
  grade: string;
  confidence: string;
  recognized: number;
  submitted: number;
  planName: string;
  dimensions: Array<{ name: string; score: number; max: number; note: string }>;
  roles: Record<Role | "lands" | "plan", number>;
  strengths: string[];
  improvements: string[];
  unmatched: string[];
};

const SAMPLE_DECK = `1 Command Tower
1 Sol Ring
1 Arcane Signet
1 Nature's Lore
1 Sakura-Tribe Elder
1 Stitcher's Supplier
1 Satyr Wayfinder
1 Life from the Loam
1 Buried Alive
1 Entomb
1 Eternal Witness
1 Reanimate
1 Animate Dead
1 Victimize
1 Living Death
1 Mulldrifter
1 Baleful Strix
1 Pernicious Deed
1 Beast Within
1 Counterspell
1 Swiftfoot Boots
1 Altar of Dementia
1 Spore Frog
1 Sidisi, Brood Tyrant
1 Ramunap Excavator
1 Mystic Remora
1 Forest
1 Island
1 Swamp`;

const STRATEGIES = [
  { name: "graveyard value", terms: ["graveyard", "reanimat", "mill", "self-mill", "recursion"], signals: ["graveyard", "mill", "return target", "from your graveyard", "escape", "dredge", "unearth", "delirium"] },
  { name: "tokens", terms: ["token", "go wide", "creature swarm"], signals: ["create a", "create two", "create three", "populate", "convoke", "tokens you control"] },
  { name: "artifacts", terms: ["artifact", "treasure", "clue", "food"], signals: ["artifact", "treasure", "clue", "food", "affinity", "improvise", "metalcraft"] },
  { name: "spellslinger", terms: ["spellslinger", "instant", "sorcery", "noncreature spell", "storm"], signals: ["instant or sorcery", "noncreature spell", "cast a spell", "magecraft", "storm"] },
  { name: "+1/+1 counters", terms: ["counter", "+1/+1", "proliferate"], signals: ["+1/+1 counter", "proliferate", "move a counter", "double the number"] },
  { name: "aristocrats", terms: ["aristocrat", "sacrifice", "death trigger", "dies"], signals: ["sacrifice", "dies", "creature card died", "whenever another creature dies"] },
  { name: "lands", terms: ["landfall", "lands matter", "extra land"], signals: ["landfall", "play an additional land", "land card from your graveyard", "whenever a land enters"] },
  { name: "lifegain", terms: ["lifegain", "life gain", "gain life"], signals: ["gain life", "you gained life", "lifelink"] },
  { name: "blink", terms: ["blink", "flicker", "enter the battlefield", "etb"], signals: ["exile", "return it to the battlefield", "enters the battlefield"] },
  { name: "Voltron", terms: ["voltron", "equipment", "aura", "commander damage"], signals: ["equip", "equipped creature", "enchanted creature", "aura"] },
  { name: "enchantments", terms: ["enchantment", "enchantress"], signals: ["enchantment", "constellation", "aura spell"] },
  { name: "typal", terms: ["tribal", "typal", "creature type"], signals: ["creatures you control", "choose a creature type", "of the chosen type"] },
];

const ROLE_SIGNALS: Record<Role, string[]> = {
  ramp: ["add {", "search your library for a basic land", "search your library for a land", "treasure token", "cost {1} less"],
  draw: ["draw a card", "draw two cards", "draw three cards", "investigate", "impulse", "connive"],
  interaction: ["destroy target", "exile target", "counter target", "return target", "deals damage to any target", "target creature gets -"],
  protection: ["hexproof", "indestructible", "phase out", "protection from", "regenerate", "can't be countered"],
  recursion: ["return target", "from your graveyard", "graveyard to your hand", "graveyard to the battlefield"],
  wipe: ["destroy all", "exile all", "all creatures get -", "each creature", "each opponent sacrifices"],
};

function parseDeck(raw: string) {
  const names: string[] = [];
  for (const original of raw.split(/\r?\n/)) {
    const line = original.trim();
    if (!line || /^\[.*\]$/.test(line) || /^(commander|deck|sideboard|maybeboard)$/i.test(line)) continue;
    const match = line.match(/^\s*(\d+)\s*x?\s+(.+?)(?:\s+\([A-Z0-9]+\)\s+\d+)?$/i);
    if (!match) continue;
    const count = Math.min(Number(match[1]), 20);
    for (let i = 0; i < count; i++) names.push(match[2].trim());
  }
  return names;
}

function cardText(card: ScryfallCard) {
  return [card.name, card.type_line, card.oracle_text, ...(card.card_faces ?? []).flatMap((face) => [face.type_line, face.oracle_text])]
    .filter(Boolean).join(" ").toLowerCase();
}

function countRole(cards: ScryfallCard[], role: Role) {
  return cards.filter((card) => ROLE_SIGNALS[role].some((signal) => cardText(card).includes(signal))).length;
}

async function fetchCards(names: string[]) {
  const requested = names.map((name) => name.toLowerCase());
  const unique = [...new Set(requested)];
  const fetchedCards: ScryfallCard[] = [];
  const unmatched: string[] = [];
  for (let i = 0; i < unique.length; i += 75) {
    const batch = unique.slice(i, i + 75);
    const response = await fetch("https://api.scryfall.com/cards/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifiers: batch.map((name) => ({ name })) }),
    });
    if (!response.ok) throw new Error("Scryfall could not read this deck right now.");
    const data = await response.json();
    fetchedCards.push(...(data.data ?? []));
    unmatched.push(...(data.not_found ?? []).map((entry: { name?: string }) => entry.name ?? "Unknown card"));
    if (i + 75 < unique.length) await new Promise((resolve) => setTimeout(resolve, 80));
  }
  const byName = new Map<string, ScryfallCard>();
  for (const card of fetchedCards) {
    byName.set(card.name.toLowerCase(), card);
    byName.set(card.name.split(" // ")[0].toLowerCase(), card);
  }
  const cards = requested.map((name) => byName.get(name)).filter((card): card is ScryfallCard => Boolean(card));
  return { cards, unmatched };
}

function analyze(cards: ScryfallCard[], commander: ScryfallCard | undefined, intent: string, submitted: number, unmatched: string[]): Result {
  const lowerIntent = intent.toLowerCase();
  const chosen = STRATEGIES.filter((strategy) => strategy.terms.some((term) => lowerIntent.includes(term)));
  const strategies = chosen.length ? chosen : STRATEGIES.filter((strategy) => strategy.signals.some((signal) => lowerIntent.includes(signal)));
  const active = strategies.length ? strategies : [STRATEGIES[0]];
  const planName = strategies.length ? strategies.map((strategy) => strategy.name).join(" + ") : "custom game plan";
  const nonlands = cards.filter((card) => !card.type_line.toLowerCase().includes("land"));
  const planCards = nonlands.filter((card) => active.some((strategy) => strategy.signals.some((signal) => cardText(card).includes(signal))));
  const lands = cards.filter((card) => card.type_line.toLowerCase().includes("land")).length;
  const roles = {
    ramp: countRole(cards, "ramp"), draw: countRole(cards, "draw"), interaction: countRole(cards, "interaction"),
    protection: countRole(cards, "protection"), recursion: countRole(cards, "recursion"), wipe: countRole(cards, "wipe"),
    lands, plan: planCards.length,
  };
  const scale = Math.max(cards.length / 99, 0.28);
  const planDensity = nonlands.length ? planCards.length / nonlands.length : 0;
  const planScore = Math.min(35, Math.round(planDensity * 70));
  const commanderSignals = commander ? active.flatMap((strategy) => strategy.signals).filter((signal) => cardText(commander).includes(signal)).length : 0;
  const commanderScore = Math.min(15, commanderSignals * 5 + (commander ? 4 : 0));
  const target = (value: number, ideal: number) => Math.min(1, value / (ideal * scale));
  const foundationScore = Math.round(20 * ((target(roles.ramp, 10) + target(roles.draw, 10) + target(roles.interaction, 10) + target(roles.lands, 36)) / 4));
  const consistencyScore = Math.min(15, Math.round(5 + planDensity * 15 + target(roles.draw, 10) * 3));
  const resilienceScore = Math.min(15, Math.round((target(roles.protection, 5) + target(roles.recursion, 5) + target(roles.wipe, 3)) / 3 * 15));
  const confidenceFactor = Math.min(1, cards.length / 90);
  const rawScore = planScore + commanderScore + foundationScore + consistencyScore + resilienceScore;
  const score = Math.round(rawScore * (0.76 + confidenceFactor * 0.24));
  const grade = score >= 85 ? "Locked in" : score >= 70 ? "Well aligned" : score >= 55 ? "Promising" : score >= 40 ? "Needs focus" : "Early build";
  const dimensions = [
    { name: "Plan density", score: planScore, max: 35, note: `${planCards.length} cards directly reinforce ${planName}.` },
    { name: "Commander fit", score: commanderScore, max: 15, note: commander ? `${commander.name} shares ${commanderSignals || "few explicit"} plan signals.` : "Add a commander for a more reliable fit score." },
    { name: "Foundation", score: foundationScore, max: 20, note: "Ramp, draw, interaction, and mana are checked together." },
    { name: "Consistency", score: consistencyScore, max: 15, note: "Repeated effects make the intended play pattern show up more often." },
    { name: "Resilience", score: resilienceScore, max: 15, note: "Protection, recursion, and reset buttons help the plan recover." },
  ];
  const strengths: string[] = [];
  if (planDensity >= 0.3) strengths.push(`${Math.round(planDensity * 100)}% of nonlands visibly advance the stated plan.`);
  if (roles.draw >= 8 * scale) strengths.push(`Card flow is healthy with ${roles.draw} draw or selection effects.`);
  if (roles.ramp >= 8 * scale) strengths.push(`${roles.ramp} ramp signals should help the deck get moving on time.`);
  if (commanderSignals >= 2 && commander) strengths.push(`${commander.name} clearly participates in the game plan.`);
  if (!strengths.length) strengths.push("The deck has a workable base; the next gains come from making its main loop more explicit.");
  const improvements: string[] = [];
  if (roles.draw < 8 * scale) improvements.push(`Add ${Math.max(1, Math.ceil(10 * scale - roles.draw))} more repeatable draw or selection pieces.`);
  if (roles.interaction < 8 * scale) improvements.push(`Reserve more slots for flexible removal or stack interaction.`);
  if (planDensity < 0.3) improvements.push(`Replace off-plan cards with redundant enablers or payoffs for ${planName}.`);
  if (roles.protection + roles.recursion < 6 * scale) improvements.push("Add protection or recursion so one board wipe does not end the plan.");
  if (improvements.length < 2) improvements.push("Add another redundant payoff so the engine still converts value into a win when one piece is removed.");
  if (improvements.length < 2) improvements.push("Goldfish opening hands and track how often the deck begins its core loop by turn four.");
  return {
    score, grade, confidence: cards.length >= 90 ? "High" : cards.length >= 55 ? "Medium" : "Preview",
    recognized: cards.length, submitted, planName, dimensions, roles, strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3), unmatched,
  };
}

export default function Home() {
  const [commander, setCommander] = useState("");
  const [intent, setIntent] = useState("");
  const [deck, setDeck] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cardCount = useMemo(() => parseDeck(deck).length, [deck]);

  const loadSample = () => {
    setCommander("Muldrotha, the Gravetide");
    setIntent("Use self-mill and graveyard recursion to build repeatable value, then win through sacrifice loops or a large Living Death.");
    setDeck(SAMPLE_DECK);
    setResult(null);
    setError("");
  };

  const runAnalysis = async () => {
    const names = parseDeck(deck);
    if (!commander.trim() || intent.trim().length < 12 || names.length < 10) {
      setError("Add a commander, a clear game-plan prompt, and at least 10 deck cards.");
      return;
    }
    setLoading(true); setError(""); setResult(null);
    try {
      const fetched = await fetchCards([...names, commander.trim()]);
      const commanderName = commander.trim().toLowerCase();
      const commanderCard = fetched.cards.find((card) => card.name.toLowerCase() === commanderName || card.name.split(" // ")[0].toLowerCase() === commanderName);
      const deckCards = fetched.cards.slice(0, Math.max(0, fetched.cards.length - (commanderCard ? 1 : 0)));
      setResult(analyze(deckCards, commanderCard, intent, names.length, fetched.unmatched));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The analysis could not be completed.");
    } finally { setLoading(false); }
  };

  return (
    <main>
      <nav className="nav wrap" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="EDH Nexus home"><span className="brandmark">N</span><span>EDH <b>NEXUS</b></span></a>
        <div className="navlinks"><a href="#method">How it scores</a><span className="beta">BETA</span></div>
      </nav>

      <section className="hero wrap" id="top">
        <div>
          <p className="eyebrow">Intent-aware deck diagnostics</p>
          <h1>Does your deck do what you built it to do?</h1>
          <p className="lede">Describe the game plan. Paste the list. Get a transparent synergy score that shows where your Commander deck is focused—and where it drifts.</p>
          <div className="trust"><span>◆ Live Oracle data from Scryfall</span><span>◆ No account required</span><span>◆ Your list stays in your browser</span></div>
        </div>
        <aside className="hero-card" aria-label="Example synergy score">
          <div className="mini-head"><span>EXAMPLE DIAGNOSTIC</span><span className="live-dot">READY</span></div>
          <div className="score-orbit"><strong>82</strong><span>/100</span></div>
          <h2>Well aligned</h2><p>Strong plan density. A little more protection would make the deck harder to disrupt.</p>
          <div className="spark-bars"><i style={{width:"88%"}}/><i style={{width:"74%"}}/><i style={{width:"91%"}}/></div>
        </aside>
      </section>

      <section className="workspace wrap" aria-label="Deck analyzer">
        <div className="form-panel">
          <div className="panel-title"><div><span className="step">01</span><h2>Define the deck</h2></div><button className="text-button" onClick={loadSample}>Load example</button></div>
          <label>Commander<input value={commander} onChange={(e) => setCommander(e.target.value)} placeholder="e.g. Muldrotha, the Gravetide" /></label>
          <label>What is this deck designed to do?<textarea className="intent" value={intent} onChange={(e) => setIntent(e.target.value)} placeholder="Describe the engine, preferred play pattern, and how the deck expects to win…" /></label>
          <label>Decklist <span className="label-note">{cardCount} cards detected</span><textarea className="decklist" value={deck} onChange={(e) => setDeck(e.target.value)} placeholder={"1 Sol Ring\n1 Arcane Signet\n1 Command Tower\n…"} spellCheck={false} /></label>
          {error && <p className="error" role="alert">{error}</p>}
          <button className="analyze" onClick={runAnalysis} disabled={loading}>{loading ? <><span className="spinner"/>Reading Oracle text…</> : <>Analyze synergy <span>→</span></>}</button>
          <p className="fineprint">Scoring is a diagnostic, not a power-level verdict. Metagame, budget, pilots, and hidden combos still matter.</p>
        </div>

        <div className={`results-panel ${result ? "has-results" : ""}`} aria-live="polite">
          {!result ? <div className="empty-state"><div className="empty-glyph"><span>✦</span></div><p className="eyebrow">Your diagnostic appears here</p><h2>A score with receipts.</h2><p>We compare each card’s current Oracle text against your stated plan, then evaluate the support structure around it.</p><div className="empty-metrics"><span>PLAN FIT</span><span>FOUNDATION</span><span>RESILIENCE</span></div></div> : <Results result={result} />}
        </div>
      </section>

      <section className="method wrap" id="method">
        <div><p className="eyebrow">The score, explained</p><h2>Five lenses. No mystery number.</h2></div>
        <div className="method-grid">
          {[['35','Plan density','How many cards directly enable or reward the stated strategy.'],['15','Commander fit','Whether the commander materially advances the plan.'],['20','Foundation','Mana, card flow, interaction, and land balance.'],['15','Consistency','Redundancy that helps the deck repeat its intended pattern.'],['15','Resilience','Ways to protect, recur, or rebuild key resources.']].map(([points,title,copy]) => <article key={title}><span>{points} PTS</span><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <footer className="wrap"><span>EDH NEXUS · DECK DIAGNOSTICS</span><p>Magic: The Gathering is owned by Wizards of the Coast. EDH Nexus is unofficial and unaffiliated.</p></footer>
    </main>
  );
}

function Results({ result }: { result: Result }) {
  const circumference = 2 * Math.PI * 54;
  return <div className="results">
    <div className="result-head"><div className="ring"><svg viewBox="0 0 128 128" aria-hidden="true"><circle cx="64" cy="64" r="54"/><circle className="progress" cx="64" cy="64" r="54" style={{strokeDasharray:circumference,strokeDashoffset:circumference * (1-result.score/100)}}/></svg><div><strong>{result.score}</strong><span>/100</span></div></div><div><p className="eyebrow">Synergy diagnostic</p><h2>{result.grade}</h2><p>{result.planName} · {result.confidence} confidence</p></div></div>
    <div className="coverage"><span><b>{result.recognized}</b> cards read</span><span><b>{result.roles.plan}</b> plan cards</span><span><b>{result.roles.interaction}</b> interaction</span></div>
    <div className="dimension-list">{result.dimensions.map((item) => <div className="dimension" key={item.name}><div><b>{item.name}</b><span>{item.score}/{item.max}</span></div><div className="meter"><i style={{width:`${item.score/item.max*100}%`}}/></div><p>{item.note}</p></div>)}</div>
    <div className="findings"><div><h3><span className="good">↑</span> What’s working</h3>{result.strengths.map((item) => <p key={item}>{item}</p>)}</div><div><h3><span className="warn">→</span> Best next edits</h3>{result.improvements.map((item) => <p key={item}>{item}</p>)}</div></div>
    {result.unmatched.length > 0 && <p className="unmatched">Couldn’t match: {result.unmatched.slice(0,4).join(", ")}{result.unmatched.length > 4 ? ` +${result.unmatched.length-4} more` : ""}.</p>}
  </div>;
}
