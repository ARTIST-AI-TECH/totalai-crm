FlowPro -> Simpro: site address matching fix package
=====================================================
Prepared by Selva / Total AI, 9 July 2026

READ IN THIS ORDER:
1. N8N-IMPLEMENTATION.md ............ node-by-node n8n guide (START HERE)
2. SOLUTION-site-address-matching.md  verified Simpro API reference & why
                                      the current lookup + Noam's workaround fail
3. n8n-code-node-matcher.js ......... PASTE THIS into an n8n Code node
                                      (JavaScript, "Run Once for All Items",
                                      edit the 3 CONFIG lines at the top)

Reference implementations (same logic, for testing outside n8n):
- simpro-address-match.js ........... Node.js module; run `node simpro-address-match.js` for self-tests
- simpro_address_match.py .......... Python port; run `python3 simpro_address_match.py`

The 10-minute quick win is section 3 of N8N-IMPLEMENTATION.md.
The critical bug-fix for site creation (the missing "Customers" array)
is section 2 of SOLUTION-site-address-matching.md.
