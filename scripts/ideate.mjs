// scripts/ideate.mjs — lane 68-c ideation rounds as receipted API calls.
//
// Three rounds (task 68-c): (a) deepseek-v4-pro imagines the 2028 runtime's
// missing primitives; (b) typesafe systemone (jev) scores/ranks them by
// leverage × buildability-now with explicit criteria; (c) deepinfra
// gpt-oss-20b devil's-advocates the top-3.
//
// Laws:
//   - judges advise, ledgers decide: every model answer is stored VERBATIM as
//     data (receipts/round-*.answer.md); the lane curates, models never decide.
//   - pricing-first: every call writes receipts/call-<n>-<round>.receipt.json
//     (model, usage, latency, finish) BEFORE anything else is trusted.
//   - fail-closed: non-2xx / empty content → receipted failure, throw.
//   - spend caps from task 68-c (stricter than brief §2): typesafe ≤ 4,
//     deepinfra ≤ 6, deepseek ≤ 2 — enforced via receipts/spend.json.
//   - key discipline: keys runtime-only from env; never printed or receipted.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const ROOT = new URL('..', import.meta.url).pathname;
const RECEIPTS = `${ROOT}receipts`;
mkdirSync(RECEIPTS, { recursive: true });

const CAPS = { typesafe: 4, deepinfra: 6, deepseek: 2 };

function spend() {
  const f = `${RECEIPTS}/spend.json`;
  const s = existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : { typesafe: 0, deepinfra: 0, deepseek: 0 };
  return {
    get: s,
    bump(channel) { s[channel] = (s[channel] ?? 0) + 1; writeFileSync(f, JSON.stringify(s, null, 1) + '\n'); return s[channel]; },
    check(channel) { if ((s[channel] ?? 0) >= CAPS[channel]) throw new Error(`spend cap ${channel}<=${CAPS[channel]} reached — fail-closed`); },
  };
}

function requireKey(name) {
  const k = process.env[name];
  if (!k) throw new Error(`${name} missing — channel closed (fail-closed)`);
  return k;
}

if (!existsSync(`${RECEIPTS}/spend.json`)) writeFileSync(`${RECEIPTS}/spend.json`, JSON.stringify({ typesafe: 0, deepinfra: 0, deepseek: 0, __calls: 0 }, null, 1) + '\n');
let callNo = JSON.parse(readFileSync(`${RECEIPTS}/spend.json`, 'utf8')).__calls ?? 0;

function receiptFile(round, channel) {
  callNo += 1;
  const s = JSON.parse(readFileSync(`${RECEIPTS}/spend.json`, 'utf8') || '{}');
  s.__calls = callNo;
  writeFileSync(`${RECEIPTS}/spend.json`, JSON.stringify(s, null, 1) + '\n');
  return `${RECEIPTS}/call-${String(callNo).padStart(2, '0')}-round-${round}-${channel}.receipt.json`;
}

function writeReceipt(file, obj) { writeFileSync(file, JSON.stringify(obj, null, 2) + '\n'); }

