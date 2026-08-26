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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <button
          onClick={() => setShowForm(!showForm)}
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
            type="text"
            placeholder="Title *"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className="w-full bg-neutral-700 border border-neutral-600 rounded p-1.5 text-white text-xs"
          />
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full bg-neutral-700 border border-neutral-600 rounded p-1.5 text-white text-xs resize-none"
            rows={2}
          />
          <div className="flex gap-1.5">
            <button
              onClick={handleAddQuiz}
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

      {loading && quizzes.length === 0 && (
        <div className="space-y-1">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-8 bg-neutral-800 rounded animate-pulse"
            />
          ))}
        </div>
      )}

      {quizzes.length === 0 && !loading && (
        <p className="text-neutral-500 text-xs text-center py-3">
          No quizzes yet
        </p>
      )}

      <div className="space-y-1">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="border border-neutral-700 rounded p-2 bg-neutral-800/50 flex items-start justify-between gap-2"
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-white text-xs line-clamp-1">
                {quiz.title}
              </h4>
              {quiz.description && (
                <p className="text-neutral-400 text-xs mt-0.5 line-clamp-1">
                  {quiz.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  quiz.published
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-yellow-900/30 text-yellow-400'
                }`}
              >
                {quiz.published ? 'Pub' : 'Draft'}
              </span>
              <button
                onClick={() => handleDeleteQuiz(quiz.id)}
                className="p-1 text-neutral-500 hover:text-red-400"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
