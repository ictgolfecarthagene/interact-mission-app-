import { createClient } from '@supabase/supabase-js';

// The NEXT_PUBLIC_ prefix is mandatory for the browser to read these!
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);