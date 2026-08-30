'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CalendarPage from '../components/Calendar/CalendarPage';

export default function InstructorCalendar() {
  const { token, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN') {
      router.push('/dashboard/student');
    }
  }, [token, user, router]);

  if (!token) {
    return null;
  }

  return <CalendarPage />;
}
