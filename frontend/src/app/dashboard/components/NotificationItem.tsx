'use client';

import { Trash2, CheckCircle, AlertCircle, Bell, Video, Award, BookOpen, HelpCircle } from 'lucide-react';
import { Notification } from '@/hooks/useNotifications';
import { useRouter } from 'next/navigation';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const router = useRouter();

  const getIcon = () => {
    switch (notification.type) {
      case 'ASSIGNMENT_SUBMITTED':
        return <CheckCircle size={16} className="text-blue-400" />;
      case 'ASSIGNMENT_GRADED':
        return <Award size={16} className="text-green-400" />;
      case 'ASSIGNMENT_CREATED':
        return <BookOpen size={16} className="text-purple-400" />;
      case 'ANNOUNCEMENT_PUBLISHED':
        return <Bell size={16} className="text-yellow-400" />;
      case 'LIVE_SESSION_SCHEDULED':
        return <Video size={16} className="text-cyan-400" />;
      case 'LIVE_SESSION_UPDATED':
        return <AlertCircle size={16} className="text-orange-400" />;
      case 'LIVE_SESSION_CANCELLED':
        return <AlertCircle size={16} className="text-red-400" />;
      case 'ENROLLMENT_CONFIRMED':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'QUIZ_PUBLISHED':
        return <HelpCircle size={16} className="text-indigo-400" />;
      case 'COURSE_PUBLISHED':
        return <BookOpen size={16} className="text-blue-400" />;
      default:
        return <Bell size={16} className="text-gray-400" />;
    }
  };

  const handleNotificationClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      onClick={handleNotificationClick}
      className={`p-3 border-b border-neutral-700 cursor-pointer transition-colors ${
        notification.read
          ? 'bg-neutral-900/50 hover:bg-neutral-900'
          : 'bg-blue-900/20 hover:bg-blue-900/30'
      }`}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 pt-1">{getIcon()}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-neutral-200 truncate">
                {notification.title}
              </h4>
              <p className="text-sm text-neutral-400 line-clamp-2">
                {notification.message}
              </p>
            </div>

            {/* Unread Indicator */}
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-neutral-500">
              {timeAgo(notification.createdAt)}
            </span>

            {/* Actions */}
            <div className="flex gap-2">
              {!notification.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Mark read
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="text-neutral-500 hover:text-red-400 transition-colors"
                title="Delete notification"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
