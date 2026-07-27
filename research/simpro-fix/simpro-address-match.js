/**
 * FlowPro — Simpro site address matcher
 * -------------------------------------
 * Zero-dependency Node.js module that matches a free-text work-order address
 * (e.g. "46 Emerald Blvd, Aldinga Beach") against a list of Simpro sites
 * (e.g. { ID: 123, Name: "46 Emerald Boulevard, Aldinga Beach",
 *         Address: { Address: "46 Emerald Boulevard", City: "Aldinga Beach",
 *                    State: "SA", PostalCode: "5173" } }).
 *
 * Why: Simpro's API has NO fuzzy search (confirmed by Simpro partnerships).
 * Its search/filter is substring-based at best, so "Blvd" never matches
 * "Boulevard". The fix is to normalize + match on OUR side.
 *
 * Usage:
 *   const { matchSite, normalizeAddress, buildSearchTerms } = require('./simpro-address-match');
 *
 *   // Option A (recommended): pull all sites once (paginated), cache, match locally
 *   const result = matchSite('46 Emerald Blvd, Aldinga Beach', sites);
 *   // result = { decision: 'match'|'review'|'no-match', best: {site, score}, candidates: [...] }
 *
 *   // Option B (minimal change): generate safe search terms for Simpro's ?search=
 *   buildSearchTerms('46 Emerald Blvd, Aldinga Beach');
 *   // -> ['46 Emerald', 'Emerald'] — street type dropped so abbreviations can't break the search
 *
 * Run self-test:  node simpro-address-match.js
 */

'use strict';

// ---------------------------------------------------------------------------
// 1. Australian street-type abbreviations (Australia Post / AS/NZS 4819 / GNAF)
//    Maps every accepted abbreviation to the full street type.
// ---------------------------------------------------------------------------
const STREET_TYPES = {
  // canonical: [abbreviations...]
  alley: ['ally', 'al'],
  approach: ['app', 'apch'],
  arcade: ['arc'],
  avenue: ['ave', 'av', 'avn', 'avenu'],
  bend: ['bnd'],
  boulevard: ['blvd', 'bvd', 'blv', 'boul', 'boulevarde', 'bvde', 'blvde', 'bde'], // 'boulevarde'/BVDE = official NSW variant, distinct type in G-NAF but equivalent for matching
  brace: ['brce'],
  break: ['brk'],
  broadway: ['bdwy', 'bway'],
  bypass: ['bypa', 'byp'],
  causeway: ['cway', 'cswy'],
  chase: ['ch', 'cha'],
  circle: ['cir', 'ccl'],
  circuit: ['cct', 'crct'],
  close: ['cl'],
  common: ['cmmn', 'comm'],
  concourse: ['con', 'cnc'],
  corner: ['crn', 'cnr'],
  corso: ['cso'],
  court: ['ct', 'crt'],
  cove: ['cve'],
  crescent: ['cres', 'cr', 'crs', 'crsnt', 'cresent'], // last entry = common misspelling
  crest: ['crst', 'cst'],
  crossing: ['crsg', 'xing'],
  drive: ['dr', 'drv', 'dve'],
  driveway: ['drwy', 'dvwy'],
  edge: ['edg'],
  elbow: ['elb'],
  entrance: ['ent'],
  esplanade: ['esp', 'espl'],
  expressway: ['exp', 'expy', 'xway'],
  fairway: ['fawy'],
  freeway: ['fwy', 'frwy'],
  frontage: ['frtg', 'fr'],
  gardens: ['gdns', 'gdn'],
  gate: ['gte'],
  gateway: ['gwy', 'gtwy'],
  glade: ['glde', 'gld'],
  glen: ['gln'],
  grange: ['gra', 'grge'],
  green: ['grn'],
  grove: ['gr', 'grv', 'gve'],
  heights: ['hts', 'hgts'],
  highway: ['hwy', 'hway', 'hiway'],
  hill: ['hl'],
  junction: ['jnc', 'junc', 'jctn', 'jct'],
  key: ['ky'],
  landing: ['ldg', 'lndg'],
  lane: ['ln', 'la'],
  laneway: ['lnwy'],
  link: ['lnk', 'lk'],
  lookout: ['lkt', 'lookt'],
  loop: ['lp'],
  mall: ['ml'],
  meander: ['mndr', 'mr', 'mdr'],
  mews: ['mws', 'mw'],
  motorway: ['mwy', 'mtwy'],
  nook: ['nk'],
  outlook: ['otlk', 'out'],
  parade: ['pde', 'prde', 'par'],
  parkway: ['pwy', 'pkwy', 'pky'],
  pass: ['ps'],
  passage: ['psge'],
  pathway: ['pway', 'phwy', 'pthwy'],
  place: ['pl', 'plce'],
  plaza: ['plza', 'plz'],
  pocket: ['pkt', 'pckt'],
  point: ['pnt', 'pt'],
  promenade: ['prom', 'pmnd'],
  quadrant: ['qdrt', 'quad'],
  quay: ['qy'],
  quays: ['qys'],
  ramble: ['rmbl', 'ra'],
  reserve: ['res', 'rsv'],
  rest: ['rst'],
  retreat: ['rtt', 'rt'],
  ridge: ['rdge', 'rdg'],
  rise: ['ri', 'rse'],
  road: ['rd'],
  rotary: ['rty', 'rtry'],
  row: ['rw'],
  run: ['rn'],
  square: ['sq', 'sqr'],
  street: ['st', 'str', 'strt'],
  strip: ['strp'],
  subway: ['sbwy', 'sub'],
  terrace: ['tce', 'ter', 'terr'],
  track: ['trk', 'trck'],
  trail: ['trl', 'tr'],
  turn: ['tn', 'trn'],
  vale: ['va'],
  view: ['vw', 'vws'],
  vista: ['vsta', 'vst'],
  walk: ['wlk', 'wk'],
  walkway: ['wkwy', 'wwy'],
  waters: ['wtrs'],
  waterway: ['wry', 'wtwy'],
  way: ['wy'],
  wharf: ['whrf', 'whf'],
  yard: ['yd', 'yrd'],
};

