# TOTFL Parallel Execution Guide

## 🚀 Overview

Run **5 concurrent Claude Code sessions** to accelerate TOTFL integration from **9-10 days → 2-3 days** (70% time savings).

**GitHub Issues:** https://github.com/Badou-AI/flowforge-coach-97/issues
**Total Issues:** 24 issues across 4 epics
**Strategy:** Git worktrees + parallel Claude sessions

---

## 📋 Prerequisites

### 1. Run Worktree Setup Script
```bash
cd /Users/adjidiortraore/Code/top-of-the-flow-dev
./scripts/setup-worktrees.sh
```

This creates 18 separate worktrees in `/Users/adjidiortraore/Code/totfl-worktrees/`

### 2. Verify Worktrees Created
```bash
git worktree list
```

Should show 18+ worktrees, each on separate feature branch.

---

## 🎯 Parallel Execution Waves

### Wave 1: UI Foundation (Day 1 - 5 parallel sessions)

**Session 1** - Dashboard (Issue #3)
```bash
# Terminal 1
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-dashboard-components
claude code .

# In Claude Code:
# "Implement GitHub issue Badou-AI/flowforge-coach-97#3 - Port Dashboard Components"
```

**Session 2** - Coach UI (Issue #4)
```bash
# Terminal 2
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-coach-ui
claude code .

# In Claude Code:
# "Implement GitHub issue Badou-AI/flowforge-coach-97#4 - Port AI Voice Coach UI"
```

**Session 3** - Questions UI (Issue #5)
```bash
# Terminal 3
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-questions-ui
claude code .

# In Claude Code:
# "Implement GitHub issue Badou-AI/flowforge-coach-97#5 - Port 99 Questions Assessment"
```

**Session 4** - Pitch Practice (Issue #7) ⭐
```bash
# Terminal 4
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-pitch-practice
claude code .

# In Claude Code:
# "Implement GitHub issue Badou-AI/flowforge-coach-97#7 - Port Pitch Practice Feature"
```

**Session 5** - Database Schema (Issue #14) 🔥
```bash
# Terminal 5
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-database-schema
claude code .

# In Claude Code:
# "Implement GitHub issue Badou-AI/flowforge-coach-97#14 - Create Supabase Database Schema"
```

**Estimated:** 4-8 hours (parallel), longest is Database (4h) + OpenAI (8h)

---

### Wave 2: Remaining UI (Day 1-2 - 4 parallel sessions)

**Session 1** - Documents UI (Issue #6)
```bash
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-documents-ui
claude code .
# "Implement issue #6 - Port Documents Library & Viewer"
```

**Session 2** - Project Wizard (Issue #11)
```bash
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-project-wizard
claude code .
# "Implement issue #11 - Port Project Creation Wizard"
```

**Session 3** - Layout Merge (Issue #12)
```bash
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-layout-merge
claude code .
# "Implement issue #12 - Merge Lovable & Existing Layout Systems"
```

**Session 4** - Theme (Issue #13)
```bash
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-theme-consistency
claude code .
# "Implement issue #13 - Theme & Styling Consistency"
```

**Estimated:** 3-6 hours (parallel)

---

### Wave 3: Backend Integration (Day 2-3 - 4 parallel sessions)

**Session 1** - Auth Wiring (Issue #18) 🔥
```bash
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-auth-wiring
claude code .
# "Implement issue #18 - Connect Lovable UI to JWT System"
```

**Session 2** - n8n Integration (Issue #27)
```bash
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-n8n-integration
claude code .
# "Implement issue #27 - n8n Document Generation Integration"
```

**Session 3** - OpenAI Realtime (Issue #16)
```bash
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-openai-realtime
claude code .
# "Implement issue #16 - OpenAI Realtime API Integration"
```

**Session 4** - Gemini KB (Issue #17)
```bash
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-gemini-kb
claude code .
# "Implement issue #17 - Gemini Knowledge Base Integration"
```

**Estimated:** 6-8 hours (parallel), longest is OpenAI Realtime (8h)

---

### Wave 4: Premium & Quota (Day 3 - 2 parallel sessions)

**Session 1** - Stripe Premium (Issue #19)
```bash
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-stripe-premium
claude code .
# "Implement issue #19 - Stripe Premium Feature Gating"
```

**Session 2** - Voice Quota (Issue #20)
```bash
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-voice-quota
claude code .
# "Implement issue #20 - Voice Quota Management System"
```

**Estimated:** 4-5 hours (parallel)

---

### Wave 5: Testing & Polish (Day 4 - 3 sessions)

**Session 1** - E2E Testing (Issue #22)
```bash
cd /Users/adjidiortraore/Code/top-of-the-flow-dev
# Work on develop branch
# "Implement issue #22 - End-to-End Testing"
```

**Session 2** - Mobile (Issue #23)
```bash
# "Implement issue #23 - Mobile Responsive Refinement"
```

**Session 3** - Performance (Issue #24)
```bash
# "Implement issue #24 - Performance Optimization"
```

**Estimated:** 3-6 hours (parallel)

---

## 🔄 PR & Merge Strategy

### After Each Feature Complete:

```bash
# 1. Commit changes in worktree
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-dashboard-components
git add -A
git commit -m "feat(ui): add dashboard components from Lovable

- Add CurrentProjectCard, PhaseJourney, ProjectsGrid
- Add DailyCoachingWidget, QuickActions, RecentAchievements
- Convert React Router to Next.js Link
- Add 'use client' directives
- Update dashboard page

Resolves #3"

# 2. Push to GitHub
git push -u origin feature/dashboard-components

# 3. Create PR to develop
gh pr create \
  --repo Badou-AI/flowforge-coach-97 \
  --base develop \
  --title "feat(ui): add dashboard components from Lovable" \
  --body "Resolves #3

## Changes
- Ported 6 dashboard components
- Converted React Router to Next.js
- Added client directives
- Updated dashboard page

## Testing
- ✅ All components render
- ✅ Navigation works
- ✅ Mobile responsive

## Screenshots
[Add screenshots if helpful]"

# 4. Wait for review or auto-merge if you're confident
gh pr merge --auto --squash

# 5. Pull changes to main worktree
cd /Users/adjidiortraore/Code/top-of-the-flow-dev
git checkout develop
git pull origin develop
```

---

## 🎭 Session Coordination Strategy

### Option A: Sequential Merges (Safer)
1. Complete Wave 1 features
2. Merge all Wave 1 PRs to develop
3. Test integrated develop branch
4. Start Wave 2
5. Repeat

**Pros:** Less merge conflicts, easier to debug
**Cons:** Slower (waves can't overlap)

### Option B: Continuous Integration (Faster)
1. Work on all waves simultaneously
2. Merge PRs as they complete (regardless of wave)
3. Develop branch continuously updated
4. Each session pulls latest develop regularly

**Pros:** Faster, truly parallel
**Cons:** More merge conflicts possible

**Recommended:** **Option B** with these rules:
- Pull from develop before starting work each day
- Create small, focused PRs
- Merge frequently (don't let PRs sit)
- Communicate conflicts in shared doc

---

## 🛡️ Conflict Prevention

### File Ownership Map

| Feature | Primary Files | Potential Conflicts |
|---------|---------------|---------------------|
| Dashboard | components/dashboard/*, app/(dashboard)/page.tsx | None expected |
| Coach | components/coaching/*, app/(dashboard)/coach/page.tsx | VoiceRecorder.ts (also used by Pitch) |
| Questions | components/game/*, app/(dashboard)/questions/page.tsx | None |
| Documents | components/documents/*, app/(dashboard)/documents/* | None |
| Pitch Practice | components/pitch-practice/*, app/(dashboard)/pitch-practice/* | VoiceRecorder.ts (shared with Coach) |
| Layout | components/layout/*, app/(dashboard)/layout.tsx | **HIGH CONFLICT RISK** ⚠️ |
| Theme | app/globals.css, tailwind.config.ts | **HIGH CONFLICT RISK** ⚠️ |
| Database | lib/db/schema.ts, lib/db/migrations/* | **MEDIUM CONFLICT RISK** |
| Auth | middleware.ts, lib/auth/* | **LOW CONFLICT (only additions)** |

**Strategy for High-Risk Files:**
- **Layout & Theme:** Do these LAST, after all component work
- **Database:** Do this FIRST, let others pull schema
- **VoiceRecorder:** Extract to shared utils early

---

## 📊 Progress Tracking

### GitHub Issue Board View
```bash
# View all issues
gh issue list --repo Badou-AI/flowforge-coach-97

# View by label
gh issue list --repo Badou-AI/flowforge-coach-97 --label "ui"
gh issue list --repo Badou-AI/flowforge-coach-97 --label "backend"

# View by state
gh issue list --repo Badou-AI/flowforge-coach-97 --state open
gh issue list --repo Badou-AI/flowforge-coach-97 --state closed
```

### Daily Standup Check
At start of each day:
```bash
# What's merged to develop?
git log develop --oneline --since="yesterday"

# What PRs are pending?
gh pr list --repo Badou-AI/flowforge-coach-97 --base develop

# What issues remain?
gh issue list --repo Badou-AI/flowforge-coach-97 --label "priority:critical"
```

---

## 🎯 Recommended Execution Order

### Day 1 Morning (Wave 1 - Critical Path)
**Start 5 sessions in parallel:**
1. Session A: Database Schema (#14) - **CRITICAL, START FIRST**
2. Session B: Dashboard UI (#3)
3. Session C: Coach UI (#4)
4. Session D: Pitch Practice (#7) - **KILLER FEATURE**
5. Session E: Auth Wiring (#18) - **CRITICAL**

**Why this order:**
- Database blocks others (need schema)
- Auth blocks user-specific features
- Pitch Practice is priority feature
- Dashboard + Coach are most visible pages

---

### Day 1 Afternoon (Wave 1 Continued)
**Continue or start:**
1. Session A: Questions UI (#5) - (if DB done)
2. Session B: Project Wizard (#11)
3. Session C: Documents UI (#6)
4. Session D: n8n Integration (#27) - (if DB + Auth done)
5. Session E: Voice Quota (#20) - (if DB done)

---

### Day 2 (Wave 2 & 3 - Backend Integration)
**Parallel sessions:**
1. OpenAI Realtime (#16) - Longest (8h)
2. Gemini KB (#17) - Medium (6h)
3. Stripe Premium (#19) - Medium (5h)
4. Layout Merge (#12) - Quick (3h)
5. Theme Consistency (#13) - Quick (2h)

---

### Day 3 (Remaining UI + Polish)
**Parallel sessions:**
1. Ask/KB UI (#26)
2. Journey Timeline (#8)
3. Settings UI (#9)
4. E2E Testing (#22) - Can start when core features done

---

### Day 4 (Testing & Launch Prep)
**Sequential work on develop branch:**
1. Mobile refinement (#23)
2. Performance optimization (#24)
3. Deployment prep (#25)
4. Final testing
5. **LAUNCH!** 🚀

---

## 💻 Claude Code Session Commands

### Starting a Session
```bash
# Each terminal/session works in its own worktree
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-[feature-name]

# Open Claude Code
claude code .

# Or open in VS Code first, then use Claude Code extension
code .
```

### Prompt for Each Session
```
I'm working on TOTFL integration in a git worktree.

Current worktree: /Users/adjidiortraore/Code/totfl-worktrees/totfl-[feature]
Feature branch: feature/[feature-name]
Base branch: develop

Please implement GitHub issue Badou-AI/flowforge-coach-97#[NUMBER].

Source code is in: /tmp/flowforge-coach-97 (Lovable-generated)
Target structure: Next.js 15 App Router

When complete, create a PR to the develop branch.
```

### Completing a Session
```bash
# After Claude finishes the implementation

# 1. Review changes
git status
git diff

# 2. Let Claude commit
# Claude will commit with proper message

# 3. Push
git push -u origin feature/[feature-name]

# 4. Create PR (Claude can do this)
gh pr create --base develop --fill

# 5. Close this session, start next task
```

---

## 🔀 Merge Strategy

### Auto-Merge for Low-Risk PRs
```bash
# If PR has no conflicts and tests pass (when we add CI)
gh pr merge [PR-NUMBER] --auto --squash
```

### Manual Review for High-Risk
- Layout changes (#12)
- Theme changes (#13)
- Database schema (#14)
- Auth changes (#18)

**Review these PRs carefully before merging!**

---

## 🐛 Handling Merge Conflicts

### If Conflict Occurs:

```bash
# In the worktree
git checkout feature/your-feature
git fetch origin
git merge origin/develop

# Resolve conflicts
# Then commit
git add .
git commit -m "chore: resolve merge conflicts from develop"
git push

# PR will auto-update
```

### Prevention:
- Pull from develop every 2-3 hours
- Merge PRs quickly (don't let them sit)
- Communicate in shared Slack/Discord when merging layout/theme changes

---

## 📦 Recommended Session Allocation

### If You Have 3 Claude Sessions Available:

**Priority 1 (Critical Path):**
- Session A: Database (#14) then Auth (#18) then n8n (#27)
- Session B: Dashboard (#3) then Coach (#4) then Pitch (#7)
- Session C: Questions (#5) then Wizard (#11) then Documents (#6)

### If You Have 5 Claude Sessions:

**Group by Dependency:**
- Session A: Database → n8n → Gemini (sequential pipeline)
- Session B: Dashboard → Layout → Theme (UI foundation)
- Session C: Coach → Voice Quota (voice features)
- Session D: Questions → Ask UI (gamification)
- Session E: Auth → Stripe Premium (monetization)

---

## 📈 Expected Timeline

### Day 1 (8 hours parallel work = ~40 hours of work done)
**Morning (Wave 1):**
- Database schema ✅
- Dashboard UI ✅
- Coach UI ✅
- Pitch Practice ✅
- Auth wiring ✅

**Afternoon (Wave 2):**
- Questions UI ✅
- Documents UI ✅
- Wizard UI ✅
- n8n integration ✅
- Voice quota ✅

**End of Day:** ~10 PRs merged to develop

---

### Day 2 (8 hours parallel = ~40 hours)
**Morning (Wave 3):**
- OpenAI Realtime ✅
- Gemini KB ✅
- Stripe Premium ✅
- Layout merge ✅
- Theme consistency ✅

**Afternoon (Wave 4):**
- Ask UI ✅
- Journey/Settings ✅
- Integration testing
- Bug fixes

**End of Day:** All features integrated on develop

---

### Day 3 (Testing & Polish)
**Sequential work:**
- E2E testing ✅
- Mobile refinement ✅
- Performance optimization ✅
- Bug fixes
- Final review

**End of Day:** Ready for production

---

### Day 4 (Deployment)
- Deploy to Vercel
- Configure production Supabase
- Test production environment
- **LAUNCH!** 🎉

---

## ✅ Success Criteria Per Wave

### Wave 1 Complete When:
- [ ] Dashboard shows projects and phase journey
- [ ] Can navigate to all pages
- [ ] Voice recording UI functional (no real AI yet)
- [ ] Database tables exist
- [ ] Auth protects all routes

### Wave 2 Complete When:
- [ ] All UI pages fully ported
- [ ] Layout consistent across pages
- [ ] Theme/branding unified
- [ ] All navigation links work

### Wave 3 Complete When:
- [ ] Voice coaching works with real AI
- [ ] Documents generate from n8n
- [ ] Knowledge base answers questions
- [ ] Quota tracking functional
- [ ] Premium features gated

### Wave 4 Complete When:
- [ ] All tests passing
- [ ] Mobile fully functional
- [ ] Performance acceptable
- [ ] Production deployed

---

## 🚨 Troubleshooting

### Issue: Merge Conflict in globals.css
```bash
# Accept both changes, then manually merge
git checkout --ours app/globals.css   # Keep our version
git checkout --theirs app/globals.css # Keep their version
# Or manually edit to combine both
```

### Issue: Worktree Won't Delete
```bash
git worktree remove --force /path/to/worktree
git branch -D feature/branch-name
```

### Issue: Lost Track of Which Session is Which
```bash
# List all worktrees with their branches
git worktree list

# See what's changed in each
cd /path/to/worktree && git status
```

---

## 📞 Communication Between Sessions

### Shared Context File (Optional)
Create a shared file that all sessions can reference:

```bash
# In main repo
touch INTEGRATION_STATUS.md

# Update as features complete
echo "✅ Database schema merged to develop at 2:34 PM" >> INTEGRATION_STATUS.md
echo "⚠️ VoiceRecorder.ts being used by both Coach and Pitch - don't modify directly" >> INTEGRATION_STATUS.md
```

---

## 🎯 Quick Reference Commands

### Setup
```bash
./scripts/setup-worktrees.sh          # Create all worktrees
git worktree list                     # List all worktrees
```

### Working
```bash
cd /Users/adjidiortraore/Code/totfl-worktrees/totfl-[feature]
claude code .                         # Start Claude session
git status                            # Check changes
git push -u origin feature/[name]    # Push feature branch
gh pr create --base develop --fill   # Create PR
```

### Cleanup
```bash
git worktree remove [path]            # Remove worktree
git branch -d feature/[name]          # Delete branch
git pull origin develop               # Update main repo
```

### Monitoring
```bash
gh issue list --repo Badou-AI/flowforge-coach-97                    # All issues
gh pr list --repo Badou-AI/flowforge-coach-97 --base develop       # Open PRs
git log develop --oneline --graph --since="today"                  # Today's merges
```

---

## 🏁 Final Integration Checklist

Before merging develop → main:

- [ ] All 24 issues closed
- [ ] All tests passing
- [ ] No console errors in any page
- [ ] Mobile works perfectly
- [ ] Voice features work with real APIs
- [ ] Documents generate from n8n
- [ ] Knowledge base answers questions
- [ ] Stripe checkout works
- [ ] Quota tracking enforced
- [ ] Performance acceptable (<3s load)
- [ ] Reviewed by at least one other person
- [ ] Production environment configured

**Then:**
```bash
git checkout main
git merge develop
git tag v1.0.0
git push origin main --tags
```

---

## 🎉 Expected Outcome

**Without Parallel Sessions:** 9-10 days sequential work
**With 5 Parallel Sessions:** 2-3 days total
**Time Savings: 70%** ⚡

**You'll have:**
- ✅ Complete TOTFL app with all Lovable UI
- ✅ Working backend (n8n, OpenAI, Gemini, Stripe)
- ✅ Voice coaching functional
- ✅ Pitch practice (killer feature) live
- ✅ 99 questions game working
- ✅ Knowledge base answering questions
- ✅ Premium features gated
- ✅ Production-ready app

**READY TO EXECUTE!** 🚀
