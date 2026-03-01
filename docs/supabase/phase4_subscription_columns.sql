-- phase4_subscription_columns.sql
-- Adds subscription status columns to profiles table for RevenueCat integration

-- Add subscription columns to profiles
alter table profiles
  add column if not exists subscription_status text default 'none',
  add column if not exists subscription_expires_at timestamp with time zone,
  add column if not exists trial_started_at timestamp with time zone;

-- Add comment for documentation
comment on column profiles.subscription_status is 'Subscription status: none, trialing, active, expired';
comment on column profiles.subscription_expires_at is 'When the current subscription/trial expires';
comment on column profiles.trial_started_at is 'When the user started their trial (for calculating trial days remaining)';

-- Create index for efficient subscription status queries
create index if not exists profiles_subscription_status_idx on profiles(subscription_status);
create index if not exists profiles_subscription_expires_at_idx on profiles(subscription_expires_at);
