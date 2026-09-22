// ============================================================
// PAYMONGO CONFIGURATION
// Find these values in your PayMongo Dashboard -> Developers
//   Public Test Key:  pk_test_...
//   Secret Test Key:  sk_test_...   (KEEP SERVER-SIDE ONLY — put it
//                     in a Supabase Edge Function secret, never here)
// ============================================================
window.PAYMONGO_PUBLIC_KEY = 'pk_test_wqSWdMhCB7miUmv986EGPJhd';
window.PAYMONGO_CHECKOUT_FUNCTION =
  'https://bpleimrxzigbhpofavec.supabase.co/functions/v1/paymongo-checkout';