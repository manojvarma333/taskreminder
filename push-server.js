import webpush from 'web-push';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

// VAPID keys
const VAPID_PUBLIC_KEY = 'BNai26ozYWRIn9ryl1a1vfzwGj57msUbjPbVhUJpZtQKPRELE9ybxTpve05gkIA3Wik8V4zvrj2cdy-yyBAcEUo';
const VAPID_PRIVATE_KEY = 'Cwfd3Uk0-ZkghHH1drdKrfV9LY1u6jdCA1D70WK_Do8';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Supabase client
const supabase = createClient(
  'https://ndunfqmhwahylrvkdllc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kdW5mcW1od2FoeWxydmtkbGxjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIwNDI5MCwiZXhwIjoyMDg4NzgwMjkwfQ.06EP6HdGoUNv1RQfshevQH3XzYSsvUL0eiBaVPezoQ4'
);

// Check and send notifications for due tasks
app.post('/check-notifications', async (req, res) => {
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
        // Get user's push subscription
        const { data: subscription } = await supabase
          .from('push_subscriptions')
          .select('subscription')
          .eq('user_id', task.user_id)
          .single();

        if (subscription && subscription.subscription) {
          try {
            const pushSubscription = JSON.parse(subscription.subscription);
            
            await webpush.sendNotification(
              pushSubscription,
              JSON.stringify({
                title: 'Task Reminder',
                body: task.title + (task.description ? '\n' + task.description : ''),
                icon: '/vite.svg',
                badge: '/vite.svg',
                tag: task.id,
                requireInteraction: true,
                data: {
                  taskId: task.id
                }
              })
            );

            console.log(`Push notification sent for task: ${task.title}`);

            // Mark task as notified
            await supabase
              .from('tasks')
              .update({ is_notified: true })
              .eq('id', task.id);

          } catch (pushError) {
            console.error('Error sending push notification:', pushError);
          }
        }
      }
    }

    res.json({ success: true, tasksFound: tasks?.length || 0 });
  } catch (error) {
    console.error('Error in notification check:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Push notification server running on port ${PORT}`);
});
