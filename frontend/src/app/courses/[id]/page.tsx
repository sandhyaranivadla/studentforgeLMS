'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, CheckCircle, Clock, FileText, PlayCircle, Users, ArrowLeft } from 'lucide-react';

const API = 'http://localhost:4000';

interface Lesson {
  id: string;
  title: string;
  type: string;
  duration: string | null;
}

interface CourseModule {
  id: string;
  title: string;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  thumbnail: string | null;
  instructor: {
    name: string | null;
  };
  modules: CourseModule[];
}

export default function CourseDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const { token, user } = useAuth();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch course details
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const courseRes = await fetch(`${API}/courses/${id}`, { headers });
        if (courseRes.ok) {
          setCourse(await courseRes.json());
        } else {
          setError('Course not found');
        }

        // Check if user is enrolled
        if (token && user?.role === 'STUDENT') {
          const enrollRes = await fetch(`${API}/enrollments/check/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (enrollRes.ok) {
            const data = await enrollRes.json();
            setIsEnrolled(data.enrolled);
          }
        }
      } catch (e) {
        setError('Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      void fetchData();
    }
  }, [id, token, user]);

  const handleEnroll = async () => {
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (user?.role !== 'STUDENT') {
      alert('Only students can enroll in courses.');
      return;
    }

    try {
      setEnrolling(true);
      const res = await fetch(`${API}/enrollments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ courseId: id }),
      });
      
      if (!res.ok) throw new Error('Failed to enroll');
      
      setIsEnrolled(true);
      router.push('/dashboard/student');
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error enrolling');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-pulse flex flex-col items-center">
          <BookOpen className="h-12 w-12 text-blue-500 mb-4 animate-bounce" />
          <p className="text-neutral-400">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white p-4">
        <div className="text-center bg-neutral-900 border border-neutral-800 p-8 rounded-2xl max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-2">Oops!</h2>
          <p className="text-neutral-400 mb-6">{error}</p>
          <Link href="/courses" className="text-blue-500 hover:text-blue-400">
            &larr; Back to Courses
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Hero */}
      <div className="relative border-b border-neutral-800 bg-neutral-950">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20" />
        <div className="max-w-6xl mx-auto px-6 py-12 md:py-20 relative z-10">
          <Link href="/courses" className="inline-flex items-center text-neutral-400 hover:text-white mb-8 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Catalog
          </Link>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{course.title}</h1>
              <p className="text-lg text-neutral-300 mb-6 line-clamp-3">{course.description}</p>
              <div className="flex items-center gap-4 text-neutral-400 text-sm mb-8">
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1.5" />
                  {course.instructor.name || 'Instructor'}
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-1.5" />
                  {course.modules.length} Modules
                </div>
              </div>
            </div>
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl">
              <div className="aspect-video bg-neutral-800 rounded-lg mb-6 overflow-hidden relative">
                {course.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900">
                    <BookOpen className="w-12 h-12 text-neutral-700" />
                  </div>
                )}
              </div>
              
              <div className="text-3xl font-bold mb-6">
                {course.price === 0 ? 'Free' : `$${course.price.toFixed(2)}`}
              </div>
              
              {isEnrolled ? (
                <button
                  onClick={() => router.push('/dashboard/student')}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" /> Go to Dashboard
                </button>
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl transition-colors"
                >
                  {enrolling ? 'Enrolling...' : 'Enroll Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold mb-8">Course Curriculum</h2>
        
        {course.modules.length === 0 ? (
          <div className="text-neutral-500 p-8 border border-neutral-800 border-dashed rounded-xl text-center">
            No modules have been added to this course yet.
          </div>
        ) : (
          <div className="space-y-4">
            {course.modules.map((module, i) => (
              <div key={module.id} className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/30">
                <div className="px-6 py-4 bg-neutral-900 flex justify-between items-center border-b border-neutral-800">
                  <h3 className="font-semibold text-lg">Module {i + 1}: {module.title}</h3>
                  <span className="text-sm text-neutral-400">{module.lessons.length} Lessons</span>
                </div>
                
                <div className="divide-y divide-neutral-800/50">
                  {module.lessons.map((lesson) => (
                    <div key={lesson.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {lesson.type === 'VIDEO' ? (
                          <PlayCircle className="w-5 h-5 text-blue-400" />
                        ) : (
                          <FileText className="w-5 h-5 text-purple-400" />
                        )}
                        <span className="text-neutral-300">{lesson.title}</span>
                      </div>
                      {lesson.duration && (
                        <div className="flex items-center text-xs text-neutral-500">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {lesson.duration}
                        </div>
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
