'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface StudentAnswer {
  id: string;
  questionId: string;
  question: {
    questionText: string;
    marks: number;
  };
  selectedOption?: {
    id: string;
    optionText: string;
    isCorrect: boolean;
  };
  marksObtained?: number;
}

interface Attempt {
  id: string;
  studentId: string;
  student: {
    name: string;
    email: string;
  };
  score?: number;
  totalMarks?: number;
  passing?: boolean;
  submittedAt?: string;
  answers: StudentAnswer[];
}

interface QuizResultsProps {
  quizId: string;
  token?: string | null;
  onClose: () => void;
}

const API = 'http://localhost:4000';

export default function QuizResults({
  quizId,
  token,
  onClose,
}: QuizResultsProps) {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedAttempt, setSelectedAttempt] = useState<Attempt | null>(null);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const res = await fetch(`${API}/quizzes/${quizId}/attempts`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load attempts');
        const data = await res.json();
        setAttempts(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load attempts');
      } finally {
        setLoading(false);
      }
    };

    if (token && quizId) {
      void fetchAttempts();
    }
  }, [quizId, token]);

  const downloadResults = () => {
    const csv = [
      ['Student Name', 'Email', 'Score', 'Total Marks', 'Passing', 'Submitted At'],
      ...attempts.map((a) => [
        a.student.name,
        a.student.email,
        a.score || '0',
        a.totalMarks || '0',
        a.passing ? 'Yes' : 'No',
        a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : 'N/A',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quiz-results-${quizId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-96 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Quiz Results</h2>
          <div className="flex gap-2">
            {attempts.length > 0 && (
              <button
                onClick={downloadResults}
                className="flex items-center gap-2 bg-green-500 text-white px-3 py-2 rounded hover:bg-green-600"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>
        )}

        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : selectedAttempt ? (
          <div>
            <button
              onClick={() => setSelectedAttempt(null)}
              className="mb-4 text-blue-600 hover:underline"
            >
              ← Back to Results
            </button>

            <div className="bg-gray-50 p-4 rounded mb-4">
              <h3 className="font-semibold mb-2">{selectedAttempt.student.name}</h3>
              <p className="text-sm text-gray-600">{selectedAttempt.student.email}</p>
              <p className="text-sm mt-2">
                Score: <span className="font-bold">{selectedAttempt.score || 0}</span> /{' '}
                {selectedAttempt.totalMarks || 0}
              </p>
            </div>

            <div className="space-y-3">
              {selectedAttempt.answers.map((answer) => (
                <div
                  key={answer.id}
                  className={`p-3 rounded border-l-4 ${
                    answer.selectedOption?.isCorrect
                      ? 'bg-green-50 border-green-500'
                      : 'bg-red-50 border-red-500'
                  }`}
                >
                  <p className="font-medium text-sm mb-1">
                    {answer.question.questionText}
                  </p>
                  <p className="text-sm text-gray-600">
                    Selected: {answer.selectedOption?.optionText || 'No answer'}
                  </p>
                  {answer.marksObtained !== undefined && (
                    <p className="text-sm mt-1">
                      Marks: <span className="font-semibold">{answer.marksObtained}</span> /{' '}
                      {answer.question.marks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : attempts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No student attempts yet.
          </div>
        ) : (
          <div className="space-y-2">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => setSelectedAttempt(attempt)}
              >
                <div className="flex-1">
                  <p className="font-medium">{attempt.student.name}</p>
                  <p className="text-sm text-gray-600">{attempt.student.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    {attempt.score || 0} / {attempt.totalMarks || 0}
                  </p>
                  <p
                    className={`text-sm ${
                      attempt.passing ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {attempt.passing ? 'Passing' : 'Failing'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
