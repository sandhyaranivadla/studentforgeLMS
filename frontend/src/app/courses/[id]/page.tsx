"use client";
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Star, Clock, CheckCircle, Video, FileText, ChevronRight, Lock } from 'lucide-react';

export default function CourseDetail() {
  const params = useParams();
  
  // Mock Data
  const course = {
    id: params.id as string,
    title: 'Full-Stack Next.js Masterclass',
    description: 'Learn to build production-ready, full-stack applications with Next.js 15, React server components, and TailwindCSS from scratch.',
    instructor: 'Dr. Smith',
    rating: 4.9,
    students: '1,240',
    duration: '12h 30m',
    price: '$99',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=1200&auto=format&fit=crop',
    whatYouWillLearn: [
      'Build full-stack apps with Next.js App Router',
      'Secure authentication and role-based access',
      'Database integration with Prisma and CockroachDB',
      'Deploy scalable apps to Vercel and AWS'
    ],
    modules: [
      {
        title: 'Module 1: Introduction to Next.js',
        duration: '1h 20m',
        lessons: [
          { title: 'Welcome to the Course', type: 'video', duration: '5m' },
          { title: 'Setting up the environment', type: 'video', duration: '15m' },
          { title: 'Understanding Server Components', type: 'video', duration: '45m' },
          { title: 'Module 1 Quiz', type: 'quiz', duration: '15m' },
        ]
      },
      {
        title: 'Module 2: Routing and Layouts',
        duration: '2h 10m',
        lessons: [
          { title: 'App Router Deep Dive', type: 'video', duration: '30m' },
          { title: 'Nested Layouts', type: 'video', duration: '45m' },
          { title: 'Routing Best Practices', type: 'pdf', duration: '10m' },
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col font-sans selection:bg-blue-500/30">
      <header className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md flex items-center px-6 sticky top-0 z-50 justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-blue-500">
          <BookOpen size={24} />
          <span className="font-bold text-xl text-white tracking-tight">StudentForge</span>
        </Link>
        <Link href="/courses" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors py-2">
          &larr; Back to Catalog
        </Link>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <div className="bg-neutral-900 border-b border-neutral-800">
          <div className="max-w-7xl mx-auto px-6 py-12 lg:py-20 flex flex-col lg:flex-row gap-12">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                <Link href="/courses" className="hover:underline">Engineering</Link>
                <ChevronRight className="h-4 w-4 text-neutral-600" />
                <span className="text-neutral-400">Web Development</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {course.title}
              </h1>
              <p className="text-lg text-neutral-400 max-w-2xl leading-relaxed">
                {course.description}
              </p>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-neutral-300">
                <span className="flex items-center gap-1.5 bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full font-medium">
                  <Star className="h-4 w-4 fill-yellow-500" /> {course.rating} Rating
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-neutral-500" /> {course.students} students
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-neutral-500" /> {course.duration} of content
                </span>
              </div>
              
              <div className="pt-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-inner">
                  {course.instructor.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-neutral-400">Instructed by</p>
                  <p className="font-medium text-white">{course.instructor}</p>
                </div>
              </div>
            </div>
            
            {/* Sticky Pricing Card */}
            <div className="w-full lg:w-96 shrink-0">
              <div className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl sticky top-24">
                <div className="h-48 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 cursor-pointer hover:bg-white/30 transition-colors">
                      <Video className="h-6 w-6 text-white ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="text-3xl font-bold text-white mb-6">{course.price}</div>
                  <Link href={`/checkout/${course.id}`} className="w-full flex items-center justify-center py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-[0_0_20px_rgba(37,99,235,0.2)]">
                    Enroll Now
                  </Link>
                  <p className="text-xs text-center text-neutral-500 mt-4">30-Day Money-Back Guarantee</p>
                  
                  <div className="mt-6 pt-6 border-t border-neutral-800 space-y-3 text-sm text-neutral-300">
                    <div className="flex items-center gap-3"><Video className="h-4 w-4 text-neutral-500" /> {course.duration} on-demand video</div>
                    <div className="flex items-center gap-3"><FileText className="h-4 w-4 text-neutral-500" /> 12 downloadable resources</div>
                    <div className="flex items-center gap-3"><CheckCircle className="h-4 w-4 text-neutral-500" /> Certificate of completion</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-6 py-12 lg:pr-96">
          <div className="max-w-3xl">
            {/* What you'll learn */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-8 mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">What you'll learn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.whatYouWillLearn.map((item, idx) => (
                  <div key={idx} className="flex gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span className="text-neutral-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Course Curriculum */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Course Content</h2>
              <div className="space-y-4">
                {course.modules.map((mod, idx) => (
                  <div key={idx} className="border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/30">
                    <div className="bg-neutral-900 p-4 flex items-center justify-between">
                      <h3 className="font-semibold text-white">{mod.title}</h3>
                      <span className="text-sm text-neutral-400">{mod.lessons.length} lessons • {mod.duration}</span>
                    </div>
                    <div className="divide-y divide-neutral-800/50">
                      {mod.lessons.map((lesson, lIdx) => (
                        <div key={lIdx} className="p-4 flex items-center justify-between hover:bg-neutral-800/30 transition-colors">
                          <div className="flex items-center gap-3 text-neutral-300">
                            {lesson.type === 'video' ? <Video className="h-4 w-4 text-blue-500" /> : 
                             lesson.type === 'pdf' ? <FileText className="h-4 w-4 text-orange-500" /> : 
                             <CheckCircle className="h-4 w-4 text-purple-500" />}
                            <span>{lesson.title}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-neutral-500">{lesson.duration}</span>
                            <Lock className="h-4 w-4 text-neutral-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
}
