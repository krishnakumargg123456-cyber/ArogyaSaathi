import React, { useEffect, useState } from 'react';
import { Card, Badge } from '../../design-system';
import { mobileApiFetch } from '../../core/api/client';

interface ApiTask {
  id: string;
  patient_name: string | null;
  task_type: string;
  due_date: string;
  status: string;
  priority: string;
  notes: string | null;
}

function formatDueDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: value.includes('T') ? 'short' : undefined
  }).format(date);
}

export const TaskInboxScreen: React.FC = () => {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    mobileApiFetch<ApiTask[]>('/tasks')
      .then((records) => {
        if (active) setTasks(records);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load assigned tasks.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const completeTask = async (task: ApiTask) => {
    setSavingTaskId(task.id);
    setError(null);
    try {
      await mobileApiFetch(`/tasks/${encodeURIComponent(task.id)}/complete`, { method: 'PATCH' });
      setTasks((records) => records.map((record) => (
        record.id === task.id ? { ...record, status: 'COMPLETED' } : record
      )));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not complete the task.');
    } finally {
      setSavingTaskId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Today's Assigned Field Tasks</h2>
        <p className="text-xs text-gray-500">Tasks assigned to your authenticated account</p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
      {loading && <p className="py-6 text-center text-sm text-gray-500">Loading assigned tasks…</p>}

      <div className="space-y-2.5">
        {tasks.map((task) => {
          const completed = task.status === 'COMPLETED';
          return (
            <Card
              key={task.id}
              variant="elevated"
              padding="md"
              className={`transition flex items-start gap-3 ${completed ? 'bg-gray-50 opacity-70' : 'bg-white'}`}
            >
              <input
                type="checkbox"
                checked={completed}
                disabled={completed || savingTaskId === task.id}
                onChange={() => void completeTask(task)}
                aria-label={`Complete ${task.task_type}`}
                className="mt-1 w-4 h-4 rounded text-[#0B6E4F] border-gray-300 focus:ring-[#0B6E4F] cursor-pointer"
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-bold ${completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.task_type.replace(/_/g, ' ')}
                  </span>
                  <Badge variant={task.priority === 'HIGH' || task.priority === 'URGENT' ? 'danger' : 'neutral'} size="sm">
                    {formatDueDate(task.due_date)}
                  </Badge>
                </div>
                {task.patient_name && <div className="text-xs text-gray-500">Patient: {task.patient_name}</div>}
                {task.notes && <div className="text-xs text-gray-600">{task.notes}</div>}
              </div>
            </Card>
          );
        })}
        {!loading && !error && tasks.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
            No assigned tasks found.
          </div>
        )}
      </div>
    </div>
  );
};
