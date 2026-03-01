# Plan 01: RevenueCat SDK Setup + Provider

## Objective
Install RevenueCat SDK, create the provider/context, and wire it into the app's root layout.

## Tasks

### 1. Install Dependencies
```bash
npx expo install react-native-purchases react-native-purchases-ui expo-dev-client
```

### 2. Create RevenueCatProvider
- File: `src/providers/RevenueCatProvider.tsx`
- Initialize Purchases SDK with platform-specific API keys (env vars)
- Expose context: `isProUser`, `trialDaysRemaining`, `currentOffering`, `customerInfo`
- Handle restore purchases

### 3. Create useSubscription Hook
- File: `src/hooks/useSubscription.ts`
- Returns: `{ isPremium, isTrialing, trialDaysLeft, offerings, purchase, restore, loading }`
- Checks `premium` entitlement from CustomerInfo
- Computes trial remaining from original purchase date

### 4. Wire Provider into App Layout
- Wrap app in `<RevenueCatProvider>` in root `_layout.tsx`
- Must be inside auth check (only init for logged-in users)

### 5. Environment Configuration
- Add `REVENUECAT_APPLE_API_KEY` and `REVENUECAT_GOOGLE_API_KEY` to app config
- Update `.env.example`

## Acceptance Criteria
- [ ] `react-native-purchases` installs without errors
- [ ] RevenueCat initializes on app launch (visible in RevenueCat dashboard)
- [ ] `useSubscription` hook returns correct state
- [ ] No regressions in existing auth flow

## Dependencies
- RevenueCat project must be created in dashboard (Gab to do)
- Apple/Google store products must be configured (Gab to do)
