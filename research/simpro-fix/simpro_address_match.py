"""
FlowPro — Simpro site address matcher (Python port)
---------------------------------------------------
Zero-dependency module that matches a free-text work-order address
(e.g. "46 Emerald Blvd, Aldinga Beach") against Simpro sites
(e.g. {"ID": 101, "Name": "46 Emerald Boulevard, Aldinga Beach",
       "Address": {"Address": "46 Emerald Boulevard", "City": "Aldinga Beach",
                   "State": "SA", "PostalCode": "5173"}}).

Why: Simpro's API has NO fuzzy search (confirmed by Simpro partnerships).
Normalize + match on OUR side instead.

Usage:
    from simpro_address_match import match_site, normalize_address, build_search_terms

    result = match_site("46 Emerald Blvd, Aldinga Beach", sites)
    # result["decision"] in ("match", "review", "no-match")

Self-test:  python3 simpro_address_match.py
"""

import re

# ---------------------------------------------------------------------------
# 1. Australian street-type abbreviations (Australia Post / AS/NZS 4819 / GNAF)
# ---------------------------------------------------------------------------
STREET_TYPES = {
    "alley": ["ally", "al"],
    "approach": ["app", "apch"],
    "arcade": ["arc"],
    "avenue": ["ave", "av", "avn", "avenu"],
    "bend": ["bnd"],
    "boulevard": ["blvd", "bvd", "blv", "boul", "boulevarde", "bvde", "blvde", "bde"],
    "brace": ["brce"],
    "break": ["brk"],
    "broadway": ["bdwy", "bway"],
    "bypass": ["bypa", "byp"],
    "causeway": ["cway", "cswy"],
    "chase": ["ch", "cha"],
    "circle": ["cir", "ccl"],
    "circuit": ["cct", "crct"],
    "close": ["cl"],
    "common": ["cmmn", "comm"],
    "concourse": ["con", "cnc"],
    "corner": ["crn", "cnr"],
    "corso": ["cso"],
    "court": ["ct", "crt"],
    "cove": ["cve"],
    "crescent": ["cres", "cr", "crs", "crsnt", "cresent"],
    "crest": ["crst", "cst"],
    "crossing": ["crsg", "xing"],
    "drive": ["dr", "drv", "dve"],
    "driveway": ["drwy", "dvwy"],
    "edge": ["edg"],
    "elbow": ["elb"],
    "entrance": ["ent"],
    "esplanade": ["esp", "espl"],
    "expressway": ["exp", "expy", "xway"],
    "fairway": ["fawy"],
    "freeway": ["fwy", "frwy"],
    "frontage": ["frtg", "fr"],
    "gardens": ["gdns", "gdn"],
    "gate": ["gte"],
    "gateway": ["gwy", "gtwy"],
    "glade": ["glde", "gld"],
    "glen": ["gln"],
    "grange": ["gra", "grge"],
    "green": ["grn"],
    "grove": ["gr", "grv", "gve"],
    "heights": ["hts", "hgts"],
    "highway": ["hwy", "hway", "hiway"],
    "hill": ["hl"],
    "junction": ["jnc", "junc", "jctn", "jct"],
    "key": ["ky"],
    "landing": ["ldg", "lndg"],
    "lane": ["ln", "la"],
    "laneway": ["lnwy"],
    "link": ["lnk", "lk"],
    "lookout": ["lkt", "lookt"],
    "loop": ["lp"],
    "mall": ["ml"],
    "meander": ["mndr", "mr", "mdr"],
    "mews": ["mws", "mw"],
    "motorway": ["mwy", "mtwy"],
    "nook": ["nk"],
    "outlook": ["otlk", "out"],
    "parade": ["pde", "prde", "par"],
    "parkway": ["pwy", "pkwy", "pky"],
    "pass": ["ps"],
    "passage": ["psge"],
    "pathway": ["pway", "phwy", "pthwy"],
    "place": ["pl", "plce"],
    "plaza": ["plza", "plz"],
    "pocket": ["pkt", "pckt"],
    "point": ["pnt", "pt"],
    "promenade": ["prom", "pmnd"],
    "quadrant": ["qdrt", "quad"],
    "quay": ["qy"],
    "quays": ["qys"],
    "ramble": ["rmbl", "ra"],
    "reserve": ["res", "rsv"],
    "rest": ["rst"],
    "retreat": ["rtt", "rt"],
    "ridge": ["rdge", "rdg"],
    "rise": ["ri", "rse"],
    "road": ["rd"],
    "rotary": ["rty", "rtry"],
    "row": ["rw"],
    "run": ["rn"],
    "square": ["sq", "sqr"],
    "street": ["st", "str", "strt"],
    "strip": ["strp"],
    "subway": ["sbwy", "sub"],
    "terrace": ["tce", "ter", "terr"],
    "track": ["trk", "trck"],
    "trail": ["trl", "tr"],
    "turn": ["tn", "trn"],
    "vale": ["va"],
    "view": ["vw", "vws"],
    "vista": ["vsta", "vst"],
    "walk": ["wlk", "wk"],
    "walkway": ["wkwy", "wwy"],
    "waters": ["wtrs"],
    "waterway": ["wry", "wtwy"],
    "way": ["wy"],
    "wharf": ["whrf", "whf"],
    "yard": ["yd", "yrd"],
}

