import { createClient } from '@supabase/supabase-js';

// Create Supabase client with retry logic
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
);

// Retry wrapper for API calls
export async function supabaseCall<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      console.warn(`Attempt ${attempt} failed:`, error);
      
      // Rate limit error
      if (error?.code === 'PGRST116') {
        console.log('Rate limit hit, waiting...');
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * attempt));
          continue;
        }
        throw new Error('Rate limit exceeded. Please try again in a few minutes.');
      }
      
      // Other errors
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw new Error('Max retries exceeded');
}

export { supabase, supabaseCall };
