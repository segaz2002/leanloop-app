# Roadmap: LeanLoop

## Overview

Ship a beginner-friendly lifting + fat-loss loop app with subscription, then iterate based on retention and conversion.

## Phases

- [ ] **Phase 1: App skeleton + Auth** — Expo app scaffold, Supabase auth, navigation.
- [ ] **Phase 2: Training plan + Logging** — 3-day full body plan delivery + workout logging UX.
- [ ] **Phase 3: Weekly check-in + Adaptation** — protein/steps targets + check-in + rules-based adjustments.
- [ ] **Phase 4: Subscription + Paywall** — IAP, trial, paywall gating.
- [ ] **Phase 5: Launch assets** — landing page copy, App Store copy, Summer Body Campaign content plan.

## Progress

| Phase | Status |
|---|---|
| 1 | ✅ Done (Auth + navigation) |
| 2 | ✅ Done (A/B/C plan + workout execution + logging) |
| 3 | ✅ Done (weight logging, weekly check-in, adjustment rules, exercise substitutions, design system) |
| 4 | 🟡 Next (Subscription + Paywall) |
| 5 | ⬜ Not started |

## Releases

- ✅ **v1.0 MVP**: Auth, workouts (A/B/C), logging UX, progress scoreboard, habits (protein/steps)
- ✅ **v1.1**: QA/polish (progress clarity, scroll/refresh, rest timer persistence, unit toggle propagation)
- ✅ **v1.2**: Weight logging + Weekly check-in + rules-based target suggestions + UI theme system refactor
  - Weight sparkline + 7-day trend text
  - Weekly adjustment rules (weight delta + adherence, deterministic)
  - Exercise substitution picker (option pills per exercise in workout screen)
  - Full design system migration: Themed.View removed, all screens on Typography + useAppTheme
- ✅ **v1.3**: Goal picker (fat loss/maintenance/lean gain) + per-goal adjustment rules + substitution persistence
  - `GoalProvider` (AsyncStorage-backed context, default maintenance)
  - `computeAdjustments()` extracted to `adjustment.logic.ts` — fat loss / lean gain / maintenance rules
  - Goal label shown in "Next week suggestion" card
  - Substitution selections persisted to AsyncStorage per workout
- 🔜 **v1.4 (next)**: Subscription + Paywall (Phase 4)

