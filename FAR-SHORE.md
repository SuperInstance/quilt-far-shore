# FAR-SHORE.md — the perfect figure, imagined from real artifacts

**Lane 68-c (ideation).** This document imagines the soft-joint quilt's runtime as it
would stand in 2028 if the program *succeeded completely* — then names the delta
between that figure and what waves 66–67 actually built, artifact by artifact.

Method law: **judges advise, ledgers decide.** The far shore below was drafted from
three receipted ideation calls (§provenance), but every claim about what exists is
anchored to a real file in a real repo, and every claim about what is missing is
labeled as imagination. The verbatim model answers live in `receipts/` as data —
not authority. Where the devil's advocate scored a hit, the hit is marked ⚔.

---

## 1. The far shore in one paragraph

By 2028 the quilt is a **reactive sheet with a time axis**. Cells read and write;
every read and write is a flow entry in an append-only ledger with signed custody.
The formulaic bulk of any domain has ground down into **lookup tables** (the grind
is a *measured process*, not an aspiration), soft joints — small models reading the
moment as a **compound vector of FACTS and TONE** — remain only where runs prove
they must, and **greeter cells** still refuse to decompose, by contract, forever.
Operators no longer see a spreadsheet of values: they see **fields** — rates,
accumulations, lags, invariant violations, and a **freeze frontier** that shows,
in any projection they ask for, where the sheet is still alive and where it has
become table. Small models plug into the soft joints; everything else is lookup,
and the whole thing punches above its weights *by receipted measurement*, the way
wave-66's storefront already did at +2.83 quality over the bare model on ~1/3 the
calls (quilt-storefront, eval re-run, wave-67).

## 2. An operator's day in 2028 (the vignette the primitives must earn)

> 09:00 — The operator opens the sheet's **flow map** (quilt-chrono
> `src/projection.js` `flowMap`/`renderSVG` at maturity: live, streaming). The
> refunder's **warmth-velocity** derived cell shows acceleration since 08:40 —
> three escalating distress turns. No threshold alarm fired; the *derivative* did.
>
> 09:02 — An **invariant monitor** seals an anomaly cell: "refund-outcome ∉
> policy-table(receipt_present=true)" on turn 412. The operator clicks the anomaly
> and gets a **causal slice**: the minimal replayable set — two lookup reads, one
> fact parse, one joint call — that reproduces the wrong ruling at seq 4118.
>
> 09:05 — The slice shows the joint answered against a fact the pre-vector could
> not see. The operator does not hand-patch: the run's adjustment is mined
> (quilt-runbook `src/mine.js` lineage), the **two-stage freeze test** re-runs over
> the grown corpus, and the fact-region `receipt_present=true ∧ distress∈[0,.5]`
> crosses the unanimity bar — the outcome column compiles into `refunder.frozen`
> and the fallback-first path serves it **before any model call** from then on
> (the mechanism that exists today in quilt-storefront `src/engine.js` `tryFrozen`).
>
> 09:15 — The **freeze frontier** projection updates: one more region turned to
> table. The joint's **meter cell** shows the month's cost curve bending down; the
> sheet punches above its weights a little more than it did in July.
>
> 09:20 — A visitor walks in. The greeter cell greets them. Nobody — no compiler,
> no freezing test, no budget squeeze — will ever turn it into a table. That is a
> contract, signed, and the compiler treats it as forbidden ground.

Nothing in that vignette requires a bigger model. Every sentence is a *structural*
claim. That is the point: the far shore is more **structure**, not more parameters.

## 3. The primitive stack (imagined 2028 ← built 2026)

Every row: what it grows from (real repo, real file), and the named delta. The
nine primitives came from round A (deepseek-v4-pro; the call hit its token cap and
the corpus was mined verbatim from its own reasoning trace — see §provenance);
round B ranked them; round C attacked the top three.