// Flatten to abbreviation -> canonical lookup (canonical maps to itself).
const STREET_TYPE_LOOKUP = {};
for (const [canonical, abbrs] of Object.entries(STREET_TYPES)) {
  STREET_TYPE_LOOKUP[canonical] = canonical;
  for (const a of abbrs) STREET_TYPE_LOOKUP[a] = canonical;
}
// The set of canonical street-type words (used to split street name vs type).
const STREET_TYPE_WORDS = new Set(Object.keys(STREET_TYPES));

const AU_STATES = new Set(['nsw', 'vic', 'qld', 'sa', 'wa', 'tas', 'nt', 'act']);
const NOISE_WORDS = new Set(['australia', 'aus', 'au']);
// Cardinal suffixes appear AFTER the street type ("Esplanade Sth", "Railway Pde N").
const DIRECTIONALS = { n: 'north', s: 'south', e: 'east', w: 'west', ne: 'north east', nw: 'north west', se: 'south east', sw: 'south west', nth: 'north', sth: 'south', north: 'north', south: 'south', east: 'east', west: 'west' };

// ---------------------------------------------------------------------------
// 2. Normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a raw address string into structured, comparable parts.
 * Returns { unit, number, streetName, streetType, suburb, tokens, canonical }.
 * Any part may be '' when it can't be determined.
 */
