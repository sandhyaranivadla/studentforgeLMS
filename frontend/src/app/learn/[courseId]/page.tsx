"use client";
import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Menu, X, PlayCircle, FileText, CheckCircle, MessageCircle, ChevronLeft } from 'lucide-react';

export default function CoursePlayback() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Mock Data
  const courseTitle = 'Full-Stack Next.js Masterclass';
  const modules = [
    {
      title: 'Module 1: Introduction',
      lessons: [
        { id: '1', title: 'Welcome to the Course', type: 'video', duration: '5:00', completed: true },
        { id: '2', title: 'Setting up the environment', type: 'video', duration: '15:30', completed: true },
        { id: '3', title: 'Understanding Server Components', type: 'video', duration: '45:00', completed: false, active: true },
        { id: '4', title: 'Module 1 Quiz', type: 'quiz', duration: '15:00', completed: false },
      ]
    },
    {
      title: 'Module 2: Routing',
      lessons: [
        { id: '5', title: 'App Router Deep Dive', type: 'video', duration: '30:00', completed: false },
        { id: '6', title: 'Nested Layouts', type: 'video', duration: '45:00', completed: false },
      ]
    }
  ];

  return (
    <div className="h-screen bg-neutral-950 text-white flex flex-col font-sans overflow-hidden">
      {/* Navbar */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-950 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="h-6 w-px bg-neutral-800 hidden sm:block"></div>
          <Link href="/dashboard" className="hidden sm:flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm">
            <ChevronLeft size={16} /> Dashboard
          </Link>
          <span className="font-semibold ml-2 sm:ml-0 truncate w-48 sm:w-auto">{courseTitle}</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-neutral-400">
            <div className="w-32 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '30%' }}></div>
            </div>
            <span>30% Complete</span>
          </div>
          <button className="bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <MessageCircle size={16} /> Course Chat
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Curriculum */}
        <aside 
          className={`${sidebarOpen ? 'w-80' : 'w-0 opacity-0'} shrink-0 bg-neutral-900 border-r border-neutral-800 overflow-y-auto transition-all duration-300 ease-in-out`}
        >
          <div className="p-4 border-b border-neutral-800">
            <h2 className="font-semibold text-white">Course Content</h2>
          </div>
          
          <div className="divide-y divide-neutral-800">
            {modules.map((mod, mIdx) => (
              <div key={mIdx} className="bg-neutral-900/50">
                <div className="px-4 py-3 bg-neutral-900/80 sticky top-0 z-10 backdrop-blur-md">
                  <h3 className="font-medium text-sm text-neutral-200">{mod.title}</h3>
                  <p className="text-xs text-neutral-500 mt-0.5">0/{mod.lessons.length} completed</p>
                </div>
                <div>
                  {mod.lessons.map(lesson => (
                    <button 
                      key={lesson.id}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${lesson.active ? 'bg-blue-500/10 border-l-2 border-blue-500' : 'hover:bg-neutral-800 border-l-2 border-transparent'}`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {lesson.completed ? (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        ) : lesson.type === 'video' ? (
                          <PlayCircle className={`h-4 w-4 ${lesson.active ? 'text-blue-500' : 'text-neutral-500'}`} />
                        ) : lesson.type === 'quiz' ? (
                          <CheckCircle className={`h-4 w-4 ${lesson.active ? 'text-blue-500' : 'text-neutral-500'}`} />
                        ) : (
                          <FileText className={`h-4 w-4 ${lesson.active ? 'text-blue-500' : 'text-neutral-500'}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm line-clamp-2 ${lesson.active ? 'text-blue-400 font-medium' : 'text-neutral-300'}`}>
                          {lesson.title}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">{lesson.duration}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-black flex flex-col relative">
          {/* Video Player Mock */}
          <div className="w-full aspect-video bg-neutral-900 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex flex-col justify-end p-4">
              <div className="flex items-center gap-4 text-white">
                <button className="hover:text-blue-400"><PlayCircle size={28} /></button>
                <div className="flex-1 h-1.5 bg-white/30 rounded-full cursor-pointer relative">
                  <div className="absolute left-0 top-0 h-full bg-blue-500 rounded-full w-1/3"></div>
                </div>
                <span className="text-sm text-neutral-300">15:00 / 45:00</span>
              </div>
            </div>
            
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="w-20 h-20 bg-blue-600/90 rounded-full flex items-center justify-center backdrop-blur-sm shadow-2xl">
                 <PlayCircle className="text-white h-10 w-10 ml-1" />
               </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop" alt="Video frame" className="w-full h-full object-cover opacity-60" />
          </div>
          
          <div className="p-6 lg:p-10 flex-1 overflow-y-auto bg-neutral-950">
            <div className="max-w-4xl">
              <h1 className="text-2xl font-bold text-white mb-2">Understanding Server Components</h1>
              <p className="text-neutral-400 mb-8">Module 1 • Lesson 3</p>
              
              <div className="prose prose-invert max-w-none">
                <p>In this lesson, we dive deep into React Server Components (RSC) and how Next.js App Router utilizes them to reduce client-side JavaScript bundles and improve initial page load performance.</p>
                <h3>Key Takeaways:</h3>
                <ul>
                  <li>Server components render exclusively on the server.</li>
                  <li>They cannot use state (`useState`) or lifecycle hooks (`useEffect`).</li>
                  <li>Client components (`"use client"`) are used for interactivity.</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
