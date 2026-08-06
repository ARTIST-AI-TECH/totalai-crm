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

The PPG operation transfers **in place, running**: TotalAI takes over the existing n8n automation server (hosted on the UpCloud account TotalAI manages) with its workflows, configuration, and execution history intact. Specifically, TotalAI receives:

- **operational control of the n8n instance** (owner login handed over; TotalAI changes the credentials on day one) and the server it runs on;
- the **handover package** (`FlowPro-Handover-TotalAI-2026-08.zip`): standalone fallback workflows, setup guide, operator runbook, address-reference data, expectations documentation, and the cutover checklist;
- responsibility for the **client-specific configuration, credentials, and upstream accounts** (Simpro, Outlook, Twilio) for PPG, including moving the instance's hostname off Ady's domain per the cutover checklist;
- responsibility for **hosting and operating** the automation from the cut-over date.

This is an operational handover of **one client's deployment**. It does **not** include the retained IP in Section 3 or the Smart-Matching Service engine (Section 7). TotalAI's use of the handover workflows is limited to serving PPG.

## 5. Support cut-over

- Ady will provide the handover materials (this memo and the handover package) by [date].
- From **[cut-over date]**, Ady has **no support, maintenance, on-call, or availability obligation** for PPG or any TotalAI client. All support requests, incidents, and client communications are TotalAI's responsibility from that date.
- Ady will make himself available for **[e.g. one] handover call of up to [e.g. 60 minutes]** at the cut-over to walk through the system and rehearse the standalone-fallback procedure. Any assistance beyond that is at Ady's sole discretion and separately quoted.
- For the **first 30 days after cut-over**, the Smart-Matching Service (Section 7) remains connected at no charge so the operation is uninterrupted while TotalAI decides whether to subscribe. This transition courtesy does not create any support obligation beyond keeping that service reachable, and does not affect Section 6 in any way.

## 6. Settlement of accrued support

Under the original arrangement, ongoing support was to be funded by the client's monthly maintenance/retainer fee, which has not been collected for over three months. In settlement of Ady's accrued, uncompensated support to date, **TotalAI will pay Ady a one-time amount of $1,750 USD**, due by [date].

**This settlement is unconditional.** It is owed regardless of whether TotalAI elects the Smart-Matching Service (Section 7), and it is not reduced, offset, or replaced by any other element of this memo or the handover package.

Aside from this one-time settlement, no other payment is owed by either party **under this memo** — there is no transfer fee, no retainer, no ongoing licence, and no revenue share. Any Smart-Matching Service subscription (Section 7) is a separate, optional, forward-looking arrangement, not a payment under this memo.

## 7. The Smart-Matching Service (optional, separate)

The address-resolution engine described in Section 3 (the "Smart-Matching Service") currently serves the PPG workflows from Ady's separate infrastructure. It is **not part of the handover**. Going forward TotalAI may, at its option:

- **subscribe** to it as a normal vendor service — **$150 USD per month** (a locked rate for TotalAI, discounted from the standard $200/month in recognition of the existing relationship; the rate does not increase while the subscription remains continuously active), month-to-month, cancellable by TotalAI on 30 days' notice, terminable by Ady on no less than 90 days' notice, with the documented standalone fallback applying in either case; scope and boundaries per the appendix `50-smart-matching-service/SMART-MATCHING-SERVICE.md` in the handover package, confirmed in a one-page service agreement if elected; or
- **decline it**, in which case the standalone fallback in the handover package is activated (a documented ~30-minute procedure) and Ady decommissions the Service's infrastructure for PPG.

The decision is TotalAI's alone, to be made within the 30-day window in Section 5. Declining the Service does not diminish the completeness of the handover (Section 4), and electing it does not alter the settlement (Section 6) or revive any partnership obligation (Section 8).

## 8. No ongoing relationship

The parties are not partners, employees, or agents of one another and will not be after the cut-over date. There is no non-compete, non-solicit, or exclusivity binding Ady; he is free to pursue related products and clients. Likewise TotalAI is free to operate and grow the PPG relationship (and others) using its own resources and the handover package, within the limits of Section 4.

## 9. Mutual release

Effective on receipt of the Section 6 settlement, each party releases the other from any and all claims arising out of the collaboration to date, except the obligations expressly stated in this memo. Each party is responsible for its own taxes and expenses.

## 10. Professional conduct

Both parties will conduct the wind-down professionally, keep each other's confidential information confidential, and refrain from disparagement. The client experience will be protected throughout.

## 11. Deliverables (attached / referenced)

- This Separation Memorandum.
- `FlowPro-Handover-TotalAI-2026-08.zip` — the handover package (workflows, runbooks, reference data, cutover checklist, Smart-Matching Service appendix).

---

*Signatures*

Ady: ______________________  Date: __________

Selva / TotalAI: ______________________  Date: __________

---

> **Note (not legal advice):** This is a plain-language draft to align on terms. Because it involves IP ownership, a client relationship, and a release of claims, have a qualified solicitor (AU, given TotalAI/PPG) review — particularly Sections 3, 4, 7, and 9 — before signing. A short professionally-reviewed agreement here is cheap insurance against a messy dispute later.
