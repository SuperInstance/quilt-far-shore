# quilt-far-shore

**Lane 68-c of the SuperInstance fleet (ideation lane).** This is a DESIGN repo:
we imagined the soft-joint quilt's runtime at full maturity (2028), then
reverse-actualized the imagination into machine-usable specs and the smallest
honest experiments the fleet could run next with the channels it actually has.

The principal's words this lane builds from: *"we want ways to construct
synergistic intelligence that punches above its weights and through decomposition
becomes more and more a lookup table that smaller and smaller models can plug
into the soft joints… once you can think in true calculus and not just limits for
rate-of-change, you can exist with new abstractions of derivatives and integrals…
The spreadsheet made the mechanical engineering of computation into something
multi-dimensional. We are adding many more dimensions, especially time, as
readings and writings, pushes and pulls flow actively and elegantly and visually
in whatever projection you need for the display and controls of the application."*

## The method: imagine → reverse-actualize → experiment

1. **IMAGINE** (`FAR-SHORE.md`) — three receipted model calls (deepseek-v4-pro
   imagines the missing 2028 primitives; typesafe/jev scores them by
   leverage × buildability-now with explicit criteria; gpt-oss-20b attacks the
   top three as devil's advocate). All answers are stored **verbatim as data,
   not authority** — the fleet law is *judges advise, ledgers decide*. Every
   imagined primitive is grounded in a wave-66/67 artifact that EXISTS
   (repo + file cited) with the delta named.
2. **REVERSE-ACTUALIZE** (`REVERSE-ACTUALIZE.md`) — for each top-3 primitive:
   the smallest honest experiment for wave-68/69, its falsifiable prediction,
   and the artifact it would leave. Ranked by leverage ÷ effort.
3. **EXPERIMENT (specified, not run here)** (`spec/primitives-v2.md`) —
   machine-usable draft specs for the top 2: **§A** the FACT-dimension
   moment-vector contract (fact-vector + tone-vector split, two-stage freeze
   test) and **§B** the derivative/integral abstraction (rate / accum / lag as
   first-class **derived cells** over quilt-chrono's ledger). Each spec carries
   JSON schemas, worked examples, and open questions.

## This repo is machine-checkable

The spec's schemas and worked examples are not prose decorations — `tests/spec.test.mjs`
parses every ```json block out of `spec/primitives-v2.md` and **recomputes the
arithmetic** (the two-stage freeze groupings over the real 7-observation wave-67
corpus; the rate/accum/lag evaluations). If the spec and the code disagree, the
test fails.

```bash
npm test          # node --test — 9/9 green, zero network, stdlib only
npm run keyscan   # key discipline scanner (copied verbatim from cot-quilt)
```

## Layout

| Path | What |
|---|---|
| `FAR-SHORE.md` | the imagined 2028 runtime: primitive stack grounded in existing artifacts, time-dimension display/controls, decomposition economics, the greeter law at scale, provenance |
| `REVERSE-ACTUALIZE.md` | the bridge: R1/R2/R3 experiments, falsifiable predictions, leverage÷effort ranking, the single most actionable next step |
| `spec/primitives-v2.md` | the two machine-usable contracts (§A fact/tone split + two-stage freeze test; §B derived cells) — schemas + worked examples + open questions |
| `DESIGN.md` | the design pass: ideation notes, honest findings, rejected alternatives |
| `receipts/` | one receipt per external call (model, usage, latency, finish) + **verbatim** model answers + lane-computed score tables + `external-calls-summary-68c.json` |
| `scripts/ideate.mjs` | the receipted ideation caller (spend-capped, fail-closed, keys never printed) |
| `tests/` | spec validation suite + fixtures (real wave-67 data with provenance) |

## Receipts (spend, honestly)

| Channel | Model | Calls | Cap | Notes |
|---|---|---|---|---|
| deepseek | deepseek-v4-pro | 2 receipted (3 attempts — 1 pre-receipt loss disclosed) | 2 | round A; call-01 empty-content fail receipted; call-02 truncated, corpus mined verbatim from its own reasoning trace |
| typesafe | jev-1.13.0 (systemone) | 1 (31 questions, 7172+578 tok) | 4 | round B; scores consumed as ordinal (they exceeded the 0..1 range — calibration finding) |
| deepinfra | openai/gpt-oss-20b | 1 (3568 tok) | 6 | round C; verdicts KILL/KILL/MUTATE, adopted as design constraints |

Full details: `receipts/external-calls-summary-68c.json`. Keys live only in
`/home/z/my-project/.env.keys` (runtime-only); `scripts/keyscan.mjs` must print
CLEAN before any commit.

## What the next wave should consume

1. **R1 (compound-key freeze test re-run)** — the most actionable experiment;
   its corpus is the shared raw material of the freeze frontier, the skeleton
   compiler, and spec §A's validation. `REVERSE-ACTUALIZE.md` §R1.
2. **spec §A + §B** are adoption-ready drafts: additive to quilt-storefront
   (`src/vector.js`, `src/freeze.js`) and read-only over quilt-chrono — with the
   adoption checklist at the end of the spec file.
3. **The receipts are reusable** — `receipts/primitives.json` (9 primitives with
   provenance) and `receipts/round-b-scores.json` (judge table) are structured
   inputs for any future planning lane.
