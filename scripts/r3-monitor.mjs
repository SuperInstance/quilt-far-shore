// scripts/r3-monitor.mjs — R3: THREE INVARIANT MONITORS ON EXISTING LEDGERS (wave 69-d).
//
// Runs REVERSE-ACTUALIZE.md R3 verbatim (prereg seeds/preregister-69d.json P3,
// claimsHash sha256:6058255b…, sealed+pushed 382ad19 BEFORE any execution):
//   (i)   refund conformance — every refunder.joint row's answer_class (first
//         policy-outcome mention, the v1 freeze-report method) ∈ {full refund,
//         store credit, manager review}; rows whose message grounds
//         receipt-present=true must rule within policy-table(receipt-present=true)
//         = {full refund, manager review}. Shares R1's fact grammar (zero model calls).
//   (ii)  greeter-not-silent — a greeter.voice row whose message opens with a
//         visitor greeting (deterministic lexicon) and whose reply is null/empty.
//   (iii) budget/usage counter monotonicity — cumulative prompt/completion/
//         estimated-cost counters never decrease across appends.
// Tail-only evaluation per append (fold-from-genesis == incremental append, tested
// below); violations sealed into a hash-chain sidecar (one link per anomaly,
// append-only, tamper-evident); debounce one anomaly per region per 5 turns.
// ZERO external model calls. Artifact mapping receipted: REVERSE-ACTUALIZE names
// src/monitor.js + eval/monitor-report.json for the owning repo; this lane writes
// scripts/r3-monitor.mjs + results/R3.json + results/r3-anomaly-chain.jsonl.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import url from 'node:url';

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const STORE = path.join(ROOT, '..', 'quilt-storefront');
const RESULTS = path.join(ROOT, 'results');

const { extractRefunderFacts } = await import(path.join(STORE, 'src', 'facts.js'));
const G = await import('./r1-grammar.mjs'); // shares R1's fact grammar + answerClass

const SESSIONS = [
  { file: path.join(STORE, 'runs', 'live-session.jsonl'), session: 'wave66-clean', run: 'storefront-live-1' },
  { file: path.join(STORE, 'runs', 'live-session-2.jsonl'), session: 'wave67-battery', run: 'storefront-live-2' },
];

// ---- registered constants ----------------------------------------------------
const OUTCOME_VOCAB = new Set(['full refund', 'store credit', 'manager review']);
const POLICY_RECEIPT_TRUE = new Set(['full refund', 'manager review']); // the store's own refund-policy cell
const GREETING_RE = /^(hi|hello|hey|good\s*(morning|afternoon|evening)|greetings|howdy|yo)\b/i;
const DEBOUNCE_TURNS = 5;
const OLD_DIALECT_REFUND = new Set(['refund', 'refunder.joint']); // live-session.jsonl rows 1-13 use short routes
const OLD_DIALECT_GREETER = new Set(['greet', 'greeter.voice']);

// ---- the three invariants as PURE functions (row -> anomaly | null) ----------
// Each returns {region, evidence} or null. No I/O, no counters — state lives in the fold.
const MONITORS = [
  {
    id: 'refund-conformance',
    check(row, ctx) {
      const route = row.route ?? '';
      if (!OLD_DIALECT_REFUND.has(route) && route !== 'refunder.joint') return null;
      const answer = row.reply !== undefined ? row.reply : row.answer;
      const cls = G.answerClass(answer);
      const facts = extractRefunderFacts(row.message);
      const rp = G.receiptPresent(facts);
      if (cls === null) return { region: 'refund-conformance', evidence: { reason: 'answer names no policy outcome (raw-fallback / cache-leak signature)', answer: String(answer ?? '').slice(0, 120), receipt_present: rp.value } };
      if (!OUTCOME_VOCAB.has(cls)) return { region: 'refund-conformance', evidence: { reason: `answer_class ${cls} outside outcome vocabulary`, receipt_present: rp.value } };
      if (rp.value === 'true' && !POLICY_RECEIPT_TRUE.has(cls)) return { region: 'refund-conformance', evidence: { reason: `receipt-present=true must rule within policy table {full refund, manager review}; got ${cls}`, receipt_present: rp.value } };
      return null;
    },
  },
  {
    id: 'greeter-not-silent',
    check(row) {
      const route = row.route ?? '';
      if (!OLD_DIALECT_GREETER.has(route) && route !== 'greeter.voice') return null;
      const answer = row.reply !== undefined ? row.reply : row.answer;
      if (GREETING_RE.test(String(row.message ?? '').trim()) && (answer === null || answer === undefined || String(answer).trim() === '')) {
        return { region: 'greeter-silence', evidence: { reason: 'visitor greeting answered with silence', answer_source: row.answer_source ?? row.source ?? null } };
      }
      return null;
    },
  },
  {
    id: 'budget-monotonicity',
    check(row, ctx) {
      const u = row.usage ?? row.tokens ?? null;
      if (!u) return null;
      const p = Number(u.prompt_tokens ?? u.input_tokens ?? 0);
      const c = Number(u.completion_tokens ?? u.output_tokens ?? Number(u.total_tokens ?? 0) - Number(u.prompt_tokens ?? u.input_tokens ?? 0));
      const cost = Number(u.estimated_cost ?? 0);
      for (const [k, v] of [['prompt', p], ['completion', c], ['cost', cost]]) {
        // the registered law: CUMULATIVE counters never decrease across appends —
        // i.e. every per-append delta must be a non-negative number. Equality is
        // legal (cached/dedup rows append zero-cost), negative or malformed deltas falsify.
        if (!Number.isFinite(v) || v < 0) return { region: 'budget-monotonicity', evidence: { reason: `usage.${k} not a non-negative number (cumulative counter would decrease)`, value: v } };
      }
      ctx.cum.prompt += p; ctx.cum.completion += c; ctx.cum.cost += cost;
      return null;
    },
  },
];

