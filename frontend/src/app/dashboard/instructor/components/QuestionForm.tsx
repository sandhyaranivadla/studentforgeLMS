'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import OptionForm from './OptionForm';

interface Question {
  id: string;
  questionText: string;
  marks: number;
  orderIndex?: number;
  options: Option[];
}

interface Option {
  id: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex?: number;
}

interface QuestionFormProps {
  quizId: string;
  question?: Question;
  token?: string | null;
  onCancel: () => void;
  onSave: (question: Question) => void;
}

const API = 'http://localhost:4000';

export default function QuestionForm({
  quizId,
  question,
  token,
  onCancel,
  onSave,
}: QuestionFormProps) {
  const [formData, setFormData] = useState({
    questionText: question?.questionText || '',
    marks: question?.marks || 1,
  });
  const [options, setOptions] = useState<Option[]>(question?.options || []);
  const [showAddOption, setShowAddOption] = useState(false);
  const [editingOption, setEditingOption] = useState<Option | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!formData.questionText.trim()) {
      setError('Question text is required');
      return;
    }

    try {
      setLoading(true);

      if (question) {
        // Update existing question
        const res = await fetch(`${API}/quizzes/questions/${question.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionText: formData.questionText,
            marks: formData.marks,
          }),
        });
        if (!res.ok) throw new Error('Failed to update question');
        const updated = await res.json();
        onSave({ ...updated, options });
      } else {
        // Create new question
        const res = await fetch(`${API}/quizzes/${quizId}/questions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionText: formData.questionText,
            marks: formData.marks,
          }),
        });
        if (!res.ok) throw new Error('Failed to create question');
        const created = await res.json();
        onSave({ ...created, options: [] });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save question');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('Delete this option?')) return;
    try {
      const res = await fetch(`${API}/quizzes/options/${optionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete option');
      setOptions((prev) => prev.filter((o) => o.id !== optionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete option');
    }
  };

  return (
    <div className="bg-blue-50 p-4 rounded mb-4 border border-blue-200">
      <h4 className="font-semibold mb-3">
        {question ? 'Edit Question' : 'New Question'}
      </h4>

      {error && (
        <div className="bg-red-50 text-red-700 p-2 rounded mb-3 text-sm">{error}</div>
      )}

      <div className="space-y-3">
        <textarea
          value={formData.questionText}
          onChange={(e) =>
            setFormData({ ...formData, questionText: e.target.value })
          }
          placeholder="Question text"
          rows={2}
          className="w-full px-3 py-2 border rounded text-sm"
        />

        <input
          type="number"
          value={formData.marks}
          onChange={(e) =>
            setFormData({ ...formData, marks: parseFloat(e.target.value) || 1 })
          }
          placeholder="Marks"
          min="0.5"
          step="0.5"
          className="w-full px-3 py-2 border rounded text-sm"
        />

        {question && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Options ({options.length})</span>
              <button
                onClick={() => setShowAddOption(!showAddOption)}
                className="flex items-center gap-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>

            {showAddOption && (
              <OptionForm
                questionId={question.id}
                token={token}
                onCancel={() => setShowAddOption(false)}
                onSave={(newOption) => {
                  setOptions((prev) => [...prev, newOption]);
                  setShowAddOption(false);
                }}
              />
            )}

            {editingOption && (
              <OptionForm
                questionId={question.id}
                option={editingOption}
                token={token}
                onCancel={() => setEditingOption(null)}
                onSave={(updated) => {
                  setOptions((prev) =>
                    prev.map((o) => (o.id === updated.id ? updated : o))
                  );
                  setEditingOption(null);
                }}
              />
            )}

            <div className="space-y-1">
              {options.map((opt) => (
                <div key={opt.id} className="flex items-center gap-2 text-sm p-2 bg-white rounded">
                  <input
                    type="radio"
                    checked={opt.isCorrect}
                    disabled
                    className="cursor-default"
                  />
                  <span className="flex-1 truncate">{opt.optionText}</span>
                  <button
                    onClick={() => setEditingOption(opt)}
                    className="text-blue-600 hover:bg-blue-50 px-1 rounded text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteOption(opt.id)}
                    className="text-red-600 hover:bg-red-50 p-0.5 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
          {loading ? 'Saving...' : 'Save Question'}
        </button>
      </div>
    </div>
  );
}
