'use client';

import { useEffect, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  User,
} from 'lucide-react';

const API = 'http://localhost:4000';

interface CourseOverview {
  enrollmentCount: number;
  activeEnrollments: number;
  completedEnrollments: number;
  cancelledEnrollments: number;
  averageCompletion: number;
  assignmentSubmissionRate: number;
  quizPassRate: number;
  lessonsTotal: number;
  lessonsAverageCompletion: number;
  assignmentsTotal: number;
  quizzesTotal: number;
  liveSessionsTotal: number;
  liveSessionsUpcoming: number;
}

interface StudentPerformance {
  studentId: string;
  studentName: string;
  studentEmail: string;
  enrollmentDate: Date;
  enrollmentStatus: string;
  progress: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  lessonsCompletionRate: number;
  assignmentsSubmitted: number;
  assignmentsTotal: number;
  assignmentSubmissionRate: number;
  assignmentAverageScore: number;
  assignmentAverageMaxScore: number;
  quizzesTaken: number;
  quizzesTotal: number;
  quizPassedCount: number;
  quizPassRate: number;
  quizAverageScore: number;
  liveSessionsAttended: number;
  liveSessionsTotal: number;
  attendanceRate: number;
  lastActivityAt: Date;
}

interface AssignmentAnalytics {
  assignmentId: string;
  title: string;
  description: string;
  dueDate: Date;
  maxMarks: number;
  submittedCount: number;
  totalEnrolled: number;
  submissionRate: number;
  notSubmittedCount: number;
  gradedCount: number;
  pendingGradingCount: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  onTimeSubmissions: number;
  lateSubmissions: number;
  deadlineMissRate: number;
  updatedAt: Date;
}

interface QuizAnalytics {
  quizId: string;
  title: string;
  description: string;
  passingScore: number;
  timeLimit: number;
  totalQuestions: number;
  totalMarks: number;
  attemptCount: number;
  uniqueStudentsAttempted: number;
  totalEnrolled: number;
  attemptRate: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  averageTimeSpent: number;
  published: boolean;
  updatedAt: Date;
}

interface LessonAnalytics {
  lessonId: string;
  title: string;
  type: string;
  moduleId: string;
  moduleName: string;
  viewCount: number;
  uniqueStudentsViewed: number;
  uniqueStudentsCompleted: number;
  totalEnrolled: number;
  completionRate: number;
  viewRate: number;
  averageTimeSpent: number;
  averageLastAccess: Date;
  orderIndex: number;
  createdAt: Date;
}

