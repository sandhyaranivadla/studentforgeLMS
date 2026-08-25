'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function CheckoutPage({ params }: { params: { courseId: string } }) {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  const handleEnroll = async () => {
    if (!token) return;
    setEnrolling(true);
    setError('');
    try {
      const res = await fetch('http://localhost:4000/enrollments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ courseId: params.courseId })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        router.push('/dashboard/student');
      } else {
        setError(data.message || 'Failed to enroll');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setEnrolling(false);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-center bg-neutral-900 p-8 rounded-xl border border-neutral-800">
          <h1 className="text-2xl font-bold mb-4">Please Login</h1>
          <p className="mb-6 text-neutral-400">You must be logged in as a student to enroll in this course.</p>
          <Link href="/login" className="bg-blue-600 px-6 py-2 rounded font-medium">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Confirm Enrollment</h1>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}
        
        <p className="text-neutral-400 mb-8 text-center">
          You are about to enroll in this course. There is no charge for early access users.
        </p>
        
        <div className="flex flex-col gap-4">
          <button 
            onClick={handleEnroll}
            disabled={enrolling}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors disabled:opacity-50"
          >
            {enrolling ? 'Enrolling...' : 'Confirm Free Enrollment'}
          </button>
          
          <button 
            onClick={() => router.back()}
            className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 px-4 rounded transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
