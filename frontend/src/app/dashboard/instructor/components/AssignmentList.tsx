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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <BookOpen size={18} /> Assignments
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
          className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded flex items-center gap-1"
        >
          <Plus size={14} /> Add Assignment
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
            placeholder="Title *"
            className="w-full bg-neutral-700 border border-neutral-600 rounded p-2 text-white text-sm"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <textarea
            placeholder="Description *"
            rows={3}
            className="w-full bg-neutral-700 border border-neutral-600 rounded p-2 text-white text-sm resize-none"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <textarea
            placeholder="Instructions (optional)"
            rows={2}
            className="w-full bg-neutral-700 border border-neutral-600 rounded p-2 text-white text-sm resize-none"
            value={formData.instructions}
            onChange={(e) =>
              setFormData({ ...formData, instructions: e.target.value })
            }
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="datetime-local"
              placeholder="Due Date"
              className="bg-neutral-700 border border-neutral-600 rounded p-2 text-white text-sm"
              value={formData.dueDate}
              onChange={(e) =>
                setFormData({ ...formData, dueDate: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Max Marks"
              className="bg-neutral-700 border border-neutral-600 rounded p-2 text-white text-sm"
              value={formData.maxMarks}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxMarks: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => void handleAddAssignment()}
              disabled={loading}
              className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded"
            >
              {loading ? '…' : 'Create'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              disabled={loading}
              className="text-sm bg-neutral-700 hover:bg-neutral-600 disabled:opacity-50 text-white px-3 py-1.5 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && assignments.length === 0 && (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-12 bg-neutral-800 rounded animate-pulse"
            />
          ))}
        </div>
      )}

      {assignments.length === 0 && !loading && (
        <p className="text-neutral-500 text-sm text-center py-8">
          No assignments yet. Create one to get started!
        </p>
      )}

      <div className="space-y-2">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="border border-neutral-700 rounded-lg p-4 bg-neutral-800/50 flex items-start justify-between"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white text-sm">
                {assignment.title}
              </h4>
              <p className="text-neutral-400 text-xs mt-1 line-clamp-2">
                {assignment.description}
              </p>
              <div className="flex items-center gap-2 mt-2 text-xs text-neutral-500">
                <span>Max Marks: {assignment.maxMarks}</span>
                {assignment.dueDate && (
                  <>
                    <span>•</span>
                    <span>
                      Due: {new Date(assignment.dueDate).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-4">
              <button
                onClick={() =>
                  onEditAssignment && onEditAssignment(assignment)
                }
                className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-700 rounded transition-colors"
                title="Edit"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => void handleDeleteAssignment(assignment.id)}
                className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
