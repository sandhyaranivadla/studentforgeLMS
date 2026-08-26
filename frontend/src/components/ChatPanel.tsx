import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { io, Socket } from 'socket.io-client';
import { Send, Loader2 } from 'lucide-react';

const SOCKET_URL = 'http://localhost:4000';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  sender: {
    name: string;
    email: string;
    role: string;
  };
}

interface ChatPanelProps {
  courseId: string;
}

export default function ChatPanel({ courseId }: ChatPanelProps) {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!token || !courseId) return;

    // Fetch initial chat history
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${SOCKET_URL}/chat/${courseId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error('Failed to fetch chat history', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();

    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` }
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('joinCourse', { courseId });
    });

    socket.on('newMessage', (message: Message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.emit('leaveCourse', { courseId });
      socket.disconnect();
    };
  }, [courseId, token]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    // Emit the message
    socketRef.current.emit('sendMessage', { courseId, content: input.trim() });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 border-l border-neutral-800">
      <div className="p-4 border-b border-neutral-800">
        <h3 className="font-bold text-white">Course Chat</h3>
        <p className="text-xs text-neutral-400 mt-1">Real-time discussion room</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500 text-sm">
            <MessageSquare size={32} className="mb-2 opacity-20" />
            <p>No messages yet.</p>
            <p>Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = user?.id === msg.senderId;
            return (
              <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                {!isMe && (
                  <span className="text-xs text-neutral-400 mb-1 ml-1">
                    {msg.sender?.name || msg.sender?.email.split('@')[0]}
                    {msg.sender?.role === 'INSTRUCTOR' && (
                      <span className="ml-2 px-1.5 py-0.5 bg-blue-900/40 text-blue-400 rounded text-[10px]">Instructor</span>
                    )}
                  </span>
                )}
                <div 
                  className={`px-4 py-2 rounded-2xl max-w-[85%] break-words text-sm ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-neutral-800 text-neutral-200 rounded-tl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-neutral-800 bg-neutral-900">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full bg-black border border-neutral-800 rounded-full py-2 pl-4 pr-12 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="absolute right-1 top-1 bottom-1 w-8 flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
    </div>
  );
}

// Add the missing icon
import { MessageSquare } from 'lucide-react';
