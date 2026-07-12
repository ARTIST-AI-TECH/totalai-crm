/**
 * FlowPro — Simpro site address matcher (TypeScript port)
 * -------------------------------------------------------
 * Zero-dependency matcher that resolves a free-text work-order address
 * (e.g. "46 Emerald Blvd, Aldinga Beach") to a Simpro site by normalizing
 * BOTH sides to a canonical form and scoring with Jaro-Winkler.
 *
 * Simpro's API has no fuzzy search (confirmed by Simpro partnerships) and its
 * filters are exact/substring at best — "Blvd" never matches "Boulevard". So
 * matching happens here, in the CRM, against a local mirror of the sites.
 *
 * Ported from research/simpro-fix/simpro-address-match.js (14/14 self-tests).
 * Algorithm preserved verbatim; only types + a flexible candidate adapter added.
 */

// ---------------------------------------------------------------------------
// 1. Australian street-type abbreviations (Australia Post / AS/NZS 4819 / GNAF)
// ---------------------------------------------------------------------------
const STREET_TYPES: Record<string, string[]> = {
  alley: ['ally', 'al'],
  approach: ['app', 'apch'],
  arcade: ['arc'],
  avenue: ['ave', 'av', 'avn', 'avenu'],
  bend: ['bnd'],
  boulevard: ['blvd', 'bvd', 'blv', 'boul', 'boulevarde', 'bvde', 'blvde', 'bde'],
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
  crescent: ['cres', 'cr', 'crs', 'crsnt', 'cresent'],
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

const STREET_TYPE_LOOKUP: Record<string, string> = {};
for (const [canonical, abbrs] of Object.entries(STREET_TYPES)) {
  STREET_TYPE_LOOKUP[canonical] = canonical;
  for (const a of abbrs) STREET_TYPE_LOOKUP[a] = canonical;
}
const STREET_TYPE_WORDS = new Set(Object.keys(STREET_TYPES));

const AU_STATES = new Set(['nsw', 'vic', 'qld', 'sa', 'wa', 'tas', 'nt', 'act']);
const NOISE_WORDS = new Set(['australia', 'aus', 'au']);
const DIRECTIONALS: Record<string, string> = {
  n: 'north', s: 'south', e: 'east', w: 'west',
  ne: 'north east', nw: 'north west', se: 'south east', sw: 'south west',
  nth: 'north', sth: 'south', north: 'north', south: 'south', east: 'east', west: 'west',
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface NormalizedAddress {
  unit: string;
  number: string;
  streetName: string;
  streetType: string;
  suburb: string;
  postcode: string;
  tokens: string[];
  canonical: string;
}

/** Shape the matcher accepts — decoupled from the DB row / Simpro payload. */
export interface SiteCandidateInput {
  id: number;
  name?: string | null;
  address?: {
    line?: string | null;
    city?: string | null;
    state?: string | null;
    postcode?: string | null;
  } | null;
  customerIds?: number[] | null;
  customerName?: string | null;
}

export interface ScoredCandidate {
  id: number;
  name: string;
  score: number;
  customerIds: number[];
  customerName: string | null;
}

export type Decision = 'match' | 'review' | 'no-match';

export interface MatchResult {
  decision: Decision;
  best: ScoredCandidate | null;
  candidates: ScoredCandidate[];
  normalizedInput: NormalizedAddress;
  /** Canonical key for the learned map (flowpro_site_map.address_key). */
  addressKey: string;
}

export interface MatchOptions {
  acceptAt?: number;
  reviewAt?: number;
  minGap?: number;
}

// ---------------------------------------------------------------------------
// 2. Normalization
// ---------------------------------------------------------------------------
export function normalizeAddress(raw: string | null | undefined): NormalizedAddress {
  if (!raw) {
    return { unit: '', number: '', streetName: '', streetType: '', suburb: '', postcode: '', tokens: [], canonical: '' };
  }

  let s = String(raw)
    .toLowerCase()
    .replace(/[.,;:()'"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Unit patterns: "unit 2 46", "u 2/46", "u2/46", "2/46", "flat 2 46", "apt 2 46"
  let unit = '';
  let m: RegExpMatchArray | null;
  if ((m = s.match(/\b(?:unit|u|flat|apt|apartment|shop|suite|lot)\s*(\w+)\s*[/\s]\s*(\d+\w?)\b/))) {
    unit = m[1];
    s = s.replace(m[0], ` ${m[2]} `);
  } else if ((m = s.match(/\b(\d+\w?)\s*\/\s*(\d+\w?)\b/))) {
    unit = m[1];
    s = s.replace(m[0], ` ${m[2]} `);
  }

  s = s.replace(/\s+/g, ' ').trim();
  let tokens = s.split(' ').filter(Boolean);

  // Strip trailing postcode (4 digits), state and noise words.
  let postcode = '';
  tokens = tokens.filter((t) => {
    if (/^\d{4}$/.test(t) && tokens.indexOf(t) > 0) { postcode = t; return false; }
    if (AU_STATES.has(t)) return false;
    if (NOISE_WORDS.has(t)) return false;
    return true;
  });

  // Street number = first token that starts with a digit.
  let number = '';
  const numIdx = tokens.findIndex((t) => /^\d/.test(t));
  if (numIdx !== -1) {
    number = tokens[numIdx].replace(/[^0-9a-z-]/g, '');
    tokens.splice(numIdx, 1);
  }

  // Expand street-type abbreviations; "st"/"str" at the START is Saint.
  tokens = tokens.map((t, i) => {
    if ((t === 'st' || t === 'str') && i === 0) return 'saint';
    return STREET_TYPE_LOOKUP[t] || t;
  });

  // Split into street name + type + suburb.
  let streetType = '';
  let streetName = '';
  let suburb = '';
  const typeIdx = tokens.findIndex((t) => STREET_TYPE_WORDS.has(t));
  if (typeIdx !== -1) {
    streetType = tokens[typeIdx];
    streetName = tokens.slice(0, typeIdx).join(' ');
    const rest = tokens.slice(typeIdx + 1);
    if (rest.length && DIRECTIONALS[rest[0]] && rest[0].length <= 3) {
      rest[0] = DIRECTIONALS[rest[0]];
    }
    suburb = rest.join(' ');
  } else {
    streetName = tokens.join(' ');
  }
  if (suburb.startsWith('street ')) suburb = 'saint ' + suburb.slice(7);

  const canonical = [unit && `u${unit}`, number, streetName, streetType, suburb]
    .filter(Boolean)
    .join(' ');

  return { unit, number, streetName, streetType, suburb, postcode, tokens, canonical };
}

/** The stable key stored in flowpro_site_map and used for the L0 lookup. */
export function addressKey(raw: string | null | undefined): string {
  return normalizeAddress(raw).canonical;
}

// ---------------------------------------------------------------------------
// 3. String similarity (Jaro-Winkler — no dependencies)
// ---------------------------------------------------------------------------
export function jaroWinkler(a: string, b: string): number {
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
  let prefix = 0;
  for (let i = 0; i < Math.min(4, a.length, b.length); i++) {
    if (a[i] === b[i]) prefix++; else break;
  }
  return jaro + prefix * 0.1 * (1 - jaro);
}

// ---------------------------------------------------------------------------
// 4. Matching
// ---------------------------------------------------------------------------
export function numbersMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const parse = (n: string) => {
    const m = /^(\d+)(?:-(\d+))?([a-z]*)$/.exec(n);
    if (!m) return null;
    return { lo: parseInt(m[1], 10), hi: m[2] ? parseInt(m[2], 10) : parseInt(m[1], 10), suffix: m[3] };
  };
  const pa = parse(a);
  const pb = parse(b);
  if (!pa || !pb) return false;
  if (pa.suffix && pb.suffix && pa.suffix !== pb.suffix) return false;
  return pa.lo <= pb.hi && pb.lo <= pa.hi;
}

export function scorePair(wo: NormalizedAddress, site: NormalizedAddress): number {
  if (wo.number && site.number && !numbersMatch(wo.number, site.number)) return 0;

  let score = 0;
  let weight = 0;

  if (wo.streetName && site.streetName) {
    score += 0.55 * jaroWinkler(wo.streetName, site.streetName);
    weight += 0.55;
  }
  if (wo.streetType && site.streetType) {
    score += 0.15 * (wo.streetType === site.streetType ? 1 : 0);
    weight += 0.15;
  }
  if (wo.suburb && site.suburb) {
    score += 0.25 * jaroWinkler(wo.suburb, site.suburb);
    weight += 0.25;
  }
  if (wo.unit || site.unit) {
    score += 0.05 * (wo.unit === site.unit ? 1 : 0);
    weight += 0.05;
  }

  if (!weight) return 0;
  let s = score / weight;

  if (wo.number && site.number) s = Math.min(1, s + 0.03);
  else if (wo.number !== site.number) s *= 0.9;

  if (wo.postcode && site.postcode) {
    s = wo.postcode === site.postcode ? Math.min(1, s + 0.02) : s * 0.85;
  }

  return s;
}

/** All address strings a candidate can be matched against (name + structured). */
function candidateAddressStrings(site: SiteCandidateInput): string[] {
  const out: string[] = [];
  if (site.name) out.push(site.name);
  const a = site.address || {};
  const parts = [a.line, a.city, a.state, a.postcode].filter(Boolean).join(' ');
  if (parts) out.push(parts);
  return out.length ? out : [''];
}

/**
 * Match a work-order address against a pool of candidate sites.
 *   'match'    -> best is safe to use automatically
 *   'review'   -> plausible candidates; queue a human confirm
 *   'no-match' -> treat as a new property (create the site)
 */
export function matchSite(
  workOrderAddress: string,
  sites: SiteCandidateInput[],
  opts: MatchOptions = {}
): MatchResult {
  const { acceptAt = 0.93, reviewAt = 0.75, minGap = 0.04 } = opts;
  const wo = normalizeAddress(workOrderAddress);

  const scored: ScoredCandidate[] = sites
    .map((site) => {
      const best = Math.max(
        ...candidateAddressStrings(site).map((str) => scorePair(wo, normalizeAddress(str)))
      );
      return {
        id: site.id,
        name: site.name || '',
        score: Math.round(best * 1000) / 1000,
        customerIds: site.customerIds || [],
        customerName: site.customerName ?? null,
      };
    })
    .filter((c) => c.score >= reviewAt * 0.8)
    .sort((x, y) => y.score - x.score)
    .slice(0, 5);

  const best = scored[0] || null;
  const runnerUp = scored[1] || null;

  let decision: Decision = 'no-match';
  if (best && best.score >= acceptAt && (!runnerUp || best.score - runnerUp.score >= minGap)) {
    decision = 'match';
  } else if (best && best.score >= reviewAt) {
    decision = 'review';
  }

  return { decision, best, candidates: scored, normalizedInput: wo, addressKey: wo.canonical };
}

/**
 * Minimal-change helper: safe terms for Simpro's ?Name=<term>% filter (drops the
 * street type so Blvd/Boulevard can't break the search). Confirm hits with
 * matchSite() before use. Kept for the n8n sites-sync fallback path.
 */
export function buildSearchTerms(workOrderAddress: string): string[] {
  const wo = normalizeAddress(workOrderAddress);
  const terms: string[] = [];
  if (wo.number && wo.streetName) terms.push(`${wo.number} ${wo.streetName}`);
  if (wo.streetName) terms.push(wo.streetName);
  if (wo.number && wo.suburb) terms.push(`${wo.number} ${wo.suburb}`);
  return [...new Set(terms)];
}
