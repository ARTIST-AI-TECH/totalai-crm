# FlowPro — Understanding the FlowProIssues Folder

**Status report & explainer**
**From:** Ady
**To:** Selva
**Date:** 14 July 2026
**Re:** What the Blue and Red flags mean, whether anything is broken, and how we drive the folder toward empty

---

## Summary

- The **FlowProIssues** folder is the automation's *exception queue* — the small number of work orders it deliberately **won't** turn into a job without a human glance. Everything else is now created automatically.
- The two flags mean different things:
  - 🔵 **Blue — `NewJobSiteFound`**: *"This looks like a brand-new property. Someone should create the site."*
  - 🔴 **Red — `NoJobSiteFound`**: *"An existing site looks similar, but not similar enough to be sure. A human should confirm which one before we act."*
- I re-checked the three work orders you asked about against the live system. **All three were flagged correctly**, and all three have since been created in Simpro. There is **no bug** — the folder is the safety net working as designed.
- There is a clear, low-risk path to make this folder almost always empty. It's described at the end.

---

## How the automation decides

For every incoming work order, the system compares the property address against **every existing site in Simpro** and produces a confidence score. Based on that score, one of four things happens:

| Outcome | What it means | Result |
|---|---|---|
| **Exact memory match** | We've filed this exact address before | ✅ Job created automatically |
| **Confident match** (high score, one clear winner) | One existing site clearly fits | ✅ Job created automatically |
| **Possible match** (medium score) | One or more existing sites *look* like it, but none is a safe, unique pick | 🔴 **Red** → FlowProIssues |
| **No match** (low score) | Nothing in Simpro resembles it | 🔵 **Blue** → FlowProIssues |

Only the bottom two land in FlowProIssues. The first two become jobs with no human involvement.

---

## Blue vs. Red — the plain-English version

Think of the automation as a mail carrier learning a new route:

- 🔵 **Blue** is the carrier saying *"there's a new house here that isn't on my map yet — add it."* The address doesn't resemble anything we already have, so it's almost certainly a new property that needs a site created.

- 🔴 **Red** is the carrier saying *"two houses on this street could be the one on the parcel — I'm not going to shove it through the wrong door; tell me which."* An existing site is close enough to be a real possibility, but not close enough to be certain. Rather than risk sending a plumber to the wrong address, the system asks a person to confirm.

The important point: **Red is not the system failing to find a site. It usually means it found one that's *too* similar to a different, existing property, and is refusing to guess.** That refusal is exactly what prevents the mis-filed jobs we used to get.

> A note on the labels: the wording is slightly counter-intuitive. "`NoJobSiteFound`" (Red) sounds like *nothing* was found, but it actually means the opposite — candidates *were* found and need a human to choose between them. We'll make these names clearer in a future update.

---

## Proof: the three work orders you flagged

You gave me three examples. I ran each back through the live system. Here is what existed in Simpro at the moment each was flagged (the confidence score is the similarity to the closest existing property):

| Work order | Closest existing property at the time | Score | Decision | Correct? |
|---|---|---|---|---|
| **1A Randell Road, Morphett Vale** | 1A Grainger Road, Somerton Park | 0.745 | 🔵 Blue — new site | ✅ genuinely new |
| **7 Bristol Lane, Woodville West** | 7 Bristol Crescent, Davoren Park | 0.738 | 🔵 Blue — new site | ✅ genuinely new |
| **9 Bryant Street, Mansfield Park** | **13/9 Bryan Street, Salisbury** *(and 8/9 Brian Street, Salisbury)* | 0.838 | 🔴 Red — review | ✅ a near-twin existed |

What this shows:

- The two **Blue** work orders had *no* existing property close enough to matter (the nearest were different streets — Grainger, Bristol Crescent). Correctly treated as new.
- The **Red** work order had a genuine near-twin already in Simpro: **9 Bryan Street** and **9 Brian Street** in Salisbury — same street number, and a street name just one letter away from "Bryant." That is precisely the situation where auto-creating or auto-matching would be dangerous, so the system correctly asked for a human check.

All three properties have since been created in Simpro (their site records are sequential, confirming they were added right after being flagged), and the system now recognises all three automatically. **The loop closed exactly as intended.**

---

## Is anything broken?

**No.** Every flag in your examples was the correct decision. The Red flag on "9 Bryant Street" is the clearest possible illustration of *why* the folder exists: without it, the job could have been filed against "9 Bryan Street, Salisbury" — a real, different address across town.

The ratio you're seeing (a large majority auto-filed, only a handful in FlowProIssues) is the system performing as designed — and, as you noted, dramatically better than the previous tool.

---

## The road to an (almost) empty FlowProIssues folder

Three levers, in order of impact:

1. **Turn on automatic site creation for Blue.**
   Blue means "genuinely new property." Once we've confirmed a first batch of Blue flags really are new (a quick check against Simpro), we can let the automation **create the new site and the job automatically** for the Blue cases. A ready-to-go version of the workflow already does this — and, critically, it *still* sends Red cases to a human. This removes the bulk of the folder in one step, with no risk of creating duplicates of existing sites.

2. **Let the memory keep growing so Red shrinks on its own.**
   Every time a property is filed, the system remembers it — and remembers which managing agency it belongs to. That agency memory is what lets it break "near-twin" ties automatically in future. As it fills in, cases that are Red today will resolve on their own tomorrow.

3. **Clean up duplicate site records in Simpro over time.**
   Some Reds are caused by the same property existing twice in Simpro. Tidying those at the source removes those flags permanently.

**What will always remain** is a small, healthy trickle of Red — the genuinely ambiguous cases (a real near-twin address, a work order missing its suburb). Those *should* get a five-second human glance. That residue isn't a failure; it's the guarantee that a job never goes to the wrong door.

---

## One recommended improvement

When a person resolves a FlowProIssues item today, they typically create the site **directly in Simpro**. That works — but the automation only learns about it *passively*, on the next hourly sync, and it never records the agency link that helps prevent future Reds.

**Recommendation:** wire the human resolution step so that confirming/creating a site also **teaches the automation** the address and its agency. This makes the memory grow every time a person touches the folder — which is exactly what makes the folder get smaller over time.

---

## What we need before turning on auto-creation

One confirmation, that's all: **spot-check the current Blue flags against Simpro to be sure they are genuinely new properties** (not existing sites the system happened to miss). Once we're satisfied Blue is trustworthy — and the evidence above says it is — we flip on automatic creation for Blue, keep Red going to a person, and the folder becomes the small exception queue it was always meant to be.

Happy to walk through any of this live.

— Ady
