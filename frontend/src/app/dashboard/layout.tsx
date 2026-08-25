'use client';
import { useRouter } from 'next/navigation';
import { BookOpen, LogOut, LayoutDashboard, Settings } from 'lucide-react';
import React from 'react';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

interface StoredUser {
  name?: string;
  email?: string;
}

interface JwtPayload {
  name?: string;
  email: string;
  role: string;
}

function getUserFromCookie(): StoredUser | null {
  const token = Cookies.get('token');
  if (!token) return null;
  try {
    const decoded = jwtDecode<JwtPayload>(token);
    return { name: decoded.name, email: decoded.email };
  } catch {
    return null;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = getUserFromCookie();

  if (!user) {
    void router.push('/login');
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        Redirecting...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 bg-neutral-900 border-r border-neutral-800 flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <BookOpen className="text-blue-500" />
          <span className="font-bold text-xl tracking-tight">StudentForge</span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          <a
            href="/dashboard"
            className="flex items-center gap-3 bg-blue-600/10 text-blue-500 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <LayoutDashboard size={20} />
            Dashboard
          </a>
          <a
            href="#"
            className="flex items-center gap-3 text-neutral-400 hover:text-white hover:bg-neutral-800 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            <Settings size={20} />
            Settings
          </a>
        </nav>

        <div className="p-4 border-t border-neutral-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold">
              {user.name?.charAt(0) || user.email?.charAt(0)}
            </div>
            <div>
              <p className="text-sm font-medium">{user.name || 'User'}</p>
              <p className="text-xs text-neutral-500 truncate w-32">
                {user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              Cookies.remove('token');
              void router.push('/login');
            }}
            className="w-full flex items-center gap-2 text-neutral-400 hover:text-red-400 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-neutral-800 bg-neutral-900/50 flex items-center px-6 sticky top-0 backdrop-blur-md z-10">
          <h1 className="text-lg font-semibold text-neutral-200">
            Welcome back, {user.name?.split(' ')[0] || 'User'} 👋
          </h1>
        </header>
        <div className="p-6 flex-1 overflow-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950">
          {children}
        </div>
      </main>
    </div>
  );
}
