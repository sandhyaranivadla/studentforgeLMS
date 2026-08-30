'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PlayCircle,
  Award,
  BookMarked,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { OperunCard, OperunCardHeader, OperunCardTitle, OperunCardBody, OperunAlert } from '@/components/ui';
import { OperunContainer, OperunMain } from '@/components/layout';
import StudentAssignmentList from './components/StudentAssignmentList';

const API = 'http://localhost:4000';

interface CourseInstructor {
  name: string | null;
}

interface LiveSession {
  id: string;
  title: string;
  startTime: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  instructor: CourseInstructor;
  liveSessions?: LiveSession[];
}

interface Enrollment {
  id: string;
  courseId: string;
  progress: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  course: Course;
}

export default function StudentDashboard() {
  const { token } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveSessionsByEnrollment, setLiveSessionsByEnrollment] = useState<Record<string, LiveSession[]>>({});

  useEffect(() => {
    if (!token) return;
    const fetchEnrollments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/enrollments`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        const enrollmentsArray = Array.isArray(data) ? data : [];
        setEnrollments(enrollmentsArray);
        
        // Fetch live sessions for each enrolled course
        const sessionsByEnrollment: Record<string, LiveSession[]> = {};
        await Promise.all(
          enrollmentsArray.map(async (enrollment: Enrollment) => {
            try {
              const sessionRes = await fetch(`${API}/live-sessions/course/${enrollment.courseId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (sessionRes.ok) {
                const sessions = await sessionRes.json();
                // Filter to only future sessions
                const now = new Date();
                sessionsByEnrollment[enrollment.courseId] = (Array.isArray(sessions) ? sessions : [])
                  .filter((s: LiveSession) => new Date(s.startTime) > now)
                  .sort((a: LiveSession, b: LiveSession) => 
                    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
                  );
              }
            } catch {
              // Non-fatal - continue with other courses
            }
          })
        );
        setLiveSessionsByEnrollment(sessionsByEnrollment);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load enrollments');
      } finally {
        setLoading(false);
      }
    };
    void fetchEnrollments();
  }, [token]);

  const active = enrollments.filter((e) => e.status === 'ACTIVE' && e.progress > 0);
  const notStarted = enrollments.filter((e) => e.status === 'ACTIVE' && e.progress === 0);
  const completed = enrollments.filter((e) => e.status === 'COMPLETED');

  const averageProgress =
    enrollments.length > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrollments.length)
      : 0;

  const statusBadge = (enrollment: Enrollment) => {
    if (enrollment.status === 'COMPLETED')
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-900/50 text-emerald-400 font-medium">
          Completed
        </span>
      );
    if (enrollment.status === 'CANCELLED')
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500 font-medium">
          Cancelled
        </span>
      );
    if (enrollment.progress === 0)
      return (
        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-medium">
          Not Started
        </span>
      );
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-400 font-medium">
        In Progress
      </span>
    );
  };

  const progressBarColor = (progress: number, status: Enrollment['status']) => {
    if (status === 'COMPLETED' || progress === 100) return 'bg-emerald-500';
    if (progress > 0) return 'bg-blue-500';
    return 'bg-neutral-700';
  };

  return (
    <OperunMain>
      <OperunContainer maxWidth="lg">
        <div style={{ paddingTop: '2rem', paddingBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <OperunCard>
              <OperunCardBody>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    In Progress
                  </h3>
                  <PlayCircle style={{ color: '#0ea5e9', width: '16px', height: '16px' }} />
                </div>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>
                  {loading ? '—' : active.length}
                </p>
              </OperunCardBody>
            </OperunCard>

            <OperunCard>
              <OperunCardBody>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    Completed
                  </h3>
                  <Award style={{ color: '#10b981', width: '16px', height: '16px' }} />
                </div>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>
                  {loading ? '—' : completed.length}
                </p>
              </OperunCardBody>
            </OperunCard>

            <OperunCard>
              <OperunCardBody>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    Enrolled
                  </h3>
                  <BookMarked style={{ color: '#a855f7', width: '16px', height: '16px' }} />
                </div>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>
                  {loading ? '—' : enrollments.length}
                </p>
              </OperunCardBody>
            </OperunCard>

            <OperunCard>
              <OperunCardBody>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                    Avg. Progress
                  </h3>
                  <TrendingUp style={{ color: '#eab308', width: '16px', height: '16px' }} />
                </div>
                <p style={{ fontSize: '1.875rem', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>
                  {loading ? '—' : `${averageProgress}%`}
                </p>
              </OperunCardBody>
            </OperunCard>
          </div>

          {/* My Courses Section */}
          <OperunCard>
            <OperunCardHeader>
              <OperunCardTitle>My Courses</OperunCardTitle>
            </OperunCardHeader>

            <OperunCardBody>
              {/* Loading */}
              {loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        border: '1px solid rgba(107, 114, 128, 0.5)',
                        borderRadius: '0.75rem',
                        overflow: 'hidden',
                        animation: 'pulse 2s infinite',
                      }}
                    >
                      <div style={{ height: '144px', background: 'rgba(31, 41, 55, 0.5)' }} />
                      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ height: '1rem', background: 'rgba(31, 41, 55, 0.5)', borderRadius: '0.375rem', width: '75%' }} />
                        <div style={{ height: '0.75rem', background: 'rgba(31, 41, 55, 0.5)', borderRadius: '0.375rem', width: '50%' }} />
                        <div style={{ height: '0.5rem', background: 'rgba(31, 41, 55, 0.5)', borderRadius: '9999px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <OperunAlert variant="error" onClose={() => setError('')}>
                  {error}
                </OperunAlert>
              )}

              {/* Empty State */}
              {!loading && !error && enrollments.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  paddingTop: '3rem',
                  paddingBottom: '3rem',
                  background: 'rgba(5, 15, 30, 0.5)',
                  borderRadius: '0.75rem',
                  border: '1px dashed rgba(107, 114, 128, 0.5)',
                }}>
                  <BookMarked style={{ width: '40px', height: '40px', color: '#4b5563', marginLeft: 'auto', marginRight: 'auto', marginBottom: '0.75rem' }} />
                  <p style={{ color: '#6b7280', marginBottom: '1rem', margin: 0 }}>
                    You haven't been enrolled in any courses yet.
                  </p>
                  <p style={{ color: '#4b5563', fontSize: '0.875rem', margin: 0 }}>
                    Please contact your administrator to get access.
                  </p>
                </div>
              )}

              {/* In-progress section */}
              {!loading && !error && enrollments.length > 0 && active.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', margin: 0 }}>
                    Continue Learning
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {active.map((enrollment) => (
                      <CourseCard
                        key={enrollment.id}
                        enrollment={enrollment}
                        liveSessions={liveSessionsByEnrollment[enrollment.courseId] || []}
                        statusBadge={statusBadge(enrollment)}
                        barColor={progressBarColor(enrollment.progress, enrollment.status)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Not started section */}
              {!loading && !error && enrollments.length > 0 && notStarted.length > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', margin: 0 }}>
                    Not Started
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {notStarted.map((enrollment) => (
                      <CourseCard
                        key={enrollment.id}
                        enrollment={enrollment}
                        liveSessions={liveSessionsByEnrollment[enrollment.courseId] || []}
                        statusBadge={statusBadge(enrollment)}
                        barColor={progressBarColor(enrollment.progress, enrollment.status)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed section */}
              {!loading && !error && enrollments.length > 0 && completed.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', margin: 0 }}>
                    Completed
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {completed.map((enrollment) => (
                      <CourseCard
                        key={enrollment.id}
                        enrollment={enrollment}
                        liveSessions={liveSessionsByEnrollment[enrollment.courseId] || []}
                        statusBadge={statusBadge(enrollment)}
                        barColor={progressBarColor(enrollment.progress, enrollment.status)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </OperunCardBody>
          </OperunCard>

          {/* Assignments Section */}
          <StudentAssignmentList token={token} />
        </div>
      </OperunContainer>
    </OperunMain>
  );
}

/* ─── CourseCard ─────────────────────────────────────────────────── */
function CourseCard({
  enrollment,
  liveSessions,
  statusBadge,
  barColor,
}: {
  enrollment: Enrollment;
  liveSessions: LiveSession[];
  statusBadge: React.ReactNode;
  barColor: string;
}) {
  const barColorMap: Record<string, string> = {
    'bg-emerald-500': '#10b981',
    'bg-blue-500': '#0ea5e9',
    'bg-neutral-700': '#4b5563',
  };

  const progressColor = barColorMap[barColor] || '#0ea5e9';

  return (
    <div style={{
      border: '1px solid rgba(107, 114, 128, 0.5)',
      background: 'rgba(5, 15, 30, 0.5)',
      borderRadius: '0.75rem',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'border-color 0.3s, transform 0.3s',
    }} onMouseEnter={(e) => {
      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(14, 165, 233, 0.4)';
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
    }} onMouseLeave={(e) => {
      (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(107, 114, 128, 0.5)';
      (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
    }}>
      {/* Thumbnail */}
      <div style={{ height: '144px', background: 'rgba(31, 41, 55, 0.8)', position: 'relative', overflow: 'hidden' }}>
        {enrollment.course?.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={enrollment.course.thumbnail}
            alt={enrollment.course.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.5s',
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLImageElement).style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLImageElement).style.transform = 'scale(1)';
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4), rgba(126, 39, 141, 0.4))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <BookMarked style={{ width: '40px', height: '40px', color: '#4b5563' }} />
          </div>
        )}
        <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem' }}>
          {statusBadge}
        </div>
      </div>

      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <h3 style={{
          fontWeight: 700,
          color: '#ffffff',
          marginBottom: '0.25rem',
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          fontSize: '0.875rem',
        }}>
          {enrollment.course?.title}
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem', margin: 0 }}>
          by {enrollment.course?.instructor?.name || 'Instructor'}
        </p>

        {/* Progress */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            <span>Progress</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: '#d1d5db' }}>
              {Math.round(enrollment.progress)}%
            </span>
          </div>
          <div style={{
            width: '100%',
            background: 'rgba(31, 41, 55, 0.8)',
            borderRadius: '9999px',
            height: '0.375rem',
            marginBottom: '1rem',
            overflow: 'hidden',
          }}>
            <div
              style={{
                background: progressColor,
                height: '0.375rem',
                borderRadius: '9999px',
                width: `${enrollment.progress}%`,
                transition: 'width 0.7s',
              }}
            />
          </div>
          <Link
            href={`/learn/${enrollment.courseId}`}
            style={{
              display: 'block',
              textAlign: 'center',
              width: '100%',
              fontWeight: 500,
              padding: '0.5rem',
              borderRadius: '0.5rem',
              transition: 'all 0.3s',
              fontSize: '0.875rem',
              textDecoration: 'none',
              background: enrollment.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(31, 41, 55, 0.8)',
              color: enrollment.status === 'COMPLETED' ? '#10b981' : '#ffffff',
              border: enrollment.status === 'COMPLETED' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(107, 114, 128, 0.5)',
            }}
          >
            {enrollment.status === 'COMPLETED'
              ? 'Review Course'
              : enrollment.progress === 0
                ? 'Start Learning'
                : 'Continue Learning'}
          </Link>

          {liveSessions && liveSessions.length > 0 && (
            <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(107, 114, 128, 0.5)' }}>
              <h4 style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Upcoming Live Sessions
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {liveSessions.map(session => (
                  <Link
                    key={session.id}
                    href={`/live/${session.id}`}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      width: '100%',
                      textAlign: 'left',
                      background: 'rgba(30, 58, 138, 0.2)',
                      border: '1px solid rgba(14, 165, 233, 0.2)',
                      borderRadius: '0.5rem',
                      padding: '0.5rem',
                      transition: 'all 0.3s',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(30, 58, 138, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(30, 58, 138, 0.2)';
                    }}
                  >
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#0ea5e9', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {session.title}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(14, 165, 233, 0.7)' }}>
                      {new Date(session.startTime).toLocaleString()}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
