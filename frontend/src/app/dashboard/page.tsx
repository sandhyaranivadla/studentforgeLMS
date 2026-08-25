'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    router.replace(`/dashboard/${user.role.toLowerCase()}`);
  }, [user, router]);

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <BookOpen className="text-blue-500 h-10 w-10 animate-pulse" />
        <p className="text-neutral-400 text-sm">Redirecting to your dashboard…</p>
      </div>
    </div>
  );
}
