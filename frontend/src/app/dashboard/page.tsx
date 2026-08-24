import Link from 'next/link';
import { PlayCircle, Clock, Video, Award } from 'lucide-react';

export default function DashboardPage() {
  const mockCourses = [
    { id: '1', title: 'Full-Stack Next.js Masterclass', progress: 45, thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=600&auto=format&fit=crop' },
    { id: '2', title: 'Advanced Cloud Architecture', progress: 12, thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop' }
  ];

  const mockLiveClasses = [
    { id: 'l1', title: 'Q&A Session: Database Sharding', time: 'Today, 2:00 PM', instructor: 'Dr. Smith' },
    { id: 'l2', title: 'Live Coding: WebSockets in NestJS', time: 'Tomorrow, 10:00 AM', instructor: 'Prof. Davis' }
  ];

  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-6 rounded-2xl shadow-sm hover:border-blue-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-neutral-400 text-sm font-medium">Enrolled Courses</h3>
            <PlayCircle className="text-blue-500 h-5 w-5" />
          </div>
          <p className="text-3xl font-bold text-white">2</p>
        </div>
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-6 rounded-2xl shadow-sm hover:border-purple-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-neutral-400 text-sm font-medium">Upcoming Live</h3>
            <Video className="text-purple-500 h-5 w-5" />
          </div>
          <p className="text-3xl font-bold text-white">2</p>
        </div>
        <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 p-6 rounded-2xl shadow-sm hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-neutral-400 text-sm font-medium">Certificates</h3>
            <Award className="text-emerald-500 h-5 w-5" />
          </div>
          <p className="text-3xl font-bold text-white">0</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Continue Watching */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Continue Learning</h2>
            <Link href="/courses" className="text-sm text-blue-500 hover:text-blue-400 transition-colors">
              Browse More
            </Link>
          </div>
          <div className="grid gap-4">
            {mockCourses.map(course => (
              <div key={course.id} className="group bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all shadow-lg flex flex-col sm:flex-row">
                <div className="sm:w-48 h-32 bg-neutral-800 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayCircle className="text-white h-10 w-10" />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-center">
                  <h3 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors">{course.title}</h3>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex-1 h-2 bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${course.progress}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-neutral-400">{course.progress}%</span>
                  </div>
                  <Link href={`/learn/${course.id}`} className="mt-4 inline-block text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-center transition-colors self-start">
                    Resume Course
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Live Classes */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Upcoming Live Classes</h2>
          <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl overflow-hidden shadow-lg p-2">
            {mockLiveClasses.map(session => (
              <div key={session.id} className="p-4 hover:bg-neutral-800/50 rounded-xl transition-colors border-b border-neutral-800 last:border-0 group">
                <h4 className="font-medium text-white group-hover:text-purple-400 transition-colors">{session.title}</h4>
                <p className="text-sm text-neutral-400 mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {session.time}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-medium bg-neutral-800 text-neutral-300 px-2 py-1 rounded-md">{session.instructor}</span>
                  <Link href={`/live/${session.id}`} className="text-sm text-white bg-neutral-800 hover:bg-purple-600 px-3 py-1.5 rounded-lg transition-colors">
                    Join Lobby
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
