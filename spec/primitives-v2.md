# spec/primitives-v2.md — machine-usable draft specs (lane 68-c)

**Status:** DRAFT for wave-68/69 adoption. Two contracts, both rooted in receipted
evidence: §A operationalizes the wave-67 freeze-test diagnosis
(quilt-storefront `runs/adjustments.jsonl` seq 18 + `eval/freeze-report.json`);
§B operationalizes the time-dimension thesis (principal's derivative/integral
sentence) over quilt-chrono's ledger. Both were stress-tested by round C
(`receipts/round-c-gpt-oss-20b.answer.md`): §A incorporates its MUTATE verdict
(deterministic fact extraction; tone demoted to a separate, recomputable
attribute), §B incorporates its BREAK hits (deadband, incremental partials,
late-entry law).

**Machine-checkability:** every schema and worked example in this file is
validated by `tests/spec.test.mjs` (`node --test`) — the examples are parsed out
of this very file and their arithmetic recomputed. If the spec and the code
disagree, the test fails.

---

## §A — Soft-joint descriptor v2: fact-vector + tone-vector split, two-stage freeze test

**Thesis it executes:** *facts decide outcomes, emotion decides tone — a region
key needs both to freeze a policy ruling* (67-c diagnosis: the same upset-milk
message split store-credit/full-refund because RECEIPT PRESENCE, a fact, was
invisible to the 3-dim emotional pre-vector).

### A.1 Descriptor schema (`softjoint` v2, backward compatible with wave-66 §5b)

v1 fields are unchanged (`kind`, `id`, `inputs`, `vector`, `backend`, `fallback`,
`greeter`, `notes`). v2 adds: descriptor `v: 2`; `vector` gains `role: "tone"`;
new `fact_vector`; new `region_key`.

```json schema:softjoint-v2
{
  "$id": "quilt.softjoint.v2",
  "type": "object",
  "required": ["kind", "id", "v", "vector", "backend", "fallback"],
  "properties": {
    "kind": {"const": "softjoint"},
    "id": {"type": "string"},
    "sheet": {"type": "string"},
    "v": {"const": 2},
    "inputs": {"type": "array", "items": {"type": "string"}},
    "fact_vector": {
      "type": "object",
      "required": ["role", "labels", "types", "extraction"],
      "properties": {
        "role": {"const": "fact"},
        "labels": {"type": "array", "minItems": 1, "items": {"type": "string"}},
        "types": {
          "type": "array", "minItems": 1,
          "items": {"enum": ["bool", "int", "number", "enum", "string"]}
        },
        "enum_values": {"type": "array", "items": {"type": "array", "items": {"type": "string"}}},
        "extraction": {
          "type": "object",
          "required": ["type"],
          "properties": {
            "type": {"enum": ["grammar", "lookup", "formula"]},
            "ref": {"type": "string"},
            "cost": {"const": "zero-model-calls"}
          }
        },
        "missing": {"const": "unknown", "default": "unknown"}
      }
    },
    "vector": {
      "type": "object",
      "required": ["role", "dim", "labels"],
      "properties": {
        "role": {"const": "tone"},
        "dim": {"type": "integer", "minimum": 1},
        "labels": {"type": "array", "items": {"type": "string"}},
        "extraction": {
          "type": "object",
          "properties": {
            "type": {"enum": ["model", "lexicon", "blended"]},
            "backend": {"type": "string"}
          }
        },
        "fallback": {"type": "object"}
      }
    },
    "region_key": {
      "type": "object",
      "required": ["fact_labels"],
      "properties": {
        "fact_labels": {"type": "array", "minItems": 1, "items": {"type": "string"}},
        "tone_labels": {"type": "array", "items": {"type": "string"}},
        "quantization": {
          "type": "object",
          "description": "per tone label: bucket count and fixed edges; facts are quantized only by declared enum/bool domains, never by numeric buckets",
          "additionalProperties": {
            "type": "object",
            "required": ["buckets"],
            "properties": {"buckets": {"type": "integer", "minimum": 1}, "edges": {"type": "array", "items": {"type": "number"}}}
          }
        }
      }
    },
    "backend": {"type": "object"},
    "fallback": {"type": "object"},
    "greeter": {"type": "boolean", "default": false},
    "notes": {"type": "string"}
  }
}
```

**Laws the schema encodes:**
- **L1 (no silent guessing).** A fact that cannot be extracted is the literal
  value `"unknown"` — its own region value, never coerced to `false`/`0`.
