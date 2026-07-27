# Transition & Separation Memorandum — FlowPro / Platinum Plumbing

**Draft for discussion — plain-language. Have a solicitor review the IP and release clauses before signing.**
*Placeholders in [brackets] to complete.*

**Between:** [Ady Full Name] ("Ady") and [Selva Full Name] / TotalAI [Pty Ltd] ("TotalAI").
**Date:** [date]
**Re:** Orderly transition of the Platinum Plumbing & Gas ("PPG") FlowPro automation, and clarification of ownership going forward.

---

## 1. Background

Over approximately the last eight months, Ady (technology) and Selva/TotalAI (business/client relationship) collaborated informally — without a written contract — to build and run an automation ("FlowPro") that files PPG's Tapi work orders into Simpro. The arrangement anticipated growth to multiple clients on retainer; in practice it has served a single client. Both parties now wish to wind the collaboration down cleanly and professionally.

## 2. Intent

This memo records a **clean separation**: TotalAI takes over the PPG operation and all future support of it; Ady retains the underlying platform and intellectual property and steps away from any ongoing obligation. No party is "held hostage," and the client's service continues without interruption.

## 3. What Ady retains (intellectual property)

Ady is and remains the sole owner of the **FlowPro platform**, including:
- the **"FlowPro" name and brand** (originated by Ady);
- the **CRM/application codebase** and its repositories;
- the **address-resolution engine** and its architecture (the Simpro mirror, the learned address→site memory, the fuzzy matcher, agency disambiguation, and duplicate-site handling — the "brain");
- all concepts, methods, and know-how embodied in the above.

Ady may **reuse, adapt, relicense, and commercialize** the platform freely, in any market (including derivative products for other industries or regions). Nothing in this memo grants TotalAI any right to the retained IP beyond the limited operational handover in Section 4.

## 4. What transfers to TotalAI (the PPG operation)

TotalAI receives, for the purpose of continuing to serve PPG:
- the **standalone handover workflows** (`handover/` package) — the self-contained n8n automation that runs without Ady's hosting or the retained "brain";
- responsibility for **hosting** the automation on TotalAI's own infrastructure;
- responsibility for the **client-specific configuration and credentials** (Simpro, Outlook, Twilio) for PPG.

This is an operational handover of **one client's deployment**. It does **not** include the retained IP in Section 3. TotalAI's use of the handover workflows is limited to serving PPG.

## 5. Support cut-over

- Ady will provide the handover materials (this memo, the handover package, and the case-study documentation) by [date].
- From **[cut-over date]**, Ady has **no support, maintenance, on-call, or availability obligation** for PPG or any TotalAI client. All support requests, incidents, and client communications are TotalAI's responsibility from that date.
- Ady will make himself available for **[e.g. one] handover call of up to [e.g. 60 minutes]** before the cut-over date to walk through the package. Any assistance beyond that is at Ady's sole discretion and separately quoted.

## 6. Settlement of accrued support

Under the original arrangement, ongoing support was to be funded by the client's monthly fee, which has not been collected. In settlement of Ady's accrued, uncompensated support to date, **TotalAI will pay Ady a one-time amount of $[1,500–2,000] [AUD/USD]**, due by [date].

Aside from this one-time settlement, **no other payment is owed by either party** — there is no transfer fee, no retainer, no ongoing licence, and no revenue share. This is a full and clean financial break.

## 7. No ongoing relationship

The parties are not partners, employees, or agents of one another and will not be after the cut-over date. There is no non-compete, non-solicit, or exclusivity binding Ady; he is free to pursue related products and clients. Likewise TotalAI is free to operate and grow the PPG relationship (and others) using its own resources and the handover package, within the limits of Section 4.

## 8. Mutual release

Effective on receipt of the Section 6 settlement, each party releases the other from any and all claims arising out of the collaboration to date, except the obligations expressly stated in this memo. Each party is responsible for its own taxes and expenses.

## 9. Professional conduct

Both parties will conduct the wind-down professionally, keep each other's confidential information confidential, and refrain from disparagement. The client experience will be protected throughout.

## 10. Deliverables (attached / referenced)

- This Separation Memorandum.
- `handover/` — standalone workflow package + `HANDOVER-PACKAGE.md`.
- `docs/FLOWPRO-CASE-STUDY.md` — engineering case study & handover documentation.

---

*Signatures*

Ady: ______________________  Date: __________

Selva / TotalAI: ______________________  Date: __________

---

> **Note (not legal advice):** This is a plain-language draft to align on terms. Because it involves IP ownership, a client relationship, and a release of claims, have a qualified solicitor (AU, given TotalAI/PPG) review — particularly Sections 3, 4, and 8 — before signing. A short professionally-reviewed agreement here is cheap insurance against a messy dispute later.
