'use client';

import { useAuth } from '@/contexts/AuthContext';
import { JitsiMeeting as JitsiReactSDK } from '@jitsi/react-sdk';
import { Loader2 } from 'lucide-react';

interface JitsiMeetingProps {
  roomName: string;
  onLeave: () => void;
}

export default function JitsiMeeting({ roomName, onLeave }: JitsiMeetingProps) {
  const { user } = useAuth();

  const isModerator = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  return (
    <div className="w-full h-full min-h-[600px] bg-black rounded-xl overflow-hidden relative">
      <JitsiReactSDK
        domain="meet.jit.si"
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: true,
          startWithVideoMuted: true,
          disableModeratorIndicator: false,
          enableEmailInStats: false,
          prejoinPageEnabled: false,
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        }}
        userInfo={{
          displayName: user?.name || user?.email?.split('@')[0] || 'User',
          email: user?.email || '',
        }}
        onApiReady={(externalApi) => {
          // Listen for the event when the user hangs up / leaves
          externalApi.addListener('videoConferenceLeft', () => {
            onLeave();
          });
          
          if (isModerator) {
            // Can execute moderator commands here if needed
          }
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
          iframeRef.style.border = '0px';
        }}
        spinner={() => (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900 text-white">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-sm text-neutral-400">Loading Secure Video Session...</p>
          </div>
        )}
      />
    </div>
  );
}
