// Simple notification checker for production
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ndunfqmhwahylrvkdllc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kdW5mcW1od2FoeWxydmtkbGxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIwNDI5MCwiZXhwIjoyMDg4NzgwMjkwfQ.06EP6HdGoUNv1RQfshevQH3XzYSsvUL0eiBaVPezoQ4'
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 8);

    // Get due tasks
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_completed', false)
      .eq('is_notified', false)
      .eq('scheduled_date', currentDate)
      .lte('scheduled_time', currentTime);

    if (error) throw error;

    console.log(`Found ${tasks?.length || 0} due tasks`);

    if (tasks && tasks.length > 0) {
      for (const task of tasks) {
        // Mark task as notified (we'll use browser notifications for now)
        await supabase
          .from('tasks')
          .update({ is_notified: true })
          .eq('id', task.id);

        console.log(`Task marked as notified: ${task.title}`);
      }
    }

    res.json({ success: true, tasksFound: tasks?.length || 0 });
  } catch (error) {
    console.error('Error checking notifications:', error);
    res.status(500).json({ error: error.message });
  }
}
