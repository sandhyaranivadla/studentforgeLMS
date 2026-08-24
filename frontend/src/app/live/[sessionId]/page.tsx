"use client";
import { useState } from 'react';
import Link from 'next/link';
import { Video, Mic, MicOff, VideoOff, Settings, Users, MessageSquare, Hand, PhoneOff, ChevronLeft } from 'lucide-react';

export default function LiveClass() {
  const [micOn, setMicOn] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="h-screen bg-neutral-950 text-white flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-950 flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border border-red-500/20">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              Live
            </div>
            <span className="font-semibold text-sm sm:text-base truncate">Database Sharding Strategies</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-neutral-400">
          <span className="hidden sm:inline">01:45:22 elapsed</span>
        </div>
      </header>

      {/* Main Stage */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* Video Area */}
        <div className="flex-1 bg-black flex flex-col relative p-2 sm:p-4 gap-4 overflow-hidden">
          
          {/* Main Speaker View */}
          <div className="flex-1 bg-neutral-900 rounded-2xl overflow-hidden relative border border-neutral-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=1200&auto=format&fit=crop" alt="Screen share" className="w-full h-full object-cover opacity-80" />
            
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-medium border border-white/10 flex items-center gap-2">
              Dr. Smith (Host)
              <Mic size={14} className="text-emerald-400" />
            </div>
          </div>

          {/* Participant Grid (Small) */}
          <div className="h-32 shrink-0 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-48 h-full bg-neutral-900 rounded-xl border border-neutral-800 relative overflow-hidden shrink-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center font-bold text-lg">
                  S{i}
                </div>
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-xs font-medium border border-white/10 flex items-center gap-1.5">
                  Student {i}
                  <MicOff size={12} className="text-red-400" />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Control Bar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900/90 backdrop-blur-xl border border-neutral-700/50 px-6 py-3 rounded-full flex items-center gap-2 sm:gap-4 shadow-2xl">
            <button 
              onClick={() => setMicOn(!micOn)}
              className={`p-3 rounded-full flex items-center justify-center transition-colors ${micOn ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
            >
              {micOn ? <Mic size={20} /> : <MicOff size={20} />}
            </button>
            <button 
              onClick={() => setCameraOn(!cameraOn)}
              className={`p-3 rounded-full flex items-center justify-center transition-colors ${cameraOn ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
            >
              {cameraOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
            
            <div className="w-px h-8 bg-neutral-800 mx-2"></div>
            
            <button className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors">
              <Hand size={20} />
            </button>
            <button className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors relative">
              <Users size={20} />
              <span className="absolute -top-1 -right-1 bg-neutral-700 text-[10px] w-4 h-4 flex items-center justify-center rounded-full">42</span>
            </button>
            <button 
              onClick={() => setShowChat(!showChat)}
              className={`p-3 rounded-full transition-colors ${showChat ? 'bg-blue-600 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-white'}`}
            >
              <MessageSquare size={20} />
            </button>
            <button className="p-3 rounded-full bg-neutral-800 hover:bg-neutral-700 text-white transition-colors hidden sm:block">
              <Settings size={20} />
            </button>

            <div className="w-px h-8 bg-neutral-800 mx-2"></div>
            
            <Link href="/dashboard" className="p-3 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium transition-colors flex items-center gap-2">
              <PhoneOff size={18} /> <span className="hidden sm:inline">Leave</span>
            </Link>
          </div>

        </div>

        {/* Side Chat Panel */}
        {showChat && (
          <aside className="w-80 bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="font-medium text-white">In-Call Messages</h3>
              <button onClick={() => setShowChat(false)} className="text-neutral-400 hover:text-white">
                <Settings size={16} />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              <div className="text-sm">
                <span className="font-semibold text-blue-400 mr-2">Dr. Smith</span>
                <span className="text-neutral-300">Welcome everyone! We'll begin in 2 minutes.</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-purple-400 mr-2">Sarah J.</span>
                <span className="text-neutral-300">Can everyone hear the audio clearly?</span>
              </div>
              <div className="text-sm">
                <span className="font-semibold text-emerald-400 mr-2">Mike T.</span>
                <span className="text-neutral-300">Yes, loud and clear!</span>
              </div>
            </div>
            <div className="p-4 border-t border-neutral-800">
              <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-2 flex gap-2">
                <input type="text" placeholder="Send a message to everyone..." className="bg-transparent flex-1 outline-none text-sm text-white px-2" />
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
