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
  MessageSquare,
} from 'lucide-react';
import { OperunButton } from '@/components/ui';
import ChatPanel from '@/components/ChatPanel';

/* ─── Types ─────────────────────────────────────────────────────── */
interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'QUIZ';
  contentUrl: string | null;
  duration: string | null;
  orderIndex: number;
}

interface LiveSession {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  status: string;
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
  const [chatOpen, setChatOpen] = useState(false);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);

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

        // Fetch live sessions for this course
        try {
          const sessionsRes = await fetch(`${API}/live-sessions/course/${courseId}`, { headers });
          if (sessionsRes.ok) {
            const sessions = await sessionsRes.json();
            const now = new Date();
            const futureSessions = (Array.isArray(sessions) ? sessions : [])
              .filter((s: LiveSession) => new Date(s.startTime) > now && s.status === 'SCHEDULED')
              .sort((a: LiveSession, b: LiveSession) => 
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
              );
            setLiveSessions(futureSessions);
          }
        } catch {
          // Non-fatal - continue without live sessions
        }
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
      <div style={{
        height: '100vh',
        background: 'rgba(5, 15, 30, 0.5)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '2px solid #0ea5e9',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ color: '#9ca3af' }}>Loading course…</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={{
        height: '100vh',
        background: 'rgba(5, 15, 30, 0.5)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <AlertCircle style={{ width: '48px', height: '48px', color: '#ef4444', marginLeft: 'auto', marginRight: 'auto' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>{errorMsg}</h1>
          <Link
            href="/courses"
            style={{
              color: '#0ea5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              transition: 'color 0.3s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = '#06b6d4';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = '#0ea5e9';
            }}
          >
            <ChevronLeft size={16} /> Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  if (status === 'not-enrolled') {
    return (
      <div style={{
        height: '100vh',
        background: 'rgba(5, 15, 30, 0.5)',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          maxWidth: '400px',
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '2rem',
          background: 'rgba(31, 41, 55, 0.5)',
          border: '1px solid rgba(107, 114, 128, 0.5)',
          borderRadius: '2rem',
        }}>
          <Lock style={{ width: '48px', height: '48px', color: '#eab308', marginLeft: 'auto', marginRight: 'auto' }} />
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Enrollment Required</h1>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
            You need to enroll in this course before accessing the learning content.
          </p>
          <Link
            href={`/courses/${courseId}`}
            style={{
              display: 'block',
              background: '#0ea5e9',
              color: '#ffffff',
              fontWeight: 'bold',
              padding: '0.75rem 1rem',
              borderRadius: '0.75rem',
              textDecoration: 'none',
              transition: 'background 0.3s',
              marginTop: '0.5rem',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#06b6d4';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#0ea5e9';
            }}
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
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(5, 15, 30, 0.5)',
          color: '#6b7280',
        }}>
          Select a lesson to begin
        </div>
      );
    }

    if (activeLesson.type === 'VIDEO') {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}>
          <div style={{ width: '100%', aspectRatio: '16 / 9', background: 'rgba(31, 41, 55, 0.8)', flexShrink: 0 }}>
            {activeLesson.contentUrl ? (
              <iframe
                src={activeLesson.contentUrl}
                style={{ width: '100%', height: '100%' }}
                allowFullScreen
                title={activeLesson.title}
              />
            ) : (
              <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
              }}>
                <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <PlayCircle style={{ width: '64px', height: '64px', marginLeft: 'auto', marginRight: 'auto', opacity: 0.3 }} />
                  <p style={{ fontSize: '0.875rem' }}>Video content not yet available</p>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(5, 15, 30, 0.5)', overflow: 'hidden' }}>
          {activeLesson.contentUrl ? (
            <iframe
              src={activeLesson.contentUrl}
              style={{ width: '100%', flex: 1 }}
              title={activeLesson.title}
            />
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6b7280',
            }}>
              <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <FileText style={{ width: '64px', height: '64px', marginLeft: 'auto', marginRight: 'auto', opacity: 0.3 }} />
                <p style={{ fontSize: '0.875rem' }}>PDF content not yet available</p>
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(5, 15, 30, 0.5)', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px' }}>
            <HelpCircle style={{ width: '64px', height: '64px', color: '#eab308', marginLeft: 'auto', marginRight: 'auto' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>{activeLesson.title}</h2>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: 0 }}>
              Quiz functionality coming soon. Mark it complete when you're ready.
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
    <div style={{
      height: '100vh',
      background: 'rgba(5, 15, 30, 0.5)',
      color: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Navbar */}
      <header style={{
        height: '64px',
        borderBottom: '1px solid rgba(107, 114, 128, 0.5)',
        background: 'rgba(5, 15, 30, 0.5)',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: '0.5rem',
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              borderRadius: '0.5rem',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(31, 41, 55, 0.8)';
              (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'none';
              (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ height: '24px', width: '1px', background: 'rgba(107, 114, 128, 0.5)', display: 'none', marginLeft: '0.5rem', marginRight: '0.5rem' }} />
          <Link
            href="/dashboard/student"
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '0.25rem',
              color: '#9ca3af',
              textDecoration: 'none',
              fontSize: '0.875rem',
              transition: 'color 0.3s',
              marginLeft: '0.5rem',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.color = '#9ca3af';
            }}
          >
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <span style={{ fontWeight: 600, fontSize: '0.875rem', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
            {course.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isStudent && (
            <div style={{ display: 'none', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#9ca3af' }}>
              <span style={{ fontSize: '0.75rem' }}>
                {completedCount}/{totalLessons}
              </span>
              <div style={{
                width: '112px',
                height: '8px',
                background: 'rgba(31, 41, 55, 0.8)',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}>
                <div
                  style={{
                    height: '100%',
                    background: '#0ea5e9',
                    borderRadius: '9999px',
                    transition: 'width 0.5s',
                    width: `${progressPct}%`,
                  }}
                />
              </div>
              <span style={{ fontVariantNumeric: 'tabular-nums' }}>{Math.round(progressPct)}%</span>
              {progressPct === 100 && (
                <CheckCircle style={{ width: '16px', height: '16px', color: '#10b981' }} />
              )}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0ea5e9' }}>
            <BookOpen size={18} />
          </div>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            style={{
              padding: '0.5rem',
              borderRadius: '0.5rem',
              transition: 'all 0.3s',
              marginLeft: '0.5rem',
              background: chatOpen ? 'rgba(14, 165, 233, 0.2)' : 'none',
              border: 'none',
              color: chatOpen ? '#0ea5e9' : '#9ca3af',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!chatOpen) {
                (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(31, 41, 55, 0.8)';
              }
            }}
            onMouseLeave={(e) => {
              if (!chatOpen) {
                (e.currentTarget as HTMLButtonElement).style.color = '#9ca3af';
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
              }
            }}
          >
            <MessageSquare size={20} />
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside
          style={{
            width: sidebarOpen ? '320px' : '0px',
            opacity: sidebarOpen ? 1 : 0,
            pointerEvents: sidebarOpen ? 'auto' : 'none',
            flexShrink: 0,
            background: 'rgba(31, 41, 55, 0.5)',
            borderRight: '1px solid rgba(107, 114, 128, 0.5)',
            overflowY: 'auto',
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid rgba(107, 114, 128, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <h2 style={{ fontWeight: 600, fontSize: '0.875rem', color: '#ffffff', margin: 0 }}>Course Content</h2>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
              {completedCount}/{totalLessons} done
            </span>
          </div>

          {/* Live Sessions Section */}
          {liveSessions.length > 0 && (
            <div style={{ borderBottom: '1px solid rgba(107, 114, 128, 0.5)' }}>
              <div style={{
                padding: '0.75rem 1rem',
                background: 'rgba(31, 41, 55, 0.5)',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}>
                <h3 style={{ fontWeight: 500, fontSize: '0.875rem', color: '#e5e7eb', margin: 0 }}>
                  🔴 Live Classes
                </h3>
              </div>
              {liveSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/live/${session.id}`}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    transition: 'all 0.3s',
                    background: 'transparent',
                    textDecoration: 'none',
                    color: 'inherit',
                    borderLeft: '2px solid rgba(239, 68, 68, 0.4)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(31, 41, 55, 0.8)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                  }}
                >
                  <p style={{
                    fontSize: '0.875rem',
                    color: '#ef4444',
                    fontWeight: 500,
                    margin: 0,
                  }}>
                    {session.title}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: 0 }}>
                    {new Date(session.startTime).toLocaleString()}
                  </p>
                </Link>
              ))}
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(107, 114, 128, 0.5)' }}>
            {course.modules.map((mod, mIdx) => {
              const modCompleted = mod.lessons.filter((l) => completedLessonIds.has(l.id)).length;
              return (
                <div key={mod.id}>
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(31, 41, 55, 0.5)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                  }}>
                    <h3 style={{ fontWeight: 500, fontSize: '0.875rem', color: '#e5e7eb', margin: 0 }}>
                      {mIdx + 1}. {mod.title}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem', margin: 0 }}>
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
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          transition: 'all 0.3s',
                          borderLeft: isActive ? '2px solid #0ea5e9' : isDone ? '2px solid rgba(16, 185, 129, 0.4)' : '2px solid transparent',
                          background: isActive ? 'rgba(14, 165, 233, 0.1)' : isDone ? 'transparent' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'inherit',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLButtonElement).style.background = 'rgba(31, 41, 55, 0.8)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive) {
                            (e.currentTarget as HTMLButtonElement).style.background = isDone ? 'transparent' : 'transparent';
                          }
                        }}
                      >
                        <div style={{ marginTop: '0.125rem' }}>
                          <LessonIcon type={lesson.type} completed={isDone} active={isActive} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: '0.875rem',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              color: isActive ? '#0ea5e9' : isDone ? '#10b981' : '#d1d5db',
                              fontWeight: isActive ? 500 : 400,
                              margin: 0,
                            }}
                          >
                            {lesson.title}
                          </p>
                          {lesson.duration && (
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem', margin: 0 }}>
                              {lesson.duration}
                            </p>
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
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'rgba(5, 15, 30, 0.5)' }}>
          {renderContent()}
        </main>

        {/* Chat Panel */}
        <aside
          style={{
            width: chatOpen ? '320px' : '0px',
            opacity: chatOpen ? 1 : 0,
            pointerEvents: chatOpen ? 'auto' : 'none',
            flexShrink: 0,
            background: 'rgba(31, 41, 55, 0.5)',
            borderLeft: '1px solid rgba(107, 114, 128, 0.5)',
            transition: 'all 0.3s ease-in-out',
          }}
        >
          <ChatPanel courseId={courseId} />
        </aside>
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
    <div style={{
      padding: '1.25rem 1.75rem',
      background: 'rgba(5, 15, 30, 0.5)',
      borderTop: '1px solid rgba(107, 114, 128, 0.5)',
      flexShrink: 0,
    }}>
      <div style={{
        maxWidth: '1024px',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.375rem' }}>
            <span style={{ textTransform: 'uppercase', fontWeight: 500, background: 'rgba(31, 41, 55, 0.8)', padding: '0.125rem 0.5rem', borderRadius: '0.375rem' }}>
              {lesson.type}
            </span>
            {lesson.duration && <span>{lesson.duration}</span>}
            {completed && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#10b981', fontWeight: 500 }}>
                <CheckCircle size={12} /> Completed
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
            {lesson.title}
          </h1>
          {lesson.contentUrl && lesson.type !== 'VIDEO' && (
            <a
              href={lesson.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                marginTop: '0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                color: '#0ea5e9',
                textDecoration: 'none',
                fontSize: '0.875rem',
                transition: 'color 0.3s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = '#06b6d4';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = '#0ea5e9';
              }}
            >
              <CheckCircle size={13} /> Open resource in new tab
            </a>
          )}
        </div>

        {/* Complete button — only for students */}
        {isStudent && (
          <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
            {completeError && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: 0 }}>{completeError}</p>
            )}
            {completed ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#10b981',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}>
                <CheckCircle size={16} />
                Lesson Complete
              </div>
            ) : (
              <OperunButton
                onClick={onComplete}
                disabled={completing}
                loading={completing}
                variant="primary"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}
              >
                <CheckCircle size={16} />
                Mark Complete
              </OperunButton>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
