'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  FileText,
  HelpCircle,
  Lock,
  AlertCircle,
  BookOpen,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  type: 'VIDEO' | 'PDF' | 'QUIZ';
  duration: string | null;
  contentUrl: string | null;
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
  price: number;
  thumbnail: string | null;
  published: boolean;
  instructor: { name: string | null };
  modules: CourseModule[];
}

const lessonIcon = (type: Lesson['type']) => {
  if (type === 'VIDEO') return <PlayCircle className="h-4 w-4 text-blue-400" />;
  if (type === 'PDF') return <FileText className="h-4 w-4 text-emerald-400" />;
  return <HelpCircle className="h-4 w-4 text-yellow-400" />;
};

export default function CourseDetails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, user } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollError, setEnrollError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const courseRes = await fetch(`http://localhost:4000/courses/${id}`, {
          headers,
          cache: 'no-store',
        } as RequestInit);

        if (!courseRes.ok) {
          if (courseRes.status === 404) setError('Course not found.');
          else setError(`Failed to load course (${courseRes.status})`);
          return;
        }

        const courseData: Course = await courseRes.json();
        setCourse(courseData);

        // Check enrollment if logged in as student
        if (token && user?.role === 'STUDENT') {
          const enrollRes = await fetch(
            `http://localhost:4000/enrollments/check/${id}`,
            { headers },
          );
          if (enrollRes.ok) {
            const { enrolled: isEnrolled } = await enrollRes.json();
            setEnrolled(isEnrolled);
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, [id, token, user]);

  const handleEnroll = async () => {
    if (!token) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'STUDENT') {
      setEnrollError('Only students can enroll in courses.');
      return;
    }
    setEnrolling(true);
    setEnrollError('');
    try {
      const res = await fetch('http://localhost:4000/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId: id }),
      });
      const data = await res.json();
      if (res.ok) {
        setEnrolled(true);
      } else {
        setEnrollError(data.message || 'Failed to enroll');
      }
    } catch {
      setEnrollError('An unexpected error occurred');
    } finally {
      setEnrolling(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-neutral-400">Loading course…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !course) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold">{error || 'Course not found'}</h1>
          <Link href="/courses" className="text-blue-500 hover:text-blue-400 flex items-center justify-center gap-2">
            <ArrowLeft size={16} /> Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const isInstructor = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md flex items-center px-6 sticky top-0 z-50">
        <Link href="/courses" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm">Back to catalog</span>
        </Link>
        <div className="ml-auto flex items-center gap-2 text-blue-500">
          <BookOpen size={20} />
          <span className="font-bold text-white">StudentForge</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 lg:p-12">
        {/* Hero */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <h1 className="text-3xl lg:text-4xl font-extrabold mb-4 leading-tight">{course.title}</h1>
            <p className="text-neutral-300 text-lg leading-relaxed mb-6">{course.description}</p>
            <div className="flex flex-wrap gap-4 text-sm text-neutral-400">
              <span>By <strong className="text-white">{course.instructor?.name || 'Unknown'}</strong></span>
              <span>•</span>
              <span>{course.modules.length} module{course.modules.length !== 1 ? 's' : ''}</span>
              <span>•</span>
              <span>{totalLessons} lesson{totalLessons !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Enroll card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col gap-4 h-fit">
            {course.thumbnail && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-36 object-cover rounded-xl"
              />
            )}
            <div className="text-2xl font-bold">
              {course.price === 0 ? (
                <span className="text-emerald-400">Free</span>
              ) : (
                <span>${course.price}</span>
              )}
            </div>

            {enrollError && (
              <p className="text-red-400 text-sm bg-red-900/30 border border-red-500/30 rounded p-2">
                {enrollError}
              </p>
            )}

            {/* Enrolled student */}
            {enrolled && user?.role === 'STUDENT' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <CheckCircle size={16} /> You are enrolled
                </div>
                <Link
                  href={`/learn/${course.id}`}
                  className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                >
                  Continue Learning
                </Link>
              </div>
            )}

            {/* Not enrolled student */}
            {!enrolled && user?.role === 'STUDENT' && (
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
              >
                {enrolling ? 'Enrolling…' : 'Enroll Now'}
              </button>
            )}

            {/* Instructor / Admin */}
            {isInstructor && (
              <Link
                href="/dashboard/instructor"
                className="block text-center w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Manage in Dashboard
              </Link>
            )}

            {/* Not logged in */}
            {!user && (
              <Link
                href="/login"
                className="block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
              >
                Sign in to Enroll
              </Link>
            )}
          </div>
        </div>

        {/* Curriculum */}
        <h2 className="text-2xl font-bold mb-6">Course Curriculum</h2>
        {course.modules.length === 0 ? (
          <div className="bg-neutral-900/50 border border-neutral-800 border-dashed rounded-xl p-10 text-center text-neutral-500">
            No modules have been added yet.
          </div>
        ) : (
          <div className="space-y-4">
            {course.modules.map((mod, i) => (
              <div key={mod.id} className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/40">
                <div className="px-5 py-4 bg-neutral-800/50 flex justify-between items-center">
                  <h3 className="font-semibold text-white">
                    Module {i + 1}: {mod.title}
                  </h3>
                  <span className="text-xs text-neutral-500">
                    {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="divide-y divide-neutral-800/50">
                  {mod.lessons.length === 0 && (
                    <p className="px-5 py-3 text-sm text-neutral-500">No lessons yet.</p>
                  )}
                  {mod.lessons.map((lesson) => (
                    <div key={lesson.id} className="px-5 py-3 flex items-center gap-3">
                      {enrolled ? lessonIcon(lesson.type) : <Lock className="h-4 w-4 text-neutral-600" />}
                      <span className="flex-1 text-sm text-neutral-300">{lesson.title}</span>
                      <span className="text-xs bg-neutral-800 px-2 py-0.5 rounded text-neutral-400">
                        {lesson.type}
                      </span>
                      {lesson.duration && (
                        <span className="text-xs text-neutral-500 ml-2">{lesson.duration}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
