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

    // Extract user_id from RevenueCat's `original_app_user_id`
    // We configure RevenueCat to use Supabase user.id as app_user_id
    const userId = subscriber.original_app_user_id;
    if (!userId) {
      return new Response('Bad Request: invalid app_user_id', { status: 400 });
    }

    // Determine subscription status and expiration
    const entitlements = subscriber.entitlements || {};
    const premiumEntitlement = entitlements.premium;
    
    let subscriptionStatus = 'none';
    let subscriptionExpiresAt: Date | null = null;
    let trialStartedAt: Date | null = null;

    if (premiumEntitlement) {
      // Check if active
      const expiresMs = new Date(premiumEntitlement.expires_date).getTime();
      const now = Date.now();
      
      if (expiresMs > now) {
        // Active entitlement
        if (premiumEntitlement.period_type === 'trial') {
          subscriptionStatus = 'trialing';
          trialStartedAt = premiumEntitlement.purchase_date 
            ? new Date(premiumEntitlement.purchase_date) 
            : null;
        } else {
          subscriptionStatus = 'active';
        }
        subscriptionExpiresAt = new Date(premiumEntitlement.expires_date);
      } else {
        subscriptionStatus = 'expired';
      }
    }

    // Update profiles table with subscription info
    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: subscriptionStatus,
        subscription_expires_at: subscriptionExpiresAt,
        trial_started_at: trialStartedAt,
      })
      .eq('id', userId);

    if (error) {
      console.error('Supabase update error:', error);
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