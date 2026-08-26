'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, AlertCircle, BookOpen } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  maxMarks: number;
  moduleId?: string;
}

interface AssignmentListProps {
  courseId: string;
  token?: string | null;
  onEditAssignment?: (assignment: Assignment) => void;
}

const API = 'http://localhost:4000';

export default function AssignmentList({
  courseId,
  token,
  onEditAssignment,
}: AssignmentListProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    dueDate: '',
    maxMarks: 0,
    moduleId: '',
  });

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      const url = `${API}/assignments?courseId=${courseId}`;
      console.log('[AssignmentList] API request:', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[AssignmentList] Response status:', res.status, res.ok);
      
      if (!res.ok) {
        const errorBody = await res.text().catch(() => '');
        console.error('[AssignmentList] Error response body:', errorBody);
        
        // Handle authentication errors
        if (res.status === 401) {
          console.warn('[AssignmentList] Received 401 - token may be invalid or expired');
          setError('Authentication failed. Please refresh the page or log in again.');
          return;
        }
        
        if (res.status === 403) {
          console.warn('[AssignmentList] Received 403 - insufficient permissions');
          setError('You do not have permission to view assignments for this course.');
          return;
        }
        
        throw new Error(`Failed to load assignments: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      console.log('[AssignmentList] Response data:', data);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('[AssignmentList] Error:', e);
      setError(e instanceof Error ? e.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || !courseId) {
      console.log('[AssignmentList] Skipping fetch - token:', !!token, 'courseId:', !!courseId);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchAssignments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, token]);

  const handleAddAssignment = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        maxMarks: parseFloat(String(formData.maxMarks)) || 0,
      };
      const res = await fetch(`${API}/assignments?courseId=${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create assignment');
      const newAssignment = await res.json();
      setAssignments((prev) => [...prev, newAssignment]);
      setFormData({
        title: '',
        description: '',
        instructions: '',
        dueDate: '',
        maxMarks: 0,
        moduleId: '',
      });
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Delete this assignment?')) return;
    try {
      const res = await fetch(`${API}/assignments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete assignment');
      setAssignments((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete assignment');
    }
  };

  return (
    <div className="space-y-2" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
          className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2 py-1 rounded flex items-center gap-1 whitespace-nowrap"
        >
          <Plus size={12} /> Add
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-500/30 rounded p-2 text-xs">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {showForm && (
        <div className="border border-neutral-700 rounded p-3 space-y-2 bg-neutral-800/50">
          <input
            placeholder="Title *"
            className="w-full bg-neutral-700 border border-neutral-600 rounded p-1.5 text-white text-xs"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <textarea
            placeholder="Description *"
            rows={2}
            className="w-full bg-neutral-700 border border-neutral-600 rounded p-1.5 text-white text-xs resize-none"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <div className="flex gap-1.5">
            <button
              onClick={() => void handleAddAssignment()}
              disabled={loading}
              className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-2 py-1 rounded"
            >
              {loading ? '…' : 'Save'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              disabled={loading}
              className="text-xs bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white px-2 py-1 rounded"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {loading && assignments.length === 0 && (
        <div className="space-y-1">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-8 bg-neutral-800 rounded animate-pulse"
            />
          ))}
        </div>
      )}

      {assignments.length === 0 && !loading && (
        <p className="text-neutral-500 text-xs text-center py-3">
          No assignments yet
        </p>
      )}

      <div className="space-y-1">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="border border-neutral-700 rounded p-2 bg-neutral-800/50 flex items-start justify-between gap-2"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white text-xs line-clamp-1">
                {assignment.title}
              </h4>
              <p className="text-neutral-400 text-xs mt-0.5 line-clamp-1">
                {assignment.description}
              </p>
              {assignment.dueDate && (
                <span className="text-xs text-neutral-500 mt-1 block">
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <button
              onClick={() => void handleDeleteAssignment(assignment.id)}
              className="p-1 text-neutral-500 hover:text-red-400 flex-shrink-0"
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
