'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, AlertCircle, Bell, Send } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
}

interface AnnouncementListProps {
  courseId: string;
  token?: string | null;
}

const API = 'http://localhost:4000';

export default function AnnouncementList({
  courseId,
  token,
}: AnnouncementListProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  });

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      const url = `${API}/announcements?courseId=${courseId}`;
      console.log('[AnnouncementList] API request:', url);
      const res = await fetch(
        url,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log('[AnnouncementList] Response status:', res.status, res.ok);
      
      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        console.error('[AnnouncementList] Error response body:', errorBody);
        throw new Error(`Failed to load announcements: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('[AnnouncementList] Response data:', data);
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[AnnouncementList] Error:', e);
      setError(e instanceof Error ? e.message : 'Failed to load announcements');
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

  const handleAddAnnouncement = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (formData.title.length < 5 || formData.title.length > 200) {
      setError('Title must be between 5 and 200 characters');
      return;
    }

    if (formData.content.length < 10 || formData.content.length > 5000) {
      setError('Content must be between 10 and 5000 characters');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        courseId,
        title: formData.title,
        content: formData.content,
        status: formData.status,
      };

      const res = await fetch(`${API}/announcements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create announcement');
      }

      const newAnnouncement = await res.json();
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      setFormData({
        title: '',
        content: '',
        status: 'DRAFT',
      });
      setShowForm(false);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!editingId) return;

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    if (formData.title.length < 5 || formData.title.length > 200) {
      setError('Title must be between 5 and 200 characters');
      return;
    }

    if (formData.content.length < 10 || formData.content.length > 5000) {
      setError('Content must be between 10 and 5000 characters');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: formData.title,
        content: formData.content,
        status: formData.status,
      };

      const res = await fetch(`${API}/announcements/${editingId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update announcement');
      }

      const updatedAnnouncement = await res.json();
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === editingId ? updatedAnnouncement : a)),
      );
      setFormData({
        title: '',
        content: '',
        status: 'DRAFT',
      });
      setEditingId(null);
      setShowForm(false);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('Delete this announcement? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/announcements/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete announcement');
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete announcement');
    }
  };

  const handleEditClick = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      status: announcement.status,
    });
    setShowForm(true);
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      title: '',
      content: '',
      status: 'DRAFT',
    });
    setError('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Bell size={18} /> Announcements
        </h3>
        <button
          onClick={() => {
            if (!showForm) {
              setEditingId(null);
              setFormData({
                title: '',
                content: '',
                status: 'DRAFT',
              });
              setError('');
            }
            setShowForm(!showForm);
          }}
          disabled={loading}
          className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded flex items-center gap-1"
        >
          <Plus size={14} /> {editingId ? 'Cancel' : 'New Announcement'}
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-500/30 rounded p-3 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {showForm && (
        <div className="border border-neutral-700 rounded-lg p-4 space-y-3 bg-neutral-800/50">
          <input
            placeholder="Announcement title (5-200 characters) *"
            className="w-full bg-neutral-700 border border-neutral-600 rounded p-2 text-white text-sm"
            value={formData.title}
            maxLength={200}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <div className="text-xs text-neutral-500">
            {formData.title.length} / 200
          </div>

          <textarea
            placeholder="Announcement content (10-5000 characters) *"
            rows={5}
            className="w-full bg-neutral-700 border border-neutral-600 rounded p-2 text-white text-sm resize-none"
            value={formData.content}
            maxLength={5000}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
          />
          <div className="text-xs text-neutral-500">
            {formData.content.length} / 5000
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-neutral-300 flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value="DRAFT"
                checked={formData.status === 'DRAFT'}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'PUBLISHED' })
                }
                className="w-4 h-4"
              />
              Draft (Students cannot see)
            </label>
            <label className="text-sm text-neutral-300 flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value="PUBLISHED"
                checked={formData.status === 'PUBLISHED'}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'PUBLISHED' })
                }
                className="w-4 h-4"
              />
              Published (Students can see)
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                editingId ? void handleUpdateAnnouncement() : void handleAddAnnouncement()
              }
              disabled={loading}
              className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded flex items-center gap-1"
            >
              <Send size={14} />
              {loading ? '…' : editingId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={loading}
              className="text-sm bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white px-3 py-1.5 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && announcements.length === 0 && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-20 bg-neutral-800 rounded animate-pulse"
            />
          ))}
        </div>
      )}

      {announcements.length === 0 && !loading && (
        <p className="text-neutral-500 text-sm text-center py-8">
          No announcements yet. Create one to get started!
        </p>
      )}

      <div className="space-y-3">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className={`border rounded-lg p-4 ${
              announcement.status === 'PUBLISHED'
                ? 'border-emerald-500/30 bg-emerald-900/20'
                : 'border-neutral-700 bg-neutral-800/50'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-white text-sm">
                    {announcement.title}
                  </h4>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      announcement.status === 'PUBLISHED'
                        ? 'bg-emerald-900/50 text-emerald-400'
                        : 'bg-yellow-900/40 text-yellow-400'
                    }`}
                  >
                    {announcement.status}
                  </span>
                </div>
                <p className="text-neutral-400 text-xs mt-1 line-clamp-2">
                  {announcement.content}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                  <span>
                    Created: {new Date(announcement.createdAt).toLocaleDateString()}
                  </span>
                  {announcement.publishedAt && (
                    <>
                      <span>•</span>
                      <span>
                        Published:{' '}
                        {new Date(announcement.publishedAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleEditClick(announcement)}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition-colors"
                  title="Edit"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => void handleDeleteAnnouncement(announcement.id)}
                  className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
