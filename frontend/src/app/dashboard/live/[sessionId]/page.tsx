'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import JitsiMeeting from '@/components/JitsiMeeting';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Loader2 } from 'lucide-react';

const API = 'http://localhost:4000';

export default function LiveSessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const router = useRouter();
  const { token, user } = useAuth();
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch(`${API}/live-sessions/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Live session not found');
        const data = await res.json();
        setSession(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (sessionId && token) fetchSession();
  }, [sessionId, token]);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-neutral-950 text-white min-h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p className="text-neutral-400">Loading Session...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-8 text-red-400">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p>{error || 'Session not found'}</p>
        <button 
          onClick={() => router.back()}
          className="mt-6 px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Use the session ID as a secure, unique Jitsi room name
  const roomName = `studentforge-live-${session.id}`;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white">{session.title}</h2>
          <p className="text-sm text-neutral-400">
             Started at {new Date(session.startTime).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden bg-black border border-neutral-800 min-h-[600px]">
        <JitsiMeeting 
          roomName={roomName}
          onLeave={() => router.back()}
        />
      </div>
    </div>
  );
}
