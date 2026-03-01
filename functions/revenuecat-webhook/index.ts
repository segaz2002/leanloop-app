import { serve } from 'https://deno.land/std@0.209.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.41.0';

// Environment variables (set in Supabase Dashboard → Functions → Config)
const REVENUECAT_SECRET = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Verify RevenueCat signature (HMAC-SHA256 of body with secret)
function verifySignature(body: string, signature: string): boolean {
  if (!REVENUECAT_SECRET) throw new Error('REVENUECAT_WEBHOOK_SECRET not set');
  const hash = new Uint8Array(
    crypto.subtle.digestSync('SHA-256', new TextEncoder().encode(body))
  );
  const expected = btoa(String.fromCharCode(...hash));
  return expected === signature;
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (url.pathname !== '/revenuecat-webhook') {
      return new Response('Not Found', { status: 404 });
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return new Response('Bad Request: JSON required', { status: 400 });
    }

    const body = await req.text();
    const signature = req.headers.get('revenuecat-signature');
    if (!signature || !verifySignature(body, signature)) {
      return new Response('Unauthorized: Invalid signature', { status: 401 });
    }

    const payload = JSON.parse(body);
    const subscriber = payload.subscriber;

    // Extract user_id from RevenueCat's `original_app_user_id` (we use email as app_user_id)
    const appUserId = subscriber.original_app_user_id;
    if (!appUserId || !appUserId.includes('@')) {
      return new Response('Bad Request: invalid app_user_id', { status: 400 });
    }

    // Find user by email (we store email as `auth.users.email`)
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', appUserId)
      .limit(1);

    if (userError || !user?.length) {
      return new Response(`User not found for email: ${appUserId}`, { status: 404 });
    }

    const userId = user[0].id;

    // Upsert subscription record
    const subs = subscriber.subscriptions;
    const activeSub = Object.values(subs).find((s: any) => s.billing_period_type === 'normal' && s.expires_date);

    const subscriptionData = {
      user_id: userId,
      provider: 'revenuecat',
      provider_id: activeSub?.id || null,
      status: activeSub ? 'active' : 'canceled',
      expires_at: activeSub?.expires_date ? new Date(activeSub.expires_date) : null,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const { error } = await supabase
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' });

    if (error) {
      console.error('Supabase upsert error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true, message: 'Subscription synced' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Webhook error:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});