'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, BookOpen, MessageSquare } from 'lucide-react';
import ChatPanel from '@/components/ChatPanel';

const API = 'http://localhost:4000';

export default function CourseHubPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!token) return;
      try {
        const res = await fetch(`${API}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Course not found');
        const data = await res.json();
        setCourse(data);
      } catch (err: any) {
        setError('Failed to load course details.');
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchCourse();
  }, [courseId, token]);

  if (loading) return <div className="p-8 text-neutral-400">Loading course...</div>;
  if (error || !course) return <div className="p-8 text-red-400">{error || 'Course not found'}</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showChat ? 'pr-80' : ''}`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.back()}
              className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-3xl font-bold text-white">{course.title}</h2>
              <p className="text-neutral-400 text-sm mt-1">{course.description}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showChat 
                ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' 
                : 'bg-neutral-800 text-white hover:bg-neutral-700'
            }`}
          >
            <MessageSquare size={18} />
            {showChat ? 'Hide Chat' : 'Course Chat'}
          </button>
        </div>

        {/* Course Content Placeholder */}
        <div className="flex-1 bg-neutral-900 rounded-xl border border-neutral-800 p-8 flex flex-col items-center justify-center text-center">
           <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="text-blue-500" size={32} />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Course Modules</h3>
           <p className="text-neutral-400 max-w-md">
             The course video player and lesson modules will appear here. For now, open the chat panel to communicate with your peers and instructor!
           </p>
        </div>
      </div>

      {/* Slide-out Chat Panel */}
      <div 
        className={`fixed right-0 top-16 bottom-0 w-80 bg-neutral-900 border-l border-neutral-800 transform transition-transform duration-300 ease-in-out ${
          showChat ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <ChatPanel courseId={courseId as string} />
      </div>
    </div>
  );
}
