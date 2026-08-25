'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Users, CheckCircle, EyeOff, AlertCircle, Trash2 } from 'lucide-react';

interface Instructor {
  name: string | null;
  email: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  published: boolean;
  instructor: Instructor;
  modules: { id: string; lessons: { id: string }[] }[];
  enrollments: { id: string }[];
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    const fetchAll = async () => {
      try {
        const res = await fetch('http://localhost:4000/courses', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Error ${res.status}`);
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    void fetchAll();
  }, [token]);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const handleTogglePublish = async (course: Course) => {
    const res = await fetch(`http://localhost:4000/courses/${course.id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ published: !course.published }),
    });
    if (res.ok) {
      setCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, published: !course.published } : c)),
      );
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Permanently delete this course?')) return;
    const res = await fetch(`http://localhost:4000/courses/${courseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    }
  };

  const totalLessons = (course: Course) =>
    course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  const published = courses.filter((c) => c.published).length;
  const drafts = courses.filter((c) => !c.published).length;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-neutral-400 text-sm font-medium">Total Courses</h3>
            <BookOpen className="text-blue-500 h-5 w-5" />
          </div>
          <p className="text-3xl font-bold">{loading ? '—' : courses.length}</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-neutral-400 text-sm font-medium">Published</h3>
            <CheckCircle className="text-emerald-500 h-5 w-5" />
          </div>
          <p className="text-3xl font-bold">{loading ? '—' : published}</p>
        </div>
        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl hover:border-yellow-500/50 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-neutral-400 text-sm font-medium">Drafts</h3>
            <EyeOff className="text-yellow-500 h-5 w-5" />
          </div>
          <p className="text-3xl font-bold">{loading ? '—' : drafts}</p>
        </div>
      </div>

      {/* All courses table */}
      <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Users size={18} className="text-blue-500" />
            All Platform Courses
          </h2>
          <Link href="/courses" className="text-sm text-blue-500 hover:text-blue-400">
            View catalog →
          </Link>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-neutral-800 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 text-red-400 bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <p className="text-neutral-500 text-sm text-center py-8">No courses on the platform yet.</p>
        )}

        {!loading && courses.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-800">
                  <th className="pb-3 font-medium pr-4">Course</th>
                  <th className="pb-3 font-medium pr-4">Instructor</th>
                  <th className="pb-3 font-medium pr-4 text-center">Modules</th>
                  <th className="pb-3 font-medium pr-4 text-center">Lessons</th>
                  <th className="pb-3 font-medium pr-4 text-center">Enrollments</th>
                  <th className="pb-3 font-medium pr-4">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3 pr-4">
                      <Link
                        href={`/courses/${course.id}`}
                        className="font-medium text-white hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {course.title}
                      </Link>
                      <p className="text-neutral-600 text-xs mt-0.5">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </p>
                    </td>
                    <td className="py-3 pr-4 text-neutral-400">
                      {course.instructor?.name || 'Unknown'}
                    </td>
                    <td className="py-3 pr-4 text-center text-neutral-300">{course.modules.length}</td>
                    <td className="py-3 pr-4 text-center text-neutral-300">{totalLessons(course)}</td>
                    <td className="py-3 pr-4 text-center text-neutral-300">
                      {course.enrollments?.length ?? 0}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          course.published
                            ? 'bg-emerald-900/50 text-emerald-400'
                            : 'bg-yellow-900/40 text-yellow-400'
                        }`}
                      >
                        {course.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => void handleTogglePublish(course)}
                          className={`p-1.5 rounded text-xs transition-colors ${
                            course.published
                              ? 'text-yellow-400 hover:bg-yellow-900/20'
                              : 'text-emerald-400 hover:bg-emerald-900/20'
                          }`}
                          title={course.published ? 'Unpublish' : 'Publish'}
                        >
                          {course.published ? <EyeOff size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button
                          onClick={() => void handleDeleteCourse(course.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
