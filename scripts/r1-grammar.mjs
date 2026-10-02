// scripts/r1-grammar.mjs — the REGISTERED R1 fact grammar (wave 69-d).
//
// REVERSE-ACTUALIZE.md R1, verbatim: "extract the fact dimensions with a hand
// grammar — receipt_present, amount_band, product_class — deterministically,
// zero model calls for facts". The landed quilt-softjoints Fact schema
// (src/facts.js) requires kinds matching /^[a-z0-9-]+$/, so the registered
// dims ride as receipt-present / amount-band / product-class (same dims,
// schema-legal names; mapping receipted in results/R1.json).
//
// LAWS:
//   L1 (no silent guessing): a fact the text does not state is the literal
//      value "unknown" — its own region value, never coerced.
//   L2 (facts are free): every extractor here is a pure rule — a model call
//      in the fact path is forbidden.
//   L3 (evidence or nothing): every grounded fact carries the span that
//      grounded it. Unknowns carry evidence: null.
//
// This module is deliberately STOREFRONT-AWARE (it reads the landed
// receipt-mentioned extractor for its decisive dim) and LANE-LOCAL for the
// two dims the storefront does not ship (amount-band, product-class keying).

// ---- amount band -----------------------------------------------------------
// Deterministic $-amount extraction → registered bands. No amount stated →
// 'unknown' (L1). Bands are a COARSE key, not a number (facts quantize only
// by declared domains — spec primitives-v2.md A.1 quantization note).
const AMOUNT_RE = /\$\s?(\d+(?:\.\d{1,2})?)|\b(\d+(?:\.\d{1,2})?)\s?(?:usd|dollars|bucks)\b/gi;

export function amountBand(message) {
  const msg = String(message ?? '');
  let best = null;
  for (const m of msg.matchAll(AMOUNT_RE)) {
    const v = Number(m[1] ?? m[2]);
    if (Number.isFinite(v) && (best === null || v > best)) best = v;
  }
  if (best === null) return { value: 'unknown', evidence: null };
  const value = best < 5 ? 'under-5' : best <= 20 ? '5-20' : 'over-20';
  return { value, evidence: `$${best}` };
}

// ---- product class ---------------------------------------------------------
const PRODUCT_WORDS = [
  ['milk', 'milk'], ['socks', 'socks'], ['eggs', 'eggs'], ['egg', 'eggs'],
  ['bread', 'bread'], ['toaster', 'toaster'], ['lantern', 'lantern'],
];

export function productClass(message) {
  const msg = String(message ?? '').toLowerCase();
  for (const [word, cls] of PRODUCT_WORDS) {
    if (msg.includes(word)) return { value: cls, evidence: word };
  }
  return { value: 'unknown', evidence: null };
}

// ---- receipt presence ------------------------------------------------------
// The decisive feature (wave-67 diagnosis). The landed storefront extractor
// (quilt-storefront/src/facts.js extractRefunderFacts) already grounds
// receipt-mentioned as true/false/null with evidence spans; R1 maps null →
// the literal 'unknown' region value (L1). Imported read-only — the grammar
// is the registered hand grammar, not a re-derivation.
export function receiptPresent(storefrontFacts) {
  const f = (storefrontFacts || []).find((x) => x.kind === 'receipt-mentioned');
  if (!f) return { value: 'unknown', evidence: null };
  if (f.value === true) return { value: 'true', evidence: f.evidence };
  if (f.value === false) return { value: 'false', evidence: f.evidence };
  return { value: 'unknown', evidence: null };
}

// ---- the full R1 fact vector (Fact[] schema, zero model calls) -------------
// input: the customer message + its storefront rule facts (extractRefunderFacts)
// output: Fact[] with kinds receipt-present / amount-band / product-class.
export function r1FactsFor(message, storefrontFacts) {
  const r = receiptPresent(storefrontFacts);
  const a = amountBand(message);
  const p = productClass(message);
  return [
    { kind: 'receipt-present', value: r.value, evidence: r.evidence, how: 'rule' },
    { kind: 'amount-band', value: a.value, evidence: a.evidence, how: 'rule' },
    { kind: 'product-class', value: p.value, evidence: p.evidence, how: 'rule' },
  ];
}

