# REVERSE-ACTUALIZE.md — from the imagined shore to the smallest honest experiments

The far shore (FAR-SHORE.md) is imagination. This document is the bridge: for each
of the round-B top-3 primitives, **the smallest experiment wave-68/69 could run
with the channels we actually have** (typesafe, deepinfra, mothquantum, cloudflare,
node + jsonl ledgers), the **falsifiable prediction** that makes it honest, and
the **artifact** it leaves behind. Judges advise, ledgers decide: round C's
attacks (verbatim in `receipts/round-c-gpt-oss-20b.answer.md`) were consumed as
design constraints and falsifiers — its KILL verdicts are answered with
predictions that would kill the primitive for real if they fail.

Ranking below uses **leverage ÷ effort** (leverage 1–10 = how much downstream
capability the experiment unlocks; effort in lane-units ≈ one wave-sprint of one
lane).

---

## R1 — Compound-key freeze test re-run (from Evidence Key)

**Smallest honest experiment.** Grow the refunder corpus from 7 to ≥14 joint
observations by re-running the storefront battery with the five refund registers
plus fact-varied messages (receipt mentioned vs not; amount bands), extract the
fact dimensions with a hand grammar — `receipt_present`, `amount_band`,
`product_class` — **deterministically, zero model calls for facts**; then run
quilt-softjoints `freezingTest` (`src/decompose.js`) unchanged, over compound
`(fact-region, tone-bucket)` keys at buckets 2/3/4, threshold 3. The v2
pre-vector is *additive* to quilt-storefront `src/vector.js` (v1 behavior when
fact dims are empty — hours/stock/price routes untouched). Nothing else changes:
the fallback-first `tryFrozen` path, the zero-call frozen-hit harness
(`tests/07-freeze.test.mjs`), and the §5a adjustment flow all already exist.

**Falsifiable prediction (two-sided, either result decides).**
1. At least one fact-keyed region reaches unanimity at n≥3 that the emotion-only
   key could NOT freeze (the 67-c split region `distress:0|goodwill:1|repeat-customer:0`,
   {full refund: 2, store credit: 1}), and its frozen rows replay with 100%
   answer-class agreement at **zero model calls**. If no fact-keyed region reaches
   the bar after corpus growth, the v2 contract fails to fix the diagnosed
   defect — falsified.
2. The upset-milk region *without* a receipt mention remains split — proving the
   67-c non-determinism was a missing-key artifact, not model noise. If instead
   *every* region freezes early, the grammar is overfitting (round C's warning
   about domain-specific regex) — falsified.

**Artifact left.** `eval/freeze-report-v2.json` (append-only, v1 untouched),
additive `refunderPreVectorV2` + the fact grammar in a lane repo, §5a adjustment
records seq 19+, and — if prediction 1 holds — the storefront's **first live
frozen policy ruling** served from `refunder.frozen` before any model call.

**Channels.** deepinfra (battery turns ≈ 8–12 calls), typesafe (only if a router
re-check is needed), cloudflare optional (host the frozen-path demo as an organ
worker), moth optional 0 jobs.

**Leverage 9 ÷ effort 1 = 9.** The corpus this experiment grows is the *shared
raw material* of the freeze frontier (primitive 9), the skeleton compiler's
ground truth (primitive 8), and spec A's validation (`spec/primitives-v2.md` §A).

---

## R2 — Derived cells over real ledgers (from Flow Calculus)

**Smallest honest experiment.** Implement `rate` / `accum` / `lag` as one pure
module consuming quilt-chrono's ledger API read-only (`src/ledger.js` state, the
same prefix-fold discipline `src/seal.js` uses), with a deadband ε (reuse the
`isDegenerate` spread<0.04 law from quilt-storefront `src/vector.js`) and cached
incremental partials keyed `(cell, op, window, seq)` — the cache is an
observation, never a transition. Run it on **real wave-67 data**: the 24-turn
battery's per-turn vectors and latencies, and the runbook dogfood ledger. Optional
moth use (0–1 job): `comet-qrng-v1` supplies the adversarial jitter stream for
the deadband robustness check — an honest quantum-RNG consumer, not decoration.

