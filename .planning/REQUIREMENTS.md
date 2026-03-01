# Requirements: LeanLoop

**Defined:** 2026-02-24  
**Last updated:** 2026-02-28  
**Core Value:** Beginners get a plan they can follow and weekly adjustments that keep them progressing.

## v1 Requirements

### Authentication (AUTH)
- [x] **AUTH-01**: User can sign up / log in via email + password.
- [x] **AUTH-02**: User session persists across app restarts.

### Training Plan (TRN)
- [x] **TRN-01**: App provides a 3-day full body program (A/B/C) for an 8–12 week block.
- [x] **TRN-02**: Each exercise has prescribed sets/reps and progression guidance (v1 rules).
- [x] **TRN-03**: App supports exercise substitutions (basic) — *MVP: fixed list of swaps per exercise; persisted per workout via AsyncStorage*.

### Workout Execution & Logging (LOG)
- [x] **LOG-01**: User can log sets (weight/reps) quickly.
- [x] **LOG-02**: Rest timer is available per set/exercise (persists across background/resume).
- [x] **LOG-03**: App shows previous performance for the same exercise.

### Macro-lite Fat Loss Loop (CUT)
- [x] **CUT-01**: App sets a protein target and steps target.
- [x] **CUT-02**: Weekly check-in captures weight and adherence.
- [x] **CUT-03**: Weekly adjustment suggests next-week targets (rules-based v1).

### Progress (PRG)
- [x] **PRG-01**: Show weight trend over time — *implemented as SVG sparkline + 7-day avg/delta summary*.
- [ ] **PRG-02**: Show strength progress (PRs / top set trend) — *planned for v2*.

### Subscription (SUB)
- [ ] **SUB-01**: iOS/Android in-app subscription with 7-day free trial.
- [ ] **SUB-02**: Paywall blocks plan continuation past trial.

## v2 Requirements
- Apple/Google sign-in
- Wearables integrations
- Community challenge teams + share cards

## Out of Scope

| Feature | Reason |
|---|---|
| Full macro tracking | Too much friction for beginners in v1 |
| Coaching chat | Not needed for v1 |

---
*Requirements defined: 2026-02-24 | Updated: 2026-02-28*