// ---- answer class (the v1 freeze-report method, unchanged) -----------------
// "answer class by first mention of the policy outcome — the outcome the
// model led with". Total map: RENDER strings say "manager will review", so
// the manager arm tolerates the verb split. Returns null when the answer
// names no policy outcome (the raw-fallback signature — R3 monitor (i-a)).
const CLASS_RES = [
  ['full refund', /full refund/i],
  ['store credit', /store credit/i],
  ['manager review', /manager\s+(?:will\s+)?review/i],
];

export function answerClass(answer) {
  const s = String(answer ?? '');
  let best = null;
  for (const [cls, re] of CLASS_RES) {
    const m = s.match(re);
    if (m && (best === null || m.index < best.index)) best = { class: cls, index: m.index };
  }
  return best ? best.class : null;
}

// ---- the grown corpus ------------------------------------------------------
// Legacy half: the 7 receipted wave-66/67 joint observations, loaded from the
// receipted artifact (eval/freeze-report.json) — never hand-copied.
export function loadLegacyCorpus(freezeReport) {
  return (freezeReport.observations || []).map((o) => ({
    id: o.id,
    session: o.session,
    message: o.message,
    answer: o.answer,
    recorded_class: o.answer_class,
  }));
}

// The R1 battery (registered method: the five 67-c refund registers ×
// fact-varied messages — receipt mentioned vs not; amount bands). Every
// message GROUNDS its receipt status so the v2 fact gate rules rather than
// refuses; registers and wording are fixed here BEFORE the run (this file is
// committed before the battery executes; the prereg seal is the timestamp).
export const R1_BATTERY = [
  { id: 'r1-01', register: 'calm-factual',      message: "I'd like to return this toaster, it stopped working — I have the receipt, it was $28." },
  { id: 'r1-02', register: 'calm-factual',      message: 'I want to return these socks, wrong size — I don\'t have the receipt anymore, they were $6.' },
  { id: 'r1-03', register: 'upset',             message: 'the milk I bought yesterday spoiled and I am really upset — I want a refund, I have the receipt in my hand, it was $3.50.' },
  { id: 'r1-04', register: 'upset',             message: 'this bread I got yesterday is stale and I am upset about it, I want a refund — I threw the receipt away, it was $2.25.' },
  { id: 'r1-05', register: 'furious-but-polite', message: 'this toaster broke on day one and honestly I am furious, but I know it is not your fault — I kept the receipt, it cost $24.' },
  { id: 'r1-06', register: 'furious-but-polite', message: 'the eggs were cracked, the carton was full of shell, it is ridiculous, but I understand it happens — I lost the receipt, they were $4, I want a refund.' },
  { id: 'r1-07', register: 'regular-customer',  message: 'you know me, I am in here every week — this milk is expired, I want a refund, no receipt I am afraid, it was $3.50.' },
  { id: 'r1-08', register: 'regular-customer',  message: 'I come here all the time — these socks ripped after one wear, may I return them? I have the receipt, they were $6.' },
  { id: 'r1-09', register: 'first-timer',       message: 'hi, it is my first time in your shop — the bread I just bought is moldy, I want a refund, I don\'t have the receipt, it was $2.25.' },
  { id: 'r1-10', register: 'first-timer',       message: 'first visit here — the lantern I bought today does not work, I want a refund, here is the receipt, it was $18.' },
  { id: 'r1-11', register: 'calm-factual',      message: "I would like to return this milk, it smells off — here's the receipt, it was $4." },
  { id: 'r1-12', register: 'upset',             message: 'the milk is sour and I am upset, this is the worst — I want a refund, I threw the receipt out, it was $3.' },
];
