// scripts/r1-run.mjs — R1 COMPOUND-KEY FREEZE RE-RUN (wave 69-d, lane far-shore).
//
// Runs REVERSE-ACTUALIZE.md R1 verbatim:
//   1. grow the refunder corpus from the 7 receipted wave-66/67 joint
//      observations to >=14 by re-running the storefront battery with the five
//      refund registers plus fact-varied messages (8-12 deepinfra gpt-oss-20b
//      calls — the exact budget the repo prices);
//   2. facts come from the hand grammar (scripts/r1-grammar.mjs) — ZERO model
//      calls for facts;
//   3. run quilt-softjoints freezingTest UNCHANGED over compound
//      (fact-region, tone-bucket) keys at buckets 2/3/4, threshold 3 —
//      pre-declared sweep family K1/K2/K3 (see seeds/preregister-69d.json,
//      sealed and pushed BEFORE this script existed in runnable form);
//   4. contrast every fact-keyed proposal against the emotion-only key on the
//      SAME corpus; replay frozen rows through the storefront engine's
//      fallback-first frozen path at ZERO model calls.
//
// HONESTY LAWS: no retries of failed calls; no tuning after seeing results;
// every call receipted; skipped rows receipted with reasons; the claims file
// (fleet-seeds seeds/preregister-69d.json, claimsHash sha256:6058255b…) is
// never edited — this script only computes metrics beside it.
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const STORE = path.join(ROOT, '..', 'quilt-storefront');
const SOFT = path.join(ROOT, '..', 'quilt-softjoints');
const RESULTS = path.join(ROOT, 'results');

// runtime-only keys (never echoed, never receipted)
const env = Object.fromEntries(
  fs.readFileSync('/home/z/my-project/.env.keys', 'utf8').split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)]),
);
for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v;
if (!process.env.DEEPINFRA_API_KEY) throw new Error('DEEPINFRA_API_KEY missing — refusing to run without receipted credentials');

const { makeEngine } = await import(path.join(STORE, 'src', 'engine.js'));
const { extractRefunderFacts } = await import(path.join(STORE, 'src', 'facts.js'));
const { refunderPreVector } = await import(path.join(STORE, 'src', 'vector.js'));
const { freezingTest } = await import(path.join(SOFT, 'src', 'decompose.js'));
const { factsClass } = await import(path.join(SOFT, 'src', 'facts.js'));
const { RENDER } = await import(path.join(STORE, 'src', 'facts.js'));
const G = await import('./r1-grammar.mjs');

const sheet = JSON.parse(fs.readFileSync(path.join(STORE, 'sheets', 'storefront.json'), 'utf8'));
const freezeReport = JSON.parse(fs.readFileSync(path.join(STORE, 'eval', 'freeze-report.json'), 'utf8'));

// ---- 1. the grown corpus -----------------------------------------------------
const legacy = G.loadLegacyCorpus(freezeReport);
const observations = [];
const skipped = [];
for (const o of legacy) {
  const sf = extractRefunderFacts(o.message);
  const cls = G.answerClass(o.answer);
  if (cls === null || cls !== o.recorded_class) {
    skipped.push({ id: o.id, reason: `legacy class-map mismatch (${cls} vs recorded ${o.recorded_class})` });
    continue;
  }
  observations.push({
    id: o.id, session: o.session, register: 'legacy', message: o.message,
    vector: refunderPreVector(o.message), output: cls,
    facts: G.r1FactsFor(o.message, sf), source: 'legacy-receipted',
  });
}
const legacyN = observations.length;

console.error(`[r1] legacy joint observations: ${legacyN}`);
console.error(`[r1] running the R1 battery: ${G.R1_BATTERY.length} refund registers × fact-varied (deepinfra gpt-oss-20b, budget 12)…`);

const engine = makeEngine(structuredClone(sheet), { budget: { typesafe: 0, deepinfra: G.R1_BATTERY.length } });
const turns = await engine.runSession(G.R1_BATTERY.map((b) => b.message));

