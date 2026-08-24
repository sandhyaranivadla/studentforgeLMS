import Link from 'next/link';
import { BookOpen, Search, Filter, Star, Clock } from 'lucide-react';

async function getCourses() {
  try {
    const res = await fetch('http://localhost:4000/courses', { cache: 'no-store' });
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error('Failed to fetch courses', e);
    return [];
  }
}

export default async function CourseCatalog() {
  const courses = await getCourses();

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950">
      <header className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md flex items-center px-6 sticky top-0 z-50 justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-blue-500">
          <BookOpen size={24} />
          <span className="font-bold text-xl text-white tracking-tight">StudentForge</span>
        </Link>
        <div className="flex gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-neutral-400 hover:text-white transition-colors py-2">
            Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight mb-3">Course Catalog</h1>
            <p className="text-neutral-400 text-lg max-w-2xl">Discover your next skill. Enroll in high-quality, self-paced courses combined with real-time live classes.</p>
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 h-5 w-5" />
              <input 
                type="text" 
                placeholder="Search courses..." 
                className="bg-neutral-900 border border-neutral-800 text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full md:w-64 transition-all"
              />
            </div>
            <button className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-lg hover:bg-neutral-800 transition-colors text-neutral-400 hover:text-white">
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course: any) => (
            <Link href={`/courses/${course.id}`} key={course.id} className="group flex flex-col bg-neutral-900/40 border border-neutral-800/60 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:bg-neutral-900/60 transition-all shadow-xl hover:-translate-y-1">
              <div className="h-48 bg-neutral-800 relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={course.thumbnail || 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop'} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-3 left-3">
                  <span className="bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-md border border-white/10">
                    {course.category || 'Engineering'}
                  </span>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-bold text-lg text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">{course.title}</h3>
                
                <div className="flex items-center gap-4 text-sm text-neutral-400 mb-4 mt-auto pt-4 border-t border-neutral-800/50">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium text-neutral-200">{course.rating || 4.9}</span>
                    <span>({course.students || '1.2k'})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {course.duration || '12h 30m'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-white">${course.price}</span>
                  <span className="text-sm font-medium text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-10px] group-hover:translate-x-0 duration-300">
                    View Course →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
