// Initialize Supabase client and expose as window.sb
(function(){
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    console.error("[supabase] Missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY in config.js");
    return;
  }
  if (!window.supabase || !window.supabase.createClient) {
    console.error("[supabase] supabase-js library not loaded (CDN script missing?)");
    return;
  }
  window.sb = window.supabase.createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  console.log("[supabase] client ready:", url);
})();
