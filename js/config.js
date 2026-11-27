// Fill these in later. The app works without them (local mode, no AI until you add a Gemini key).
window.SF_CONFIG = {
  SUPABASE_URL: 'YOUR_SUPABASE_URL',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',   // safe to be public: Row Level Security protects data

  // Leave empty to let each visitor paste their own free key (saved only in their browser).
  // If you put your key here, anyone can read it from the site's source. Restrict it by domain in Google AI Studio.
  GEMINI_API_KEY: '',
  GEMINI_MODEL: 'gemini-2.5-flash'
};