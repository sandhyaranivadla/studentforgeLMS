'use client';

import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import QuestionForm from './QuestionForm';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  published: boolean;
  timeLimit?: number;
  passingScore?: number;
  showCorrectAnswers: boolean;
  randomizeQuestions: boolean;
  questions?: Question[];
}

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

interface QuizFormProps {
  quiz: Quiz;
  token?: string | null;
  onClose: () => void;
  onSave: () => void;
}

const API = 'http://localhost:4000';

export default function QuizForm({
  quiz,
  token,
  onClose,
  onSave,
}: QuizFormProps) {
  const [formData, setFormData] = useState(quiz);
  const [questions, setQuestions] = useState<Question[]>(quiz.questions || []);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateQuiz = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/quizzes/${quiz.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          instructions: formData.instructions,
          timeLimit: formData.timeLimit || null,
          passingScore: formData.passingScore || null,
          showCorrectAnswers: formData.showCorrectAnswers,
          randomizeQuestions: formData.randomizeQuestions,
        }),
      });
      if (!res.ok) throw new Error('Failed to update quiz');
      onSave();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Delete this question?')) return;
    try {
      const res = await fetch(`${API}/quizzes/questions/${questionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete question');
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete question');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-96 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Edit Quiz</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>
        )}

        <div className="space-y-3 mb-6">
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
            placeholder="Quiz Title"
          />
          <textarea
            value={formData.description || ''}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
            placeholder="Description"
            rows={2}
          />
          <textarea
            value={formData.instructions || ''}
            onChange={(e) =>
              setFormData({ ...formData, instructions: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
            placeholder="Instructions"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={formData.timeLimit || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  timeLimit: e.target.value ? parseInt(e.target.value) : undefined,
                })
              }
              className="px-3 py-2 border rounded"
              placeholder="Time Limit (min)"
            />
            <input
              type="number"
              value={formData.passingScore || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  passingScore: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              className="px-3 py-2 border rounded"
              placeholder="Passing Score (%)"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.showCorrectAnswers}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    showCorrectAnswers: e.target.checked,
                  })
                }
              />
              Show Correct Answers
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.randomizeQuestions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    randomizeQuestions: e.target.checked,
                  })
                }
              />
              Randomize Questions
            </label>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Questions ({questions.length})</h3>
            <button
              onClick={() => setShowAddQuestion(!showAddQuestion)}
              className="flex items-center gap-1 bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {showAddQuestion && (
            <QuestionForm
              quizId={quiz.id}
              token={token}
              onCancel={() => setShowAddQuestion(false)}
              onSave={(newQuestion) => {
                setQuestions((prev) => [...prev, newQuestion]);
                setShowAddQuestion(false);
              }}
            />
          )}

          {editingQuestion && (
            <QuestionForm
              quizId={quiz.id}
              question={editingQuestion}
              token={token}
              onCancel={() => setEditingQuestion(null)}
              onSave={(updated) => {
                setQuestions((prev) =>
                  prev.map((q) => (q.id === updated.id ? updated : q))
                );
                setEditingQuestion(null);
              }}
            />
          )}

          <div className="space-y-2">
            {questions.map((q) => (
              <div
                key={q.id}
                className="p-2 bg-gray-50 rounded flex items-center justify-between"
              >
                <div className="text-sm">
                  <p className="font-medium">{q.questionText}</p>
                  <p className="text-gray-600">{q.options?.length || 0} options</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingQuestion(q)}
                    className="text-blue-600 hover:bg-blue-50 p-1 rounded text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="text-red-600 hover:bg-red-50 p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-6 border-t pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateQuiz}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}
