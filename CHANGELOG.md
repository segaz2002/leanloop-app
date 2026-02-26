# Changelog

## v1.1.0 — 2026-02-26

### Improvements
- Home: habits card now shows **3-Workout Quest** status and a **Today summary** (protein/steps vs goals).
- Home/Progress: clearer habit save feedback (prefill from saved values; “Saved” indicator).
- Progress: split metrics into **logged days** vs **goal days** for both protein and steps.
- Progress: “Last 4 weeks” table now includes clear headers (Week / Grade / W / P≥ / S≥) and legend.
- Workout: rest timer now persists across background/resume using an absolute end timestamp.

### Fixes
- Progress now refreshes when the tab gains focus.
- Progress is scrollable on iOS/web (ScrollView + keyboard-friendly settings).
- Workout screen refreshes when unit preference (kg/lb) changes so labels and “Last:” formatting stay correct.
