// Public Supabase settings. The publishable key is designed to ship in
// browser code; Row Level Security keeps each journal private.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://zsgacmfbqqmbcexomyoo.supabase.co';
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_2GNNUjTGciy6Wi_wxDuStg_tY1sP28y';
export const API_URL = `${SUPABASE_URL}/functions/v1/lg-agent`;
export const APP_URL = 'https://jgerms20.github.io/Life_Gamified/';