STREET_TYPE_LOOKUP = {}
for canonical, abbrs in STREET_TYPES.items():
    STREET_TYPE_LOOKUP[canonical] = canonical
    for a in abbrs:
        STREET_TYPE_LOOKUP[a] = canonical
STREET_TYPE_WORDS = set(STREET_TYPES.keys())

AU_STATES = {"nsw", "vic", "qld", "sa", "wa", "tas", "nt", "act"}
NOISE_WORDS = {"australia", "aus", "au"}
# Cardinal suffixes appear AFTER the street type ("Esplanade Sth", "Railway Pde N").
DIRECTIONALS = {"n": "north", "s": "south", "e": "east", "w": "west",
                "ne": "north east", "nw": "north west", "se": "south east", "sw": "south west",
                "nth": "north", "sth": "south"}


# ---------------------------------------------------------------------------
# 2. Normalization
# ---------------------------------------------------------------------------
def normalize_address(raw):
    empty = {"unit": "", "number": "", "street_name": "", "street_type": "",
             "suburb": "", "postcode": "", "tokens": [], "canonical": ""}
    if not raw:
        return empty

    s = re.sub(r"[.,;:()'\"]", " ", str(raw).lower())
    s = re.sub(r"\s+", " ", s).strip()

    unit = ""
    m = re.search(r"\b(?:unit|u|flat|apt|apartment|shop|suite|lot)\s*(\w+)\s*[/\s]\s*(\d+\w?)\b", s)
    if m:
        unit = m.group(1)
        s = s.replace(m.group(0), f" {m.group(2)} ")
    else:
        m = re.search(r"\b(\d+\w?)\s*/\s*(\d+\w?)\b", s)
        if m:
            unit = m.group(1)
            s = s.replace(m.group(0), f" {m.group(2)} ")

    tokens = re.sub(r"\s+", " ", s).strip().split(" ")
    tokens = [t for t in tokens if t]

    postcode = ""
    kept = []
    for i, t in enumerate(tokens):
        if re.fullmatch(r"\d{4}", t) and i > 0:
            postcode = t
            continue
        if t in AU_STATES or t in NOISE_WORDS:
            continue
        kept.append(t)
    tokens = kept

    number = ""
    for i, t in enumerate(tokens):
        if re.match(r"^\d", t):
            number = re.sub(r"[^0-9a-z-]", "", t)
            tokens.pop(i)
            break

    out = []
    for i, t in enumerate(tokens):
        if t in ("st", "str") and i == 0:
            out.append("saint")  # "St Kilda" etc.
        else:
            out.append(STREET_TYPE_LOOKUP.get(t, t))
    tokens = out

    street_type = ""
    street_name = ""
    suburb = ""
    type_idx = next((i for i, t in enumerate(tokens) if t in STREET_TYPE_WORDS), -1)
    if type_idx != -1:
        street_type = tokens[type_idx]
        street_name = " ".join(tokens[:type_idx])
        rest = tokens[type_idx + 1:]
        # Expand a cardinal suffix right after the type in place so "Pde Sth ..."
        # and "Parade South ..." normalize identically on both sides.
        if rest and rest[0] in DIRECTIONALS and len(rest[0]) <= 3:
            rest[0] = DIRECTIONALS[rest[0]]
        suburb = " ".join(rest)
    else:
        street_name = " ".join(tokens)
    # "St Kilda" in the suburb position expands to "street kilda" above; flip a
    # leading "street" back to "saint" so it aligns with "Saint Kilda".
    if suburb.startswith("street "):
        suburb = "saint " + suburb[7:]

    canonical = " ".join(x for x in [f"u{unit}" if unit else "", number, street_name, street_type, suburb] if x)
    return {"unit": unit, "number": number, "street_name": street_name,
            "street_type": street_type, "suburb": suburb, "postcode": postcode,
            "tokens": tokens, "canonical": canonical}