// ---------------------------------------------------------------------------
// round a — deepseek deepseek-v4-pro: the 2028 runtime's missing primitives
// ---------------------------------------------------------------------------
const ROUND_A_PROMPT = `The year is 2028. The soft-joint quilt succeeded completely.

WHAT THE QUILT IS (the founding thesis, verbatim intent): a reactive sheet of cells that orchestrates many small model calls, algorithms, iterators, routers, hooks and drops into a network that functions like one larger model within its domain of expertise. Its design laws:
- Synergistic intelligence that punches above its weights: decompose domain behavior until the formulaic parts become LOOKUP TABLES; leave SOFT JOINTS where small dynamic models plug in, models that understand the moment as a VECTOR ARRAY, not a value array.
- GREETER CELLS: points of connection deliberately never decomposed (the human greeter in the automated general store).
- Runs stop needing adjustments: every play-test run leaves logs rewound to stable points; the WHY of each manual adjustment is decomposed and COMPILED into new cells, so future runs hit those paths natively.
- TIME IS A DIMENSION (the principal, verbatim): "the way that once you can think in true calculus and not just limits for rate-of-change, you can exist with new abstractions of derivatives and integrals and what these new conceptual objects unlock... The spreadsheet made the mechanical engineering of computation into something multi-dimensional. We are adding many more dimensions, especially time, as readings and writings, pushes and pulls flow actively and elegantly and visually in whatever projection you need for the display and controls of the application."

WHAT ALREADY EXISTS (built 2026, waves 66-67 — do NOT re-invent these):
- quilt-softjoints: soft-joint execution reading the moment as a named-dimension vector {warmth, urgency, familiarity, frustration} (0..1 each); freezing test = unanimity + n>=threshold over bucketed vector regions promotes a soft joint into a lookup table; adjustment->cell compiler (union-find clustering of run adjustments).
- quilt-lookup: 1040-entry spreadsheet-mathematics catalog (103 families), 73 executable lookup/formula recipes, every entry classified pure-lookup / lookup-with-weights / needs-dynamic-model / greeter-territory.
- quilt-chrono: append-only jsonl time ledger; flow entries (pushes/pulls between cells); PROJECTIONS = pure functions (ledger, t1, t2) -> view for display/controls; snapshots; rewind; sha256 tip hash; sealed signed custody (a chrono seal IS an organ checkpoint, HMAC-SHA256, byte-exact interop with the organ protocol).
- quilt-storefront: live measured application artifact (+2.83 quality over the bare model at ~1/3 the calls); fallback-first FROZEN path (frozen table consulted BEFORE any model call); the freezing test honestly REFUSED to freeze the refund ruling — diagnosis: the emotional vector cannot see RECEIPT PRESENCE, a FACT; "facts decide outcomes, emotion decides tone; a region key needs both to freeze a policy ruling."
- quilt-runbook: rewindable run ledger with stable points, replay contract, and WHY-mining of adjustments.
- quilt-jev-toolkit organ protocol v2: manifest/boot/snapshot/rewind/nest/checkpoint (signed checkpoints, partial custody, O(tail) boot); quilt-organ-workers hosts organs on Cloudflare; quilt-mcp-receipts exposes signed append-only receipt chains over MCP.
- quilt-playtest: reactive cell engine (value/formula/ai/router/listener/program/sensor/io cells) with CellEKG gesture math classifying cell motion (drifting/oscillating/stuck) from live subscriptions.

QUESTION: Describe the runtime's primitives we have NOT yet built — the pieces whose absence you would notice the moment you tried to OPERATE this thing at 2028 maturity: as a daily-working operator, debugger, auditor, or composer of new domains onto it. Think about what new CONCEPTUAL OBJECTS the operators live inside (the way derivatives and integrals were new objects, not just better limits).

FORMAT — 8 to 10 primitives, exactly this shape, no preamble, no closing summary:
### <NAME> — <four-word handle>
- Definition: 2-3 sentences, precise, mechanism not vibes.
- Unlocks: the new abstraction the operator gains (like d/dt gave rate-of-change as an object).
- Grows from: which existing artifact above it extends, and the delta.
- Naive failure mode: how it breaks if built without care.`;

