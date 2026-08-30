'use client';

import { useState } from 'react';
import { Loader, Trash2, CheckCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationItem from '../components/NotificationItem';

export default function NotificationsPage() {
  const {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleDeleteAll = async () => {
    if (!confirm('Delete all notifications? This action cannot be undone.')) return;

    setIsDeleting(true);
    try {
      await deleteAllNotifications();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
        <p className="text-neutral-400">
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          {unreadCount > 0 && ` • ${unreadCount} unread`}
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="px-4 py-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <CheckCircle size={16} />
              Mark all as read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              <Trash2 size={16} />
              {isDeleting ? 'Deleting...' : 'Delete all'}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="animate-spin text-neutral-500" size={32} />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-400">{error}</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-neutral-500">
            <p>
              {filter === 'unread'
                ? 'No unread notifications'
                : 'No notifications'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
          </div>
        )}
      </div>

      {/* Help Text */}
      {notifications.length === 0 && !isLoading && (
        <div className="mt-8 p-6 bg-neutral-900/50 border border-neutral-800 rounded-lg text-center">
          <p className="text-neutral-400">
            You're all caught up! New notifications will appear here when there's activity
            in your courses.
          </p>
        </div>
      )}
    </div>
  );
}
