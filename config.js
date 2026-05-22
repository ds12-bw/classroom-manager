// Supabase credentials — safe to keep client-side (publishable key only)
// ถ้าจะ commit เข้า git แนะนำให้ใส่ในไฟล์นี้ และเพิ่มลง .gitignore หาก key เป็น secret
window.SUPABASE_URL = "https://zevhjuzazhjigixzasyb.supabase.co";
window.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_n4viOelZ6CswUD-ZPmVbXg_Cnt-UVr0";

// Toggle realtime (multi-device sync). Set to false if you see refetch loops.
window.SUPABASE_REALTIME = true;
