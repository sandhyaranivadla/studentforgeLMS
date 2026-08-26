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
        setEnrollments(Array.isArray(data) ? data : []);
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
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-2xl hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
              In Progress
            </h3>
            <PlayCircle className="text-blue-500 h-4 w-4" />
          </div>
          <p className="text-3xl font-bold text-white">{loading ? '—' : active.length}</p>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-2xl hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
              Completed
            </h3>
            <Award className="text-emerald-500 h-4 w-4" />
          </div>
          <p className="text-3xl font-bold text-white">{loading ? '—' : completed.length}</p>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-2xl hover:border-purple-500/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
              Enrolled
            </h3>
            <BookMarked className="text-purple-500 h-4 w-4" />
          </div>
          <p className="text-3xl font-bold text-white">
            {loading ? '—' : enrollments.length}
          </p>
        </div>

        <div className="bg-neutral-900/50 border border-neutral-800 p-5 rounded-2xl hover:border-yellow-500/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-neutral-400 text-xs font-medium uppercase tracking-wider">
              Avg. Progress
            </h3>
            <TrendingUp className="text-yellow-500 h-4 w-4" />
          </div>
          <p className="text-3xl font-bold text-white">
            {loading ? '—' : `${averageProgress}%`}
          </p>
        </div>
      </div>

      {/* Course cards */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">My Courses</h2>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="border border-neutral-800 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="h-36 bg-neutral-800" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-neutral-800 rounded w-3/4" />
                  <div className="h-3 bg-neutral-800 rounded w-1/2" />
                  <div className="h-2 bg-neutral-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-3 text-red-400 bg-red-900/20 border border-red-500/30 rounded-xl p-4">
            <AlertCircle size={18} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && enrollments.length === 0 && (
          <div className="text-center py-12 bg-neutral-950 rounded-xl border border-neutral-800 border-dashed">
            <BookMarked className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-500 mb-4">
              You haven&apos;t been enrolled in any courses yet.
            </p>
            <p className="text-neutral-600 text-sm">
              Please contact your administrator to get access.
            </p>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && enrollments.length > 0 && (
          <>
            {/* In-progress section */}
            {active.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
                  Continue Learning
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {active.map((enrollment) => (
                    <CourseCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      statusBadge={statusBadge(enrollment)}
                      barColor={progressBarColor(enrollment.progress, enrollment.status)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Not started section */}
            {notStarted.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
                  Not Started
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {notStarted.map((enrollment) => (
                    <CourseCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      statusBadge={statusBadge(enrollment)}
                      barColor={progressBarColor(enrollment.progress, enrollment.status)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed section */}
            {completed.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider mb-4">
                  Completed
                </h3>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {completed.map((enrollment) => (
                    <CourseCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      statusBadge={statusBadge(enrollment)}
                      barColor={progressBarColor(enrollment.progress, enrollment.status)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Assignments Section */}
      <StudentAssignmentList token={token} />
    </div>
  );
}

/* ─── CourseCard ─────────────────────────────────────────────────── */
function CourseCard({
  enrollment,
  statusBadge,
  barColor,
}: {
  enrollment: Enrollment;
  statusBadge: React.ReactNode;
  barColor: string;
}) {
  return (
    <div className="border border-neutral-800 bg-neutral-950 rounded-xl overflow-hidden flex flex-col hover:border-blue-500/40 transition-colors group">
      {/* Thumbnail */}
      <div className="h-36 bg-neutral-800 relative overflow-hidden">
        {enrollment.course?.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={enrollment.course.thumbnail}
            alt={enrollment.course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-900/40 to-purple-900/40 flex items-center justify-center">
            <BookMarked className="h-10 w-10 text-neutral-600" />
          </div>
        )}
        <div className="absolute top-2 right-2">{statusBadge}</div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-white mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {enrollment.course?.title}
        </h3>
        <p className="text-xs text-neutral-500 mb-4">
          by {enrollment.course?.instructor?.name || 'Instructor'}
        </p>

        {/* Progress */}
        <div className="mt-auto">
          <div className="flex justify-between text-xs text-neutral-500 mb-1.5">
            <span>Progress</span>
            <span className="tabular-nums font-medium text-neutral-300">
              {Math.round(enrollment.progress)}%
            </span>
          </div>
          <div className="w-full bg-neutral-800 rounded-full h-1.5 mb-4 overflow-hidden">
            <div
              className={`${barColor} h-1.5 rounded-full transition-all duration-700`}
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
          <Link
            href={`/learn/${enrollment.courseId}`}
            className={`block text-center w-full font-medium py-2 rounded-lg transition-colors text-sm ${
              enrollment.status === 'COMPLETED'
                ? 'bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-500/30'
                : 'bg-neutral-800 hover:bg-blue-600 text-white'
            }`}
          >
            {enrollment.status === 'COMPLETED'
              ? 'Review Course'
              : enrollment.progress === 0
                ? 'Start Learning'
                : 'Continue Learning'}
          </Link>
          
          {enrollment.course?.liveSessions && enrollment.course.liveSessions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-neutral-800">
              <h4 className="text-xs text-neutral-400 mb-2 uppercase tracking-wider font-semibold">Upcoming Live Sessions</h4>
              <div className="space-y-2">
                {enrollment.course.liveSessions.map(session => (
                  <Link
                    key={session.id}
                    href={`/dashboard/live/${session.id}`}
                    className="flex flex-col gap-1 w-full text-left bg-blue-900/20 hover:bg-blue-900/40 border border-blue-500/20 rounded-lg p-2 transition-colors"
                  >
                    <span className="text-sm font-medium text-blue-400 line-clamp-1">{session.title}</span>
                    <span className="text-xs text-blue-300/70">{new Date(session.startTime).toLocaleString()}</span>
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
