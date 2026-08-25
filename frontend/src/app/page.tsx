import Link from 'next/link';
import { ArrowRight, BookOpen, Video, MessageCircle, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 selection:bg-blue-500/30">
      
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 border-b border-white/5 bg-neutral-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 text-blue-500">
            <BookOpen size={24} />
            <span className="text-xl font-bold text-white tracking-tight">StudentForge</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Exclusive Learning Management System
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
            An exclusive portal for <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
              dedicated cohorts.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Welcome to StudentForge. Access your premium enrolled courses, join live instructor-led sessions, and collaborate with your cohort.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:scale-105">
              Login
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-7xl mx-auto mt-32 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 p-8 rounded-3xl hover:border-blue-500/50 transition-colors group">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Video size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Live Classrooms</h3>
            <p className="text-neutral-400 leading-relaxed">
              Join low-latency Zoom-powered live sessions directly from your browser. Ask questions, raise your hand, and collaborate.
            </p>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 p-8 rounded-3xl hover:border-purple-500/50 transition-colors group">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <MessageCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Real-time Chat</h3>
            <p className="text-neutral-400 leading-relaxed">
              Never feel isolated. Persistent messaging and ad-hoc 1:1 tutoring calls ensure your doubts are answered instantly.
            </p>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-800 p-8 rounded-3xl hover:border-emerald-500/50 transition-colors group">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Verified Credentials</h3>
            <p className="text-neutral-400 leading-relaxed">
              Complete auto-graded assessments and earn certificates that you can instantly share to your LinkedIn profile.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}
