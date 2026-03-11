import { Task } from '../lib/supabase';
import { Calendar, Clock, CheckCircle2, Circle, CreditCard as Edit2, Trash2 } from 'lucide-react';

interface TaskListProps {
  title: string;
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (task: Task) => void;
  emptyMessage: string;
  color: 'blue' | 'red' | 'green';
}

export function TaskList({
  title,
  tasks,
  onEdit,
  onDelete,
  onToggleComplete,
  emptyMessage,
  color,
}: TaskListProps) {
  const colorClasses = {
    blue: 'border-blue-200 bg-blue-50',
    red: 'border-red-200 bg-red-50',
    green: 'border-green-200 bg-green-50',
  };

  const headerColors = {
    blue: 'text-blue-900',
    red: 'text-red-900',
    green: 'text-green-900',
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className={`border-2 rounded-xl p-6 ${colorClasses[color]}`}>
      <h2 className={`text-xl font-bold mb-4 ${headerColors[color]}`}>
        {title} ({tasks.length})
      </h2>

      {tasks.length === 0 ? (
        <p className="text-gray-600 text-center py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition border border-gray-200"
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => onToggleComplete(task)}
                  className="mt-1 flex-shrink-0 text-gray-400 hover:text-blue-600 transition"
                >
                  {task.is_completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-semibold text-gray-900 mb-1 ${
                      task.is_completed ? 'line-through text-gray-500' : ''
                    }`}
                  >
                    {task.title}
                  </h3>
                  {task.description && (
                    <p
                      className={`text-sm text-gray-600 mb-2 ${
                        task.is_completed ? 'line-through' : ''
                      }`}
                    >
                      {task.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(task.scheduled_date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatTime(task.scheduled_time)}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => onEdit(task)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit task"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onDelete(task.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete task"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
