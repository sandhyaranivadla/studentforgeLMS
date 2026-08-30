'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface LiveClass {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string;
  status: string;
  moduleId?: string;
}

interface LiveClassFormProps {
  courseId: string;
  liveClass?: LiveClass | null;
  token?: string | null;
  onCancel: () => void;
  onSave: (liveClass: LiveClass) => void;
}

const API = 'http://localhost:4000';

export default function LiveClassForm({
  courseId,
  liveClass,
  token,
  onCancel,
  onSave,
}: LiveClassFormProps) {
  const [formData, setFormData] = useState({
    title: liveClass?.title || '',
    description: liveClass?.description || '',
    startTime: liveClass?.startTime
      ? new Date(liveClass.startTime).toISOString().slice(0, 16)
      : '',
    endTime: liveClass?.endTime
      ? new Date(liveClass.endTime).toISOString().slice(0, 16)
      : '',
    moduleId: liveClass?.moduleId || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.startTime) {
      setError('Start time is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: formData.endTime
          ? new Date(formData.endTime).toISOString()
          : undefined,
        moduleId: formData.moduleId || undefined,
      };

      if (liveClass) {
        // Update
        const res = await fetch(`${API}/live-sessions/${liveClass.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update live class');
        const updated = await res.json();
        onSave(updated);
      } else {
        // Create
        const res = await fetch(`${API}/live-sessions?courseId=${courseId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create live class');
        const created = await res.json();
        onSave(created);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save live class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 p-4 rounded border border-blue-200 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold">
          {liveClass ? 'Edit Live Class' : 'Schedule Live Class'}
        </h4>
        <button onClick={onCancel} className="p-1 hover:bg-blue-100 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>
      )}

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border rounded text-sm"
        />

        <textarea
          placeholder="Description (optional)"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={2}
          className="w-full px-3 py-2 border rounded text-sm"
        />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1">Start Time</label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">End Time (optional)</label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1">Module (optional)</label>
          <input
            type="text"
            placeholder="Module ID"
            value={formData.moduleId}
            onChange={(e) =>
              setFormData({ ...formData, moduleId: e.target.value })
            }
            className="w-full px-3 py-2 border rounded text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-4">
        <button
          onClick={onCancel}
          className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Saving...' : liveClass ? 'Update' : 'Schedule'}
        </button>
      </div>
    </div>
  );
}
