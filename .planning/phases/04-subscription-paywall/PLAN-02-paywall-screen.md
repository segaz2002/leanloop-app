# Plan 02: Paywall Screen + Trial UI

## Objective
Build the paywall screen using RevenueCat UI and add trial countdown nudges.

## Tasks

### 1. Paywall Screen
- File: `app/(app)/paywall.tsx`
- Use RevenueCat's `<RevenueCatUI.Paywall>` component (remote-configured)
- Fallback: custom paywall if remote not configured yet
- Show monthly + annual options with trial badge
- Handle purchase success → navigate back
- Handle restore purchases button

### 2. Trial Countdown Component
- File: `src/components/TrialBanner.tsx`
- Shows "X days left in trial" when trialing
- Shows on Progress tab and Home
- Tappable → navigates to paywall
- Styling: accent color, non-intrusive

### 3. Expired Trial Modal
- When trial expires and user tries to access gated feature → show modal
- "Your trial has ended" + CTA to subscribe
- Dismiss → back to non-gated areas

## Acceptance Criteria
- [ ] Paywall screen renders with correct products
- [ ] Purchase flow completes (sandbox testing)
- [ ] Trial banner shows correct countdown
- [ ] Expired modal blocks gated features
