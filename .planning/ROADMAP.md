# Roadmap: LeanLoop

## Overview

Ship a beginner-friendly lifting + fat-loss loop app with subscription, then iterate based on retention and conversion.

## Phases

- [x] **Phase 1: App skeleton + Auth** — Expo app scaffold, Supabase auth, navigation.
- [x] **Phase 2: Training plan + Logging** — 3-day full body plan delivery + workout logging UX.
- [✅] **Phase 3: Weekly check-in + Adaptation** — protein/steps targets + check-in + rules-based adjustments + weight trend + goal picker + substitutions.
- [🟡] **Phase 4: Subscription + Paywall** — IAP, trial, paywall gating.
- [ ] **Phase 5: Launch assets** — landing page copy, App Store copy, Summer Body Campaign content plan.

## Progress

| Phase | Status |
|---|---|
| 1 | ✅ Done (Auth + navigation) |
| 2 | ✅ Done (A/B/C plan + workout execution + logging) |
| 3 | ✅ Complete (v1.2 + v1.3 shipped) |
| 4 | 🟡 In progress (planning & scoping) |
| 5 | ⬜ Not started |

## Releases

- ✅ **v1.0 MVP**: Auth, workouts (A/B/C), logging UX, progress scoreboard, habits (protein/steps)
- ✅ **v1.1**: QA/polish (progress clarity, scroll/refresh, rest timer persistence, unit toggle propagation)
- ✅ **v1.2**: Weight logging + Weekly check-in + rules-based target suggestions + UI theme system refactor  
  - ✅ Sparkline (SVG) + 7-day avg/delta  
  - ✅ Maintenance-default weekly suggestions  
  - ✅ Accent-driven UI primitives  
- ✅ **v1.3**: Goal picker (fat loss / maintenance / lean gain) + per-goal adjustment rules + exercise substitutions (persisted)  
  - ✅ `GoalProvider` (AsyncStorage-backed, default maintenance)  
  - ✅ `computeAdjustments()` logic per goal mode  
  - ✅ Substitution selections saved per workout  
- 🔜 **v1.4 (next)**: Subscription + Paywall (RevenueCat/IAP, trial, paywall gating on premium features)

---
*Last updated: 2026-02-28*