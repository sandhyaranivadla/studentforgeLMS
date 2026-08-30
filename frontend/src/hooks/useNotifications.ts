'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  readAt: string | null;
  courseId: string;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
  actionUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Fetch initial notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/notifications?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error(`API Error: ${response.status} - ${response.statusText}`);
        throw new Error(`Failed to fetch notifications: ${response.status}`);
      }

      const data = await response.json();
      setNotifications(data.data || []);
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch notifications';
      setError(errorMessage);
      console.error('Notifications fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error(`Unread count error: ${response.status} - ${response.statusText}`);
        return;
      }

      const data = await response.json();
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Unread count fetch error:', err);
    }
  }, [token, API_URL]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (id: string) => {
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/notifications/${id}/read`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to mark as read');
        }

        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n,
          ),
        );

        await fetchUnreadCount();
      } catch (err) {
        console.error('Mark as read error:', err);
      }
    },
    [token, API_URL, fetchUnreadCount],
  );

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          readAt: new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Mark all as read error:', err);
    }
  }, [token, API_URL]);

  // Delete notification
  const deleteNotification = useCallback(
    async (id: string) => {
      if (!token) return;

      try {
        const response = await fetch(`${API_URL}/notifications/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete notification');
        }

        // Update local state
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        await fetchUnreadCount();
      } catch (err) {
        console.error('Delete notification error:', err);
      }
    },
    [token, API_URL, fetchUnreadCount],
  );

  // Delete all notifications
  const deleteAllNotifications = useCallback(async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete all notifications');
      }

      // Update local state
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Delete all notifications error:', err);
    }
  }, [token, API_URL]);

  // Initialize Socket.io connection and fetch initial data
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Fetch initial data
    void fetchNotifications();
    void fetchUnreadCount();

    // Initialize Socket.io connection
    const newSocket = io(`${API_URL}/notifications`, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Real-time: New notification received
    newSocket.on('notification:new', (notification: Notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    // Real-time: Unread count updated
    newSocket.on('unread-count:update', (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
    });

    // Connection status
    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Socket.io connection error:', err);
      setError('Connection lost. Attempting to reconnect...');
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
    };
  }, [token, API_URL, fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    refreshNotifications: fetchNotifications,
  };
}