- **L2 (facts are free).** Fact extraction is `grammar|lookup|formula` — a model
  call in the fact path reintroduces the cost the freeze exists to remove
  (round C's central BREAK, adopted as law).
- **L3 (tone is recompute-able).** Tone stays the v1 shape (model or lexicon
  read, 0..1 per label, `isDegenerate` gate); it may be recomputed on demand and
  is never part of a fact region's identity.
- **L4 (back-compat).** A v2 descriptor with `fact_vector` absent, or a v1
  descriptor, runs the v1 freezing test unchanged (vector-only keys).

### A.2 Two-stage freeze test

Stage 1 freezes the **outcome** on fact regions; stage 2 decides whether **tone**
merely varies phrasing. Verdicts: `dynamic` | `outcome_frozen_tone_dynamic` |
`fully_frozen` | `greeter_never`.

```json schema:freeze-test-v2
{
  "$id": "quilt.freeze-test.v2",
  "type": "object",
  "required": ["kind", "cell", "stage1", "verdict"],
  "properties": {
    "kind": {"const": "freeze-test-v2"},
    "cell": {"type": "string"},
    "threshold": {"type": "integer", "minimum": 2},
    "stage1": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["fact_region", "n", "outcomes", "unanimous"],
        "properties": {
          "fact_region": {"type": "string", "description": "e.g. 'receipt_present=true|product_class=socks' — 'unknown' is its own value (L1)"},
          "n": {"type": "integer"},
          "outcomes": {"type": "object", "additionalProperties": {"type": "integer"}},
          "unanimous": {"type": "boolean"},
          "frozen_outcome": {"type": ["string", "null"], "description": "set iff unanimous && n >= threshold"}
        }
      }
    },
    "stage2": {
      "type": ["array", "null"],
      "items": {
        "type": "object",
        "required": ["fact_region", "tone_bucket", "phrase_classes", "n"],
        "properties": {
          "fact_region": {"type": "string"},
          "tone_bucket": {"type": "string"},
          "phrase_classes": {"type": "object", "additionalProperties": {"type": "integer"}},
          "n": {"type": "integer"},
          "unanimous": {"type": "boolean"}
        }
      }
    },
    "verdict": {"enum": ["dynamic", "outcome_frozen_tone_dynamic", "fully_frozen", "greeter_never"]}
  }
}
```

**Semantics.**
- **Stage 1 (outcome).** Group observations by the fact region key (declared
  `fact_labels`, exact values, `unknown` allowed). A region freezes its outcome
  column iff `n >= threshold` AND all `answer_class` values are unanimous
  (the quilt-softjoints unanimity law, unchanged).
- **Stage 2 (tone).** Within each stage-1-frozen region, bucket observations by
  quantized tone (declared `tone_labels` + `quantization`) and check whether the
  **phrase class** (a normalization of the reply, not the outcome) is unanimous
  per tone bucket at the same threshold. Unanimous everywhere → `fully_frozen`;
  otherwise → `outcome_frozen_tone_dynamic` (outcome from the frozen table, tone
  stays dynamic — and cheap).
- **Greeter law.** `greeter: true` → verdict `greeter_never` without staging.
- **Failure posture.** A frozen outcome is served by the fallback-first path
  (`tryFrozen`) with zero model calls; a tone-dynamic joint still fails CLOSED to
  the frozen outcome (never to a fresh guess).

### A.3 Worked examples

**A3.1 — the real 67-c corpus, real arithmetic: nothing freezes yet (and that is the point).**
The 7 joint-answered observations of `eval/freeze-report.json`, fact-parsed by the
spec's grammar (`receipt_present`: message contains receipt *possession*;
`product_class` from the noun; tone label `distress` bucketed with edges
`[0, 0.34, 0.67, 1.0]`):

```json example:A31-real-corpus-stage1
{
  "kind": "freeze-test-v2",
  "cell": "refunder.joint",
  "threshold": 3,
  "stage1": [
    {"fact_region": "receipt_present=false|product_class=milk",  "n": 2, "outcomes": {"store credit": 1, "full refund": 1}, "unanimous": false, "frozen_outcome": null},
    {"fact_region": "receipt_present=false|product_class=socks", "n": 1, "outcomes": {"full refund": 1}, "unanimous": true,  "frozen_outcome": null},
    {"fact_region": "receipt_present=false|product_class=other", "n": 2, "outcomes": {"full refund": 1, "store credit": 1}, "unanimous": false, "frozen_outcome": null},
    {"fact_region": "receipt_present=false|product_class=eggs",  "n": 1, "outcomes": {"store credit": 1}, "unanimous": true,  "frozen_outcome": null},
    {"fact_region": "receipt_present=true|product_class=socks",  "n": 1, "outcomes": {"full refund": 1}, "unanimous": true,  "frozen_outcome": null}
  ],
  "stage2": null,
  "verdict": "dynamic"
}
```

