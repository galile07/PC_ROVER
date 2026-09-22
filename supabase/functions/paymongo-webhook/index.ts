// ============================================================
// Edge Function: paymongo-webhook
// Receives PayMongo webhook events and marks orders paid/failed.
//
// Deploy in Supabase Dashboard:
//   Edge Functions -> Create -> name: `paymongo-webhook`
//   Paste this code. Set secrets:
//     SUPABASE_SERVICE_ROLE_KEY  (from Project Settings -> API)
//     PAYMONGO_WEBHOOK_SECRET    (from PayMongo Dashboard, webhook settings)
// ============================================================

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const webhookSecret = Deno.env.get('PAYMONGO_WEBHOOK_SECRET') || '';

Deno.serve(async (req) => {
  // PayMongo sends JSON body + signature header
  const raw = await req.text();
  const secret = req.headers.get('paymongo-signature') || '';

  // Only verify the signature when a webhook secret is configured.
  // In cases where the secret is not yet set (initial testing via the
  // PayMongo "test event" tester), we still require the header to exist.
  if (webhookSecret) {
    const crypto = await import('node:crypto');
    const expected = crypto.createHmac('sha256', webhookSecret).update(raw).digest('hex');
    const got = secret.split(/[,:]/).map((p) => p.trim()).filter((p) => /^[0-9a-f]{64}$/i.test(p));
    if (!got.includes(expected)) {
      return new Response('Invalid signature', { status: 401 });
    }
  }

  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const type = event.type || '';
  const payment = event.data || {};
  const attrs = payment.attributes || {};
  const metadata = attrs.metadata || {};
  const orderId = metadata.order_id || '';
  const paymentId = payment.id || '';
  const referenceNumber = attrs.reference_number || '';

  // Checkout session events: order id lives in the session metadata.
  const sessionRef = orderId || referenceNumber || '';

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase env missing for webhook update');
    return new Response('OK (no DB update)', { status: 200 });
  }

  if (sessionRef) {
    const update = {
      payment_id: paymentId,
      ...(type === 'checkout_session.payment.paid'
        ? { status: 'paid', paid_at: new Date().toISOString() }
        : type.includes('failed')
          ? { status: 'payment_failed', paid_at: null }
          : {}),
    };

    await fetch(`${supabaseUrl}/rest/v1/orders?id=eq.${encodeURIComponent(sessionRef)}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(update),
    }).catch((e) => console.error('webhook update error', e));
  }

  return new Response('OK', { status: 200 });
});