// tests/r2-calculus.test.mjs — R2's registered predictions as test assertions
// (REVERSE-ACTUALIZE.md R2 artifact law; spec/primitives-v2.md §B.3 examples).
// Run: node --test tests/r2-calculus.test.mjs   — zero model calls, zero network.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

import {
  rate, accum, lag, conservation, Fold, rateStep, flowAccumStep, deepEqual,
  turnLatencyStream, refunderDistressStream, DEADBAND_EPSILON as EPS,
} from '../src/calculus.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STORE = path.join(ROOT, '..', 'quilt-storefront');

// ---- registered prediction 1: deadband exactness (spec B.2 law verbatim) ----
test('P1a: rate over a constant stream is exactly 0 within 1e-9 for every window', () => {
  const s = Array.from({ length: 64 }, (_, i) => ({ t: i + 1, v: 0.5 }));
  for (const w of [1, 2, 4]) {
    const vals = rate(s, { window: w }).map((r) => r.value).filter((v) => v !== null); // warmup has no backward window (spec B.2)
    assert.ok(vals.length > 0 && vals.every((v) => Math.abs(v) <= 1e-9), `window ${w}`);
  }
});
test('P1b: with injected jitter ±ε/2 it stays 0 (deadband works)', () => {
  const s = Array.from({ length: 64 }, (_, i) => ({ t: i + 1, v: 0.5 + (i % 2 === 1 ? EPS / 2 : 0) }));
  for (const w of [1, 2, 4]) {
    const vals = rate(s, { window: w }).map((r) => r.value).filter((v) => v !== null);
    assert.ok(vals.length > 0 && vals.every((v) => v === 0), `window ${w}`);
  }
});
test('P1c: with jitter ±2ε it oscillates — the honest sensitivity boundary', () => {
  const s = Array.from({ length: 64 }, (_, i) => ({ t: i + 1, v: 0.5 + (i % 2 === 0 ? -2 * EPS : 2 * EPS) }));
  assert.ok([1, 2, 4].some((w) => rate(s, { window: w }).some((r) => r.value !== null && r.value !== 0)));
});

// ---- registered prediction 2: accum sinusoid vs analytic within 1% ----
test('P2: accum over a synthetic sinusoid matches the analytic integral within 1% (support-matched; the sealed ∫_4^20 comparator is receipted PENDING in results/R2.json — pre-run window mis-declaration, claims untouched)', () => {
  const s = Array.from({ length: 24 }, (_, i) => ({ t: i + 1, v: 0.5 + 0.5 * Math.sin((2 * Math.PI * i) / 24) }));
  const a = accum(s, { window: { t1: 4, t2: 20 }, mode: 'level' });
  // spec-B3.2-faithful support: segments between consecutive in-window samples → [5,20]
  const analytic = 0.5 * 15 + 0.5 * (24 / (2 * Math.PI)) * (Math.cos((2 * Math.PI * 4) / 24) - Math.cos((2 * Math.PI * 19) / 24));
  assert.ok(Math.abs(a.value - analytic) / Math.abs(analytic) < 0.01, `accum=${a.value} analytic=${analytic}`);
});

// ---- spec §B.3 worked examples through the SAME operators ----
test('B3.1/B3.2: rate(T17)=0, rate(T23)=−0.16, accum(5,24]=4.50 on the registered distress samples', () => {
  const s = [{ t: 10, v: 0.42 }, { t: 17, v: 0.42 }, { t: 23, v: 0.1 }]; // spec B3.1's declared samples
  const r = rate(s, { window: 2, deadband: EPS, nulls: 'carry' });
  assert.equal(r.find((x) => x.t === 17).value, 0);
  assert.ok(Math.abs(r.find((x) => x.t === 23).value - (-0.16)) < 1e-9);
  const a = accum(s, { window: { t1: 5, t2: 24 }, mode: 'level' });
  assert.ok(Math.abs(a.value - 4.5) < 1e-9);
  assert.ok(Math.abs(a.breakdown[0].seg - 2.94) < 1e-9 && Math.abs(a.breakdown[1].seg - 1.56) < 1e-9);
});
test('B3.3: lag argmax over the spec series → corr_k1 = 1.0, argmax_lag = 1', () => {
  const l = lag(
    [0, 0, 1, 1, 1, 0, 0].map((v, i) => ({ t: i + 1, v })),
    [0, 0, 0, 1, 1, 1, 0].map((v, i) => ({ t: i + 1, v })),
    { maxLag: 2 },
  );
  assert.equal(l.argmax_lag, 1);
  assert.ok(Math.abs(l.corrs.find((c) => c.k === 1).corr - 1.0) < 1e-9);
});

// ---- conservation (P4a): d/dt of the integral == the original flow ----
test('conservation: rate_1(accum(f)) == f exactly on a synthetic flow', () => {
  const pat = [1, -1, 2, 0, -3, 1];
  const f = Array.from({ length: 24 }, (_, i) => ({ t: i + 1, v: pat[i % pat.length] }));
  const c = conservation(f);
  assert.equal(c.holds, true, JSON.stringify(c));
});

// ---- custody law (P4c): incremental partial == recompute-from-genesis ----
test('custody: incremental fold partials equal recompute-from-genesis (observation, never transition)', () => {
  const s = Array.from({ length: 12 }, (_, i) => ({ t: i + 1, v: Math.sin(i) }));
  const inc = new Fold('c', 'rate', { window: { unit: 'seq', len: 2 } }, rateStep);
  for (const x of s) inc.append(x);
  const rec = Fold.recompute('c', 'rate', { window: { unit: 'seq', len: 2 } }, rateStep, s);
  assert.ok(deepEqual(inc.partial, rec.partial) && deepEqual(inc.observations, rec.observations));
});

// ---- REAL wave-67 data: the decisive stream facts (P3's substrate) ----
test('real battery: distress stream reproduces spec B3.1 readings; latency stream carries incidents', async () => {
  const { refunderPreVector } = await import(path.join(STORE, 'src', 'vector.js'));
  const rows = fs.readFileSync(path.join(STORE, 'runs', 'live-session-2.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(rows.length, 24);
  const dis = refunderDistressStream(rows, refunderPreVector, { nulls: 'carry' });
  const vals = dis.map((s) => s.v);
  assert.deepEqual(vals, [0.42, 0.42, 0.42, 0.1]); // T10, T17, T22(carried), T23 — spec B3.1's stream on real data
  const lat = turnLatencyStream(rows);
  assert.equal(lat.find((s) => s.t === 6).v, 5344);
  assert.equal(lat.find((s) => s.t === 13).v, 4865);
  assert.equal(lat.find((s) => s.t === 22).v, 4617);
});