| # | Primitive (2028 form) | Grows from (exists today) | The delta |
|---|---|---|---|
| 1 | **Flow Calculus** — `diff`/`integrate`/`lag` operators over ledgers emit **derived cells** (rate / accumulated / lag kinds); operators intervene on acceleration and accumulated drift, not thresholds | quilt-chrono `src/projection.js` (pure `(ledger,t1,t2)→view`: `stateAt`, `diff`, `flowMap`, `renderTable`, `renderSVG`); `src/ledger.js` tipHash; `src/seal.js` custody | projections are point-in-time views; the shore adds closed calculus operators whose **outputs are cells** with kinds (`rate`, `accum`, `lag`) — d/dt and ∫ become things you can hold, wire, and freeze |
| 2 | **Moment Field** — buckets become a continuous field over named dimensions; freezing works on region *shape*, policy gradients are queryable | quilt-softjoints `src/joint.js` (bucketed vector regions); quilt-storefront `src/vector.js` (`DIMS`, `isDegenerate` spread<0.04 gate, `blend` 0.7/0.3) | from bucketed regions (freezing test only sees buckets) to interpolated field with gradients; the bucket-boundary luck disappears |
| 3 | **Evidence Key** — region keys become compound `(fact-vector, tone-vector)`; facts decide outcomes, tone decides tone of voice; two-stage freeze test | quilt-storefront `src/freeze.js` + `eval/freeze-report.json` (the honest NON-FREEZE: same upset-milk message split store-credit/full-refund because RECEIPT PRESENCE, a fact, was invisible to the 3-dim emotional pre-vector) + `runs/adjustments.jsonl` seq 18 (the v2-vector proposal) | the pre-vector grows a deterministic, typed fact dimension extracted by grammar/lookup — never by model call — and freezing unifies on facts first |
| 4 | **Greeter Contract** — a signed, enforced never-decompose boundary | quilt-softjoints §5b descriptor `"greeter": true` + `notes` (convention only); quilt-jev-toolkit `src/organ/checkpoint.mjs` (HMAC-signed checkpoints) | from a notes flag the compiler *could* ignore to a signed contract the compiler and freezing tests *must* refuse |
| 5 | **Causal Slice** — "why did this fire?" returns a replayable object | quilt-runbook `src/mine.js` (`mineRun`, WHY-mining) + `src/replay.js` replay contract + chrono `stateAt` | from post-hoc log mining to a minimal replayable slice object that survives rewind and seals |
| 6 | **Invariant Monitor** — assertions over projections, evaluated per append, violations sealed as anomaly cells | quilt-chrono `src/projection.js` (pure views) + quilt-playtest `examples/e3_gesture_ekg.mjs` (CellEKG motion classes: drifting/oscillating/stuck) | from offline views and one-off probes to always-on guards whose violations are *sealed receipts*, not console noise |
| 7 | **Metered Soft Joint** — per-joint meter cells: calls, latency, vector coverage, frozen hit-rate, drift | quilt-storefront per-call usage receipting (fixed in 67-c) + budget-remaining routing + quilt-softjoints raw-hash cache (`src/joint.js`) | from session budget counters to per-joint economics as **cells** — cost curves are projectable like any other dimension |
| 8 | **Domain Skeleton Compiler** — raw domain traces in, proposed sheet out | quilt-softjoints `src/compiler.js` (`compileAdjustments`, union-find clustering — proven cross-repo in `receipts/cross-compile-66c.json`) + quilt-lookup `catalog/classification.json` (1040 entries: 159 pure-lookup / 839 lookup-with-weights / 32 needs-dynamic-model / 10 greeter-territory) | from compiling *corrections to existing sheets* to compiling *initial skeletons for new domains* — with the freezing test's evidence bar as its honesty gate ⚔ |
| 9 | **Freeze Frontier** — the managed surface between table / joint / greeter, with hysteresis, displayed and controlled like any projection | quilt-softjoints `src/decompose.js` `freezingTest` (unanimity + n≥threshold) + quilt-storefront fallback-first `tryFrozen` + `refunder.frozen` evidence-empty table law | from per-joint binary freeze events to a region-map surface you can *look at* and *steer* — the grind-down becomes visible governance |

