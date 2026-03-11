import { useEffect, useRef } from 'react';
import { supabase, Task } from '../lib/supabase';

export function useNotifications(userId: string | undefined) {
  const intervalRef = useRef<number | null>(null);
  const notifiedTasksRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

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
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('Task Reminder', {
          body: `${task.title}${task.description ? '\n' + task.description : ''}`,
          icon: '/vite.svg',
          badge: '/vite.svg',
          tag: task.id,
          requireInteraction: true,
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
    };

    checkTasks();
    intervalRef.current = window.setInterval(checkTasks, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId]);
}
