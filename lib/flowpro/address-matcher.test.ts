/**
 * Self-test for the FlowPro address matcher.
 * Run:  npx tsx lib/flowpro/address-matcher.test.ts
 * Exits non-zero on any failure (usable as a CI gate).
 *
 * No test framework in this repo (db scripts use tsx), so this mirrors that.
 */
import {
  matchSite,
  addressKey,
  normalizeAddress,
  type SiteCandidateInput,
} from './address-matcher';

// Candidate pool in the CRM's flowpro_sites row shape (structured address).
const sites: SiteCandidateInput[] = [
  { id: 101, name: '46 Emerald Boulevard, Aldinga Beach', address: { line: '46 Emerald Boulevard', city: 'Aldinga Beach', state: 'SA', postcode: '5173' }, customerIds: [7001], customerName: 'OC Real Estate' },
  { id: 102, name: '48 Emerald Boulevard, Aldinga Beach', address: { line: '48 Emerald Boulevard', city: 'Aldinga Beach', state: 'SA', postcode: '5173' }, customerIds: [7001], customerName: 'OC Real Estate' },
  { id: 103, name: '46 Emerald Street, Morphett Vale', address: { line: '46 Emerald Street', city: 'Morphett Vale', state: 'SA', postcode: '5162' }, customerIds: [7002] },
  { id: 104, name: '12 Jade Loop, Aldinga Beach', address: { line: '12 Jade Loop', city: 'Aldinga Beach', state: 'SA', postcode: '5173' }, customerIds: [7001] },
  { id: 105, name: 'Unit 2, 7 Sapphire Way, Aldinga Beach', address: { line: '2/7 Sapphire Way', city: 'Aldinga Beach', state: 'SA', postcode: '5173' }, customerIds: [7003] },
  { id: 106, name: '12-14 Ochre Drive, Aldinga Beach', address: { line: '12-14 Ochre Drive', city: 'Aldinga Beach', state: 'SA', postcode: '5173' }, customerIds: [7001] },
  { id: 107, name: 'The Esplanade South, Port Noarlunga', address: { line: 'The Esplanade South', city: 'Port Noarlunga', state: 'SA', postcode: '5167' }, customerIds: [7004] },
];

type Decision = 'match' | 'review' | 'no-match';
const cases: Array<[string, Decision, number | null]> = [
  ['46 Emerald Blvd, Aldinga Beach SA 5173', 'match', 101], // THE screenshot bug
  ['46 Emerald Blvd Aldinga Beach', 'match', 101],
  ['46 Emerald Bvd, Aldinga Beach', 'match', 101],
  ['46 Emerald Boulevarde, Aldinga Beach', 'match', 101],
  ['46 emerald boulevard aldinga beach', 'match', 101],
  ['46 Emerald Blvd', 'match', 101],
  ['48 Emerald Blvd, Aldinga Beach', 'match', 102],
  ['46 Emerald St, Morphett Vale', 'match', 103],
  ['2/7 Sapphire Way, Aldinga Beach', 'match', 105],
  ['Unit 2, 7 Sapphire Wy, Aldinga Beach', 'match', 105],
  ['99 Nonexistent Rd, Adelaide', 'no-match', null],
  ['14 Ochre Dr, Aldinga Beach', 'match', 106],
  ['12-14 Ochre Drv Aldinga Beach', 'match', 106],
  ['The Esplanade Sth, Port Noarlunga', 'match', 107],
];

let pass = 0;
let fail = 0;

console.log('— matchSite cases —');
for (const [input, wantDecision, wantId] of cases) {
  const r = matchSite(input, sites);
  const gotId = r.best ? r.best.id : null;
  const ok = r.decision === wantDecision && (wantDecision === 'no-match' || gotId === wantId);
  console.log(`${ok ? 'PASS' : 'FAIL'}  "${input}" -> ${r.decision} site=${gotId} score=${r.best ? r.best.score : '-'} (want ${wantDecision}/${wantId})`);
  ok ? pass++ : fail++;
}

// The memory layer depends on the SAME canonical key falling out of every
// surface variant of an address. If these drift, L0 lookups silently miss.
console.log('\n— addressKey stability (memory-layer invariant) —');
const keyGroups: Array<[string, string[]]> = [
  ['46 Emerald Blvd / Boulevard / Bvd + state/postcode noise', [
    '46 Emerald Blvd, Aldinga Beach SA 5173',
    '46 Emerald Boulevard, Aldinga Beach',
    '46 Emerald Bvd, Aldinga Beach SA',
    '46 EMERALD BLVD, ALDINGA BEACH',
  ]],
  ['unit notation 2/7 vs Unit 2, 7', [
    '2/7 Sapphire Way, Aldinga Beach',
    'Unit 2, 7 Sapphire Wy, Aldinga Beach',
  ]],
];
for (const [label, variants] of keyGroups) {
  const keys = variants.map(addressKey);
  const ok = new Set(keys).size === 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}\n       -> ${JSON.stringify(keys)}`);
  ok ? pass++ : fail++;
}

// A confident match must yield a customer to attach — the whole point of
// recovering the site is recovering its agency for free.
console.log('\n— match carries the customer —');
{
  const r = matchSite('46 Emerald Blvd, Aldinga Beach', sites);
  const ok = r.decision === 'match' && r.best?.customerIds?.[0] === 7001;
  console.log(`${ok ? 'PASS' : 'FAIL'}  best.customerIds[0] = ${r.best?.customerIds?.[0]} (want 7001)`);
  ok ? pass++ : fail++;
}

// Two genuinely-close candidates must NOT auto-accept (the 46 vs 46A problem).
console.log('\n— ambiguous pair routes to review, not a wrong auto-match —');
{
  const twins: SiteCandidateInput[] = [
    { id: 201, name: '5 Rosewood Court, Seaford', address: { line: '5 Rosewood Court', city: 'Seaford' } },
    { id: 202, name: '5A Rosewood Court, Seaford', address: { line: '5A Rosewood Court', city: 'Seaford' } },
  ];
  const r = matchSite('5 Rosewood Ct, Seaford', twins);
  // 5 must not silently resolve to 5A; either it locks 201 clearly or asks.
  const ok = !(r.decision === 'match' && r.best?.id === 202);
  console.log(`${ok ? 'PASS' : 'FAIL'}  "5 Rosewood Ct" -> ${r.decision} site=${r.best?.id} (must not auto-match 202)`);
  ok ? pass++ : fail++;
}

console.log(`\n${pass}/${pass + fail} passed`);
if (fail > 0) process.exitCode = 1;