The compound key *localizes* the 67-c split (milk and other both split; every
receipt-present region is unanimous) but n=1 regions are below the bar — the
instrument still refuses. This example is the falsifiable base R1 grows.

**A3.2 — the same region after R1's corpus growth (three added rows marked SIMULATED): the first frozen policy ruling.**
`(receipt_present=true|product_class=socks)` reaches n=3, unanimous
`full refund`; stage 2 shows tone splits phrasing → outcome freezes, tone stays live:

```json example:A32-outcome-frozen
{
  "kind": "freeze-test-v2",
  "cell": "refunder.joint",
  "threshold": 3,
  "stage1": [
    {"fact_region": "receipt_present=true|product_class=socks", "n": 3,
     "outcomes": {"full refund": 3}, "unanimous": true, "frozen_outcome": "full refund",
     "observations": ["live-session-2-replay.jsonl#L1 (real)", "SIMULATED-68-a", "SIMULATED-68-b"]}
  ],
  "stage2": [
    {"fact_region": "receipt_present=true|product_class=socks", "tone_bucket": "distress:0", "phrase_classes": {"plain": 2}, "n": 2, "unanimous": true},
    {"fact_region": "receipt_present=true|product_class=socks", "tone_bucket": "distress:1", "phrase_classes": {"plain": 1, "soothing": 1}, "n": 2, "unanimous": false}
  ],
  "verdict": "outcome_frozen_tone_dynamic"
}
```

Runtime consequence: `tryFrozen("receipt_present=true|product_class=socks")`
serves `"full refund"` with **zero model calls**; the tone-dynamic joint only
shapes the sentence, and fails closed to the frozen outcome.

**A3.3 — greeter refusal + v1 back-compat.**

```json example:A33-greeter-and-v1
{
  "kind": "freeze-test-v2",
  "cell": "greeter.voice",
  "threshold": 3,
  "stage1": [],
  "stage2": null,
  "verdict": "greeter_never",
  "note": "greeter: true — staging is forbidden by law; connection value is never compiled into a table",
  "backcompat": {
    "cell": "hours.answer",
    "v": 1,
    "fact_vector": "absent",
    "behavior": "L4: v1 freezingTest with vector-only keys, unchanged from wave-66"
  }
}
```

### A.4 Open questions (honest, carried forward)

