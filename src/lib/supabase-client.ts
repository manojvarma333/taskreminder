import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'x-connection-info': 'task-reminder-app'
      }
    }
  }
});

// Enhanced error handling
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  
  if (error?.code === 'PGRST116') {
    return 'Too many requests. Please wait a few minutes and try again.';
  }
  
  if (error?.code === 'PGRST120') {
    return 'Connection limit exceeded. Please try again later.';
  }
  
  return error?.message || 'An unexpected error occurred.';
};

export { supabase, handleSupabaseError };
