'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, AlertCircle, Video, Calendar, Clock } from 'lucide-react';
import LiveClassForm from './LiveClassForm';

interface LiveClass {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED' | string;
  moduleId?: string;
  course?: { id: string; title: string };
  module?: { id: string; title: string };
}

interface LiveClassListProps {
  courseId: string;
  token?: string | null;
}

const API = 'http://localhost:4000';

export default function LiveClassList({
  courseId,
  token,
}: LiveClassListProps) {
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<LiveClass | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    if (!token || !courseId) return;

    const loadClasses = async () => {
      try {
        setLoading(true);
        setError('');
        const url = `${API}/live-sessions/course/${courseId}`;
        console.log('[LiveClassList] API request:', url);
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('[LiveClassList] Response status:', res.status, res.ok);
        
        if (!res.ok) {
          const errorBody = await res.text().catch(() => '');
          console.error('[LiveClassList] Error response body:', errorBody);
          throw new Error(`Failed to load live classes: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('[LiveClassList] Response data:', data);
        setLiveClasses(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('[LiveClassList] Error:', e);
        setError(e instanceof Error ? e.message : 'Failed to load live classes');
      } finally {
        setLoading(false);
      }
    };

    void loadClasses();
  }, [courseId, token]);

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Are you sure you want to delete this live class?')) return;

    try {
      const res = await fetch(`${API}/live-sessions/${classId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete live class');
      setLiveClasses((prev) => prev.filter((c) => c.id !== classId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete live class');
    }
  };

  const statusColor: Record<string, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    LIVE: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
  };

  const getFilteredClasses = () => {
    if (filter === 'all') return liveClasses;

    const now = new Date();
    if (filter === 'upcoming') {
      return liveClasses.filter((c) => new Date(c.startTime) > now && c.status === 'SCHEDULED');
    }
    if (filter === 'past') {
      return liveClasses.filter((c) => c.status === 'COMPLETED' || c.status === 'CANCELLED');
    }
    return liveClasses;
  };

  const filteredClasses = getFilteredClasses();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Video className="w-5 h-5" />
          Live Classes
        </h3>
        <button
          onClick={() => {
            setEditingClass(null);
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" /> Schedule
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {showForm && (
        <LiveClassForm
          courseId={courseId}
          liveClass={editingClass}
          token={token}
          onCancel={() => {
            setShowForm(false);
            setEditingClass(null);
          }}
          onSave={(newClass) => {
            if (editingClass) {
              setLiveClasses((prev) =>
                prev.map((c) => (c.id === newClass.id ? newClass : c))
              );
            } else {
              setLiveClasses((prev) => [...prev, newClass]);
            }
            setShowForm(false);
            setEditingClass(null);
          }}
        />
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('past')}
          className={`px-3 py-1 rounded text-sm ${
            filter === 'past' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          Past
        </button>
      </div>

      {loading && !showForm ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          No live classes yet. Create one to get started!
        </div>
      ) : (
        <div className="space-y-2">
          {filteredClasses.map((liveClass) => (
            <div
              key={liveClass.id}
              className="flex items-start justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
            >
              <div className="flex-1">
                <h4 className="font-medium">{liveClass.title}</h4>
                <p className="text-sm text-gray-600">{liveClass.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(liveClass.startTime)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(liveClass.startTime)}
                    {liveClass.endTime && ` - ${formatTime(liveClass.endTime)}`}
                  </div>
                  {liveClass.module && (
                    <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                      {liveClass.module.title}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    statusColor[liveClass.status]
                  }`}
                >
                  {liveClass.status}
                </span>
                {liveClass.status === 'SCHEDULED' && (
                  <>
                    <button
                      onClick={() => {
                        setEditingClass(liveClass);
                        setShowForm(true);
                      }}
                      className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClass(liveClass.id)}
                      className="p-1 hover:bg-red-100 text-red-600 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
