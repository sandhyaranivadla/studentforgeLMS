'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Search, Clock, AlertCircle, BookMarked } from 'lucide-react';

interface Instructor {
  name: string | null;
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string | null;
  published: boolean;
  instructor: Instructor;
  modules: { id: string; lessons: { id: string }[] }[];
}

export default function CourseCatalog() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await fetch('http://localhost:4000/courses', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        } as RequestInit);
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        const data = await res.json();
        setCourses(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    void fetchCourses();
  }, [token]);

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()),
  );

  const totalLessons = (course: Course) =>
    course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md flex items-center px-6 sticky top-0 z-50 justify-between">
        <Link href="/" className="flex items-center gap-2 text-blue-500">
          <BookOpen size={24} />
          <span className="font-bold text-xl text-white tracking-tight">StudentForge</span>
        </Link>
        <div className="flex gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-neutral-400 hover:text-white transition-colors py-2"
          >
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-12">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">Course Catalog</h1>
            <p className="text-neutral-400 text-lg max-w-2xl">
              Discover your next skill. Enroll in high-quality, self-paced courses.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 h-5 w-5" />
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full md:w-72 transition-all"
            />
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-neutral-900/40 border border-neutral-800/60 rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="h-48 bg-neutral-800" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-neutral-800 rounded w-3/4" />
                  <div className="h-4 bg-neutral-800 rounded w-full" />
                  <div className="h-4 bg-neutral-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load courses</h2>
            <p className="text-neutral-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookMarked className="h-12 w-12 text-neutral-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {search ? 'No courses match your search' : 'No courses available yet'}
            </h2>
            <p className="text-neutral-400">
              {search ? 'Try a different keyword.' : 'Check back soon for new content.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-4 text-blue-500 hover:text-blue-400 text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Course grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((course) => (
              <Link
                href={`/courses/${course.id}`}
                key={course.id}
                className="group flex flex-col bg-neutral-900/40 border border-neutral-800/60 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:bg-neutral-900/60 transition-all shadow-xl hover:-translate-y-1"
              >
                {/* Thumbnail */}
                <div className="h-48 bg-neutral-800 relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      course.thumbnail ||
                      'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop'
                    }
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-lg text-white mb-1 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-neutral-400 text-sm line-clamp-2 mb-4">{course.description}</p>

                  <div className="mt-auto pt-4 border-t border-neutral-800/50 flex items-center gap-4 text-sm text-neutral-400">
                    <span className="flex items-center gap-1">
                      <BookMarked className="h-4 w-4" />
                      {course.modules.length} module{course.modules.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {totalLessons(course)} lesson{totalLessons(course) !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-bold text-white">
                      {course.price === 0 ? 'Free' : `$${course.price}`}
                    </span>
                    <span className="text-xs text-neutral-500">
                      by {course.instructor?.name || 'Instructor'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
