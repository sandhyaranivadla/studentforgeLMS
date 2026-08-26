'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Bell } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  publishedAt?: string | null;
  instructor: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface AnnouncementsFeedProps {
  courseId: string;
  token?: string | null;
}

const API = 'http://localhost:4000';

export default function AnnouncementsFeed({
  courseId,
  token,
}: AnnouncementsFeedProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(
        `${API}/announcements/published?courseId=${courseId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        if (res.status === 403) {
          setError('You are not enrolled in this course');
        } else {
          throw new Error('Failed to load announcements');
        }
        return;
      }

      const data = await res.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Failed to load announcements'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && courseId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchAnnouncements();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, token]);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-24 bg-neutral-800 rounded-lg animate-pulse" />
        <div className="h-24 bg-neutral-800 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 text-yellow-400 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 text-sm">
        <AlertCircle size={16} />
        {error}
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500">
        <Bell size={32} className="mx-auto mb-3 opacity-50" />
        <p className="text-sm">No announcements yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {announcements.map((announcement) => {
        const isExpanded = expandedId === announcement.id;
        const isLongContent = announcement.content.length > 200;

        return (
          <div
            key={announcement.id}
            className="border border-neutral-700 rounded-lg p-4 bg-neutral-800/50 hover:border-neutral-600 transition-colors"
          >
            <div className="flex items-start gap-3">
              <Bell className="text-blue-400 mt-1 shrink-0" size={18} />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white text-sm">
                  {announcement.title}
                </h4>
                <p className="text-neutral-400 text-xs mt-0.5">
                  By {announcement.instructor.name || announcement.instructor.email}
                </p>

                <div
                  className={`mt-2 text-sm text-neutral-300 ${
                    !isExpanded && isLongContent ? 'line-clamp-2' : ''
                  }`}
                >
                  {announcement.content}
                </div>

                {isLongContent && (
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : announcement.id)
                    }
                    className="text-xs text-blue-400 hover:text-blue-300 mt-2"
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}

                <div className="text-xs text-neutral-500 mt-3">
                  Published:{' '}
                  {announcement.publishedAt
                    ? new Date(announcement.publishedAt).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )
                    : new Date(announcement.createdAt).toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        },
                      )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
