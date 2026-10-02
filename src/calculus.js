// src/calculus.js — R2: DERIVED CELLS OVER REAL LEDGERS (wave 71-d-r2).
//
// Runs REVERSE-ACTUALIZE.md R2 verbatim (prereg fleet-seeds seeds/preregister-71d.json,
// claimsHash sha256:17f0019d…, sealed+pushed e0c8709 BEFORE any execution):
//   rate / accum / lag as ONE pure module; deadband ε=0.04 (the isDegenerate
//   spread<0.04 law, quilt-storefront src/vector.js); incremental partials keyed
//   (cell, op, window, seq) — an observation (cache), never a transition;
//   consuming quilt-chrono's ledger API read-only (src/ledger.js loadLedger,
//   the prefix-fold discipline); run on REAL wave-67 data (the 24-turn battery's
//   per-turn vectors and latencies, runs/live-session-2.jsonl) + the chrono
//   dogfood ledger (examples/tide/outputs/ledger.jsonl). Moth: NOT used (the
//   registered 0–1 optional job is left unspent — zero-call channel kept zero-call).
// Semantics are spec/primitives-v2.md §B.2 verbatim. Artifact mapping receipted:
//   REVERSE-ACTUALIZE names calculus.js + tests + a projection overlay via the
//   existing renderSVG; this lane writes src/calculus.js, tests/r2-calculus.test.mjs,
//   results/R2.json, results/r2-overlay.svg.
// ZERO external model calls (pure local computation over existing ledgers).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const STORE = path.join(ROOT, '..', 'quilt-storefront');
const CHRONO = path.join(ROOT, '..', 'quilt-chrono');
export const DEADBAND_EPSILON = 0.04; // the registered isDegenerate spread law

// ---------------------------------------------------------------------------
// Streams — (t_i, V_i) sampled read-only from ledgers (spec B.2 "Streams")
// ---------------------------------------------------------------------------
export function turnLatencyStream(rows) {
  // S_latency: per-turn turn_ms — every turn of the battery carries it.
  return rows.map((r) => ({ t: r.turn, v: typeof r.turn_ms === 'number' ? r.turn_ms : 0 }));
}

export function refunderDistressStream(rows, refunderPreVector, { nulls = 'carry' } = {}) {
  // S_distress: refunder.joint rows' refunderPreVector(message).distress —
  // spec B3.1's registered stream ("refunder.joint.prevector.distress",
  // nulls: "carry"); turn 22 is the fail-closed fallback → reading null.
  const out = [];
  let last = null;
  for (const r of rows) {
    if (!String(r.route || '').includes('refunder')) continue;
    const failed = r.answer_source === 'fallback' || r.answer_source === 'fail-closed';
    let v = failed ? null : refunderPreVector(r.message).distress;
    if (v === null || v === undefined) {
      if (nulls === 'carry' && last !== null) { out.push({ t: r.turn, v: last, carried: true }); continue; }
      else if (nulls === 'carry') { out.push({ t: r.turn, v: null, carried: false }); continue; }
      else { continue; } // nulls: "skip"
    } else {
      last = v;
    }
    out.push({ t: r.turn, v, carried: false });
  }
  return out;
}

export function turnCostFlowStream(rows) {
  // REAL flow: per-turn usage.estimated_cost (spend flows out per turn; rule
  // turns spend 0). Flow-mode accum over this = cumulative spend.
  return rows.map((r) => ({ t: r.turn, v: r.usage?.estimated_cost ?? 0 }));
}

// ---------------------------------------------------------------------------
// Operators — spec B.2 verbatim. Every operator is a fold (Incremental law).
// ---------------------------------------------------------------------------
function applyNulls(samples, nulls) {
  const out = [];
  let last = null;
  for (const s of samples) {
    let v = s.v;
    if (v === null || v === undefined) {
      if (nulls === 'skip') continue;
      v = last; // carry: hold last-known-value
      if (v === null || v === undefined) continue; // nothing known yet → no reading
    } else {
      last = v;
    }
    out.push({ t: s.t, v });
  }
  return out;
}

