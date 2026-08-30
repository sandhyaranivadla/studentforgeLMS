'use client';

import { X, Loader } from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationItem from './NotificationItem';
import Link from 'next/link';

interface NotificationDropdownProps {
  onClose: () => void;
}

export default function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const {
    notifications,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="w-96 max-h-96 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700">
        <h2 className="text-lg font-semibold text-white">Notifications</h2>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 py-2 border-b border-neutral-700 bg-neutral-950/50">
        <button
          onClick={() => setFilter('all')}
          className={`text-sm px-3 py-1 rounded transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`text-sm px-3 py-1 rounded transition-colors ${
            filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'bg-neutral-800 text-neutral-400 hover:text-white'
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin text-neutral-500" size={24} />
          </div>
        ) : error ? (
          <div className="p-4 text-center text-red-400 text-sm">{error}</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-neutral-500">
            <p className="text-sm">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </p>
          </div>
        ) : (
          <div>
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

      {/* Footer */}
      <div className="border-t border-neutral-700 px-4 py-3 bg-neutral-950/50">
        <Link
          href="/dashboard/notifications"
          className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          onClick={onClose}
        >
          View all notifications →
        </Link>
      </div>
    </div>
  );
}
