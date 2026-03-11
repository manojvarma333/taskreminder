import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Task } from '../lib/supabase';
import { LogOut, Plus, Loader2 } from 'lucide-react';
import { TaskList } from './TaskList';
import { TaskForm } from './TaskForm';
import { useNotifications } from '../hooks/useNotificationsSimple';

export function TaskDashboard() {
  const { user, signOut } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useNotifications(user?.id);

  useEffect(() => {
    if (user) {
      loadTasks();
      requestNotificationPermission();
    }
  }, [user]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setShowForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTask(null);
  };

  const handleTaskSaved = () => {
    loadTasks();
    handleCloseForm();
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      await loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !task.is_completed })
        .eq('id', task.id);

      if (error) throw error;
      await loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const now = new Date();
  const upcomingTasks = tasks.filter((task) => {
    if (task.is_completed) return false;
    const taskDateTime = new Date(`${task.scheduled_date}T${task.scheduled_time}`);
    return taskDateTime >= now;
  });

  const missedTasks = tasks.filter((task) => {
    if (task.is_completed) return false;
    const taskDateTime = new Date(`${task.scheduled_date}T${task.scheduled_time}`);
    return taskDateTime < now;
  });

  const completedTasks = tasks.filter((task) => task.is_completed);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Smart Task Reminder</h1>
              <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
            </div>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={handleAddTask}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg hover:shadow-xl"
          >
            <Plus className="w-5 h-5" />
            Add New Task
          </button>
        </div>

        <div className="space-y-8">
          <TaskList
            title="Upcoming Tasks"
            tasks={upcomingTasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onToggleComplete={handleToggleComplete}
            emptyMessage="No upcoming tasks. Great job staying on top of things!"
            color="blue"
          />

          <TaskList
            title="Missed Tasks"
            tasks={missedTasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onToggleComplete={handleToggleComplete}
            emptyMessage="No missed tasks. You're doing great!"
            color="red"
          />

          <TaskList
            title="Completed Tasks"
            tasks={completedTasks}
            onEdit={handleEditTask}
            onDelete={handleDeleteTask}
            onToggleComplete={handleToggleComplete}
            emptyMessage="No completed tasks yet. Start checking off your tasks!"
            color="green"
          />
        </div>
      </main>

      {showForm && (
        <TaskForm
          task={editingTask}
          onClose={handleCloseForm}
          onSaved={handleTaskSaved}
        />
      )}
    </div>
  );
}