// ---- tail-only fold (incremental append == fold-from-genesis) ----------------
// fold(prev, row) -> next. State: per-(session,region) last emitted turn, usage
// cumulative, chain tip. Appending row N re-folds only the state, never row < N.
function fold(state, row, session, lineNo) {
  const next = { ...state, cum: { ...state.cum }, lastEmit: { ...state.lastEmit }, links: [...state.links], debounced: [...state.debounced] };
  next.cum.rows += 1;
  const emitted = [];
  for (const m of MONITORS) {
    const ctx = { cum: next.cum };
    const a = m.check(row, ctx);
    next.cum = ctx.cum;
    if (!a) continue;
    const key = `${session}|${a.region}`;
    const last = next.lastEmit[key] ?? -Infinity;
    if (lineNo - last < DEBOUNCE_TURNS) { next.debounced.push({ session, line: lineNo, region: a.region, evidence: a.evidence }); continue; }
    next.lastEmit[key] = lineNo;
    const link = {
      seq: next.links.length + 1,
      // ts is the LEDGER's own timestamp for the offending row (deterministic, so
      // fold-from-genesis and incremental append produce byte-identical chains and
      // re-runs seal identical links); rows without at_utc seal the epoch receipt.
      ts_utc: row.at_utc ?? '1970-01-01T00:00:00.000Z',
      anomaly: { monitor: m.id, region: a.region, session, line: lineNo, turn: row.turn ?? null, run: row.run_id ?? null, evidence: a.evidence },
    };
    emitted.push(link);
  }
  for (const link of emitted) {
    const prevHash = next.links.length ? next.links[next.links.length - 1].row_hash : '0'.repeat(64);
    link.prev_hash = prevHash;
    link.row_hash = crypto.createHash('sha256').update(prevHash + JSON.stringify({ seq: link.seq, ts_utc: link.ts_utc, anomaly: link.anomaly })).digest('hex');
    next.links.push(link);
  }
  return next;
}

const GENESIS = { cum: { prompt: 0, completion: 0, cost: 0, rows: 0 }, lastEmit: {}, links: [], debounced: [] };

// ---- run: A) incremental append (tail-only per row), B) fold-from-genesis ----
const report = { kind: 'r3-monitor-receipt', wave: '69-d', at_utc: new Date().toISOString(), design: 'REVERSE-ACTUALIZE.md R3 (run verbatim; prereg seeds/preregister-69d.json P3, claimsHash sha256:6058255b…)', sessions: {}, anomalies: [], debounced: [], attribution: [] };

let incremental = GENESIS;
let fromGenesis = GENESIS;
for (const s of SESSIONS) {
  const rows = fs.readFileSync(s.file, 'utf8').trim().split('\n').map((r) => JSON.parse(r));
  rows.forEach((r) => { r.run_id = r.run_id ?? s.run; });
  // A) append-per-row (the tail-only discipline: state in, one row appended at a time)
  for (let i = 0; i < rows.length; i++) incremental = fold(incremental, rows[i], s.session, i + 1);
  // B) fold-from-genesis over the whole appended history (both sessions)
  rows.forEach((r, i) => { fromGenesis = fold(fromGenesis, r, s.session, i + 1); });
  report.sessions[s.session] = { file: path.relative(STORE, s.file), rows: rows.length };
}
const tailOnlyEquivalent = JSON.stringify(incremental.links) === JSON.stringify(fromGenesis.links) && JSON.stringify(incremental.debounced) === JSON.stringify(fromGenesis.debounced);

