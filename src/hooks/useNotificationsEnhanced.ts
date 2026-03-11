import { useEffect, useRef } from 'react';
import { supabase, Task } from '../lib/supabase';

export function useNotificationsEnhanced(userId: string | undefined) {
  const intervalRef = useRef<number | null>(null);
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    // Request notification permission and subscribe to push
    const initializeNotifications = async () => {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted');
          await subscribeToPush();
        }
      }
    };

    const subscribeToPush = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.ready;
          
          // Check if already subscribed
          const existingSubscription = await registration.pushManager.getSubscription();
          if (existingSubscription) {
            console.log('Already subscribed to push notifications');
            return;
          }

          // Subscribe to push notifications
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY)
          });
          
          console.log('Push subscription created:', subscription);
          
          // Store subscription in Supabase
          await supabase.from('push_subscriptions').upsert({
            user_id: userId,
            subscription: JSON.stringify(subscription)
          });
        } catch (error) {
          console.log('Push subscription failed:', error);
        }
      }
    };

    const checkTasks = async () => {
      try {
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().slice(0, 8);

        const { data: tasks, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('is_completed', false)
          .eq('is_notified', false)
          .eq('scheduled_date', currentDate)
          .lte('scheduled_time', currentTime);

        if (error) throw error;

        if (tasks && tasks.length > 0) {
          for (const task of tasks) {
            if (!notifiedTasksRef.current.has(task.id)) {
              await sendNotification(task);
              notifiedTasksRef.current.add(task.id);

              await supabase
                .from('tasks')
                .update({ is_notified: true })
                .eq('id', task.id);
            }
          }
        }
      } catch (error) {
        console.error('Error checking tasks:', error);
      }
    };

    const sendNotification = async (task: Task) => {
      // Try service worker notification first
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification('Task Reminder', {
            body: `${task.title}${task.description ? '\n' + task.description : ''}`,
            icon: '/vite.svg',
            badge: '/vite.svg',
            tag: task.id,
            requireInteraction: true,
            actions: [
              {
                action: 'open',
                title: 'Open App'
              },
              {
                action: 'complete',
                title: 'Mark Complete'
              }
            ]
          });
        } catch (error) {
          // Fallback to regular notification
          if (Notification.permission === 'granted') {
            new Notification('Task Reminder', {
              body: `${task.title}${task.description ? '\n' + task.description : ''}`,
              icon: '/vite.svg',
              tag: task.id,
              requireInteraction: true
            });
          }
        }
      }
    };

    initializeNotifications();
    checkTasks();
    intervalRef.current = window.setInterval(checkTasks, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId]);
}

// Helper function for VAPID key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