interface LiveSessionAnalytics {
  sessionId: string;
  title: string;
  description: string;
  moduleId: string;
  moduleName: string;
  startTime: Date;
  endTime: Date;
  status: string;
  estimatedAttendees: number;
  scheduledCount: number;
  zoomMeetingId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface AnalyticsDashboardProps {
  courseId: string;
  token: string | null;
}

export default function AnalyticsDashboard({ courseId, token }: AnalyticsDashboardProps) {
  const [overview, setOverview] = useState<CourseOverview | null>(null);
  const [students, setStudents] = useState<StudentPerformance[]>([]);
  const [assignments, setAssignments] = useState<AssignmentAnalytics[]>([]);
  const [quizzes, setQuizzes] = useState<QuizAnalytics[]>([]);
  const [lessons, setLessons] = useState<LessonAnalytics[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSessionAnalytics[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<
    'overview' | 'students' | 'assignments' | 'quizzes' | 'lessons' | 'live-sessions'
  >('overview');

  const authHeaders = () => ({
    Authorization: `Bearer ${token}`,
  });

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    try {
      const [
        overviewRes,
        studentsRes,
        assignmentsRes,
        quizzesRes,
        lessonsRes,
        liveSessionsRes,
      ] = await Promise.all([
        fetch(`${API}/analytics/courses/${courseId}/overview`, {
          headers: authHeaders(),
        }),
        fetch(`${API}/analytics/courses/${courseId}/students`, {
          headers: authHeaders(),
        }),
        fetch(`${API}/analytics/courses/${courseId}/assignments`, {
          headers: authHeaders(),
        }),
        fetch(`${API}/analytics/courses/${courseId}/quizzes`, {
          headers: authHeaders(),
        }),
        fetch(`${API}/analytics/courses/${courseId}/lessons`, {
          headers: authHeaders(),
        }),
        fetch(`${API}/analytics/courses/${courseId}/live-sessions`, {
          headers: authHeaders(),
        }),
      ]);

      if (
        !overviewRes.ok ||
        !studentsRes.ok ||
        !assignmentsRes.ok ||
        !quizzesRes.ok ||
        !lessonsRes.ok ||
        !liveSessionsRes.ok
      ) {
        throw new Error('Failed to fetch analytics');
      }

      const [
        overviewData,
        studentsData,
        assignmentsData,
        quizzesData,
        lessonsData,
        liveSessionsData,
      ] = await Promise.all([
        overviewRes.json(),
        studentsRes.json(),
        assignmentsRes.json(),
        quizzesRes.json(),
        lessonsRes.json(),
        liveSessionsRes.json(),
      ]);

      setOverview(overviewData);
      setStudents(studentsData);
      setAssignments(assignmentsData);
      setQuizzes(quizzesData);
      setLessons(lessonsData);
      setLiveSessions(liveSessionsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId && token) {
      const controller = new AbortController();
      
      const loadData = async () => {
        setLoading(true);
        setError('');
        try {
          console.log('[AnalyticsDashboard] Loading analytics for course:', courseId);
          const [
            overviewRes,
            studentsRes,
            assignmentsRes,
            quizzesRes,
            lessonsRes,
            liveSessionsRes,
          ] = await Promise.all([
            fetch(`${API}/analytics/courses/${courseId}/overview`, {
              headers: authHeaders(),
              signal: controller.signal,
            }),
            fetch(`${API}/analytics/courses/${courseId}/students`, {
              headers: authHeaders(),
              signal: controller.signal,
            }),
            fetch(`${API}/analytics/courses/${courseId}/assignments`, {
              headers: authHeaders(),
              signal: controller.signal,
            }),
            fetch(`${API}/analytics/courses/${courseId}/quizzes`, {
              headers: authHeaders(),
              signal: controller.signal,
            }),
            fetch(`${API}/analytics/courses/${courseId}/lessons`, {
              headers: authHeaders(),
              signal: controller.signal,
            }),
            fetch(`${API}/analytics/courses/${courseId}/live-sessions`, {
              headers: authHeaders(),
              signal: controller.signal,
            }),
          ]);

          console.log('[AnalyticsDashboard] Response statuses:', {
            overview: overviewRes.status,
            students: studentsRes.status,
            assignments: assignmentsRes.status,
            quizzes: quizzesRes.status,
            lessons: lessonsRes.status,
            liveSessions: liveSessionsRes.status,
          });

          if (
            !overviewRes.ok ||
            !studentsRes.ok ||
            !assignmentsRes.ok ||
            !quizzesRes.ok ||
            !lessonsRes.ok ||
            !liveSessionsRes.ok
          ) {
            throw new Error('Failed to fetch analytics');
          }

          const [
            overviewData,
            studentsData,
            assignmentsData,
            quizzesData,
            lessonsData,
            liveSessionsData,
          ] = await Promise.all([
            overviewRes.json(),
            studentsRes.json(),
            assignmentsRes.json(),
            quizzesRes.json(),
            lessonsRes.json(),
            liveSessionsRes.json(),
          ]);

          console.log('[AnalyticsDashboard] Response data:', {
            overview: overviewData,
            students: studentsData,
            assignments: assignmentsData,
            quizzes: quizzesData,
            lessons: lessonsData,
            liveSessions: liveSessionsData,
          });

          setOverview(overviewData);
          setStudents(studentsData);
          setAssignments(assignmentsData);
          setQuizzes(quizzesData);
          setLessons(lessonsData);
          setLiveSessions(liveSessionsData);
        } catch (err) {
          console.error('[AnalyticsDashboard] Error:', err);
          if (err instanceof Error && err.name !== 'AbortError') {
            setError(err.message || 'Failed to load analytics');
          }
        } finally {
          setLoading(false);
        }
      };

      void loadData();

      return () => {
        controller.abort();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, token]);

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-2">
          <Loader className="h-8 w-8 text-blue-500 animate-spin" />
          <p className="text-neutral-400 text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-semibold text-white">Course Analytics</h2>
        </div>
        <button
          onClick={() => void handleRefresh()}
          className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          title="Refresh analytics"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg p-4 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-neutral-800 overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'students', label: 'Students', icon: Users },
          { id: 'assignments', label: 'Assignments', icon: BookOpen },
          { id: 'quizzes', label: 'Quizzes', icon: CheckCircle },
          { id: 'lessons', label: 'Lessons', icon: BookOpen },
          { id: 'live-sessions', label: 'Live Sessions', icon: Users },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() =>
              setActiveTab(
                id as
                  | 'overview'
                  | 'students'
                  | 'assignments'
                  | 'quizzes'
                  | 'lessons'
                  | 'live-sessions'
              )
            }
            className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === id
                ? 'text-blue-400 border-blue-500'
                : 'text-neutral-400 border-transparent hover:text-neutral-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Total Enrolled"
              value={overview.enrollmentCount}
              subtext={`${overview.activeEnrollments} active`}
              icon={Users}
              color="blue"
            />
            <StatCard
              label="Average Completion"
              value={`${overview.averageCompletion}%`}
              subtext={`${overview.completedEnrollments} completed`}
              icon={CheckCircle}
              color="emerald"
            />
            <StatCard
              label="Assignment Submission"
              value={`${overview.assignmentSubmissionRate}%`}
              subtext={`${overview.assignmentsTotal} total`}
              icon={BookOpen}
              color="yellow"
            />
            <StatCard
              label="Quiz Pass Rate"
              value={`${overview.quizPassRate}%`}
              subtext={`${overview.quizzesTotal} quizzes`}
              icon={CheckCircle}
              color="purple"
            />
            <StatCard
              label="Lesson Completion"
              value={`${overview.lessonsAverageCompletion}%`}
              subtext={`${overview.lessonsTotal} lessons`}
              icon={BookOpen}
              color="orange"
            />
            <StatCard
              label="Live Sessions"
              value={overview.liveSessionsTotal}
              subtext={`${overview.liveSessionsUpcoming} upcoming`}
              icon={Users}
              color="pink"
            />
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-4">
            {students.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                No enrolled students yet
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {students.map((student) => (
                  <div
                    key={student.studentId}
                    className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/30 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm">{student.studentName}</h4>
                        <p className="text-neutral-400 text-xs truncate">{student.studentEmail}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                          <div>
                            <p className="text-neutral-500">Progress</p>
                            <p className="text-white font-semibold">{student.progress}%</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Lessons</p>
                            <p className="text-white font-semibold">
                              {student.lessonsCompleted}/{student.lessonsTotal}
                            </p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Assignments</p>
                            <p className="text-white font-semibold">
                              {student.assignmentsSubmitted}/{student.assignmentsTotal}
                            </p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Avg Score</p>
                            <p className="text-white font-semibold">{Math.round(student.assignmentAverageScore)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                No assignments created yet
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.assignmentId}
                    className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/30 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm">{assignment.title}</h4>
                        <p className="text-neutral-400 text-xs mt-1 line-clamp-1">
                          {assignment.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                          <div>
                            <p className="text-neutral-500">Submitted</p>
                            <p className="text-white font-semibold">
                              {assignment.submittedCount}/{assignment.totalEnrolled}
                            </p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Avg Score</p>
                            <p className="text-white font-semibold">{Math.round(assignment.averageScore)}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Late</p>
                            <p className="text-white font-semibold">{assignment.lateSubmissions}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Pending</p>
                            <p className="text-white font-semibold">{assignment.pendingGradingCount}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="inline-block bg-emerald-900/50 text-emerald-400 px-2 py-1 rounded">
                          {assignment.submissionRate}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === 'quizzes' && (
          <div className="space-y-4">
            {quizzes.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                No quizzes created yet
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {quizzes.map((quiz) => (
                  <div
                    key={quiz.quizId}
                    className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/30 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm">{quiz.title}</h4>
                        <p className="text-neutral-400 text-xs mt-1 line-clamp-1">
                          {quiz.description}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                          <div>
                            <p className="text-neutral-500">Attempts</p>
                            <p className="text-white font-semibold">{quiz.attemptCount}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Pass Rate</p>
                            <p className="text-white font-semibold">{quiz.passRate}%</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Avg Score</p>
                            <p className="text-white font-semibold">{Math.round(quiz.averageScore)}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Avg Time</p>
                            <p className="text-white font-semibold">{Math.round(quiz.averageTimeSpent)}s</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div
                          className={`inline-block px-2 py-1 rounded ${
                            quiz.published
                              ? 'bg-emerald-900/50 text-emerald-400'
                              : 'bg-yellow-900/50 text-yellow-400'
                          }`}
                        >
                          {quiz.published ? 'Published' : 'Draft'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lessons Tab */}
        {activeTab === 'lessons' && (
          <div className="space-y-4">
            {lessons.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                No lessons created yet
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.lessonId}
                    className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/30 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm">{lesson.title}</h4>
                        <p className="text-neutral-400 text-xs mt-1">
                          {lesson.moduleName} • {lesson.type}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
                          <div>
                            <p className="text-neutral-500">Views</p>
                            <p className="text-white font-semibold">{lesson.viewCount}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Viewed By</p>
                            <p className="text-white font-semibold">{lesson.uniqueStudentsViewed}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Completed By</p>
                            <p className="text-white font-semibold">{lesson.uniqueStudentsCompleted}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Completion %</p>
                            <p className="text-white font-semibold">{lesson.completionRate}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Live Sessions Tab */}
        {activeTab === 'live-sessions' && (
          <div className="space-y-4">
            {liveSessions.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                No live sessions scheduled yet
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {liveSessions.map((session) => (
                  <div
                    key={session.sessionId}
                    className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/30 hover:border-neutral-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm">{session.title}</h4>
                        <p className="text-neutral-400 text-xs mt-1">{session.moduleName}</p>
                        <p className="text-neutral-500 text-xs mt-1">
                          {new Date(session.startTime).toLocaleString()}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-xs">
                          <div>
                            <p className="text-neutral-500">Estimated Attendees</p>
                            <p className="text-white font-semibold">{session.estimatedAttendees}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Status</p>
                            <p className="text-white font-semibold capitalize">{session.status}</p>
                          </div>
                          <div>
                            <p className="text-neutral-500">Zoom Link</p>
                            <p className="text-white font-semibold">
                              {session.zoomMeetingId ? 'Attached' : 'None'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div
                          className={`inline-block px-2 py-1 rounded capitalize ${
                            session.status === 'SCHEDULED'
                              ? 'bg-blue-900/50 text-blue-400'
                              : session.status === 'LIVE'
                              ? 'bg-red-900/50 text-red-400'
                              : session.status === 'COMPLETED'
                              ? 'bg-emerald-900/50 text-emerald-400'
                              : 'bg-yellow-900/50 text-yellow-400'
                          }`}
                        >
                          {session.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ComponentType<{ className: string }>;
  color: string;
}

function StatCard({ label, value, subtext, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    blue: 'border-blue-500/30 hover:border-blue-500/50 text-blue-400',
    emerald: 'border-emerald-500/30 hover:border-emerald-500/50 text-emerald-400',
    yellow: 'border-yellow-500/30 hover:border-yellow-500/50 text-yellow-400',
    purple: 'border-purple-500/30 hover:border-purple-500/50 text-purple-400',
    orange: 'border-orange-500/30 hover:border-orange-500/50 text-orange-400',
    pink: 'border-pink-500/30 hover:border-pink-500/50 text-pink-400',
  };

  return (
    <div
      className={`border border-neutral-800 rounded-lg p-6 bg-neutral-900/30 transition-colors ${
        colorClasses[color as keyof typeof colorClasses] || colorClasses.blue
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-neutral-400 text-sm">{label}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {subtext && <p className="text-neutral-500 text-xs mt-1">{subtext}</p>}
        </div>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
