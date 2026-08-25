'use client';

import { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  Menu,
  X,
  PlayCircle,
  FileText,
  HelpCircle,
  CheckCircle,
  ChevronLeft,
  Lock,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────── */
interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'QUIZ';
  contentUrl: string | null;
  duration: string | null;
  orderIndex: number;
}

interface CourseModule {
  id: string;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  modules: CourseModule[];
  instructor: { name: string | null };
}

interface Enrollment {
  id: string;
  progress: number;
  status: string;
}

interface CourseProgress {
  enrollment: Enrollment;
  completedLessonIds: string[];
}

type PageStatus = 'loading' | 'error' | 'not-enrolled' | 'ready';

const API = 'http://localhost:4000';

/* ─── Page ──────────────────────────────────────────────────────── */
export default function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const { token, user } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<string>>(new Set());
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');

  const isStudent = user?.role === 'STUDENT';

  /* ── Fetch progress (refreshable) ───────────────────────────── */
  const fetchProgress = useCallback(async () => {
    if (!token || !isStudent) return;
    try {
      const res = await fetch(`${API}/progress/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as CourseProgress;
      setEnrollment(data.enrollment);
      setCompletedLessonIds(new Set(data.completedLessonIds));
    } catch {
      // non-fatal — progress just won't update in UI
    }
  }, [token, courseId, isStudent]);

  /* ── Initial load ────────────────────────────────────────────── */
  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }
    const skipEnrollmentCheck = !!(user && user.role !== 'STUDENT');

    (async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch course
        const courseRes = await fetch(`${API}/courses/${courseId}`, {
          headers,
          cache: 'no-store',
        } as RequestInit);
        if (!courseRes.ok) {
          setErrorMsg(courseRes.status === 404 ? 'Course not found.' : 'Failed to load course.');
          setStatus('error');
          return;
        }
        const courseData: Course = await courseRes.json();
        setCourse(courseData);

        if (!skipEnrollmentCheck) {
          // Verify enrollment
          const enrollRes = await fetch(`${API}/enrollments/check/${courseId}`, { headers });
          if (!enrollRes.ok) {
            setErrorMsg('Could not verify enrollment.');
            setStatus('error');
            return;
          }
          const { enrolled, enrollment: enrollData } = await enrollRes.json();
          if (!enrolled) {
            setStatus('not-enrolled');
            return;
          }
          setEnrollment(enrollData as Enrollment);

          // Fetch existing lesson progress
          const progressRes = await fetch(`${API}/progress/courses/${courseId}`, { headers });
          if (progressRes.ok) {
            const progressData = (await progressRes.json()) as CourseProgress;
            setEnrollment(progressData.enrollment);
            setCompletedLessonIds(new Set(progressData.completedLessonIds));
          }
        }

        const firstLesson = courseData.modules?.[0]?.lessons?.[0] ?? null;
        setActiveLesson(firstLesson);
        setStatus('ready');
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'Unexpected error');
        setStatus('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, courseId]);

  /* ── Mark lesson complete ────────────────────────────────────── */
  const handleCompleteLesson = async () => {
    if (!activeLesson || !token || completing) return;
    setCompleting(true);
    setCompleteError('');
    try {
      const res = await fetch(
        `${API}/progress/courses/${courseId}/lessons/${activeLesson.id}/complete`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) {
        // 409 = already complete — treat as success silently
        if (res.status !== 409) {
          setCompleteError((data as { message?: string }).message ?? 'Failed to mark complete');
        }
      }
      // Always refresh progress after a complete attempt
      await fetchProgress();
    } catch {
      setCompleteError('Unexpected error');
    } finally {
      setCompleting(false);
    }
  };

  /* ── Status guards ───────────────────────────────────────────── */
  if (status === 'loading') {
    return (
      <div className="h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-400">Loading course…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-xl font-bold">{errorMsg}</h1>
          <Link
            href="/courses"
            className="text-blue-500 hover:text-blue-400 flex items-center justify-center gap-2"
          >
            <ChevronLeft size={16} /> Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'not-enrolled') {
    return (
      <div className="h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm mx-auto p-8 bg-neutral-900 border border-neutral-800 rounded-2xl">
          <Lock className="h-12 w-12 text-yellow-500 mx-auto" />
          <h1 className="text-xl font-bold">Enrollment Required</h1>
          <p className="text-neutral-400 text-sm">
            You need to enroll in this course before accessing the learning content.
          </p>
          <Link
            href={`/courses/${courseId}`}
            className="block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
          >
            View Course & Enroll
          </Link>
        </div>
      </div>
    );
  }

  if (!course) return null;

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedCount = completedLessonIds.size;
  const progressPct = enrollment?.progress ?? 0;
  const activeLessonCompleted = activeLesson ? completedLessonIds.has(activeLesson.id) : false;

  /* ── Sub-components ──────────────────────────────────────────── */
  const LessonIcon = ({ type, completed, active }: { type: Lesson['type']; completed: boolean; active: boolean }) => {
    if (completed) return <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />;
    const cls = active ? 'text-blue-400' : 'text-neutral-500';
    if (type === 'VIDEO') return <PlayCircle className={`h-4 w-4 ${cls} shrink-0`} />;
    if (type === 'PDF') return <FileText className={`h-4 w-4 ${cls} shrink-0`} />;
    return <HelpCircle className={`h-4 w-4 ${cls} shrink-0`} />;
  };

  const renderContent = () => {
    if (!activeLesson) {
      return (
        <div className="flex-1 flex items-center justify-center bg-neutral-950 text-neutral-500">
          Select a lesson to begin
        </div>
      );
    }

    if (activeLesson.type === 'VIDEO') {
      return (
        <div className="flex-1 flex flex-col bg-black overflow-hidden">
          <div className="w-full aspect-video bg-neutral-900 shrink-0">
            {activeLesson.contentUrl ? (
              <iframe
                src={activeLesson.contentUrl}
                className="w-full h-full"
                allowFullScreen
                title={activeLesson.title}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-500">
                <div className="text-center space-y-2">
                  <PlayCircle className="h-16 w-16 mx-auto opacity-30" />
                  <p className="text-sm">Video content not yet available</p>
                </div>
              </div>
            )}
          </div>
          <LessonDetailsPanel
            lesson={activeLesson}
            completed={activeLessonCompleted}
            completing={completing}
            completeError={completeError}
            isStudent={isStudent}
            onComplete={handleCompleteLesson}
          />
        </div>
      );
    }

    if (activeLesson.type === 'PDF') {
      return (
        <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
          {activeLesson.contentUrl ? (
            <iframe
              src={activeLesson.contentUrl}
              className="w-full flex-1"
              title={activeLesson.title}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-500">
              <div className="text-center space-y-2">
                <FileText className="h-16 w-16 mx-auto opacity-30" />
                <p className="text-sm">PDF content not yet available</p>
              </div>
            </div>
          )}
          <LessonDetailsPanel
            lesson={activeLesson}
            completed={activeLessonCompleted}
            completing={completing}
            completeError={completeError}
            isStudent={isStudent}
            onComplete={handleCompleteLesson}
          />
        </div>
      );
    }

    // QUIZ
    return (
      <div className="flex-1 flex flex-col bg-neutral-950 overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4 max-w-sm">
            <HelpCircle className="h-16 w-16 text-yellow-500 mx-auto" />
            <h2 className="text-xl font-bold text-white">{activeLesson.title}</h2>
            <p className="text-neutral-400 text-sm">
              Quiz functionality coming soon. Mark it complete when you&apos;re ready.
            </p>
          </div>
        </div>
        <LessonDetailsPanel
          lesson={activeLesson}
          completed={activeLessonCompleted}
          completing={completing}
          completeError={completeError}
          isStudent={isStudent}
          onComplete={handleCompleteLesson}
        />
      </div>
    );
  };

  /* ── Main render ─────────────────────────────────────────────── */
  return (
    <div className="h-screen bg-neutral-950 text-white flex flex-col overflow-hidden">
      {/* Navbar */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-950 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="h-6 w-px bg-neutral-800 hidden sm:block" />
          <Link
            href="/dashboard/student"
            className="hidden sm:flex items-center gap-1 text-neutral-400 hover:text-white text-sm transition-colors"
          >
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <span className="font-semibold text-sm truncate max-w-xs ml-2">{course.title}</span>
        </div>
        <div className="flex items-center gap-3">
          {isStudent && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-400">
              <span className="text-xs">
                {completedCount}/{totalLessons}
              </span>
              <div className="w-28 h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <span className="tabular-nums">{Math.round(progressPct)}%</span>
              {progressPct === 100 && (
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              )}
            </div>
          )}
          <div className="flex items-center gap-2 text-blue-500">
            <BookOpen size={18} />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? 'w-80' : 'w-0 opacity-0 pointer-events-none'} shrink-0 bg-neutral-900 border-r border-neutral-800 overflow-y-auto transition-all duration-300 ease-in-out`}
        >
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h2 className="font-semibold text-sm text-white">Course Content</h2>
            <span className="text-xs text-neutral-500">
              {completedCount}/{totalLessons} done
            </span>
          </div>

          <div className="divide-y divide-neutral-800">
            {course.modules.map((mod, mIdx) => {
              const modCompleted = mod.lessons.filter((l) => completedLessonIds.has(l.id)).length;
              return (
                <div key={mod.id}>
                  <div className="px-4 py-3 bg-neutral-900/80 sticky top-0 z-10">
                    <h3 className="font-medium text-sm text-neutral-200">
                      {mIdx + 1}. {mod.title}
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {modCompleted}/{mod.lessons.length} completed
                    </p>
                  </div>
                  {mod.lessons.map((lesson) => {
                    const isActive = activeLesson?.id === lesson.id;
                    const isDone = completedLessonIds.has(lesson.id);
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => {
                          setActiveLesson(lesson);
                          setCompleteError('');
                        }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-l-2 ${
                          isActive
                            ? 'bg-blue-500/10 border-blue-500'
                            : isDone
                              ? 'border-emerald-500/40 hover:bg-neutral-800'
                              : 'hover:bg-neutral-800 border-transparent'
                        }`}
                      >
                        <div className="mt-0.5">
                          <LessonIcon type={lesson.type} completed={isDone} active={isActive} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm line-clamp-2 ${
                              isActive
                                ? 'text-blue-400 font-medium'
                                : isDone
                                  ? 'text-emerald-400'
                                  : 'text-neutral-300'
                            }`}
                          >
                            {lesson.title}
                          </p>
                          {lesson.duration && (
                            <p className="text-xs text-neutral-500 mt-0.5">{lesson.duration}</p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

/* ─── LessonDetailsPanel ─────────────────────────────────────────── */
interface LessonDetailsPanelProps {
  lesson: Lesson;
  completed: boolean;
  completing: boolean;
  completeError: string;
  isStudent: boolean;
  onComplete: () => void;
}

function LessonDetailsPanel({
  lesson,
  completed,
  completing,
  completeError,
  isStudent,
  onComplete,
}: LessonDetailsPanelProps) {
  return (
    <div className="p-5 lg:p-7 bg-neutral-950 border-t border-neutral-800 shrink-0">
      <div className="max-w-4xl flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1.5">
            <span className="uppercase font-medium bg-neutral-800 px-2 py-0.5 rounded">
              {lesson.type}
            </span>
            {lesson.duration && <span>{lesson.duration}</span>}
            {completed && (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle size={12} /> Completed
              </span>
            )}
          </div>
          <h1 className="text-lg font-bold text-white truncate">{lesson.title}</h1>
          {lesson.contentUrl && lesson.type !== 'VIDEO' && (
            <a
              href={lesson.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-blue-500 hover:text-blue-400 text-sm"
            >
              <CheckCircle size={13} /> Open resource in new tab
            </a>
          )}
        </div>

        {/* Complete button — only for students */}
        {isStudent && (
          <div className="shrink-0 flex flex-col items-end gap-2">
            {completeError && (
              <p className="text-red-400 text-xs">{completeError}</p>
            )}
            {completed ? (
              <div className="flex items-center gap-2 bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium">
                <CheckCircle size={16} />
                Lesson Complete
              </div>
            ) : (
              <button
                onClick={onComplete}
                disabled={completing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
              >
                {completing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Mark Complete
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