# ---------------------------------------------------------------------------
# 3. Jaro-Winkler similarity
# ---------------------------------------------------------------------------
def jaro_winkler(a, b):
    if a == b:
        return 1.0
    if not a or not b:
        return 0.0
    window = max(0, max(len(a), len(b)) // 2 - 1)
    a_m = [False] * len(a)
    b_m = [False] * len(b)
    matches = 0
    for i, ca in enumerate(a):
        lo, hi = max(0, i - window), min(len(b) - 1, i + window)
        for j in range(lo, hi + 1):
            if not b_m[j] and ca == b[j]:
                a_m[i] = b_m[j] = True
                matches += 1
                break
    if not matches:
        return 0.0
    t = 0
    k = 0
    for i, ca in enumerate(a):
        if not a_m[i]:
            continue
        while not b_m[k]:
            k += 1
        if ca != b[k]:
            t += 1
        k += 1
    t /= 2
    jaro = (matches / len(a) + matches / len(b) + (matches - t) / matches) / 3
    prefix = 0
    for ca, cb in zip(a[:4], b[:4]):
        if ca == cb:
            prefix += 1
        else:
            break
    return jaro + prefix * 0.1 * (1 - jaro)


# ---------------------------------------------------------------------------
# 4. Matching
# ---------------------------------------------------------------------------
def numbers_match(a, b):
    """Range-aware street-number comparison: '12-14' matches '12'..'14' and '12-14';
    '46a' matches only '46a' (suffix letters must agree when both present)."""
    if a == b:
        return True
    def parse(n):
        m = re.fullmatch(r"(\d+)(?:-(\d+))?([a-z]*)", n)
        if not m:
            return None
        lo = int(m.group(1))
        return {"lo": lo, "hi": int(m.group(2)) if m.group(2) else lo, "suffix": m.group(3)}
    pa, pb = parse(a), parse(b)
    if not pa or not pb:
        return False
    if pa["suffix"] and pb["suffix"] and pa["suffix"] != pb["suffix"]:
        return False
    return pa["lo"] <= pb["hi"] and pb["lo"] <= pa["hi"]


def score_pair(wo, site):
    if wo["number"] and site["number"] and not numbers_match(wo["number"], site["number"]):
        return 0.0

    score = 0.0
    weight = 0.0
    if wo["street_name"] and site["street_name"]:
        score += 0.55 * jaro_winkler(wo["street_name"], site["street_name"])
        weight += 0.55
    if wo["street_type"] and site["street_type"]:
        score += 0.15 * (1.0 if wo["street_type"] == site["street_type"] else 0.0)
        weight += 0.15
    if wo["suburb"] and site["suburb"]:
        score += 0.25 * jaro_winkler(wo["suburb"], site["suburb"])
        weight += 0.25
    if wo["unit"] or site["unit"]:
        score += 0.05 * (1.0 if wo["unit"] == site["unit"] else 0.0)
        weight += 0.05

    if not weight:
        return 0.0
    s = score / weight
    if wo["number"] and site["number"]:
        s = min(1.0, s + 0.03)
    elif wo["number"] != site["number"]:
        s *= 0.9

    # Postcode is a soft anchor: agreement adds confidence, disagreement dents
    # it (people write neighbouring/old suburbs — never a hard veto).
    if wo["postcode"] and site["postcode"]:
        s = min(1.0, s + 0.02) if wo["postcode"] == site["postcode"] else s * 0.85

    return s


def _site_address_strings(site):
    out = []
    if site.get("Name"):
        out.append(site["Name"])
    a = site.get("Address") or {}
    parts = " ".join(str(x) for x in [a.get("Address"), a.get("City"), a.get("State"), a.get("PostalCode")] if x)
    if parts:
        out.append(parts)
    return out or [""]


def match_site(work_order_address, sites, accept_at=0.93, review_at=0.75, min_gap=0.04):
    """Returns {"decision": "match"|"review"|"no-match", "best": {...}, "candidates": [...]}"""
    wo = normalize_address(work_order_address)

    scored = []
    for site in sites:
        best = max(score_pair(wo, normalize_address(s)) for s in _site_address_strings(site))
        if best >= review_at * 0.8:
            scored.append({"site": site, "score": round(best, 3)})
    scored.sort(key=lambda c: -c["score"])
    scored = scored[:5]

    best = scored[0] if scored else None
    runner_up = scored[1] if len(scored) > 1 else None

    decision = "no-match"
    if best and best["score"] >= accept_at and (not runner_up or best["score"] - runner_up["score"] >= min_gap):
        decision = "match"
    elif best and best["score"] >= review_at:
        decision = "review"

    return {"decision": decision, "best": best, "candidates": scored, "normalized_input": wo}


def build_search_terms(work_order_address):
    """Safe terms for Simpro's ?search= — street type dropped so Blvd/Boulevard can't break it."""
    wo = normalize_address(work_order_address)
    terms = []
    if wo["number"] and wo["street_name"]:
        terms.append(f"{wo['number']} {wo['street_name']}")
    if wo["street_name"]:
        terms.append(wo["street_name"])
    if wo["number"] and wo["suburb"]:
        terms.append(f"{wo['number']} {wo['suburb']}")
    seen = set()
    return [t for t in terms if not (t in seen or seen.add(t))]


# ---------------------------------------------------------------------------
# 5. Self-test
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    sites = [
        {"ID": 101, "Name": "46 Emerald Boulevard, Aldinga Beach", "Address": {"Address": "46 Emerald Boulevard", "City": "Aldinga Beach", "State": "SA", "PostalCode": "5173"}},
        {"ID": 102, "Name": "48 Emerald Boulevard, Aldinga Beach", "Address": {"Address": "48 Emerald Boulevard", "City": "Aldinga Beach", "State": "SA", "PostalCode": "5173"}},
        {"ID": 103, "Name": "46 Emerald Street, Morphett Vale", "Address": {"Address": "46 Emerald Street", "City": "Morphett Vale", "State": "SA", "PostalCode": "5162"}},
        {"ID": 104, "Name": "12 Jade Loop, Aldinga Beach", "Address": {"Address": "12 Jade Loop", "City": "Aldinga Beach", "State": "SA", "PostalCode": "5173"}},
        {"ID": 105, "Name": "Unit 2, 7 Sapphire Way, Aldinga Beach", "Address": {"Address": "2/7 Sapphire Way", "City": "Aldinga Beach", "State": "SA", "PostalCode": "5173"}},
        {"ID": 106, "Name": "12-14 Ochre Drive, Aldinga Beach", "Address": {"Address": "12-14 Ochre Drive", "City": "Aldinga Beach", "State": "SA", "PostalCode": "5173"}},
        {"ID": 107, "Name": "The Esplanade South, Port Noarlunga", "Address": {"Address": "The Esplanade South", "City": "Port Noarlunga", "State": "SA", "PostalCode": "5167"}},
    ]

    cases = [
        ("46 Emerald Blvd, Aldinga Beach SA 5173", "match", 101),
        ("46 Emerald Blvd Aldinga Beach", "match", 101),
        ("46 Emerald Bvd, Aldinga Beach", "match", 101),
        ("46 Emerald Boulevarde, Aldinga Beach", "match", 101),
        ("46 emerald boulevard aldinga beach", "match", 101),
        ("46 Emerald Blvd", "match", 101),
        ("48 Emerald Blvd, Aldinga Beach", "match", 102),
        ("46 Emerald St, Morphett Vale", "match", 103),
        ("2/7 Sapphire Way, Aldinga Beach", "match", 105),
        ("Unit 2, 7 Sapphire Wy, Aldinga Beach", "match", 105),
        ("99 Nonexistent Rd, Adelaide", "no-match", None),
        ("14 Ochre Dr, Aldinga Beach", "match", 106),
        ("12-14 Ochre Drv Aldinga Beach", "match", 106),
        ("The Esplanade Sth, Port Noarlunga", "match", 107),
    ]

    passed = 0
    for inp, want_decision, want_id in cases:
        r = match_site(inp, sites)
        got_id = r["best"]["site"]["ID"] if r["best"] else None
        ok = r["decision"] == want_decision and (want_decision == "no-match" or got_id == want_id)
        score = r["best"]["score"] if r["best"] else "-"
        print(f"{'PASS' if ok else 'FAIL'}  \"{inp}\" -> {r['decision']} site={got_id} score={score} (want {want_decision}/{want_id})")
        passed += ok
    print(f"\n{passed}/{len(cases)} passed")
    print("\nsearch terms:", build_search_terms("46 Emerald Blvd, Aldinga Beach SA 5173"))
    raise SystemExit(0 if passed == len(cases) else 1)