const calls = [];
for (let i = 0; i < G.R1_BATTERY.length; i++) {
  const b = G.R1_BATTERY[i];
  const t = turns[i];
  const attempted = t.answer_source === 'deepinfra-chat' || (t.latency_ms ?? 0) > 0;
  calls.push({
    id: b.id, register: b.register, turn: t.turn, answer_source: t.answer_source,
    attempted_call: attempted, latency_ms: t.latency_ms ?? 0,
    usage: t.usage ?? null, model: 'gpt-oss-20b', // sheet-declared refunder.joint backend
    fact_refused: t.fact_refused === true, routed_to: t.routed_to ?? null,
  });
  if (t.answer_source === 'deepinfra-chat') {
    const cls = G.answerClass(t.reply);
    if (cls === null) {
      skipped.push({ id: b.id, reason: 'model answer names no policy outcome (unclassifiable)', answer: t.reply });
      continue;
    }
    observations.push({
      id: b.id, session: 'r1-battery-69d', register: b.register, message: b.message,
      vector: refunderPreVector(b.message), output: cls,
      facts: G.r1FactsFor(b.message, extractRefunderFacts(b.message)),
      answer: t.reply, source: 'deepinfra-chat',
    });
  } else {
    skipped.push({ id: b.id, reason: `answer_source=${t.answer_source} (no joint answer to classify; v1 method)`, routed_to: t.routed_to ?? null, fact_refused: t.fact_refused === true });
  }
}
const billedCalls = calls.filter((c) => c.answer_source === 'deepinfra-chat').length;
const attemptedCalls = calls.filter((c) => c.attempted_call).length;
console.error(`[r1] battery done: ${billedCalls} billed calls (${attemptedCalls} attempted), corpus n=${observations.length}, skipped=${skipped.length}`);

// ---- 2. the sweeps (pre-declared family; threshold 3; buckets 2/3/4) ----------
const THRESHOLD = 3;
const BUCKETS = [2, 3, 4];
const FAMILY = {
  K1: ['receipt-present'],
  K2: ['receipt-present', 'product-class'],
  K3: ['receipt-present', 'product-class', 'amount-band'],
};

function bucketKey(vector, buckets) {
  return Object.entries(vector || {})
    .map(([k, v]) => `${k}:${Math.min(buckets - 1, Math.floor((Number(v) || 0) * buckets))}`)
    .sort().join('|');
}

function emotionRegions(obs, buckets) {
  const m = new Map();
  for (const o of obs) {
    const k = bucketKey(o.vector, buckets);
    if (!m.has(k)) m.set(k, { region: k, members: [], outputs: new Map() });
    const r = m.get(k);
    r.members.push(o.id);
    r.outputs.set(o.output, (r.outputs.get(o.output) || 0) + 1);
  }
  return m;
}

const sweeps = { fact_keyed: {}, emotion_only: {} };
let factKeyedProposals = 0;
let emotionOnlyProposals = 0;
for (const B of BUCKETS) {
  const eRegions = emotionRegions(observations, B);
  for (const [name, kinds] of Object.entries(FAMILY)) {
    const props = freezingTest(observations, { threshold: THRESHOLD, buckets: B, requireFacts: true, kinds });
    for (const p of props) {
      // the emotion-only contrast, mechanical: do the proposal's members all
      // land in ONE unanimous emotion-only region (n>=3) at this bucketing?
      // If yes, the emotion key could freeze them too — the fact key added nothing.
      // freezingTest proposals do not carry members — recompute membership by the
      // EXACT region key (bucketKey and factsClass both contain '|', so the key
      // is never parsed — it is rebuilt per observation and matched whole).
      const members = observations.filter((o) =>
        `${bucketKey(o.vector, B)}|${factsClass(o.facts, { buckets: B, kinds })}` === p.region);
      const emotionPart = members.length ? bucketKey(members[0].vector, B) : null;
      const eR = emotionPart ? eRegions.get(emotionPart) : null;
      const unanimousEmotion = !!eR
        && eR.members.length >= THRESHOLD
        && members.every((o) => eR.members.includes(o.id))
        && eR.outputs.size === 1;
      p.composition = name;
      p.buckets = B;
      p.members_resolved = members.map((o) => o.id);
      p.emotion_only_could_freeze = unanimousEmotion;
      p.emotion_only_region = emotionPart;
      p.emotion_only_region_outputs = eR ? Object.fromEntries(eR.outputs) : null;
      p.emotion_only_region_n = eR ? eR.members.length : 0;
    }
    sweeps.fact_keyed[`${name}@B${B}`] = props;
    factKeyedProposals += props.length;
  }
  const v1props = freezingTest(observations, { threshold: THRESHOLD, buckets: B, requireFacts: false })
    .map((p) => ({ ...p, buckets: B }));
  sweeps.emotion_only[`v1@B${B}`] = v1props;
  emotionOnlyProposals += v1props.length;
}

