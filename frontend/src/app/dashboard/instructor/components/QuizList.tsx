'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, AlertCircle, BookOpen } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  published: boolean;
  moduleId?: string;
  questions?: { id: string }[];
}

interface QuizListProps {
  courseId: string;
  token?: string | null;
  onEditQuiz?: (quiz: Quiz) => void;
}

const API = 'http://localhost:4000';

export default function QuizList({
  courseId,
  token,
  onEditQuiz,
}: QuizListProps) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    instructions: '',
    timeLimit: '',
    passingScore: '',
    showCorrectAnswers: false,
    randomizeQuestions: false,
    moduleId: '',
  });

  useEffect(() => {
    if (!token || !courseId) return;

    const loadQuizzes = async () => {
      try {
        setLoading(true);
        setError('');
        const url = `${API}/quizzes?courseId=${courseId}`;
        console.log('[QuizList] API request:', url);
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log('[QuizList] Response status:', res.status, res.ok);
        
        if (!res.ok) {
          const errorBody = await res.text().catch(() => '');
          console.error('[QuizList] Error response body:', errorBody);
          throw new Error(`Failed to load quizzes: ${res.status} ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('[QuizList] Response data:', data);
        setQuizzes(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('[QuizList] Error:', e);
        setError(e instanceof Error ? e.message : 'Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };

    void loadQuizzes();
  }, [courseId, token]);

  const handleAddQuiz = async () => {
    if (!formData.title.trim()) {
      setError('Quiz title is required');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        title: formData.title,
        description: formData.description || null,
        instructions: formData.instructions || null,
        timeLimit: formData.timeLimit ? parseInt(formData.timeLimit) : null,
        passingScore: formData.passingScore ? parseFloat(formData.passingScore) : null,
        showCorrectAnswers: formData.showCorrectAnswers,
        randomizeQuestions: formData.randomizeQuestions,
        moduleId: formData.moduleId || null,
      };
      const res = await fetch(`${API}/quizzes?courseId=${courseId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to create quiz');
      const newQuiz = await res.json();
      setQuizzes((prev) => [...prev, newQuiz]);
      setFormData({
        title: '',
        description: '',
        instructions: '',
        timeLimit: '',
        passingScore: '',
        showCorrectAnswers: false,
        randomizeQuestions: false,
        moduleId: '',
      });
      setShowForm(false);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const res = await fetch(`${API}/quizzes/${quizId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete quiz');
      setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete quiz');
    }
  };

  const handlePublishToggle = async (quiz: Quiz) => {
    try {
      const endpoint = quiz.published ? 'unpublish' : 'publish';
      const res = await fetch(`${API}/quizzes/${quiz.id}/${endpoint}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to update quiz status');
      const updated = await res.json();
      setQuizzes((prev) =>
        prev.map((q) => (q.id === quiz.id ? updated : q))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update quiz status');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Quizzes
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" /> Add Quiz
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-gray-50 p-4 rounded space-y-3">
          <input
            type="text"
            placeholder="Quiz Title"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
            rows={2}
          />
          <textarea
            placeholder="Instructions"
            value={formData.instructions}
            onChange={(e) =>
              setFormData({ ...formData, instructions: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              placeholder="Time Limit (minutes)"
              value={formData.timeLimit}
              onChange={(e) =>
                setFormData({ ...formData, timeLimit: e.target.value })
              }
              className="px-3 py-2 border rounded"
            />
            <input
              type="number"
              placeholder="Passing Score (%)"
              value={formData.passingScore}
              onChange={(e) =>
                setFormData({ ...formData, passingScore: e.target.value })
              }
              className="px-3 py-2 border rounded"
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
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleAddQuiz}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Quiz'}
            </button>
          </div>
        </div>
      )}

      {loading && !showForm ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : quizzes.length === 0 ? (
        <div className="text-center text-gray-500 py-4">
          No quizzes yet. Create one to get started!
        </div>
      ) : (
        <div className="space-y-2">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100"
            >
              <div className="flex-1">
                <h4 className="font-medium">{quiz.title}</h4>
                <p className="text-sm text-gray-600">
                  {quiz.questions?.length || 0} questions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePublishToggle(quiz)}
                  className={`px-3 py-1 rounded text-sm ${
                    quiz.published
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {quiz.published ? 'Published' : 'Draft'}
                </button>
                <button
                  onClick={() => onEditQuiz?.(quiz)}
                  className="p-1 hover:bg-blue-100 text-blue-600 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteQuiz(quiz.id)}
                  className="p-1 hover:bg-red-100 text-red-600 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
