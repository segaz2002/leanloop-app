# Phase 4 Context: Subscription + Paywall

## Design Decisions

### Provider: RevenueCat
- Wraps StoreKit + Google Play Billing — no custom server-side receipt validation needed
- Free tier covers up to $2.5k/mo MTR — perfect for launch
- Expo-compatible via `react-native-purchases` + `react-native-purchases-ui`
- Remote paywall configuration (no code deploys to change pricing/copy)
- Built-in analytics (MRR, churn, trial conversion)

### Pricing (from PROJECT.md)
- **Monthly:** $9.99/mo
- **Annual:** $59.99/yr (~50% discount)
- **Trial:** 7-day free trial on both plans

### Entitlement Model
- Single entitlement: `premium`
- All current features gated behind `premium` after trial expires
- During trial: full access to everything

### Paywall Strategy
- Show paywall when trial expires (hard gate on workout execution)
- Soft nudge on Progress tab before trial expires ("X days left")
- RevenueCat's remote paywall UI (`react-native-purchases-ui`) for the paywall screen itself

### What Gets Gated (Post-Trial)
- Workout execution (start/resume workout)
- Weekly check-in submission
- Goal picker changes
- **NOT gated:** Login, viewing past workout history, viewing weight trend

### Expo Considerations
- Requires `expo-dev-client` (no Expo Go for IAP testing)
- Must run `npx expo prebuild` for native modules
- Android: `launchMode` must be `standard` or `singleTop`
- Android: BILLING permission in AndroidManifest.xml
- iOS: Enable In-App Purchase capability

## Technical Approach
1. Install `react-native-purchases` + `react-native-purchases-ui`
2. Create `RevenueCatProvider` (configure on app init with API keys)
3. Create `useSubscription` hook (check entitlement, trial status)
4. Add paywall screen using RevenueCat UI components
5. Gate features with subscription check
6. Add Supabase Edge Function for RevenueCat webhook (sync subscription status server-side)
7. Add trial countdown UI component

## Open Questions for Gab
- Confirm pricing: $9.99/mo, $59.99/yr — still good?
- Apple/Google developer accounts ready for IAP setup?
- Any specific paywall copy/branding preferences?