async function roundA() {
  spend().check('deepseek');
  const t0 = Date.now();
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${requireKey('DEEPSEEK_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'deepseek-v4-pro',
      messages: [
        { role: 'system', content: 'You are a systems designer extrapolating a working research program to its mature form. Your answer is DATA, not authority — a fleet ledger decides. Be concrete: name mechanisms, name objects, name failure modes. No flattery, no restating the prompt.' },
        { role: 'user', content: ROUND_A_PROMPT },
      ],
      temperature: 1.0,
      max_tokens: 6000,
    }),
    signal: AbortSignal.timeout(240_000),
  });
  const ms = Date.now() - t0;
  const body = await res.json().catch(() => ({}));
  const content = body.choices?.[0]?.message?.content ?? null;
  const receipt = {
    round: 'a', channel: 'deepseek', model: body.model ?? 'deepseek-v4-pro',
    http: res.status, ok: res.ok, latency_ms: ms,
    usage: body.usage ?? null, finish: body.choices?.[0]?.finish_reason ?? null,
    keys_printed: false,
    note: 'verbatim answer in receipts/round-a-deepseek.answer.md; raw wire body in receipts/raw/ (gitignored)',
  };
  if (!res.ok || !content) { writeReceipt(receiptFile('a', 'deepseek'), { ...receipt, error: JSON.stringify(body).slice(0, 500) }); throw new Error(`round a failed: HTTP ${res.status}, finish=${receipt.finish}, body=${JSON.stringify(body).slice(0, 200)}`); }
  spend().bump('deepseek');
  writeReceipt(receiptFile('a', 'deepseek'), receipt);
  writeFileSync(`${RECEIPTS}/round-a-deepseek.answer.md`, content);
  writeFileSync(`${RECEIPTS}/raw/round-a-wire.json`, JSON.stringify(body, null, 2));
  console.log(`round a OK: ${receipt.model}, ${receipt.usage?.total_tokens ?? '?'} tok, finish=${receipt.finish}, ${(ms / 1000).toFixed(1)}s`);
}

