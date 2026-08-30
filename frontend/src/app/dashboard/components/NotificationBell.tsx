'use client';

import { Bell, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';

export default function NotificationBell() {
  const { unreadCount, isConnected, error } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative p-2 text-neutral-400 hover:text-white transition-colors"
        title="Notifications"
      >
        <Bell size={24} />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        {/* Connection Status Indicator */}
        {!isConnected && (
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-yellow-500 rounded-full animate-pulse" title="Reconnecting..." />
        )}
      </button>

      {/* Error Indicator */}
      {error && (
        <div className="absolute top-12 right-0 bg-red-900/90 text-red-200 text-xs px-2 py-1 rounded whitespace-nowrap">
          <div className="flex items-center gap-1">
            <AlertCircle size={12} />
            Connection issue
          </div>
        </div>
      )}

      {/* Dropdown Panel */}
      {isDropdownOpen && (
        <div className="absolute top-12 right-0 z-50">
          <NotificationDropdown onClose={() => setIsDropdownOpen(false)} />
        </div>
      )}
    </div>
  );
}
