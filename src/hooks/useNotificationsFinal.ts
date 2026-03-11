import { useEffect, useRef } from 'react';
import { supabase, Task } from '../lib/supabase';

export function useNotifications(userId: string | undefined) {
  const intervalRef = useRef<number | null>(null);
  const notifiedTasksRef = useRef<Set<string>>(new Set());
  const retryCountRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    if (!userId) return;

    const checkTasks = async () => {
      try {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().slice(0, 8);

        // Check for tasks that are due now OR up to 5 minutes ago (to catch missed ones)
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const fiveMinutesAgoTime = fiveMinutesAgo.toTimeString().slice(0, 8);

        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('is_completed', false)
          .eq('is_notified', false)
          .eq('scheduled_date', currentDate)
          .lte('scheduled_time', currentTime)
          .gte('scheduled_time', fiveMinutesAgoTime);

        if (error) throw error;

        if (tasks && tasks.length > 0) {
          for (const task of tasks) {
            const retryCount = retryCountRef.current.get(task.id) || 0;
            
            // Try up to 3 times per task
            if (retryCount < 3) {
              const success = await sendNotification(task);
              
              if (success) {
                await supabase
                  .from('tasks')
                  .update({ is_notified: true })
                  .eq('id', task.id);
                
                notifiedTasksRef.current.add(task.id);
                retryCountRef.current.delete(task.id);
              } else {
                // Increment retry count
                retryCountRef.current.set(task.id, retryCount + 1);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking tasks:', error);
      }
    };

    const sendNotification = async (task: Task): Promise<boolean> => {
      try {
        // Check if notifications are supported
        if (!('Notification' in window)) {
          console.log('This browser does not support notifications');
          return false;
        }

        // Request permission if not granted
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') {
            console.log('Notification permission denied');
            return false;
          }
        }

        const notificationTitle = 'Task Reminder';
        const notificationBody = `${task.title}${task.description ? '\n' + task.description : ''}`;
        
        // Try service worker first (better for mobile)
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(notificationTitle, {
              body: notificationBody,
              icon: '/vite.svg',
              badge: '/vite.svg',
              tag: `task-${task.id}`,
              requireInteraction: true,
              vibrate: [200, 100, 200],
              actions: [
                {
                  action: 'complete',
                  title: 'Mark Complete'
                },
                {
                  action: 'open',
                  title: 'Open App'
                }
              ]
            });
            
            console.log(`Service worker notification sent for task: ${task.title}`);
            return true;
          } catch (swError) {
            console.log('Service worker failed, trying fallback:', swError);
          }
        }

        // Fallback to regular notification
        if (Notification.permission === 'granted') {
          const notification = new Notification(notificationTitle, {
            body: notificationBody,
            icon: '/vite.svg',
            badge: '/vite.svg',
            tag: `task-${task.id}`,
            requireInteraction: true,
            vibrate: [200, 100, 200]
          });

          // Auto-close after 10 seconds
          setTimeout(() => {
            notification.close();
          }, 10000);

          console.log(`Regular notification sent for task: ${task.title}`);
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error sending notification:', error);
        return false;
      }
    };

    // Initialize and start checking
    const initializeNotifications = async () => {
      console.log('Initializing notification system...');
      
      // Request permission immediately
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      // Check immediately
      await checkTasks();
      
      // Then check every 30 seconds
      intervalRef.current = window.setInterval(checkTasks, 30000);
    };

    initializeNotifications();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId]);
}
