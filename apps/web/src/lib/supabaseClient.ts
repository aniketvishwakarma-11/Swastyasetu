import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qaflubmrwbvsxpkcizde.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1ocrjZ-nNbXt9WUNAeBDbg_5pZp5Yt4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
