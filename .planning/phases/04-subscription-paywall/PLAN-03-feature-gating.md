# Plan 03: Feature Gating + Webhook

## Objective
Gate premium features behind subscription and sync status server-side via webhook.

## Tasks

### 1. Gate Workout Execution
- Wrap "Start Workout" / "Resume Workout" with `useSubscription` check
- If not premium + not trialing → redirect to paywall
- Past workout history remains viewable (read-only)

### 2. Gate Weekly Check-in
- Check-in submission requires active subscription/trial
- Viewing past check-ins stays free

### 3. Gate Goal Picker
- Changing goal (fat loss / maintenance / lean gain) requires premium
- Current goal stays active even if subscription lapses

### 4. RevenueCat Webhook (Supabase Edge Function)
- File: `functions/revenuecat-webhook/index.ts`
- Receives RevenueCat webhook events (purchase, renewal, cancellation, expiry)
- Updates `profiles.subscription_status` in Supabase
- Validates webhook signature

### 5. Subscription Status in Supabase
- Add columns to `profiles`: `subscription_status` (text), `subscription_expires_at` (timestamptz), `trial_started_at` (timestamptz)
- Migration SQL file

## Acceptance Criteria
- [ ] Gated features redirect to paywall when not subscribed
- [ ] Free features (history, weight trend, login) remain accessible
- [ ] Webhook processes events and updates Supabase
- [ ] Subscription status queryable server-side (for future API use)