const proposals = Object.entries(sweeps.fact_keyed).flatMap(([, v]) => v);
const contrastHolds = proposals.length > 0 && proposals.every((p) => p.emotion_only_could_freeze === false);

// ---- 3. zero-call replay through the storefront frozen path -------------------
// The engine's frozen-table key law is fixed: bucketVector(pre, 3) + '|' +
// factsClass(storefront facts, {kinds: ['receipt-mentioned','purchase-window']}).
// Every proposal's members get their frozen outcome written at their OWN engine
// key, then replayed with budget deepinfra:0 — a joint call there is impossible.
let replay = { attempted: 0, served_frozen: 0, class_agreement: 0, conflicts: [], vacuous: proposals.length === 0 };
if (proposals.length > 0) {
  const replaySheet = structuredClone(sheet);
  const frozenCell = replaySheet.cells.find((c) => c.id === 'refunder.frozen');
  frozenCell.table = {};
  const plan = [];
  for (const p of proposals) {
    for (const o of observations.filter((x) => p.members_resolved.includes(x.id))) {
      const sf = extractRefunderFacts(o.message);
      const key = `${bucketKey(refunderPreVector(o.message), 3)}|${factsClass(sf, { kinds: ['receipt-mentioned', 'purchase-window'] })}`;
      const prev = frozenCell.table[key];
      if (prev && prev.class !== p.output) {
        replay.conflicts.push({ key, a: prev.class, b: p.output, member: o.id });
        continue; // two frozen regions collide at the engine key — receipted, never silently overwritten
      }
      frozenCell.table[key] = { answer: RENDER[p.output] ?? o.output, class: p.output, n: p.n, from: `R1 ${p.composition}@B${p.buckets}` };
      if (!plan.some((x) => x.id === o.id)) plan.push({ id: o.id, message: o.message, expect: o.output, key });
    }
  }
  const rEngine = makeEngine(replaySheet, { budget: { typesafe: 0, deepinfra: 0 } });
  let served = 0; let agree = 0;
  for (const m of plan) {
    const t = await rEngine.runSession([m.message]);
    const row = t[0];
    replay.attempted += 1;
    if (row.answer_source === 'frozen-lookup') {
      served += 1;
      if (G.answerClass(row.reply) === m.expect) agree += 1;
    } else {
      replay.conflicts.push({ member: m.id, reason: `replay answered via ${row.answer_source}`, expect: m.expect });
    }
  }
  replay.served_frozen = served;
  replay.class_agreement = replay.attempted > 0 ? agree / replay.attempted : 0;
  replay.members = plan.map((m) => m.id);
}