export function rate(samples, { window = 2, deadband = DEADBAND_EPSILON, nulls = 'carry' } = {}) {
  // Spec B.2 verbatim + its own worked example B3.1 as the authoritative reading:
  // rate(t_i) = (V_i − V_{i−w}) / w — V at w TIME units back, last-known-value
  // carried over gaps (B3.1: rate(T17) = (V(17) − V(15))/2 = 0 with V(15) carried
  // from T10; rate(T23) = (0.10 − 0.42)/2 = −0.16). A reading exists iff a known
  // value exists at or before t−w (warmup → null, the honest no-history case).
  const s = applyNulls(samples, nulls);
  const out = [];
  let back = null; // last known value at or before t−w, advanced as t moves
  let bi = 0;
  for (let i = 0; i < s.length; i++) {
    while (bi < s.length && s[bi].t <= s[i].t - window) { back = s[bi]; bi++; }
    if (!back) { out.push({ t: s[i].t, value: null, flagged: false }); continue; }
    const dV = s[i].v - back.v;
    const value = Math.abs(dV) < deadband ? 0 : dV / window; // |ΔV| < deadband → 0 exactly
    out.push({ t: s[i].t, value, delta: dV, back_t: back.t });
  }
  return out;
}

export function accum(samples, { window: { t1, t2 }, mode = 'level', nulls = 'carry' } = {}) {
  if (mode === 'flow') {
    // directional sum of declared amounts in (t1, t2] (pushes +, pulls −)
    let sum = 0;
    const parts = [];
    for (const s of samples) {
      if (s.t > t1 && s.t <= t2 && typeof s.v === 'number') { sum += s.v; parts.push({ t: s.t, amount: s.v }); }
    }
    return { value: sum, parts, unit: 'flow' };
  }
  // level: last-known-value trapezoid over consecutive in-window samples.
  // Spec-B3.2-faithful: only REAL readings integrate (nulls are absent samples,
  // the trapezoid spans across them — its own worked example sums 10→17→23 =
  // 4.50 with no carried sample at the fail-closed turn); carry lives in rate.
  const s = samples.filter((x) => typeof x.v === 'number' && !x.carried && x.t > t1 && x.t <= t2); // real readings only — carried observations are rate's law, not the integral's (spec B3.2 arithmetic)
  let value = 0;
  const breakdown = [];
  for (let i = 1; i < s.length; i++) {
    const seg = ((s[i - 1].v + s[i].v) / 2) * (s[i].t - s[i - 1].t);
    value += seg;
    breakdown.push({ from: s[i - 1].t, to: s[i].t, seg });
  }
  return { value, breakdown, unit: 'level' };
}

function pearson(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let cov = 0, vx = 0, vy = 0;
  for (let i = 0; i < n; i++) { cov += (xs[i] - mx) * (ys[i] - my); vx += (xs[i] - mx) ** 2; vy += (ys[i] - my) ** 2; }
  if (vx === 0 || vy === 0) return null;
  return cov / Math.sqrt(vx * vy);
}

export function lag(vSamples, wSamples, { maxLag = 2, minSupport = 0, nulls = 'skip' } = {}) {
  const v = applyNulls(vSamples, nulls);
  const w = applyNulls(wSamples, nulls);
  const byT = new Map(w.map((s) => [s.t, s.v]));
  const corrs = [];
  for (let k = 0; k <= maxLag; k++) {
    const xs = [], ys = [];
    for (const s of w) {
      const prev = v.find((x) => x.t === s.t - k);
      if (prev && prev.v !== null) { xs.push(prev.v); ys.push(s.v); }
    }
    const c = pearson(xs, ys);
    corrs.push({ k, corr: c, support: xs.length, reported: xs.length >= Math.max(minSupport, 2) && c !== null });
  }
  let argmax = null, best = -Infinity;
  for (const c of corrs) {
    if (c.reported && c.corr !== null && c.corr > best) { best = c.corr; argmax = c.k; }
  }
  return { corrs, argmax_lag: argmax };
}