⚔ marks where round C (devil's advocate) landed a hit that reshaped the shore:
the Domain Skeleton Compiler without the evidence bar "ships plausible-looking
wrong tables" (its own failure mode, model-agreed); the derived cells and
monitors must be **incremental** (§4) or they are O(N) theater.

## 4. The time dimension: display and controls at maturity

The principal's sentence — *"readings and writings, pushes and pulls flow actively
and elegantly and visually in whatever projection you need for the display and
controls of the application"* — is operationalized today in quilt-chrono
`src/projection.js` as pure functions over the ledger. The far shore adds the
**calculus layer** and the **guard layer**, and that is what makes time a
*dimension you compute in*, not just a timeline you scrub:

- **Derived cells** (primitive 1). A cell whose value is `d(warmth)/dt` or
  `∫urgency dt` over a window is *derived, never stored*: the ledger stores events
  and seals prefix states (quilt-chrono `src/seal.js` — a chrono seal IS an organ
  checkpoint, byte-exact); the derived cell re-derives from sealed inputs, so
  custody composes for free. Kinds: `rate` (backward difference with a deadband ε
  — ⚔ the jitter attack; ε reuses the `isDegenerate` spread<0.04 law from
  quilt-storefront `src/vector.js`), `accum` (directional flow sum), `lag`
  (cross-correlation of two streams).
- **Incremental, not O(N)** (⚔ round C's strongest hit). Every operator is defined
  as a fold, and folds have cached partials keyed `(cell, op, window, seq)` — the
  cache is an *observation*, not a transition (reads are observations: the same
  law `src/seal.js` already uses when deriving prefix state). Late entries beyond
  a declared lateness bound are stored and flagged, never silently folded into
  sealed windows.
- **Invariant monitors** (primitive 6) ride the same projections the displays
  ride — one definition serves both the control room and the courtroom. Violations
  are sealed anomaly cells (append-only, debounce-windowed to fight ⚔ spam),
  which the causal slice can then replay.
- **The displays**: `flowMap`/`renderSVG`/`renderTable` gain derived-cell overlays
  (velocity fields, accumulation bands, monitor gates, the freeze frontier as a
  fourth overlay). Same pure-function discipline: `(ledger, t1, t2) → view`.

## 5. Decomposition at maturity: the grind-down as a measured process

At the far shore, "decomposition becomes more and more a lookup table that smaller
and smaller models can plug into" is a **pipeline with instruments**, not a slogan:

1. **The catalog is the gravity well.** quilt-lookup holds 1040 entries in 103
   families (988 the principal's + 39 wave-66 + 13 wave-67), 73 executable
   recipes validated at 100%, and every entry classified
   (`catalog/classification.json`) into pure-lookup / lookup-with-weights /
   needs-dynamic-model / greeter-territory. New domains are *attracted* toward
   this table before any model is consulted.
2. **Soft joints are where classification says dynamic.** The 32
   needs-dynamic-model entries and the genuinely-vector parts of the 839 get
   joints (§5b descriptors, quilt-softjoints `src/joint.js`: the moment is a
   vector array, fail-closed to fallback, raw-hash cache law).
3. **Runs leave evidence; the freeze test arbitrates.** Every run is a ledger
   (quilt-runbook run format, stable points, replay); the freezing test
   (quilt-softjoints `src/decompose.js`) promotes a joint's region to table ONLY
   on unanimity + n≥threshold over the evidence — and its refusal is a first-class
   result (wave-67's honest NON-FREEZE on the refunder).
4. **The two-stage test (v2)** adds facts to the key so *policy* rulings can
   freeze: stage 1 freezes the OUTCOME column on fact-regions; stage 2 checks
   whether tone merely varies phrasing (then phrasing stays dynamic and cheap) —
   spec in `spec/primitives-v2.md` §A.
5. **The freeze frontier** (primitive 9) is the instrument panel of steps 2–4:
   where the sheet is table, where it is alive, where it is greeter. Smaller and
   smaller models plug into fewer and fewer — and provably sufficient — joints.
6. **Adjustments compile.** The loop wave-66 demonstrated end-to-end (storefront
   live session → §5a adjustments with WHY → compiler → cells; cross-repo proof in
   quilt-softjoints `receipts/cross-compile-66c.json`) extends to initial
   skeletons (primitive 8), always behind the evidence bar.

**Economics at maturity.** The measurement discipline that produced "+2.83 over
the bare model at ~1/3 the calls, ground-truth judged" (quilt-storefront eval,
67-c) becomes per-joint meter cells (primitive 7) and a frontier-wide cost curve.
"Punches above its weights" stops being a one-time eval and becomes a curve every
projection can draw. ⚔ honest note from round C: metering must not double-count
retries and cache hits, or the curve lies (the wave-66 `model_calls` miscount,
found and fixed in 67-c, is the small local version of exactly this sin).

## 6. The greeter law at scale

Greeter cells are the deliberate anti-decomposition: connection value the fleet
protects *against* its own compilers. Today that is `"greeter": true` plus a
`notes` field explaining why it is never decomposed (§5b, quilt-softjoints), and
the storefront's `greeter.voice` already enforces the strong form: **no script
fallback — it degrades to silence, never a canned line**. At the far shore:

- the flag becomes a **signed Greeter Contract** (primitive 4): allowed inputs,
  handoff triggers, and a no-decompose clause the compiler and freezing tests
  treat as forbidden ground — enforced by verification (an organ-checkpoint-style
  signature), not by convention;
- greeters are **first-class in every projection**: an invariant monitor ("greeter
  never silent > N turns when a visitor is present") protects the *experience* the
  way other monitors protect money;
- the classification system keeps its `greeter-territory` bucket (quilt-lookup:
  10 entries today — chit-chat/greeting/rapport) so the catalog itself knows where
  lookup tables must not go.

## 7. What is NOT on the far shore

- **Bigger models.** The shore is reached by structure (calculus, contracts,
  compound keys, frontiers), not by parameters. Every primitive above *reduces*
  model dependence on the margin.
- **Free-form agent chatter.** Cells, flows, receipts — the ledger is the agent.
- **Silent freezing.** Nothing becomes a table without the evidence bar; nothing
  is deleted — corrections are new receipts (fleet law).
- **Un-measured "synergy".** If the cost/quality curve isn't drawn per joint, the
  claim doesn't exist. (Quota claims from model opinions — e.g. round C's
  Cloudflare limits — are data to verify, not facts to build on.)

## 8. Provenance (the ideation receipt trail)

| Round | Channel / model | Calls | Receipts | Role |
|---|---|---|---|---|
| a — imagine the 2028 primitives | deepseek `deepseek-v4-pro` | 2/2 cap (call-01 fail-closed empty-content, receipted; call-02 `finish=length` at 6000 completion tokens: 5789 reasoning + 211 visible) | `receipts/call-01…`, `call-02…`, verbatim `receipts/round-a-deepseek.answer.md` + `round-a-deepseek.reasoning.md` | produced the 9-primitive corpus (mined verbatim from the truncated call's own reasoning trace; curated with per-primitive `source` in `receipts/primitives.json`) |
| b — score/rank by leverage × buildability-now | typesafe systemone `jev-1.13.0` | 1 of ≤4 | `receipts/call-03…`, verbatim `receipts/round-b-jev.answer.md`, lane-computed `receipts/round-b-scores.json` | 31 questions (3 scored criteria × 9 primitives + top-pick choice); explicit criteria in the call |
| c — devil's advocate on the top-3 | deepinfra `openai/gpt-oss-20b` | 1 of ≤6 | `receipts/call-04…`, verbatim `receipts/round-c-gpt-oss-20b.answer.md` | BREAK / SNAKE OIL / FALSIFIER / VERDICT per primitive: KILL / KILL / MUTATE — verdicts adopted as design constraints and experiments, not as decisions |

Honest instrument findings (data, receipted):
1. Round B scores exceeded the 0..1 criteria range (1.19–1.93): the instrument was
   read outside its calibration — scores are consumed as **ordinal only**; ranking
   is invariant to uniform rescale. ⚔ The judge's own top-pick choice (`p3`,
   confidence 0.86) contradicted its score product (`p1` first) — a second
   calibration datum: within one call, jev's choice head and scoring hands
   disagree. The lane ranks by the product; the task-mandated spec set (fact/tone
   split, calculus cells) independently covers 2 of the top 3.
2. A lane curation bug fed the `_provenance` metadata key to the judge as if it
   were a primitive (it dutifully scored it 0.9/1.37/1.44). Receipted verbatim;
   fixed in `scripts/ideate.mjs` for reruns; disclosed per never-delete law.
3. Round A's single-call token budget (5789 reasoning tokens) truncated the final
   answer after 1.5 of 9 primitives. The corpus was recovered verbatim from the
   same receipted call's `reasoning_content`, preserved in
   `receipts/round-a-deepseek.reasoning.md` — data from a receipted call, not a
   second call.
4. Round A call-02's recorded `latency_ms` (229) is inconsistent with observed
   wall time (~40s); token counts are authoritative; measurement flagged suspect.

---

## Reverse-actualization receipts (wave 69-d, additive — the fiction above is untouched)

The shore was imagined; these are the first receipts from actually sailing at it.
R1 and R3 ran exactly as registered in REVERSE-ACTUALIZE's sister section above
(claims sealed and pushed in `fleet-seeds` @ 382ad19 BEFORE any run — the preregister
ritual held even through a lane death), and the results now stand beside the
imagination, never rewriting it.

**R1 — the compound-key freeze re-run ran, and the freeze is real (P1 PASS).**
The refunder corpus grew 7 → 19 (7 receipted wave-66/67 joint observations + 12 new
deepinfra gpt-oss-20b battery rulings over the five refund registers, fact-varied —
12/12 calls billed, usage on every row, est. $0.000813). Facts came from the hand
grammar (`scripts/r1-grammar.mjs`: receipt-present / amount-band / product-class,
deterministic, zero model calls — the L1 literal `unknown`, L2 facts-are-free, L3
evidence-or-nothing). The v2 freezing instrument, unchanged, froze **4 fact-keyed
proposals across the pre-declared K1/K2/K3 × buckets 2/3/4 family while the
emotion-only key froze nothing on the same corpus** — and one of those frozen
regions replayed through the storefront's fallback-first frozen path 8/8 with
100% answer-class agreement at budget deepinfra:0. The storefront's first live
frozen policy ruling is no longer a promise in §"Freeze Frontier"; it executed.

**The 67-c diagnosis held exactly where it should (P2 PASS).** The upset-milk
region *without* a receipt mention stayed split — the two real legacy rulings
(store credit / full refund) still disagree inside
`receipt-present:unknown|product-class:milk`, and the instrument did not absorb
them: only 1 of 11 K1@B3 regions froze. The non-determinism was a missing key,
not model noise — and the key does not overfit (round C's guard): most regions
correctly stay below the bar.

**R3 — the monitors are the fleet's first always-on guards whose violations are
receipts (P3 PASS).** Three invariants as pure functions over the ledgers already
on disk, zero external calls: the three known wave-67 incidents caught at their
EXACT positions (greeter silences T6/T13, raw-fallback T22 of `live-session-2`),
zero unattributed flags on the clean wave-66 session (its only flags, L18/L25,
land on the cache-collapse the adjustment ledger already receipts at seq 13),
sha256 link-chain sidecar re-walks clean, a mutated link is detected fail-closed,
and tail-only incremental append is byte-identical to fold-from-genesis.

**Finisher note (honesty of adoption).** The 69-d lane died after R1's run but
before scoring; this finisher re-derived every recorded R1 metric offline from
the recorded corpus (`scripts/r1-verify.mjs`, 18/18 checks, zero calls) before
adopting it, then ran R3 fresh. Verdicts 3/3 PASS by `tools/preregister.mjs
score`, appended beside untouched claims (`preregister-69d.verdict.json`,
claimsHash sha256:6058255b…). Artifacts: `results/R1.json`,
`results/r1-calls.jsonl`, `results/R3.json`, `results/r3-anomaly-chain.jsonl`.
What the shore gained: a fact-keyed freeze that actually fires, a split that
refuses to be laundered, and guards that turn incidents into tamper-evident
receipts. What stays open: R2's calculus (deferred by the sequencing note), the
frozen table's promotion path, and the monitors' ride-along on future sessions.

---

## Receipts — wave 71-d-r2 (the finisher): R2 derived cells run beside untouched claims

The last un-run registered experiment executed per REVERSE-ACTUALIZE.md R2 verbatim
(claims sealed and pushed in `fleet-seeds` @ e0c8709 BEFORE any run — preregister
`seeds/preregister-71d.json`, claimsHash `sha256:17f0019d882067219634105d9717ce10c70c52808dcf3fb2198357ca18517fc4`,
verified remote==local at seal time; the fictional far shore above is untouched —
everything below is additive receipt).

- **Artifact.** `src/calculus.js` — `rate` / `accum` / `lag` as ONE pure module
  (spec/primitives-v2.md §B.2 semantics verbatim: backward difference with the
  deadband law `|ΔV| < 0.04 → 0 exactly` — the isDegenerate spread law; level
  trapezoid / directional-flow accum; Pearson-argmax lag), incremental fold
  partials keyed `(cell, op, window, seq)` proven equal to recompute-from-genesis
  (observation, never transition), consuming quilt-chrono's ledger API READ-ONLY
  (`src/ledger.js loadLedger` over the real dogfood ledger
  `examples/tide/outputs/ledger.jsonl`, sha256 before==after) and the real
  wave-67 battery (`quilt-storefront/runs/live-session-2.jsonl`, 24 turns).
  Tests: `tests/r2-calculus.test.mjs` 9/9 — the registered predictions as
  assertions. Overlay: `results/r2-overlay.svg` (5,419 bytes) rendered through
  quilt-chrono's EXISTING `renderSVG` — the battery's time dimension as calculus.
  Receipt: `results/R2.json`. **ZERO model calls, zero network, moth unspent** (the
  registered 0–1 optional `comet-qrng-v1` job left unspent — the zero-call channel stayed zero-call).
- **P1 deadband — PASS.** Constant stream exactly 0 within 1e-9 at windows 1/2/4;
  ±ε/2 jitter stays 0 (|ΔV| = ε/2 < ε killed); ±2ε jitter oscillates (|ΔV| = 4ε
  survives) — the honest sensitivity boundary named, not hidden.
- **P2 sinusoid — PENDING (named, per the claim's own sealed refusal branch).**
  The sealed analytic ∫₄²⁰ (16 units) does not match the spec-B3.2-faithful
  trapezoid support [5,20] (15 units) — a pre-run window mis-declaration in the
  claim text, discovered at run time. Both errors receipted in `results/R2.json`:
  sealed-window rel err 0.1014; support-matched rel err **0.00033** (well inside
  1%). The sealed comparator was NOT re-scored (no threshold surgery — claims
  untouched); the instrument's correctness is additionally asserted 9/9 in tests.
- **P3 the decisive one — PASS.** On the real battery, the `rate` cell over
  turn latency (turn_ms; threshold-alarm bar 2×mean-nonzero = 6242.2 ms) and over
  the refunder's distress (`refunderPreVector`, T22 fail-closed = null carried)
  flags ALL THREE R3-receipted incidents within ≤2 turns of onset — greeter
  truncation silences T6 (rate 2672.0) and T13 (2432.5), refunder fail-closed T22
  (2308.5, plus the distress crash read at T23: (0.10−0.42)/2 = −0.16) — while
  the plain threshold alarm on the same streams flags NONE (latency bar 6242.2 >
  max 5344; distress bar 0.68 > max 0.42). Full flag sets receipted, nothing
  hidden: the derivative also flags 10 non-incident latency turns (every model
  turn's onset is a real derivative — that is what a rate cell sees), and the
  claim's edge was that the level alarm's blindspot is exactly where the incidents
  live. "Report it, don't tune it away" was obeyed in both directions.
- **P4 conservation + custody (mission-directed additive claim) — PASS.**
  d/dt of the integral == the original flow EXACTLY (max err ≤ 1e-9) on the
  synthetic flow and on the battery's real per-turn spend flow
  (`usage.estimated_cost` — accum = cumulative spend). Spec §B.3 examples
  reproduce through the same operators: rate(T17)=0 deadband-exact, rate(T23)=−0.16,
  accum (turn 5, 24] = 4.50 distress·turns (2.94 + 1.56) on the REAL distress
  stream (T10/T17/T23 prevalences 0.42/0.42/0.10), lag argmax = 1 with corr_k1 = 1.0.
- **Verdict seal.** `fleet-seeds tools/preregister.mjs score` →
  `seeds/preregister-71d.verdict.json`: **P1 PASS, P2 PENDING, P3 PASS, P4 PASS**
  (3 PASS / 0 FAIL / 0 VACUOUS / 1 PENDING) — scored beside untouched claims,
  claimsHash verified. With 69-d's R1 (3/3 PASS @ f2699e1) and R3 (3/3 PASS), **all
  three registered far-shore experiments have now RUN** — R2's calculus cells are
  real, free (zero calls), and out-detect their threshold baselines on the data
  that spawned them.