**Falsifiable predictions (round C's falsifiers, adopted and sharpened).**
1. `rate` over a constant stream is exactly 0 within 1e-9 for every window; with
   injected jitter ±ε/2 it stays 0 (deadband works); with jitter ±2ε it oscillates
   — naming the honest sensitivity boundary instead of hiding it.
2. `accum` over a synthetic sinusoid matches the analytic integral within 1%.
3. **The decisive one:** on the real battery, the `rate` cell over turn latency
   (and over the refunder's distress) flags each of the three known wave-67
   incidents (two greeter truncation silences, one refunder fail-closed) within
   ≤2 turns of onset, while a plain threshold alarm on the same stream flags
   none. If the derivative cannot out-detect the threshold on real data, the "new
   conceptual object" claim is snake oil *for this data* — report it, don't tune
   it away.

**Artifact left.** `calculus.js` + tests (the three predictions as assertions) +
a projection overlay rendering warmth-velocity/latency-rate over
`live-session-2.jsonl` via the existing `renderSVG` — the first picture of the
sheet's time dimension *as calculus*.

**Channels.** Zero model calls (pure local computation over existing ledgers);
moth optional. Effort ≈ 1 lane. **Leverage 8 ÷ effort 1 = 8.**

---

## R3 — Three invariant monitors on existing ledgers (from Invariant Monitor)

**Smallest honest experiment.** `monitor.js` defining exactly three invariants as
pure functions over the storefront session ledgers **already on disk — zero new
model calls**: (i) refund conformance: `answer_class(receipt_present=true)` ∈
policy table (shares R1's fact grammar); (ii) greeter-not-silent when a visitor
turn precedes; (iii) budget/usage counter monotonicity. Tail-only evaluation per
append (⚔ round C's O(M·N) hit, answered by construction); violations written as
sealed anomaly entries in a chain sidecar (the `seal.js` link shape — one link
per anomaly, append-only, tamper-evident), debounce-windowed to one anomaly per
region per 5 turns.

**Falsifiable prediction.** The three known wave-67 incidents are caught at their
exact seq positions (T-greeter-silence ×2, T22 raw-fallback) with **0 false
positives** on the clean wave-66 session. Any false positive on clean data or any
missed incident falsifies the monitor contract (deadband, debounce, scope) at its
current setting — iterate once or kill the primitive.

**Artifact left.** `src/monitor.js` + `eval/monitor-report.json` + the anomaly
chain sidecar — the fleet's first always-on guards whose violations are receipts.

**Channels.** Zero external calls. Effort ≈ 0.5 lane. **Leverage 6 ÷ effort 0.5 = 12.**

---

## Ranking and the single most actionable experiment

| Rank (leverage ÷ effort) | Experiment | Ratio | Model calls | Decisive either way? |
|---|---|---|---|---|
| 1 | R3 monitors | 12 | 0 | yes (catch-or-falsify on known incidents) |
| 2 | **R1 compound-key freeze** | 9 | ~8–12 deepinfra | yes (freeze or prove real non-determinism) |
| 3 | R2 derived cells | 8 | 0 | yes (out-detect thresholds or confess) |

**Most actionable next: R1.** R3 is the cheapest ratio and can ride along in the
same lane, but R1 is the one that *unblocks the fleet*: its corpus is the shared
precondition for the freeze frontier and the skeleton compiler, it validates
spec A (`spec/primitives-v2.md` §A) against the exact non-result wave-67
receipted, and both outcomes are decisive — a frozen policy ruling would be the
first table the grind-down produced from live evidence, and a persistent split
would be the strongest possible evidence for where soft joints must stay alive.

**Sequencing note.** R1 and R3 share the fact grammar; R2 is independent. A
single wave-68 lane could do R1 + R3 within one budget envelope (≈8–12 deepinfra
battery calls, 0 typesafe expected), leaving R2 — with its moth option — for 69.

**What we are NOT reverse-actualizing yet (next-3 seeds, one line each):**
Moment Field (needs R1's compound corpus before gradients mean anything),
Greeter Contract (needs the compiler to exist as an adversary worth forbidding),
Causal Slice (needs R3's anomaly cells as the things worth explaining),
Metered Soft Joint (needs R1's frozen hits to have something to count),
Domain Skeleton Compiler (needs R1's fact grammar generalized beyond refunds),
Freeze Frontier (is R1 + R3 + displays — it is the sum, not a part).
