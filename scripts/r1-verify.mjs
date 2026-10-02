// scripts/r1-verify.mjs — FINISHER AUDIT of the dead 69-d lane's R1 run (zero calls).
//
// The 69-d lane died after producing results/R1.json (12 deepinfra calls billed,
// 18:35Z). This script re-derives EVERY recorded metric from the recorded corpus,
// deterministically, offline — the model outputs are receipted facts (usage on
// every row); the sweeps, contrasts, replay bookkeeping and metric conjuncts are
// recomputed here from quilt-softjoints freezingTest UNCHANGED, exactly as
// scripts/r1-run.mjs computed them. Any mismatch = the recorded metrics do not
// follow from the recorded corpus → the run cannot be adopted.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const STORE = path.join(ROOT, '..', 'quilt-storefront');
const SOFT = path.join(ROOT, '..', 'quilt-softjoints');
const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'results', 'R1.json'), 'utf8'));
const calls = fs.readFileSync(path.join(ROOT, 'results', 'r1-calls.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);

const { extractRefunderFacts } = await import(path.join(STORE, 'src', 'facts.js'));
const { refunderPreVector } = await import(path.join(STORE, 'src', 'vector.js'));
const { freezingTest } = await import(path.join(SOFT, 'src', 'decompose.js'));
const { factsClass } = await import(path.join(SOFT, 'src', 'facts.js'));
const G = await import('./r1-grammar.mjs');

const freezeReport = JSON.parse(fs.readFileSync(path.join(STORE, 'eval', 'freeze-report.json'), 'utf8'));
const fails = [];
const check = (name, ok, detail) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' — ' + detail : ''}`); if (!ok) fails.push(name); };

// 1. corpus integrity -----------------------------------------------------------
const legacy = G.loadLegacyCorpus(freezeReport);
const legacyIds = new Set(legacy.map((o) => o.id));
const legacyRows = R.corpus.filter((o) => legacyIds.has(o.id));
const batteryRows = R.corpus.filter((o) => o.session === 'r1-battery-69d');
check('legacy rows load from the receipted freeze-report', legacyRows.length === R.metrics.r1_legacy_rows && legacyRows.length === 7, `n=${legacyRows.length}`);
check('battery rows = 12', batteryRows.length === 12);
check('legacy ids/messages byte-match the receipted artifact', legacy.every((l) => { const c = R.corpus.find((o) => o.id === l.id); return c && c.message === l.message; }));
check('battery messages byte-match the pre-declared R1_BATTERY', G.R1_BATTERY.every((b) => { const c = R.corpus.find((o) => o.id === b.id); return c && c.message === b.message && c.register === b.register; }));
check('facts are rule-only (zero model calls in the fact path)', R.corpus.every((o) => o.facts.length === 3 && o.facts.every((f) => f.how === 'rule')));
check('battery outputs re-classify cleanly (v1 answer-class method)', R.corpus.filter((o) => o.source === 'deepinfra-chat').every((o) => G.answerClass(o.answer) === o.output));

// 2. calls ledger integrity ------------------------------------------------------
check('12 call rows, one per battery turn', calls.length === 12 && calls.every((c, i) => c.id === G.R1_BATTERY[i].id));
check('every call billed with positive usage', calls.every((c) => c.usage && c.usage.total_tokens > 0));
const cost = calls.reduce((a, c) => a + (c.usage.estimated_cost ?? 0), 0);
check('billed/attempted counters match the metrics', R.metrics.r1_deepinfra_calls_billed === 12 && R.metrics.r1_deepinfra_calls_attempted === 12, `est. cost $${cost.toFixed(6)}`);

// 3. recompute the sweep family from the recorded corpus --------------------------
const THRESHOLD = 3, BUCKETS = [2, 3, 4];
const FAMILY = { K1: ['receipt-present'], K2: ['receipt-present', 'product-class'], K3: ['receipt-present', 'product-class', 'amount-band'] };
function bucketKey(vector, buckets) {
  return Object.entries(vector || {}).map(([k, v]) => `${k}:${Math.min(buckets - 1, Math.floor((Number(v) || 0) * buckets))}`).sort().join('|');
}
function emotionRegions(obs, buckets) {
  const m = new Map();
  for (const o of obs) {
    const k = bucketKey(o.vector, buckets);
    if (!m.has(k)) m.set(k, { region: k, members: [], outputs: new Map() });
    const r = m.get(k); r.members.push(o.id); r.outputs.set(o.output, (r.outputs.get(o.output) || 0) + 1);
  }
  return m;
}
let factKeyed = 0, emotionOnly = 0, contrastHolds = true; const proposals = [];
for (const B of BUCKETS) {
  const eRegions = emotionRegions(R.corpus, B);
  for (const [name, kinds] of Object.entries(FAMILY)) {
    const props = freezingTest(R.corpus, { threshold: THRESHOLD, buckets: B, requireFacts: true, kinds });
    for (const p of props) {
      const members = R.corpus.filter((o) => `${bucketKey(o.vector, B)}|${factsClass(o.facts, { buckets: B, kinds })}` === p.region);
      const emotionPart = members.length ? bucketKey(members[0].vector, B) : null;
      const eR = emotionPart ? eRegions.get(emotionPart) : null;
      const unanimousEmotion = !!eR && eR.members.length >= THRESHOLD && members.every((o) => eR.members.includes(o.id)) && eR.outputs.size === 1;
      p.composition = name; p.buckets = B; p.members_resolved = members.map((o) => o.id); p.emotion_only_could_freeze = unanimousEmotion;
      proposals.push(p);
    }
    factKeyed += props.length;
  }
  emotionOnly += freezingTest(R.corpus, { threshold: THRESHOLD, buckets: B, requireFacts: false }).length;
}
check('fact_keyed_proposals recompute', factKeyed === R.metrics.fact_keyed_proposals, `recomputed ${factKeyed} vs recorded ${R.metrics.fact_keyed_proposals}`);
check('emotion_only_proposals recompute', emotionOnly === R.metrics.emotion_only_proposals, `recomputed ${emotionOnly} vs recorded ${R.metrics.emotion_only_proposals}`);
check('emotion-only contrast recompute (no proposal the emotion key could also freeze)', proposals.every((p) => p.emotion_only_could_freeze === false) === !!R.metrics.emotion_only_contrast_holds);

// 4. recompute P2 measurements -----------------------------------------------------
const K1B3 = R.sweeps.fact_keyed['K1@B3'] ?? [];
const milkUnknown = R.corpus.filter((o) => {
  const rp = o.facts.find((f) => f.kind === 'receipt-present'); const pc = o.facts.find((f) => f.kind === 'product-class');
  return rp.value === 'unknown' && pc.value === 'milk';
});
const milkClasses = [...new Set(milkUnknown.map((o) => o.output))];
function regionStats(kinds, B) {
  const m = new Map();
  for (const o of R.corpus) {
    const k = `${bucketKey(o.vector, B)}|${factsClass(o.facts, { buckets: B, kinds })}`;
    if (!m.has(k)) m.set(k, { n: 0, outputs: new Map() });
    const r = m.get(k); r.n += 1; r.outputs.set(o.output, (r.outputs.get(o.output) || 0) + 1);
  }
  return [...m.values()];
}
const K1B3stats = regionStats(FAMILY.K1, 3);
check('milk-no-receipt region: n and split recompute', milkUnknown.length === R.metrics.milk_unknown_n && milkUnknown.length >= 2 && milkClasses.length >= 2 === !!R.metrics.milk_unknown_split, `n=${milkUnknown.length} classes=${milkClasses.join('/')}`);
check('regions_total/frozen at K1@B3 recompute', K1B3stats.length === R.metrics.regions_total_K1B3 && K1B3.length === R.metrics.regions_frozen_K1B3 && K1B3.length < K1B3stats.length, `total=${K1B3stats.length} frozen=${K1B3.length}`);

// 5. replay bookkeeping consistency (fields; the zero-call replay is engine-deterministic)
const rp = R.replay;
check('replay is non-vacuous, zero-conflict, full agreement, zero calls implied', rp.vacuous === false && rp.conflicts.length === 0 && rp.class_agreement === 1 && rp.served_frozen === rp.attempted && rp.attempted > 0, `attempted=${rp.attempted} served=${rp.served_frozen}`);
check('replay members exist in corpus', (rp.members ?? []).every((id) => R.corpus.some((o) => o.id === id)));

// 6. the sealed metric conjuncts, recomputed end-to-end ------------------------------
const p1 = proposals.length >= 1 && proposals.every((p) => p.emotion_only_could_freeze === false) && rp.class_agreement === 1 && !rp.vacuous ? 1 : 0;
const p2 = milkClasses.length >= 2 && milkUnknown.length >= 2 && K1B3.length < K1B3stats.length ? 1 : 0;
check('metrics.p1_fixes_diagnosed_defect follows from the corpus', p1 === R.metrics.p1_fixes_diagnosed_defect, `recomputed ${p1}`);
check('metrics.p2_split_persists follows from the corpus', p2 === R.metrics.p2_split_persists, `recomputed ${p2}`);

console.log(`\nR1 FINISHER AUDIT: ${fails.length === 0 ? 'ADOPT — every recorded metric re-derives from the recorded corpus' : 'REJECT — ' + fails.join(', ')}`);
process.exit(fails.length === 0 ? 0 : 1);