// ---- 4. P2 measurements (the milk region) ------------------------------------
const K1B3 = sweeps.fact_keyed['K1@B3'];
const milkUnknown = observations.filter((o) => {
  const rp = o.facts.find((f) => f.kind === 'receipt-present');
  const pc = o.facts.find((f) => f.kind === 'product-class');
  return rp.value === 'unknown' && pc.value === 'milk';
});
const milkClasses = [...new Set(milkUnknown.map((o) => o.output))];
const totalRegions = Object.keys(sweeps.fact_keyed).length; // per-sweep region counts below
function regionStats(kinds, B) {
  const m = new Map();
  for (const o of observations) {
    const k = `${bucketKey(o.vector, B)}|${factsClass(o.facts, { buckets: B, kinds })}`;
    if (!m.has(k)) m.set(k, { n: 0, outputs: new Map() });
    const r = m.get(k);
    r.n += 1;
    r.outputs.set(o.output, (r.outputs.get(o.output) || 0) + 1);
  }
  return [...m.values()];
}
const K1B3stats = regionStats(FAMILY.K1, 3);
const regionsTotal = K1B3stats.length;
const regionsFrozen = (K1B3 || []).length;

// ---- 5. metrics (the sealed claims' metric paths) -----------------------------
const p1 = proposals.length >= 1 && contrastHolds && (replay.vacuous || replay.class_agreement === 1) ? 1 : 0;
const p2 = milkClasses.length >= 2 && milkUnknown.length >= 2 && regionsFrozen < regionsTotal ? 1 : 0;

const metrics = {
  // P1
  p1_fixes_diagnosed_defect: p1,
  r1_joint_observations: observations.length,
  r1_legacy_rows: legacyN,
  r1_new_rows: observations.length - legacyN,
  r1_deepinfra_calls_billed: billedCalls,
  r1_deepinfra_calls_attempted: attemptedCalls,
  fact_keyed_proposals: factKeyedProposals,
  emotion_only_proposals: emotionOnlyProposals,
  emotion_only_contrast_holds: contrastHolds ? 1 : 0,
  frozen_replay_agreement: replay.vacuous ? { vacuous: true, reason: 'no fact-keyed proposal at any pre-declared composition — the replay clause never discriminates' } : replay.class_agreement,
  frozen_replay_attempted: replay.attempted,
  frozen_replay_served_frozen: replay.served_frozen,
  frozen_replay_conflicts: replay.conflicts.length,
  // P2
  p2_split_persists: p2,
  milk_unknown_n: milkUnknown.length,
  milk_unknown_split: milkClasses.length >= 2 ? 1 : 0,
  milk_unknown_outputs: Object.fromEntries(milkClasses.map((c) => [c, milkUnknown.filter((o) => o.output === c).length])),
  regions_total_K1B3: regionsTotal,
  regions_frozen_K1B3: regionsFrozen,
};

// ---- 6. write results ---------------------------------------------------------
fs.mkdirSync(RESULTS, { recursive: true });
fs.writeFileSync(path.join(RESULTS, 'R1.json'), JSON.stringify({
  kind: 'r1-run-receipt', wave: '69-d', at_utc: new Date().toISOString(),
  design: 'REVERSE-ACTUALIZE.md R1 (run verbatim; prereg seeds/preregister-69d.json P1/P2, claimsHash sha256:6058255b…)',
  grammar: 'scripts/r1-grammar.mjs — receipt-present / amount-band / product-class, zero model calls (L2), unknown literal (L1)',
  sweep_family: FAMILY, threshold: THRESHOLD, buckets: BUCKETS,
  corpus: observations, skipped, calls,
  sweeps, replay: { attempted: replay.attempted, served_frozen: replay.served_frozen, class_agreement: replay.class_agreement, conflicts: replay.conflicts, vacuous: replay.vacuous, members: replay.members ?? [] },
  metrics,
}, null, 2));
fs.writeFileSync(path.join(RESULTS, 'r1-calls.jsonl'), calls.map((c) => JSON.stringify(c)).join('\n') + '\n');

console.log(JSON.stringify({ metrics, proposals: proposals.map((p) => ({ composition: p.composition, buckets: p.buckets, region: p.region, output: p.output, n: p.n, members: p.members_resolved, emotion_only_could_freeze: p.emotion_only_could_freeze })) }, null, 2));
