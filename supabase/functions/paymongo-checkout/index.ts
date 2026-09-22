// ============================================================
// Edge Function: paymongo-checkout
// Creates a PayMongo Checkout Session using the SECRET key.
//
// Deploy in Supabase Dashboard:
//   Edge Functions -> Create -> name: `paymongo-checkout`
//   Paste this code. Set a secret: PAYMONGO_SECRET_KEY (sk_test_...)
// ============================================================

// CORS helpers (so a static frontend can call this function)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const secretKey = Deno.env.get('PAYMONGO_SECRET_KEY') || '';
  if (!secretKey) {
    return new Response(
      JSON.stringify({ error: 'PAYMONGO_SECRET_KEY secret not set on this function.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.json();
    const { lineItems, successUrl, cancelUrl, referenceNumber, customerEmail, metadata } = body;

    if (!Array.isArray(lineItems) || !lineItems.length) {
      return new Response(JSON.stringify({ error: 'lineItems is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!successUrl || !cancelUrl) {
      return new Response(JSON.stringify({ error: 'successUrl and cancelUrl are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = {
      data: {
        attributes: {
          line_items: lineItems.map((item) => ({
            name: String(item.name || 'PC Rover PH item'),
            amount: Math.round(Number(item.value) || 0),
            currency: String(item.currency || 'PHP'),
            quantity: 1,
          })),
          payment_method_types: ['gcash'],
          success_url: successUrl,
          cancel_url: cancelUrl,
          ...(customerEmail ? { customer_email: customerEmail } : {}),
          ...(referenceNumber ? { reference_number: String(referenceNumber) } : {}),
          ...(metadata ? { metadata } : {}),
        },
      },
    };

    const auth = `Basic ${btoa(`${secretKey}:`)}`;
    const res = await fetch('https://api.paymongo.com/v2/checkout_sessions', {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json();

    if (!res.ok) {
      const message = json?.errors?.[0]?.detail || 'PayMongo checkout creation failed';
      return new Response(JSON.stringify({ error: message }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        checkout_url: json.data?.attributes?.checkout_url,
        checkout_session_id: json.data?.id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Unexpected error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});