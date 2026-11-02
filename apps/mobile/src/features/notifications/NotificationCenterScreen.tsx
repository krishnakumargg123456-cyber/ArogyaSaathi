import React, { useEffect, useState } from 'react';
import { Card, Badge } from '../../design-system';
import { mobileApiFetch } from '../../core/api/client';

interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: string;
  is_read: boolean;
  created_at: string;
}

function formatTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export const NotificationCenterScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    mobileApiFetch<Notification[]>('/notifications')
      .then((records) => {
        if (active) setNotifications(records);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load notifications.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Notifications & Alerts</h2>
        <p className="text-xs text-gray-500">Updates associated with your authenticated account</p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
      {loading && <p className="py-6 text-center text-sm text-gray-500">Loading notifications…</p>}
      <div className="space-y-2.5">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            variant="elevated"
            padding="md"
            className={`space-y-1 ${!notification.is_read ? 'border-l-4 border-l-[#0B6E4F]' : ''}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-gray-900 text-xs">{notification.title}</span>
              <Badge variant={notification.priority === 'URGENT' || notification.priority === 'HIGH' ? 'warning' : 'neutral'} size="sm">
                {notification.category}
              </Badge>
            </div>
            <p className="text-xs text-gray-600">{notification.message}</p>
            <span className="block text-[11px] text-gray-400">{formatTime(notification.created_at)}</span>
          </Card>
        ))}
        {!loading && !error && notifications.length === 0 && (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">No notifications found.</p>
        )}
      </div>
    </div>
  );
};