1. **Fact vocabulary vs domains.** `product_class`-style enums are domain-local
   (round C's regex-overfit hit). Does a cross-domain fact grammar exist, or must
   every domain ship its own (and the skeleton compiler compile it)?
2. **`unknown` growth.** If the grammar's `unknown` rate is high, fact regions
   starve. What unknown-rate ceiling makes a region key honest? (Proposal: an
   invariant monitor — `unknown_rate < 0.2` per region.)
3. **Phrase-class normalization.** Stage 2 needs a deterministic answer→phrase
   class map (like 67-c's answer-class map). Who owns it — the sheet, the joint
   descriptor, or a shared quilt-lookup family?
4. **Threshold economics.** threshold=3 matches wave-67; does the bar scale with
   region value at risk (a $50 refund vs a $4 one)? If yes, that is a new
   `region_key.cost_at_risk` field — not yet specified.
5. **Two-annotator tone.** Round C's auditability attack on tone is answered by
   L3 (tone is machine-read and recompute-able), but the *phrase-class* map is
   human-authored — inter-author agreement is unmeasured.

---

## §B — Derived cells: rate / accum / lag over quilt-chrono ledgers

**Thesis it executes:** *"once you can think in true calculus and not just limits…
you can exist with new abstractions of derivatives and integrals and what these
new conceptual objects unlock."* A derived cell makes `d/dt` and `∫dt` **cells** —
wireable, projectable, freezable — not ad-hoc report math.

### B.1 Derived-cell descriptor schema

```json schema:derived-cell-v1
{
  "$id": "quilt.derivedcell.v1",
  "type": "object",
  "required": ["kind", "id", "source", "op", "params"],
  "properties": {
    "kind": {"const": "derived-cell"},
    "id": {"type": "string"},
    "sheet": {"type": "string"},
    "v": {"const": 1},
    "source": {"$ref": "#/definitions/stream"},
    "second": {"$ref": "#/definitions/stream"},
    "op": {"enum": ["rate", "accum", "lag"]},
    "params": {
      "type": "object",
      "required": ["window"],
      "properties": {
        "window": {
          "type": "object",
          "required": ["unit", "len"],
          "properties": {
            "unit": {"enum": ["seq", "ts"]},
            "len": {"type": "number", "exclusiveMinimum": 0}
          }
        },
        "deadband": {"type": "number", "minimum": 0, "default": 0.04,
          "description": "rate only: |ΔV| below deadband is exactly 0 (jitter law; 0.04 reuses the isDegenerate spread gate)"},
        "lateness_bound": {"type": "number", "minimum": 0,
          "description": "ts-unit entries arriving with ts earlier than (window_start - lateness_bound) are stored + flagged late, never folded into sealed windows"},
        "max_lag": {"type": "integer", "minimum": 1}
      }
    },
    "storage": {"const": "never-stored"},
    "custody": {
      "type": "object",
      "required": ["law"],
      "properties": {
        "law": {"const": "recompute-from-sealed-inputs"},
        "seal_ref": {"type": "string"}
      }
    }
  },
  "definitions": {
    "stream": {
      "type": "object",
      "required": ["ref"],
      "properties": {
        "ref": {"type": "string", "description": "cell path, e.g. 'refunder.joint.vector.distress' or a flow field 'flows[*].amount'"},
        "ledger": {"type": "string"},
        "nulls": {"enum": ["skip", "carry"], "default": "carry",
          "description": "fail-closed turns produce no reading; skip drops the sample, carry holds last-known-value (documented per cell)"}
      }
    }
  }
}
```

### B.2 Semantics over the quilt-chrono ledger

- **Streams.** A stream is `(t_i, V_i)` sampled from ledger entries: state writes
  via the `stateAt` replay discipline (`src/projection.js`), flows via their
  declared field. `t` is `seq` (event time, default) or `ts_utc` (wall time).
- **`rate`** — backward difference: `rate(t_i) = (V_i − V_{i−w}) / w` over the
  last `w` *samples* (after `nulls` policy), in units of V per sample (or per
  ms for `unit: "ts"`). Deadband law: `|ΔV| < deadband → 0` exactly.
- **`accum`** — integral of the stream over `(t1, t2]`: last-known-value
  trapezoid, `Σ V̄_i · Δt_i`; for flow streams, the directional sum of declared
  amounts (pushes +, pulls −).
- **`lag`** — `argmax over k ∈ 0..max_lag` of Pearson correlation between
  `V(t−k)` and `W(t)` on overlapping support; `k` is the new object (who follows
  whom, and by how much).
- **Custody law.** Derived values are **never stored as events** (append-only
  ledger purity); they are recomputed from sealed inputs — a chrono seal
  (`src/seal.js`, byte-exact organ checkpoint) covers the prefix, so a derived
  cell inherits custody without a new signature format.
- **Incremental law (round C's O(N) hit, answered by construction).** Every
  operator is a fold; folds keep partials keyed `(cell, op, window, last_seq)`.
  The partial is an *observation* (a cache), not a transition — it never appears
  in the ledger, and any recompute from genesis must reproduce it exactly.
- **Late entries.** Entries beyond `lateness_bound` are appended and flagged
  `late`; they never silently fold into already-sealed windows (seals cover a
  prefix; the future is open — this is the same boundary honesty as
  `verifySeal`).

### B.3 Worked examples

**B3.1 — `rate` of the refunder's distress on the real 24-turn battery.**
Stream: refunder joint pre-vectors, `distress` label, turns 10/17/23 real
(`0.42, 0.42, 0.10`), turn 22 the fail-closed fallback (`null`, `nulls: "carry"`):

```json example:B31-rate-distress
{
  "kind": "derived-cell",
  "id": "refunder.distress-velocity",
  "sheet": "corner-store-storefront",
  "v": 1,
  "source": {"ref": "refunder.joint.prevector.distress", "ledger": "runs/live-session-2.jsonl", "nulls": "carry"},
  "op": "rate",
  "params": {"window": {"unit": "seq", "len": 2}, "deadband": 0.04},
  "storage": "never-stored",
  "custody": {"law": "recompute-from-sealed-inputs"}
}
```

Evaluated: `rate(T17) = (0.42 − 0.42)/2 = 0` (also below deadband → exactly 0);
`rate(T23) = (0.10 − 0.42)/2 = −0.16` (|Δ|=0.32 > 0.04, a real reading). The
operator sees *deceleration of distress into the first-timer turn* as a cell —
the object, not the limit.

**B3.2 — `accum` of distress exposure over the battery (real numbers).**
Same stream, `op: "accum"`, `(t1, t2] = (turn 5, turn 24]`, `nulls: "carry"`:
samples `(10, 0.42), (17, 0.42), (23, 0.10)` → trapezoid
`0.42×(17−10) + ((0.42+0.10)/2)×(23−17) = 2.94 + 1.56 = 4.50` distress·turns.

```json example:B32-accum-distress
{
  "kind": "derived-cell",
  "id": "refunder.distress-exposure",
  "op": "accum",
  "source": {"ref": "refunder.joint.prevector.distress", "ledger": "runs/live-session-2.jsonl", "nulls": "carry"},
  "params": {"window": {"unit": "seq", "len": 19}},
  "storage": "never-stored",
  "expected": {"value": 4.5, "unit": "distress.turns", "breakdown": {"t10_to_t17": 2.94, "t17_to_t23": 1.56}}
}
```

**B3.3 — `lag`: does escalation follow distress? (labeled SYNTHETIC — the real
battery is too short for stable correlation; a wave-68/69 artifact computes this
over accumulated runs).**

```json example:B33-lag-escalation
{
  "kind": "derived-cell",
  "id": "escalation.follows-distress",
  "op": "lag",
  "source": {"ref": "session.distress-indicator", "ledger": "SYNTHETIC-DEMO", "nulls": "skip"},
  "second": {"ref": "session.escalation-indicator", "ledger": "SYNTHETIC-DEMO", "nulls": "skip"},
  "params": {"window": {"unit": "seq", "len": 7}, "max_lag": 2},
  "storage": "never-stored",
  "v_series": [0, 0, 1, 1, 1, 0, 0],
  "w_series": [0, 0, 0, 1, 1, 1, 0],
  "expected": {"corr_k0": 0.4167, "corr_k1": 1.0, "corr_k2": 0.1667, "argmax_lag": 1, "interpretation": "escalation notices trail distress by exactly one turn"}
}
```

### B.4 Open questions (honest, carried forward)

1. **Event time vs wall time.** Default `unit: "seq"` (turns) is replay-stable;
   wall-time rates conflate operator pauses with dynamics. When is wall time the
   honest choice? (Greeter responsiveness, yes; ruling dynamics, probably not.)
2. **Deadband calibration.** 0.04 is inherited from the vector-spread gate —
   principled for tone labels, arbitrary for latencies/amounts. Per-stream
   deadband law needed (proposal: deadband = k·(stream's own observed jitter));
   round C's falsifier is the acceptance test.
3. **`accum` semantics for vectors.** Accumulating a tone vector component is a
   level integral; accumulating *flows* (refunds out) is directional. One `op`
   with a `mode: level|flow` split, or two ops? (Draft keeps `accum` unified via
   the stream `ref`'s field type.)
4. **Correlation honesty.** Pearson on short, quantized streams (B3.3) is fragile;
   minimum-support rules for `lag` (proposal: n≥8 overlapping pairs before the
   cell reports a lag at all) are unspecified.
5. **Who consumes derived cells?** Freezing a *rate* (freeze on dynamics, not
   levels) would be a v3 — deliberately out of scope here until R2's experiments
   say whether the object earns it.

---

## Adoption checklist for wave-68/69 (what "implemented" means)

- §A: `fact_vector` + `region_key` additive in quilt-storefront `src/vector.js`/
  `src/freeze.js`; `freezingTest` unchanged (compound keys are still keys);
  freeze-report-v2 emitted alongside v1 (append-only); zero-call frozen-path
  assertions extended to compound keys.
- §B: `calculus.js` module consuming quilt-chrono read-only; the three B.3
  predictions as test assertions (rate deadband exactness, accum analytic check,
  lag argmax); an SVG overlay via existing `renderSVG`.
- Both: §5a adjustment records citing this spec file by commit sha.
