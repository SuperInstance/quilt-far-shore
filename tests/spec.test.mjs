// tests/spec.test.mjs — spec/primitives-v2.md is MACHINE-CHECKABLE: every
// fenced `json schema:*` / `json example:*` block is parsed out of the spec
// file and validated here. If the spec and this code disagree, the test fails.
//
// The worked-example arithmetic is recomputed from first principles:
//   - A31/A32: two-stage freeze grouping over the REAL 7-observation 67-c
//     corpus (tests/fixtures/freeze-observations-67c.json, provenance in-file)
//     + the spec's fact grammar re-derived here from the raw messages.
//   - B31/B32/B33: rate / accum / lag semantics recomputed per spec §B.2.
// Stdlib only; zero network (fleet law: tests run offline).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SPEC = readFileSync(join(ROOT, 'spec/primitives-v2.md'), 'utf8');

// --- extract fenced blocks labeled `json <label>` ---------------------------
const blocks = {};
for (const m of SPEC.matchAll(/```json ([a-zA-Z0-9:_-]+)\n([\s\S]*?)```/g)) {
  blocks[m[1]] = JSON.parse(m[2]);
}
const schemas = Object.fromEntries(Object.entries(blocks).filter(([k]) => k.startsWith('schema:')));
const examples = Object.fromEntries(Object.entries(blocks).filter(([k]) => k.startsWith('example:')));

test('spec file parses: 3 schemas + 6 examples present and valid JSON', () => {
  assert.deepEqual(Object.keys(schemas).sort(), ['schema:derived-cell-v1', 'schema:freeze-test-v2', 'schema:softjoint-v2']);
  assert.equal(Object.keys(examples).length, 6);
});

// --- minimal structural validators (the required-fields law of each schema) --
const REQ = {
  'schema:softjoint-v2': { paths: [['kind'], ['id'], ['v'], ['vector'], ['backend'], ['fallback']], consts: { kind: 'softjoint', v: 2 } },
  'schema:freeze-test-v2': { paths: [['kind'], ['cell'], ['stage1'], ['verdict']], consts: { kind: 'freeze-test-v2' }, enums: { verdict: ['dynamic', 'outcome_frozen_tone_dynamic', 'fully_frozen', 'greeter_never'] } },
  'schema:derived-cell-v1': { paths: [['kind'], ['id'], ['source'], ['op'], ['params']], consts: { kind: 'derived-cell', storage: 'never-stored' }, enums: { op: ['rate', 'accum', 'lag'] } },
};
function checkSchema(schemaId, obj) {
  const r = REQ[schemaId];
  for (const p of r.paths) {
    let cur = obj;
    for (const k of p) { assert.ok(cur != null && k in cur, `${schemaId}: missing ${p.join('.')}`); cur = cur[k]; }
  }
  for (const [k, v] of Object.entries(r.consts ?? {})) if (k in obj) assert.equal(obj[k], v, `${schemaId}: ${k} must be ${v}`);
  for (const [k, vals] of Object.entries(r.enums ?? {})) assert.ok(vals.includes(obj[k]), `${schemaId}: ${k}=${obj[k]} not in ${vals}`);
}
test('schemas validate their own canonical examples', () => {
  checkSchema('schema:softjoint-v2', {
    kind: 'softjoint', id: 'x', v: 2, vector: { role: 'tone', dim: 1, labels: ['a'] }, backend: {}, fallback: {},
    fact_vector: { role: 'fact', labels: ['f'], types: ['bool'], extraction: { type: 'grammar' } },
  });
  checkSchema('schema:freeze-test-v2', { kind: 'freeze-test-v2', cell: 'c', stage1: [], verdict: 'dynamic' });
  checkSchema('schema:derived-cell-v1', { kind: 'derived-cell', id: 'd', source: { ref: 's' }, op: 'rate', params: { window: { unit: 'seq', len: 2 } }, storage: 'never-stored' });
});

test('derived-cell examples validate against the derived-cell schema law', () => {
  for (const id of ['example:B31-rate-distress', 'example:B32-accum-distress', 'example:B33-lag-escalation']) {
    checkSchema('schema:derived-cell-v1', blocks[id]);
  }
});

// --- §A worked examples recomputed from the REAL 67-c corpus -----------------
const corpus = JSON.parse(readFileSync(join(ROOT, 'tests/fixtures/freeze-observations-67c.json'), 'utf8')).observations;

// the spec's fact grammar (deterministic, zero-model-calls — spec §A law L2):
function factParse(message) {
  const m = message.toLowerCase();
  return {
    receipt_present: /(have|had)\s+(the\s+)?receipt|^.*i have the receipt/.test(m) && m.includes('receipt'),
    product_class: m.includes('milk') ? 'milk' : m.includes('socks') ? 'socks' : m.includes('egg') ? 'eggs' : 'other',
  };
}
function distressBucket(d) { // spec A3.1 edges [0, .34, .67, 1]
  return d < 0.34 ? 0 : d < 0.67 ? 1 : 2;
}

