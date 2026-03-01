-- phase6_subscriptions.sql
-- Creates subscriptions table for RevenueCat integration

create table if not exists subscriptions (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,          -- 'revenuecat'
  provider_id text,                -- RevenueCat subscription ID
  status text not null,            -- 'active', 'canceled', 'expired'
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table subscriptions enable row level security;

create policy "Users can view their own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own subscription"
  on subscriptions for insert
  with check (auth.uid() = user_id);