import { createClient } from '@supabase/supabase-js';
import { env } from './env.ts';

export const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