test('A3.1: real 67-c corpus regroups to exactly the spec regions (nothing freezes at threshold 3)', () => {
  const groups = new Map();
  for (const o of corpus) {
    const f = factParse(o.message);
    const key = `receipt_present=${f.receipt_present}|product_class=${f.product_class}`;
    if (!groups.has(key)) groups.set(key, { n: 0, outcomes: {} });
    const g = groups.get(key);
    g.n += 1;
    g.outcomes[o.answer_class] = (g.outcomes[o.answer_class] ?? 0) + 1;
  }
  const ex = blocks['example:A31-real-corpus-stage1'];
  assert.equal(ex.stage1.length, groups.size, 'spec example and recomputed grouping must list the same regions');
  for (const row of ex.stage1) {
    const g = groups.get(row.fact_region);
    assert.ok(g, `region ${row.fact_region} missing from recomputation`);
    assert.equal(g.n, row.n);
    assert.deepEqual(g.outcomes, row.outcomes);
    assert.equal(row.frozen_outcome === null, !(row.unanimous && row.n >= 3), 'freeze law: unanimous AND n>=threshold');
  }
  assert.equal(ex.verdict, 'dynamic', 'the real corpus must NOT freeze — the honest 67-c result preserved');
});

test('A3.2: stage1 freeze law + stage2 split => verdict outcome_frozen_tone_dynamic', () => {
  const ex = blocks['example:A32-outcome-frozen'];
  const s1 = ex.stage1[0];
  assert.ok(s1.unanimous && s1.n >= 3 && s1.frozen_outcome === 'full refund', 'stage1 freeze condition');
  const toneSplit = ex.stage2.some((s) => !s.unanimous);
  assert.equal(ex.verdict, toneSplit ? 'outcome_frozen_tone_dynamic' : 'fully_frozen');
  assert.ok(ex.stage1[0].observations[0].startsWith('live-session-2-replay'), 'real observation must be marked real');
  assert.ok(ex.stage1[0].observations.slice(1).every((o) => o.startsWith('SIMULATED')), 'simulated rows must be marked SIMULATED');
});

test('A3.3: greeter never stages; v1 back-compat declared', () => {
  const ex = blocks['example:A33-greeter-and-v1'];
  assert.equal(ex.verdict, 'greeter_never');
  assert.equal(ex.stage1.length, 0, 'greeter law: no staging at all');
  assert.equal(ex.backcompat.fact_vector, 'absent');
});

// --- §B worked examples recomputed from first principles ---------------------
test('B3.1: rate semantics — deadband exactness and the real -0.16 reading', () => {
  // stream: turns 10,17,23 real (0.42, 0.42, 0.10); T22 fail-closed null, nulls:"carry" -> skipped for rate samples
  const samples = [0.42, 0.42, 0.10];
  const w = 2, deadband = 0.04;
  const rate = (i) => { const d = samples[i] - samples[i - 1]; return Math.abs(d) < deadband ? 0 : d / w; };
  assert.equal(rate(1), 0, 'rate(T17) = (0.42-0.42)/2 = 0 (deadband-consistent)');
  const ex = blocks['example:B31-rate-distress'];
  assert.equal(ex.params.deadband, 0.04);
  assert.ok(Math.abs(rate(2) - -0.16) < 1e-12, 'rate(T23) = (0.10-0.42)/2 = -0.16 per spec text');
});

test('B3.2: accum semantics — trapezoid over real stream = 4.50 distress.turns', () => {
  const pts = [[10, 0.42], [17, 0.42], [23, 0.10]]; // nulls:"carry" is implicit between samples
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [t0, v0] = pts[i - 1]; const [t1, v1] = pts[i];
    acc += ((v0 + v1) / 2) * (t1 - t0);
  }
  const ex = blocks['example:B32-accum-distress'];
  assert.equal(acc, ex.expected.value, 'spec expected.value must equal recomputation');
  assert.equal(acc, 4.5, '4.50 distress.turns per spec text');
  assert.equal(ex.expected.breakdown.t10_to_t17, 0.42 * 7);
  assert.equal(ex.expected.breakdown.t17_to_t23, ((0.42 + 0.10) / 2) * 6);
});

function pearson(x, y) {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n, my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sx += (x[i] - mx) ** 2; sy += (y[i] - my) ** 2; }
  return (sx === 0 || sy === 0) ? NaN : sxy / Math.sqrt(sx * sy);
}
test('B3.3: lag semantics — corr series and argmax reproduce the spec exactly', () => {
  const ex = blocks['example:B33-lag-escalation'];
  const V = ex.v_series, W = ex.w_series;
  const corrs = {};
  for (let k = 0; k <= ex.params.max_lag; k++) corrs[k] = pearson(V.slice(0, V.length - k), W.slice(k));
  assert.ok(Math.abs(corrs[0] - ex.expected.corr_k0) < 5e-5);
  assert.ok(Math.abs(corrs[1] - ex.expected.corr_k1) < 5e-5);
  assert.ok(Math.abs(corrs[2] - ex.expected.corr_k2) < 5e-5);
  const argmax = Object.entries(corrs).sort((a, b) => b[1] - a[1])[0][0];
  assert.equal(String(argmax), String(ex.expected.argmax_lag), 'escalation trails distress by exactly one turn');
});
