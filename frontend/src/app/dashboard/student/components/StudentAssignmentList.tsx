'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, BookOpen, Send } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate?: string;
  maxMarks: number;
  course: { id: string; title: string };
}

interface Submission {
  id: string;
  marks?: number;
  feedback?: string;
  submittedAt: string;
}

interface AssignmentWithSubmission extends Assignment {
  submission?: Submission;
}

const API = 'http://localhost:4000';

export default function StudentAssignmentList({ token }: { token?: string | null }) {
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState<{ [key: string]: string }>(
    {},
  );

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`${API}/assignments/student/my-submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load assignments');
      const data = await res.json();
      setAssignments(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSubmit = async (assignmentId: string) => {
    if (!submissionText[assignmentId]?.trim()) {
      setError('Submission text is required');
      return;
    }

    try {
      setSubmittingId(assignmentId);
      const res = await fetch(
        `${API}/assignments/${assignmentId}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            submissionText: submissionText[assignmentId],
          }),
        },
      );
      if (!res.ok) throw new Error('Failed to submit assignment');
      setSubmissionText((prev) => ({
        ...prev,
        [assignmentId]: '',
      }));
      await fetchAssignments();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <BookOpen size={18} /> My Assignments
      </h3>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-500/30 rounded p-3 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 bg-neutral-800 rounded animate-pulse"
            />
          ))}
        </div>
      )}

      {assignments.length === 0 && !loading && (
        <p className="text-neutral-500 text-sm text-center py-8">
          No assignments available for your courses.
        </p>
      )}

      <div className="space-y-3">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="border border-neutral-700 rounded-lg p-4 bg-neutral-800/50 space-y-3"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-white text-sm">
                    {assignment.title}
                  </h4>
                  <p className="text-neutral-400 text-xs">
                    {assignment.course.title}
                  </p>
                </div>
                {assignment.submission?.marks !== null &&
                  assignment.submission?.marks !== undefined && (
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-400">
                        {assignment.submission.marks} /{' '}
                        {assignment.maxMarks}
                      </p>
                      <p className="text-xs text-neutral-500">Graded</p>
                    </div>
                  )}
              </div>
              <p className="text-neutral-400 text-xs mt-2">
                {assignment.description}
              </p>
              {assignment.dueDate && (
                <p className="text-xs text-neutral-600 mt-1">
                  Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
              )}
              {assignment.submission?.feedback && (
                <div className="mt-3 p-2 bg-neutral-700/50 rounded text-xs text-neutral-300 border-l-2 border-blue-400">
                  <p className="font-medium text-neutral-200">Feedback:</p>
                  <p>{assignment.submission.feedback}</p>
                </div>
              )}
            </div>

            {!assignment.submission ? (
              <div className="space-y-2">
                <textarea
                  placeholder="Write your submission here..."
                  rows={4}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded p-2 text-white text-sm resize-none"
                  value={submissionText[assignment.id] || ''}
                  onChange={(e) =>
                    setSubmissionText((prev) => ({
                      ...prev,
                      [assignment.id]: e.target.value,
                    }))
                  }
                  disabled={submittingId === assignment.id}
                />
                <button
                  onClick={() => void handleSubmit(assignment.id)}
                  disabled={submittingId === assignment.id}
                  className="w-full text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded flex items-center justify-center gap-2"
                >
                  <Send size={14} />
                  {submittingId === assignment.id ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            ) : (
              <div className="p-3 bg-emerald-900/20 border border-emerald-500/30 rounded">
                <p className="text-xs text-emerald-400">
                  ✓ Submitted on{' '}
                  {new Date(
                    assignment.submission.submittedAt,
                  ).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