// ---------------------------------------------------------------------------
// Incremental law — partials keyed (cell, op, window, last_seq). The partial is
// an observation (cache), never a transition: recompute-from-genesis equality
// is the custody test (P4c).
// ---------------------------------------------------------------------------
export class Fold {
  constructor(cell, op, params, stepFn) {
    this.key = `${cell}|${op}|${JSON.stringify(params.window ?? {})}`;
    this.params = params; this.stepFn = stepFn;
    this.lastSeq = null; this.partial = null; this.observations = [];
  }
  append(sample) {
    this.lastSeq = sample.t;
    this.partial = this.stepFn(this.partial, sample, this.params);
    this.observations.push({ seq: sample.t, partial: deepCopy(this.partial) });
    return this.partial;
  }
  static recompute(cell, op, params, stepFn, samples) {
    const f = new Fold(cell, op, params, stepFn);
    for (const s of samples) f.append(s);
    return f;
  }
}
export function deepCopy(x) { return JSON.parse(JSON.stringify(x === undefined ? null : x)); }
export function deepEqual(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

// rate fold-step: backward difference over the last w samples with deadband
export function rateStep(partial, sample, { window = 2, deadband = DEADBAND_EPSILON } = {}) {
  const buf = (partial?.buf ?? []).concat([{ t: sample.t, v: sample.v }]).slice(-(window + 1));
  if (buf.length < window + 1) return { buf, value: null };
  const dV = buf[buf.length - 1].v - buf[0].v;
  return { buf, value: Math.abs(dV) < deadband ? 0 : dV / window, delta: dV };
}
// flow-accum fold-step: directional running sum
export function flowAccumStep(partial, sample) {
  return { total: (partial?.total ?? 0) + (typeof sample.v === 'number' ? sample.v : 0) };
}

// ---------------------------------------------------------------------------
// Conservation (mission-directed, preregistered as P4a): d/dt of the integral
// == the original flow, exactly, for flow-mode accum.
// ---------------------------------------------------------------------------
export function conservation(flowSamples, { deadband = 0 } = {}) {
  const flow = flowSamples.filter((s) => typeof s.v === 'number');
  let running = 0;
  const integral = flow.map((s) => { running += s.v; return { t: s.t, v: running }; });
  const d = rate(integral, { window: 1, deadband, nulls: 'skip' });
  let maxErr = 0, worst = null;
  for (let i = 1; i < d.length; i++) {
    const err = Math.abs((d[i].value ?? NaN) - flow[i].v);
    if (!(err <= 1e-9)) { if (err > (worst?.err ?? -1)) worst = { t: flow[i].t, err }; }
    if (err > maxErr) maxErr = err;
  }
  return { holds: maxErr <= 1e-9, maxErr, worst, n: flow.length };
}

// ---------------------------------------------------------------------------
// Detectors (fixed pre-run in the sealed claims — P3)
// ---------------------------------------------------------------------------
export function thresholdAlarm(stream, { k = 2 } = {}) {
  // plain level alarm: V(t) > k × mean(nonzero values of the stream)
  const nz = stream.filter((s) => typeof s.v === 'number' && s.v !== 0).map((s) => s.v);
  const mean = nz.reduce((a, b) => a + b, 0) / nz.length;
  const thr = k * mean;
  const flags = stream.filter((s) => typeof s.v === 'number' && s.v > thr).map((s) => s.t);
  return { threshold: thr, mean_nonzero: mean, flags };
}

export function derivativeFlags(rateOut, { within = 0 } = {}) {
  return rateOut.filter((r) => r.value !== null && Math.abs(r.value) > 0).map((r) => r.t);
}

// ---------------------------------------------------------------------------
// chrono read-only consumption (design: "consuming quilt-chrono's ledger API
// read-only (src/ledger.js …)"; P4d dogfood ledger)
// ---------------------------------------------------------------------------
export async function chronoDogfood() {
  const ledgerFile = path.join(CHRONO, 'examples', 'tide', 'outputs', 'ledger.jsonl');
  const shaBefore = crypto.createHash('sha256').update(fs.readFileSync(ledgerFile)).digest('hex');
  const { loadLedger } = await import(path.join(CHRONO, 'src', 'ledger.js'));
  const ledger = loadLedger(ledgerFile);
  const entries = ledger.entries ?? [];
  // flow-ish reads: every entry's numeric value per cell as a read-only stream
  const cells = {};
  for (const e of entries) {
    if (e.op !== 'write' || typeof e.value !== 'number') continue;
    (cells[e.cell] ??= []).push({ t: e.seq, v: e.value });
  }
  const probe = {};
  for (const [cell, stream] of Object.entries(cells)) {
    if (stream.length < 2) continue;
    probe[cell] = {
      n: stream.length,
      rateSample: rate(stream, { window: 2 }).slice(-1)[0] ?? null,
      accumFull: accum(stream, { window: { t1: -1, t2: Infinity }, mode: 'level' }).value,
    };
  }
  const shaAfter = crypto.createHash('sha256').update(fs.readFileSync(ledgerFile)).digest('hex');
  return { ledgerFile, entries: entries.length, cells: Object.keys(cells).length, probe, shaBefore, shaAfter, readonly: shaBefore === shaAfter };
}

export { ROOT, STORE, CHRONO };

// ---------------------------------------------------------------------------
// Runner — node src/calculus.js executes the SEALED protocol → results/R2.json
// + results/r2-overlay.svg (projection overlay via quilt-chrono renderSVG).
// ---------------------------------------------------------------------------
export function isMain(importMeta) {
  try { return importMeta && importMeta.url && process.argv[1] && url.pathToFileURL(process.argv[1]).href === importMeta.url; } catch { return false; }
}

if (isMain(import.meta)) {
  const { refunderPreVector } = await import(path.join(STORE, 'src', 'vector.js'));
  const rows = fs.readFileSync(path.join(STORE, 'runs', 'live-session-2.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  const at = new Date().toISOString();
  const eps = DEADBAND_EPSILON;
  const results = { kind: 'r2-calculus-receipt', wave: '71-d-r2', at_utc: at, design: 'REVERSE-ACTUALIZE.md R2 (run verbatim; prereg seeds/preregister-71d.json, claimsHash sha256:17f0019d…)', zero_model_calls: true, streams: {}, metrics: {}, detail: {} };

  // ---- P1: deadband exactness (registered prediction 1) ----
  const constStream = Array.from({ length: 64 }, (_, i) => ({ t: i + 1, v: 0.5 }));
  const J1 = constStream.map((s, i) => ({ t: s.t, v: 0.5 + (i % 2 === 1 ? eps / 2 : 0) }));        // s alternating 0,+1 → |ΔV| = ε/2
  const J2 = constStream.map((s, i) => ({ t: s.t, v: 0.5 + (i % 2 === 0 ? -2 * eps : 2 * eps) })); // s alternating −2,+2 → |ΔV| = 4ε
  const winAll = [1, 2, 4];
  const defined = (out) => out.map((r) => r.value).filter((v) => v !== null); // warmup samples have no backward window yet (spec B.2 needs i−w history)
  const p1const = winAll.every((w) => { const v = defined(rate(constStream, { window: w })); return v.length > 0 && v.every((x) => Math.abs(x) <= 1e-9); });
  const p1half = winAll.every((w) => { const v = defined(rate(J1, { window: w })); return v.length > 0 && v.every((x) => x === 0); });
  const p1double = winAll.some((w) => rate(J2, { window: w }).some((r) => r.value !== null && r.value !== 0));
  results.metrics.p1_constant_zero = p1const ? 1 : 0;
  results.metrics.p1_half_jitter_zero = p1half ? 1 : 0;
  results.metrics.p1_double_jitter_oscillates = p1double ? 1 : 0;
  results.metrics.p1_deadband_holds = p1const && p1half && p1double ? 1 : 0;
  results.detail.p1 = { epsilon: eps, constant_windows: winAll, J2_sample_rates: rate(J2, { window: 2 }).filter((r) => r.value).slice(0, 4) };

  // ---- P2: sinusoid accum vs analytic (registered prediction 2) ----
  // SEALED-DECLARATION DISCREPANCY discovered at run time, receipted here and
  // scored PENDING per the claim's own refusal branch ("If the stream or window
  // is found mis-declared, PENDING with the discrepancy receipted"): the sealed
  // analytic ∫_4^20 spans 16 time units, but the spec-B3.2-faithful trapezoid
  // (its own worked example counts ONLY segments between consecutive in-window
  // samples — nothing before the first, nothing after the last) integrates [5,20]
  // = 15 units. The unit mismatch alone exceeds 1%. Both numbers below; the
  // sealed comparator is NOT re-scored (no threshold surgery — claims untouched).
  const sinStream = Array.from({ length: 24 }, (_, i) => ({ t: i + 1, v: 0.5 + 0.5 * Math.sin((2 * Math.PI * i) / 24) }));
  const acc = accum(sinStream, { window: { t1: 4, t2: 20 }, mode: 'level' });
  const analyticSealed = 0.5 * (20 - 4) + 0.5 * (24 / (2 * Math.PI)) * (Math.cos((2 * Math.PI * 3) / 24) - Math.cos((2 * Math.PI * 19) / 24)); // ∫_4^20, as sealed
  const support = [5, 20]; // (t1,t2] → first in-window sample 5, last 20 → support [5,20]
  const analyticSupport = 0.5 * (support[1] - support[0]) + 0.5 * (24 / (2 * Math.PI)) * (Math.cos((2 * Math.PI * (support[0] - 1)) / 24) - Math.cos((2 * Math.PI * (support[1] - 1)) / 24)); // ∫_5^20
  const relSealed = Math.abs(acc.value - analyticSealed) / Math.abs(analyticSealed);
  const relSupport = Math.abs(acc.value - analyticSupport) / Math.abs(analyticSupport);
  results.metrics.p2_sinusoid_relerr_sealed_window = relSealed; // receipted, not scored
  results.metrics.p2_sinusoid_relerr_support_matched = relSupport; // receipted, not scored
  // metrics.p2_sinusoid_within_1pct deliberately ABSENT → PENDING (the sealed branch)
  results.detail.p2 = { accum: acc.value, analyticSealed, analyticSupport, relSealed, relSupport, pending_reason: 'sealed analytic window (4,20] = 16 units vs spec-B3.2-faithful trapezoid support [5,20] = 15 units — window mis-declared pre-run; PENDING per the sealed refusal branch, claims untouched, both errors receipted' };

  // ---- P3: decisive out-detect on the REAL battery (registered prediction 3) ----
  const INCIDENTS = [6, 13, 22]; // R3-receipted exact positions: greeter silences T6/T13, refunder fail-closed T22
  const withinWindow = (flag, onset) => Math.abs(flag - onset) <= 2;
  const latStream = turnLatencyStream(rows);
  const disStream = refunderDistressStream(rows, refunderPreVector, { nulls: 'carry' });
  const latRate = derivativeFlags(rate(latStream, { window: 2, deadband: eps }));
  const disRate = derivativeFlags(rate(disStream, { window: 2, deadband: eps }));
  const latThr = thresholdAlarm(latStream, { k: 2 });
  const disThr = thresholdAlarm(disStream, { k: 2 });
  const flaggedByDerivative = INCIDENTS.filter((onset) => latRate.some((f) => withinWindow(f, onset)) || disRate.some((f) => withinWindow(f, onset)));
  const flaggedByThreshold = INCIDENTS.filter((onset) => latThr.flags.some((f) => withinWindow(f, onset)) || disThr.flags.some((f) => withinWindow(f, onset)));
  results.metrics.p3_derivative_flags = flaggedByDerivative.length;
  results.metrics.p3_threshold_flags = flaggedByThreshold.length;
  results.metrics.p3_derivative_outdetects = flaggedByDerivative.length === 3 && flaggedByThreshold.length === 0 ? 1 : 0;
  results.detail.p3 = {
    incidents: INCIDENTS, latency_threshold: latThr.threshold, distress_threshold: disThr.threshold,
    derivative_flags_latency: latRate, derivative_flags_distress: disRate,
    threshold_flags_latency: latThr.flags, threshold_flags_distress: disThr.flags,
    derivative_flagged_incidents: flaggedByDerivative, threshold_flagged_incidents: flaggedByThreshold,
    distress_stream_real_readings: disStream,
  };

  // ---- P4: conservation + registered examples + custody + chrono read-only ----
  const synthPattern = [1, -1, 2, 0, -3, 1];
  const synthFlow = Array.from({ length: 24 }, (_, i) => ({ t: i + 1, v: synthPattern[i % synthPattern.length] }));
  const costFlow = turnCostFlowStream(rows);
  const cSynth = conservation(synthFlow);
  const cCost = conservation(costFlow);
  results.metrics.p4_conservation = cSynth.holds && cCost.holds ? 1 : 0;

  // spec §B.3 examples through the SAME operators
  const b31 = rate(disStream, { window: 2, deadband: eps });
  const r17 = b31.find((r) => r.t === 17)?.value;
  const r23 = b31.find((r) => r.t === 23)?.value;
  const b32 = accum(disStream, { window: { t1: 5, t2: 24 }, mode: 'level' });
  const b33 = lag(
    [0, 0, 1, 1, 1, 0, 0].map((v, i) => ({ t: i + 1, v })),
    [0, 0, 0, 1, 1, 1, 0].map((v, i) => ({ t: i + 1, v })),
    { maxLag: 2 },
  );
  const specExamplesOk =
    r17 === 0 && Math.abs(r23 - (-0.16)) < 1e-9 &&
    Math.abs(b32.value - 4.5) < 1e-9 &&
    b33.argmax_lag === 1 && Math.abs(b33.corrs.find((c) => c.k === 1).corr - 1.0) < 1e-9;
  results.metrics.p4_spec_examples = specExamplesOk ? 1 : 0;
  results.detail.p4_examples = { rate_T17: r17, rate_T23: r23, accum_5_24: b32.value, breakdown: b32.breakdown, lag: b33 };

  // custody: incremental fold == recompute-from-genesis on every stream
  let custodyOk = true;
  for (const [name, stream] of [['S_latency', latStream], ['S_distress', disStream], ['S_cost_flow', costFlow], ['synth_flow', synthFlow]]) {
    const inc = new Fold(name, 'rate', { window: { unit: 'seq', len: 2 } }, rateStep);
    for (const s of stream) inc.append(s);
    const rec = Fold.recompute(name, 'rate', { window: { unit: 'seq', len: 2 } }, rateStep, stream);
    if (!deepEqual(inc.partial, rec.partial) || !deepEqual(inc.observations, rec.observations)) custodyOk = false;
    const incF = new Fold(name, 'accum-flow', { window: { unit: 'seq', len: 1 } }, flowAccumStep);
    for (const s of stream) incF.append(s);
    const recF = Fold.recompute(name, 'accum-flow', { window: { unit: 'seq', len: 1 } }, flowAccumStep, stream);
    if (!deepEqual(incF.partial, recF.partial)) custodyOk = false;
  }
  results.metrics.p4_custody_incremental_eq_genesis = custodyOk ? 1 : 0;

  const chrono = await chronoDogfood();
  results.metrics.p4_chrono_readonly = chrono.readonly ? 1 : 0;
  results.detail.chrono_dogfood = chrono;

  results.metrics.p4_conservation_and_examples =
    results.metrics.p4_conservation === 1 && results.metrics.p4_spec_examples === 1 &&
    results.metrics.p4_custody_incremental_eq_genesis === 1 && results.metrics.p4_chrono_readonly === 1 ? 1 : 0;

  // ---- artifact: projection overlay via the EXISTING renderSVG ----
  try {
    const { renderSVG } = await import(path.join(CHRONO, 'src', 'projection.js'));
    const pseudoLedger = {
      entries: rows.flatMap((r) => {
        const es = [{ seq: r.turn, ts_utc: r.at_utc, op: 'write', cell: 'latency.ms', value: r.turn_ms ?? 0, by: 'battery', cause: 'init', pushed: false, flow_id: null, edge: null, corrects: null }];
        const dv = disStream.find((s) => s.t === r.turn);
        if (dv) es.push({ seq: r.turn, ts_utc: r.at_utc, op: 'write', cell: 'refunder.distress', value: dv.v ?? 0, by: 'battery', cause: 'init', pushed: false, flow_id: null, edge: null, corrects: null });
        return es;
      }),
    };
    let svg;
    try { svg = renderSVG(pseudoLedger, 1, 24, { title: 'R2 overlay — wave-67 battery: per-turn latency + refunder distress (rate cells in results/R2.json)' }); }
    catch { svg = renderSVG(pseudoLedger, { seq: 1, ts: null }, { seq: 24 }, { title: 'R2 overlay — wave-67 battery' }); }
    fs.writeFileSync(path.join(ROOT, 'results', 'r2-overlay.svg'), svg);
    results.detail.overlay = { file: 'results/r2-overlay.svg', via: 'quilt-chrono src/projection.js renderSVG', bytes: svg.length };
  } catch (e) {
    results.detail.overlay = { error: String(e && e.message || e) };
  }

  // scorer conformance (fleet-seeds preregister@1): dotted metric paths resolve
  // INSIDE the metrics view → results.metrics = { metrics: {…} } (69-d precedent)
  results.metrics = { metrics: { ...results.metrics } };
  fs.writeFileSync(path.join(ROOT, 'results', 'R2.json'), JSON.stringify(results, null, 2) + '\n');
  console.log(JSON.stringify(results.metrics));
  console.log('P3 detail:', JSON.stringify(results.detail.p3));
  console.log('overlay:', JSON.stringify(results.detail.overlay));
}