// ---------------------------------------------------------------------------
// round b — typesafe systemone (jev): score leverage × buildability-now
// ---------------------------------------------------------------------------
async function roundB() {
  spend().check('typesafe');
  const prims = JSON.parse(readFileSync(`${RECEIPTS}/primitives.json`, 'utf8'));
  // lane curation bug fixed post-call: round B's live call also scored the
  // `_provenance` key as if it were a primitive (receipted verbatim; disclosed
  // in DESIGN.md §ideation). Filter metadata keys so reruns stay clean.
  const ids = Object.keys(prims).filter((k) => !k.startsWith('_'));
  const state = {
    fleet: 'SuperInstance quilt fleet',
    year_now: 2026,
    thesis: 'decompose domain behavior until formulaic parts become lookup tables; soft joints where small models read the moment as a vector; greeter cells never decompose; time is a dimension; adjustments compile into cells',
    existing_artifacts: {
      'quilt-softjoints': 'vector-reading soft joints + freezing test (unanimity+n over bucketed regions) promotes joints to lookup tables; union-find adjustment compiler',
      'quilt-lookup': '1040-entry math catalog, 73 executable recipes, per-entry classification',
      'quilt-chrono': 'append-only time ledger, flow entries, pure projections (ledger,t1,t2)->view, snapshots, rewind, signed seals (organ checkpoints)',
      'quilt-storefront': 'live artifact +2.83 over bare model; fallback-first frozen path; freeze test refused to freeze: emotion-only region key cannot see facts (receipt presence)',
      'quilt-runbook': 'rewindable run ledger, stable points, replay contract, WHY-mining',
      'quilt-jev-toolkit': 'organ protocol v2: signed checkpoints, O(tail) boot, nesting',
      'quilt-organ-workers': 'cloudflare workers hosting organs',
      'quilt-mcp-receipts': 'signed append-only receipt chains over MCP',
    },
    channels_available_now: ['typesafe systemone (jev)', 'deepinfra cheap chat models', 'deepseek', 'cloudflare workers/pages', 'mothquantum 1 job', 'node stdlib + jsonl ledgers', 'github actions'],
    scoring_law: 'judges advise, ledgers decide. Your scores are data. The lane computes leverage × buildability-now; lookup-alignment breaks ties. Score what you see, not what flatters.',
    primitives: prims,
  };
  const questions = {};
  for (const id of ids) {
    const p = prims[id];
    questions[`lev_${id}`] = {
      type: 'score',
      instructions: `LEVERAGE of primitive "${p.name}": if it existed tomorrow, how much does it amplify the whole quilt's capability per unit of new machinery? Score 0.0-1.0.`,
      criteria: ['0.0 = cosmetic convenience; the quilt is unchanged without it', '0.5 = meaningful capability gain inside one subsystem', '1.0 = missing keystone: many subsystems gain NEW ABSTRACTIONS from it (the way d/dt made rate-of-change an object you can hold and compose)'],
    };
    questions[`bld_${id}`] = {
      type: 'score',
      instructions: `BUILDABILITY-NOW of primitive "${p.name}": can it be built and HONESTLY TESTED with the listed channels and artifacts within one or two wave sprints? Score 0.0-1.0.`,
      criteria: ['0.0 = needs resources we do not have (new hardware, frontier-scale training, years)', '0.5 = one hard part is missing but a stub could be evaluated honestly', '1.0 = pure software over existing artifacts; a falsifiable test exists this sprint'],
    };
    questions[`lkp_${id}`] = {
      type: 'score',
      instructions: `LOOKUP-ALIGNMENT of primitive "${p.name}": does it advance the core thesis — decomposition turning dynamic behavior into lookup tables smaller models plug into, and time/synergy abstractions — rather than ADD model dependence? Score 0.0-1.0.`,
      criteria: ['0.0 = anti-thesis: it replaces decomposition with a bigger model call', '0.5 = neutral tooling', '1.0 = directly converts dynamic model behavior into deterministic, queryable, sealable structure'],
    };
  }
  questions.top_pick = {
    type: 'choice',
    instructions: 'Which ONE primitive is the best next build, scored as leverage × buildability-now? Break ties only with lookup-alignment.',
    criteria: Object.fromEntries(ids.map((id) => [id, `${prims[id].name} — ${(prims[id].definition || '').slice(0, 90)}`])),
  };
  const t0 = Date.now();
  const res = await fetch('https://api.typesafe.ai/v1/systemone', {
    method: 'POST',
    headers: { Authorization: `Bearer ${requireKey('TYPESAFE_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'jev-latest', state, questions }),
    signal: AbortSignal.timeout(180_000),
  });
  const ms = Date.now() - t0;
  const body = await res.json().catch(() => ({}));
  const receipt = {
    round: 'b', channel: 'typesafe-systemone', model: body.model ?? 'jev-latest',
    http: res.status, ok: res.ok, latency_ms: ms, questions: Object.keys(questions).length,
    usage: body.usage ?? null, keys_printed: false,
    note: 'scores are data; lane computes the product. Verbatim in receipts/round-b-jev.answer.md',
  };
  if (!res.ok || !body.answers) { writeReceipt(receiptFile('b', 'typesafe'), { ...receipt, error: JSON.stringify(body).slice(0, 300) }); throw new Error(`round b failed: HTTP ${res.status}`); }
  spend().bump('typesafe');
  writeReceipt(receiptFile('b', 'typesafe'), receipt);
  writeFileSync(`${RECEIPTS}/round-b-jev.answer.md`, JSON.stringify(body.answers, null, 2));
  writeFileSync(`${RECEIPTS}/raw/round-b-wire.json`, JSON.stringify(body, null, 2));
  // compute the product table (the LANE decides, not the judge)
  const rows = ids.map((id) => {
    const g = (q) => body.answers?.[`lev_${id}`] ? body.answers?.[q]?.score : undefined;
    const lev = body.answers?.[`lev_${id}`]?.score;
    const bld = body.answers?.[`bld_${id}`]?.score;
    const lkp = body.answers?.[`lkp_${id}`]?.score;
    return { id, name: prims[id].name, lev, bld, lkp, product: (typeof lev === 'number' && typeof bld === 'number') ? Math.round(lev * bld * 1000) / 1000 : null };
  }).sort((a, b) => (b.product ?? -1) - (a.product ?? -1));
  writeFileSync(`${RECEIPTS}/round-b-scores.json`, JSON.stringify({ top_pick: body.answers?.top_pick ?? null, rows }, null, 2) + '\n');
  console.log(`round b OK: ${Object.keys(questions).length} questions, ${receipt.usage?.total_tokens ?? '?'} tok, top_pick=${JSON.stringify(body.answers?.top_pick ?? null).slice(0, 80)}`);
}

// ---------------------------------------------------------------------------
// round c — deepinfra gpt-oss-20b: devil's advocate on the top-3
// ---------------------------------------------------------------------------
async function roundC() {
  spend().check('deepinfra');
  const top3 = JSON.parse(readFileSync(`${RECEIPTS}/top3.json`, 'utf8'));
  const prompt = `You are the devil's advocate for a research fleet that builds the "soft-joint quilt": a reactive sheet of cells orchestrating many small model calls, decomposing behavior into lookup tables with soft joints (small dynamic models) at the genuinely dynamic parts, greeter cells that never decompose, an append-only time ledger with projections, and signed custody over everything. Judges advise; ledgers decide — your attack is DATA.

Three primitives were just ranked as the best next builds (by a judge scoring leverage × buildability-now). ATTACK EACH ONE. For each, output exactly:

### <NAME>
- BREAK: the most likely technical failure when built naively with our real channels (cheap models, jsonl ledgers, node, cloudflare workers; no frontier-scale anything).
- SNAKE OIL: the part that sounds profound but is unfalsifiable, already exists in disguise, or would not survive an auditor.
- FALSIFIER: the cheapest experiment that would prove it worthless (name the measurement).
- VERDICT: KEEP, MUTATE (say exactly into what), or KILL (say why).

Be specific and brutal. No praise, no hedging, no summaries. If a primitive is secretly just a rebrand of something that exists, say what it is a rebrand of.

THE THREE PRIMITIVES:
${JSON.stringify(top3, null, 2)}`;
  const t0 = Date.now();
  const res = await fetch('https://api.deepinfra.com/v1/openai/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${requireKey('DEEPINFRA_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b',
      messages: [
        { role: 'system', content: 'You are a hostile but honest reviewer. Attack mechanisms, not style. Every claim you make must be checkable.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
      max_tokens: 2600,
    }),
    signal: AbortSignal.timeout(240_000),
  });
  const ms = Date.now() - t0;
  const body = await res.json().catch(() => ({}));
  const content = body.choices?.[0]?.message?.content ?? null;
  const receipt = {
    round: 'c', channel: 'deepinfra', model: body.model ?? 'openai/gpt-oss-20b',
    http: res.status, ok: res.ok, latency_ms: ms,
    usage: body.usage ?? null, finish: body.choices?.[0]?.finish_reason ?? null,
    keys_printed: false,
    note: 'verbatim attack in receipts/round-c-gpt-oss-20b.answer.md; raw in receipts/raw/',
  };
  if (!res.ok || !content) { writeReceipt(receiptFile('c', 'deepinfra'), { ...receipt, error: JSON.stringify(body).slice(0, 300) }); throw new Error(`round c failed: HTTP ${res.status}`); }
  spend().bump('deepinfra');
  writeReceipt(receiptFile('c', 'deepinfra'), receipt);
  writeFileSync(`${RECEIPTS}/round-c-gpt-oss-20b.answer.md`, content);
  writeFileSync(`${RECEIPTS}/raw/round-c-wire.json`, JSON.stringify(body, null, 2));
  console.log(`round c OK: ${receipt.usage?.total_tokens ?? '?'} tok, finish=${receipt.finish}, ${(ms / 1000).toFixed(1)}s`);
}

const round = process.argv[2];
const fns = { a: roundA, b: roundB, c: roundC };
if (!fns[round]) { console.error('usage: node scripts/ideate.mjs a|b|c'); process.exit(2); }
try { await fns[round](); } catch (e) { console.error('FAIL:', e.message); process.exit(1); }
