import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  scheduled_date: string;
  scheduled_time: string;
  priority: 'low' | 'medium' | 'high';
  category: 'general' | 'work' | 'personal' | 'health' | 'education' | 'finance';
  is_completed: boolean;
  is_notified: boolean;
  created_at: string;
  updated_at: string;
}
