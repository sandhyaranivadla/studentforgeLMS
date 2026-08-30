'use client';

import { useState } from 'react';

interface Option {
  id: string;
  optionText: string;
  isCorrect: boolean;
}

interface OptionFormProps {
  questionId: string;
  option?: Option;
  token?: string | null;
  onCancel: () => void;
  onSave: (option: Option) => void;
}

const API = 'http://localhost:4000';

export default function OptionForm({
  questionId,
  option,
  token,
  onCancel,
  onSave,
}: OptionFormProps) {
  const [formData, setFormData] = useState({
    optionText: option?.optionText || '',
    isCorrect: option?.isCorrect || false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!formData.optionText.trim()) {
      setError('Option text is required');
      return;
    }

    try {
      setLoading(true);

      if (option) {
        // Update existing option
        const res = await fetch(`${API}/quizzes/options/${option.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            optionText: formData.optionText,
            isCorrect: formData.isCorrect,
          }),
        });
        if (!res.ok) throw new Error('Failed to update option');
        const updated = await res.json();
        onSave(updated);
      } else {
        // Create new option
        const res = await fetch(
          `${API}/quizzes/questions/${questionId}/options`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              optionText: formData.optionText,
              isCorrect: formData.isCorrect,
            }),
          }
        );
        if (!res.ok) throw new Error('Failed to create option');
        const created = await res.json();
        onSave(created);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save option');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-green-50 p-3 rounded mb-2 border border-green-200">
      {error && (
        <div className="bg-red-50 text-red-700 p-2 rounded mb-2 text-xs">{error}</div>
      )}

      <div className="space-y-2">
        <input
          type="text"
          value={formData.optionText}
          onChange={(e) =>
            setFormData({ ...formData, optionText: e.target.value })
          }
          placeholder="Option text"
          className="w-full px-3 py-2 border rounded text-sm"
        />

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={formData.isCorrect}
            onChange={(e) =>
              setFormData({ ...formData, isCorrect: e.target.checked })
            }
          />
          <span>Mark as correct answer</span>
        </label>
      </div>

      <div className="flex gap-2 justify-end mt-2">
        <button
          onClick={onCancel}
          className="px-2 py-1 border rounded text-xs hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}
