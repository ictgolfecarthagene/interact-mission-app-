import { createClient } from '@supabase/supabase-js';

// TEMPORARY TEST: Put your actual URL and Anon Key directly in these strings
const supabaseUrl = 'https://weptksltfdmkhubvcikx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndlcHRrc2x0ZmRta2h1YnZjaWt4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNDkxMTAsImV4cCI6MjA5OTcyNTExMH0.XcHhpgCaSMmtWvQg0d5JUGLhNAJRZY8ew0vAs3CQRkU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);