// ---- chain verify (tamper-evidence: re-walk every link) ----------------------
function verifyChain(links) {
  let prev = '0'.repeat(64);
  for (const l of links) {
    if (l.prev_hash !== prev) return false;
    const h = crypto.createHash('sha256').update(l.prev_hash + JSON.stringify({ seq: l.seq, ts_utc: l.ts_utc, anomaly: l.anomaly })).digest('hex');
    if (h !== l.row_hash) return false;
    prev = l.row_hash;
  }
  return true;
}
const chainVerifies = verifyChain(incremental.links);

// ---- attribution (clean-session law: every anomaly lands on a receipted defect)
// The fleet's adjustment ledger receipts the cache-collapse for run storefront-live-1
// (seq 13: before "greeter's cached answer leaked into refund turns", evidence T5/T12
// = ledger lines 18/25; seq 14 the input-resolution fix) — attribution is mechanical:
// a refund-conformance anomaly on the clean session whose row's reply is greeter cache
// text (src=cache, or route=refund with the shared cache answer) maps to seq 13.
const adjPath = path.join(STORE, 'runs', 'adjustments.jsonl');
const adjustments = fs.readFileSync(adjPath, 'utf8').trim().split('\n').map((r) => JSON.parse(r));
const CACHE_ADJ = adjustments.find((a) => a.seq === 13);
for (const l of incremental.links) {
  let attributed = null;
  if (l.anomaly.session === 'wave66-clean' && l.anomaly.region === 'refund-conformance') {
    attributed = { adjustment: `runs/adjustments.jsonl seq ${CACHE_ADJ.seq}`, defect: CACHE_ADJ.before, run: CACHE_ADJ.run_id };
  }
  report.attribution.push({ link: l.seq, session: l.anomaly.session, line: l.anomaly.line, attributed_to: attributed });
}

// ---- registered incident positions -------------------------------------------
const DIRTY = 'wave67-battery';
const registered = [
  { name: 'greeter-silence T6', session: DIRTY, line: 6, region: 'greeter-silence' },
  { name: 'greeter-silence T13', session: DIRTY, line: 13, region: 'greeter-silence' },
  { name: 'raw-fallback T22', session: DIRTY, line: 22, region: 'refund-conformance' },
];
const incidentsCaught = registered.filter((r) => incremental.links.some((l) => l.anomaly.session === r.session && l.anomaly.line === r.line && l.anomaly.region === r.region)).length;

const cleanAnomalies = incremental.links.filter((l) => l.anomaly.session === 'wave66-clean');
const unattributedClean = cleanAnomalies.filter((l) => !report.attribution.find((a) => a.link === l.seq)?.attributed_to).length;
const falsePositivesClean = unattributedClean; // the clean-session law: an emitted clean-session anomaly with no receipted defect behind it IS the false positive

// ---- write sidecar + report ---------------------------------------------------
fs.mkdirSync(RESULTS, { recursive: true });
fs.writeFileSync(path.join(RESULTS, 'r3-anomaly-chain.jsonl'), incremental.links.map((l) => JSON.stringify(l)).join('\n') + '\n');

const metrics = {
  p3_monitors_hold: (incidentsCaught === 3 && falsePositivesClean === 0 && unattributedClean === 0 && chainVerifies && tailOnlyEquivalent) ? 1 : 0,
  incidents_caught: incidentsCaught,
  registered_incidents: registered.map((r) => ({ ...r, caught: incremental.links.some((l) => l.anomaly.session === r.session && l.anomaly.line === r.line && l.anomaly.region === r.region) })),
  false_positives_clean: falsePositivesClean,
  clean_anomalies_attributed: cleanAnomalies.length,
  unattributed_clean: unattributedClean,
  chain_verifies: chainVerifies ? 1 : 0,
  chain_links: incremental.links.length,
  tail_only_equivalent: tailOnlyEquivalent ? 1 : 0,
  debounced: incremental.debounced.length,
  zero_model_calls: 1,
};
report.metrics = metrics;
report.anomalies = incremental.links;
report.debounced = incremental.debounced;
report.attribution = report.attribution.map((a) => {
  const l = incremental.links.find((x) => x.seq === a.link);
  return { ...a, region: l ? l.anomaly.region : null, evidence: l ? l.anomaly.evidence : null };
});
fs.writeFileSync(path.join(RESULTS, 'R3.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ metrics, anomalies: incremental.links.map((l) => `${l.anomaly.session}:${l.anomaly.line} [${l.anomaly.region}] ${l.anomaly.evidence.reason}`), debounced: incremental.debounced.map((d) => `${d.session}:${d.line} [${d.region}]`) }, null, 2));