function normalizeAddress(raw) {
  if (!raw) return { unit: '', number: '', streetName: '', streetType: '', suburb: '', tokens: [], canonical: '' };

  let s = String(raw)
    .toLowerCase()
    .replace(/[.,;:()'"]/g, ' ')     // punctuation -> space
    .replace(/\s+/g, ' ')
    .trim();

  // Unit patterns: "unit 2 46", "u 2/46", "u2/46", "2/46", "flat 2 46", "apt 2 46"
  let unit = '';
  let m;
  if ((m = s.match(/\b(?:unit|u|flat|apt|apartment|shop|suite|lot)\s*(\w+)\s*[/\s]\s*(\d+\w?)\b/))) {
    unit = m[1];
    s = s.replace(m[0], ` ${m[2]} `); // keep the street number
  } else if ((m = s.match(/\b(\d+\w?)\s*\/\s*(\d+\w?)\b/))) {
    unit = m[1];
    s = s.replace(m[0], ` ${m[2]} `);
  }

  s = s.replace(/\s+/g, ' ').trim();
  let tokens = s.split(' ').filter(Boolean);

  // Strip trailing postcode (4 digits) and state, plus noise words — they help
  // suburb matching only via the suburb field itself.
  let postcode = '';
  tokens = tokens.filter((t) => {
    if (/^\d{4}$/.test(t) && tokens.indexOf(t) > 0) { postcode = t; return false; }
    if (AU_STATES.has(t)) return false;
    if (NOISE_WORDS.has(t)) return false;
    return true;
  });

  // Street number = first token that starts with a digit (e.g. "46", "46a", "12-14")
  let number = '';
  const numIdx = tokens.findIndex((t) => /^\d/.test(t));
  if (numIdx !== -1) {
    number = tokens[numIdx].replace(/[^0-9a-z-]/g, '');
    tokens.splice(numIdx, 1);
  }

  // Expand street-type abbreviations everywhere, but "st" at the START of a
  // name is Saint ("St Kilda"), not Street — only expand "st"/"str" when it is
  // NOT immediately followed by another word that could continue a name badly.
  // Heuristic: expand a street-type token only if it is not the first token.
  tokens = tokens.map((t, i) => {
    if ((t === 'st' || t === 'str') && i === 0) return 'saint';
    return STREET_TYPE_LOOKUP[t] || t;
  });

  // Split into street name + type + suburb: the street TYPE is the first
  // canonical street-type word; everything before it = street name,
  // everything after = suburb.
  let streetType = '';
  let streetName = '';
  let suburb = '';
  const typeIdx = tokens.findIndex((t) => STREET_TYPE_WORDS.has(t));
  if (typeIdx !== -1) {
    streetType = tokens[typeIdx];
    streetName = tokens.slice(0, typeIdx).join(' ');
    const rest = tokens.slice(typeIdx + 1);
    // Expand a cardinal suffix right after the type in place ("Pde Sth ..." and
    // "Parade South ..." then normalize identically on both sides).
    if (rest.length && DIRECTIONALS[rest[0]] && rest[0].length <= 3) {
      rest[0] = DIRECTIONALS[rest[0]];
    }
    suburb = rest.join(' ');
  } else {
    // No street type found: assume the whole thing is street name (+ maybe suburb).
    streetName = tokens.join(' ');
  }
  // "St Kilda" written in the suburb position expands to "street kilda" above;
  // flip a leading "street" back to "saint" so it aligns with "Saint Kilda".
  if (suburb.startsWith('street ')) suburb = 'saint ' + suburb.slice(7);

  const canonical = [unit && `u${unit}`, number, streetName, streetType, suburb]
    .filter(Boolean)
    .join(' ');

  return { unit, number, streetName, streetType, suburb, postcode, tokens, canonical };
}

// ---------------------------------------------------------------------------
// 3. String similarity (Jaro-Winkler — no dependencies)
// ---------------------------------------------------------------------------
function jaroWinkler(a, b) {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;
  const matchWindow = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aM = new Array(a.length).fill(false);
  const bM = new Array(b.length).fill(false);
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const lo = Math.max(0, i - matchWindow);
    const hi = Math.min(b.length - 1, i + matchWindow);
    for (let j = lo; j <= hi; j++) {
      if (!bM[j] && a[i] === b[j]) { aM[i] = true; bM[j] = true; matches++; break; }
    }
  }
  if (!matches) return 0;
  let t = 0, k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aM[i]) continue;
    while (!bM[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  t /= 2;
  const jaro = (matches / a.length + matches / b.length + (matches - t) / matches) / 3;
  // Winkler prefix boost (up to 4 chars)
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] === b[i]) prefix++; else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

// ---------------------------------------------------------------------------
// 4. Matching
// ---------------------------------------------------------------------------

/**
 * Street-number comparison with range support: "12-14" matches "12", "13",
 * "14" and "12-14"; "46a" matches only "46a" (suffix letters must agree when
 * both sides have one).
 */
function numbersMatch(a, b) {
  if (a === b) return true;
  const parse = (n) => {
    const m = /^(\d+)(?:-(\d+))?([a-z]*)$/.exec(n);
    if (!m) return null;
    return { lo: parseInt(m[1], 10), hi: m[2] ? parseInt(m[2], 10) : parseInt(m[1], 10), suffix: m[3] };
  };
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return false;
  if (pa.suffix && pb.suffix && pa.suffix !== pb.suffix) return false;
  return pa.lo <= pb.hi && pb.lo <= pa.hi; // ranges (or points) overlap
}

/**
 * Score one normalized work-order address against one normalized site address.
 * Returns 0..1. Street number is a hard gate: if both sides have a number and
 * they don't match (range-aware), the score is 0.
 */
function scorePair(wo, site) {
  if (wo.number && site.number && !numbersMatch(wo.number, site.number)) return 0;

  let score = 0;
  let weight = 0;

  // Street name — the core signal.
  if (wo.streetName && site.streetName) {
    score += 0.55 * jaroWinkler(wo.streetName, site.streetName);
    weight += 0.55;
  }

  // Street type — exact after expansion; missing on one side is neutral-ish.
  if (wo.streetType && site.streetType) {
    score += 0.15 * (wo.streetType === site.streetType ? 1 : 0);
    weight += 0.15;
  }

  // Suburb.
  if (wo.suburb && site.suburb) {
    score += 0.25 * jaroWinkler(wo.suburb, site.suburb);
    weight += 0.25;
  }

  // Unit.
  if (wo.unit || site.unit) {
    score += 0.05 * (wo.unit === site.unit ? 1 : 0);
    weight += 0.05;
  }

  if (!weight) return 0;
  let s = score / weight;

  // Both sides having the same street number is corroborating evidence;
  // one side missing a number weakens confidence slightly.
  if (wo.number && site.number) s = Math.min(1, s + 0.03);
  else if (wo.number !== site.number) s *= 0.9;

  // Postcode is a soft anchor: agreement adds confidence, disagreement dents
  // it (people write neighbouring/old suburbs — never a hard veto).
  if (wo.postcode && site.postcode) {
    s = wo.postcode === site.postcode ? Math.min(1, s + 0.02) : s * 0.85;
  }

  return s;
}

/**
 * Extract the best address string from a Simpro site object. Simpro sites have
 * Name (often the address) and Address {Address, City, State, PostalCode}.
 * We match against BOTH and take the better score.
 */
function siteAddressStrings(site) {
  const out = [];
  if (site.Name) out.push(site.Name);
  const a = site.Address || {};
  const parts = [a.Address, a.City, a.State, a.PostalCode].filter(Boolean).join(' ');
  if (parts) out.push(parts);
  return out.length ? out : [''];
}

/**
 * Match a work-order address against an array of Simpro site objects.
 *
 * @param {string} workOrderAddress  e.g. "46 Emerald Blvd, Aldinga Beach"
 * @param {Array}  sites             Simpro site objects (need ID + Name and/or Address)
 * @param {object} [opts]            { acceptAt = 0.93, reviewAt = 0.75, minGap = 0.04 }
 * @returns {{decision, best, candidates}}
 *   decision: 'match'  -> best.site is safe to use automatically
 *             'review' -> plausible candidates; queue for a human to pick
 *             'no-match' -> treat as new site (create + flag) per Simpro's advice
 */
function matchSite(workOrderAddress, sites, opts = {}) {
  const { acceptAt = 0.93, reviewAt = 0.75, minGap = 0.04 } = opts;
  const wo = normalizeAddress(workOrderAddress);

  const scored = sites
    .map((site) => {
      const best = Math.max(...siteAddressStrings(site).map((s) => scorePair(wo, normalizeAddress(s))));
      return { site, score: Math.round(best * 1000) / 1000 };
    })
    .filter((c) => c.score >= reviewAt * 0.8) // keep near-misses for the review UI
    .sort((x, y) => y.score - x.score)
    .slice(0, 5);

  const best = scored[0] || null;
  const runnerUp = scored[1] || null;

  let decision = 'no-match';
  if (best && best.score >= acceptAt && (!runnerUp || best.score - runnerUp.score >= minGap)) {
    decision = 'match';
  } else if (best && best.score >= reviewAt) {
    decision = 'review';
  }

  return { decision, best, candidates: scored, normalizedInput: wo };
}

/**
 * Minimal-change helper: search terms safe to pass to Simpro's ?search= param.
 * Drops the street type entirely (the part that varies: Blvd vs Boulevard) and
 * searches on "number + street name", falling back to street name alone.
 * Feed each term to GET /companies/{id}/sites/?search=... until you get hits,
 * then confirm the hits with matchSite() before using them.
 */
function buildSearchTerms(workOrderAddress) {
  const wo = normalizeAddress(workOrderAddress);
  const terms = [];
  if (wo.number && wo.streetName) terms.push(`${wo.number} ${wo.streetName}`);
  if (wo.streetName) terms.push(wo.streetName);
  if (wo.number && wo.suburb) terms.push(`${wo.number} ${wo.suburb}`);
  return [...new Set(terms)];
}

module.exports = { normalizeAddress, matchSite, buildSearchTerms, scorePair, numbersMatch, jaroWinkler, STREET_TYPE_LOOKUP };

// ---------------------------------------------------------------------------
// 5. Self-test — run: node simpro-address-match.js
// ---------------------------------------------------------------------------
if (require.main === module) {
  const sites = [
    { ID: 101, Name: '46 Emerald Boulevard, Aldinga Beach', Address: { Address: '46 Emerald Boulevard', City: 'Aldinga Beach', State: 'SA', PostalCode: '5173' } },
    { ID: 102, Name: '48 Emerald Boulevard, Aldinga Beach', Address: { Address: '48 Emerald Boulevard', City: 'Aldinga Beach', State: 'SA', PostalCode: '5173' } },
    { ID: 103, Name: '46 Emerald Street, Morphett Vale', Address: { Address: '46 Emerald Street', City: 'Morphett Vale', State: 'SA', PostalCode: '5162' } },
    { ID: 104, Name: '12 Jade Loop, Aldinga Beach', Address: { Address: '12 Jade Loop', City: 'Aldinga Beach', State: 'SA', PostalCode: '5173' } },
    { ID: 105, Name: 'Unit 2, 7 Sapphire Way, Aldinga Beach', Address: { Address: '2/7 Sapphire Way', City: 'Aldinga Beach', State: 'SA', PostalCode: '5173' } },
    { ID: 106, Name: '12-14 Ochre Drive, Aldinga Beach', Address: { Address: '12-14 Ochre Drive', City: 'Aldinga Beach', State: 'SA', PostalCode: '5173' } },
    { ID: 107, Name: 'The Esplanade South, Port Noarlunga', Address: { Address: 'The Esplanade South', City: 'Port Noarlunga', State: 'SA', PostalCode: '5167' } },
  ];

  const cases = [
    // [input, expected decision, expected site ID (or null)]
    ['46 Emerald Blvd, Aldinga Beach SA 5173', 'match', 101],   // THE bug from the screenshots
    ['46 Emerald Blvd Aldinga Beach', 'match', 101],
    ['46 Emerald Bvd, Aldinga Beach', 'match', 101],
    ['46 Emerald Boulevarde, Aldinga Beach', 'match', 101],     // NSW variant spelling
    ['46 emerald boulevard aldinga beach', 'match', 101],
    ['46 Emerald Blvd', 'match', 101],                          // no suburb given
    ['48 Emerald Blvd, Aldinga Beach', 'match', 102],           // right neighbour, not 46
    ['46 Emerald St, Morphett Vale', 'match', 103],             // St = Street here
    ['2/7 Sapphire Way, Aldinga Beach', 'match', 105],          // unit syntax
    ['Unit 2, 7 Sapphire Wy, Aldinga Beach', 'match', 105],
    ['99 Nonexistent Rd, Adelaide', 'no-match', null],
    ['14 Ochre Dr, Aldinga Beach', 'match', 106],            // number inside a stored range
    ['12-14 Ochre Drv Aldinga Beach', 'match', 106],         // range to range
    ['The Esplanade Sth, Port Noarlunga', 'match', 107],     // directional abbreviation
  ];

  let pass = 0;
  for (const [input, wantDecision, wantId] of cases) {
    const r = matchSite(input, sites);
    const gotId = r.best ? r.best.site.ID : null;
    const ok = r.decision === wantDecision && (wantDecision === 'no-match' || gotId === wantId);
    console.log(`${ok ? 'PASS' : 'FAIL'}  "${input}" -> ${r.decision} site=${gotId} score=${r.best ? r.best.score : '-'} (want ${wantDecision}/${wantId})`);
    if (ok) pass++;
  }
  console.log(`\n${pass}/${cases.length} passed`);
  console.log('\nsearch terms for "46 Emerald Blvd, Aldinga Beach SA 5173":', buildSearchTerms('46 Emerald Blvd, Aldinga Beach SA 5173'));
  process.exitCode = pass === cases.length ? 0 : 1;
}
