import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { PulseLogo } from './PulseLogo';
import io, { Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isNativeApp, useKeyboardActive } from '@core/utils/platform';
import { chatAPI } from '@core/services/api';
import { useNavigate } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { App } from '@capacitor/app';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
  status?: 'sending' | 'sent';
}

const CRISIS_PATTERNS = [
  /suicide/i,
  /kill\s+my\s*self/i,
  /kill\s+him\s*self/i,
  /kill\s+her\s*self/i,
  /want\s+to\s+die/i,
  /want\s+to\s+end\s+my\s+life/i,
  /hurt\s+my\s*self/i,
  /harm\s+my\s*self/i,
  /self[- ]harm/i,
  /suicidal/i,
  /don't\s+want\s+to\s+live/i,
  /dont\s+want\s+to\s+live/i,
  /hanging\s+my\s*self/i,
  /cutting\s+my\s*self/i,
  /die\s+now/i,
  /end\s+it\s+all/i,
  /feel\s+like\s+dying/i,
  /dont\s+feel\s+good\s+wanna\s+die/i,
  /wanna\s+kill\s+my\s*self/i,
  /wish\s+i\s+was\s+dead/i,
  /wish\s+i\s+were\s+dead/i
];

const EMERGENCY_PATTERNS = [
  /chest\s+pain/i,
  /cannot\s+breathe/i,
  /can't\s+breathe/i,
  /breathing\s+diffic/i,
  /shortness\s+of\s+breath/i,
  /sudden\s+paralysis/i,
  /severe\s+bleeding/i,
  /heavy\s+bleeding/i,
  /unconscious/i,
  /heart\s+attack/i,
  /stroke\s+symptom/i
];

const MEDICATION_PATTERNS = [
  /which\s+antibiotic/i,
  /recommend\s+an\s+antibiotic/i,
  /suggest\s+a\s+medicine/i,
  /prescribe\s+a\s+pill/i,
  /dosage\s+for/i,
  /what\s+is\s+the\s+dosage\s+of/i,
  /how\s+many\s+mg\s+of/i,
  /dose\s+of/i
];

const FEATURE_PATTERNS = [
  /how\s+(to|do\s+i)\s+upload/i,
  /see\s+my\s+trends/i,
  /saved\s+hospital/i,
  /where\s+is\s+saved/i,
  /my\s+reports/i,
  /prescription\s+analys/i,
  /how\s+does\s+the\s+app\s+work/i
];

const ChatAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const isKeyboardActive = useKeyboardActive();
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [activeStreamText, setActiveStreamText] = useState<string | null>(null);
  const activeStreamIdRef = useRef<string | null>(null);
  const [pendingMessages, setPendingMessages] = useState<ChatMessage[]>([]);

  // Drag state for mobile web
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const pointerStartCoords = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });
  const fabRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen || activeStreamText !== null) {
      scrollToBottom();
    }
  }, [messages, isOpen, activeStreamText]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('pulse-ai:open', handleOpen);
    return () => window.removeEventListener('pulse-ai:open', handleOpen);
  }, []);

  // Load local chat cache on mount (Task 1)
  useEffect(() => {
    const loadCache = async () => {
      try {
        let cached: string | null = null;
        if (isNativeApp) {
          const { value } = await Preferences.get({ key: 'pulse_chat_cache' });
          cached = value;
        } else {
          cached = localStorage.getItem('pulse_chat_cache');
        }
        if (cached) {
          const parsed = JSON.parse(cached) as ChatMessage[];
          if (parsed && parsed.length > 0) {
            setMessages(parsed);
          }
        }
      } catch (err) {
        console.error('[ChatAssistant] Failed to load chat cache:', err);
      }
    };
    loadCache();
  }, []);

  // Save latest 20 messages to cache on change (Task 1)
  useEffect(() => {
    const saveCache = async () => {
      if (messages.length === 0) return;
      try {
        const cleanMessages: ChatMessage[] = messages.slice(-20).map(msg => ({
          ...msg,
          status: (msg.status === 'sending' ? 'sending' : 'sent') as 'sending' | 'sent'
        }));
        const serialized = JSON.stringify(cleanMessages);
        if (isNativeApp) {
          await Preferences.set({ key: 'pulse_chat_cache', value: serialized });
        } else {
          localStorage.setItem('pulse_chat_cache', serialized);
        }
      } catch (err) {
        console.error('[ChatAssistant] Failed to save chat cache:', err);
      }
    };
    saveCache();
  }, [messages]);

  // App Backgrounding Socket Lifecycle Manager (Task 2)
  useEffect(() => {
    if (!isNativeApp) return;

    const listener = App.addListener('appStateChange', async (state) => {
      console.log('[ChatAssistant] App lifecycle state change:', state);
      if (state.isActive) {
        // App is active: trigger connect
        if (socketRef.current) {
          if (!socketRef.current.connected) {
            console.log('[ChatAssistant] App active: reconnecting socket...');
            socketRef.current.connect();
          }
          // Request missing messages
          const lastMsgId = messages.length > 0 ? messages[messages.length - 1].id : null;
          console.log('[ChatAssistant] Syncing missing messages since:', lastMsgId);
          socketRef.current.emit('chat:sync', { lastMessageId: lastMsgId });
        }
      } else {
        // App is backgrounded: disconnect
        if (socketRef.current && socketRef.current.connected) {
          console.log('[ChatAssistant] App backgrounded: disconnecting socket...');
          socketRef.current.disconnect();
        }
      }
    });

    return () => {
      listener.then(h => h.remove());
    };
  }, [messages]);

  // Process Offline Pending Message Queue (Task 4)
  useEffect(() => {
    if (socketRef.current && socketRef.current.connected && pendingMessages.length > 0) {
      console.log('[ChatAssistant] Socket connected. Sending queued messages:', pendingMessages);
      pendingMessages.forEach(msg => {
        socketRef.current?.emit('chat:message', { text: msg.text });
      });
      setPendingMessages([]);
    }
  }, [pendingMessages, socketRef.current?.connected]);

  // Socket initialization (Persistent Keep-Alive on Mount)
  useEffect(() => {
    if (!socketRef.current) {
      const url = import.meta.env.VITE_API_URL || undefined;
      const token = localStorage.getItem('pulse_token');
      
      console.log('[ChatAssistant] Connecting socket via WebSockets...');
      const socket = io(url as any, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });
      
      socket.on('connect', () => {
        console.log('[ChatAssistant] Socket connected.');
        
        // Load history only if we do not already have messages loaded in UI
        const loadHistory = async () => {
          try {
            const history = await chatAPI.getHistory();
            if (history && history.length > 0) {
              setMessages(history.map(msg => ({
                id: msg.id,
                role: (msg.role === 'model' ? 'model' : 'user') as 'model' | 'user',
                text: msg.content,
                status: 'sent' as const
              })));
            } else {
              setMessages([{
                id: 'welcome',
                role: 'model' as const,
                text: 'Hi there! I am PulseAI. How can I help you with your health reports or prescriptions today?',
                status: 'sent' as const
              }]);
            }
          } catch (err) {
            console.error("Failed to load chat history:", err);
            setMessages([{
              id: 'welcome',
              role: 'model' as const,
              text: 'Hi there! I am PulseAI. How can I help you with your health reports or prescriptions today?',
              status: 'sent' as const
            }]);
          }
        };

        // If messages contain only a cached or welcome message, refresh history
        setMessages(prev => {
          if (prev.length <= 1) {
            loadHistory();
          }
          return prev;
        });
      });

      socket.on('chat:response', (data: { text: string, isError: boolean }) => {
        setIsTyping(false);
        setMessages(prev => {
          // Clear sending statuses
          const updated: ChatMessage[] = prev.map(msg => msg.status === 'sending' ? { ...msg, status: 'sent' as const } : msg);
          
          const resId = activeStreamIdRef.current || Date.now().toString();
          // Avoid duplicate appends if chunk processing already push-assembled it
          if (updated.some(m => m.id === resId)) return updated;

          return [...updated, {
            id: resId,
            role: 'model' as const,
            text: data.text,
            isError: data.isError,
            status: 'sent' as const
          }];
        });
        setActiveStreamText(null);
        activeStreamIdRef.current = null;
      });

      socket.on('chat:response:start', (data: { id: string }) => {
        setIsTyping(false);
        activeStreamIdRef.current = data.id || Date.now().toString();
        setActiveStreamText('');
      });

      socket.on('chat:response:chunk', (data: { text: string }) => {
        setActiveStreamText(prev => (prev === null ? data.text : prev + data.text));
      });

      socketRef.current = socket;
    }

    return () => {
      // Clean up when Component unmounts entirely (not when isOpen closes)
      if (socketRef.current) {
        console.log('[ChatAssistant] Component unmount: disconnecting socket.');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const queryText = input.trim();
    if (!queryText || isTyping) return;

    const messageId = Date.now().toString();
    const userMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      text: queryText,
      status: 'sending'
    };

    // 1. Suicide / Self-Harm Intercept
    if (CRISIS_PATTERNS.some(p => p.test(queryText))) {
      setMessages(prev => [...prev, { ...userMessage, status: 'sent' as const }]);
      setInput('');
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model' as const,
          text: `### **Emergency Support Available (India)**\n\nPlease know that you are not alone, and there is support available right now. Your life is extremely valuable, and there are people who want to listen and help you through this difficult time.\n\nPlease contact one of the following helplines immediately:\n\n* 🚨 **National Emergency Helpline**: [Call 112](tel:112) (Immediate police & medical response)\n* 📞 **Tele-MANAS (Mental Health Helpline)**: [Call 14416](tel:14416) or [Call 1800-891-4416](tel:18008914416) (24/7 free counseling)\n* 🏥 **Kiran Mental Health Helpline**: [Call 1800-599-0019](tel:18005990019) (24/7 free support)\n* 🤝 **AASRA (Suicide Prevention Helpline)**: [Call 9152987821](tel:9152987821)\n\nPlease reach out to them or contact a trusted friend, family member, or healthcare professional immediately. We care about your safety and well-being.`,
          isError: false,
          status: 'sent' as const
        }]);
      }, 800);
      return;
    }

    // 2. Emergency Triage Intercept
    if (EMERGENCY_PATTERNS.some(p => p.test(queryText))) {
      setMessages(prev => [...prev, { ...userMessage, status: 'sent' as const }]);
      setInput('');
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model' as const,
          text: `### 🚨 **Potential Medical Emergency**\n\nYou are describing symptoms (such as chest pain or breathing difficulties) that could indicate a life-threatening medical emergency.\n\n**Please do not wait.**\n\n* 📞 **Call Emergency Helpline**: [Call 112](tel:112) or [Call 108](tel:108) immediately.\n* 🏥 **Navigate to Care**: [Find Nearest Emergency Room](/search?emergency=true&sort=distance)`,
          isError: false,
          status: 'sent' as const
        }]);
      }, 800);
      return;
    }

    // 3. Medication / Self-Medication Intercept
    if (MEDICATION_PATTERNS.some(p => p.test(queryText))) {
      setMessages(prev => [...prev, { ...userMessage, status: 'sent' as const }]);
      setInput('');
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model' as const,
          text: `### 💊 **Medication Advisory**\n\nPulse AI is a triage assistant and cannot prescribe medications or calculate dosages. Self-medication (especially with antibiotics, heavy painkillers, or schedule-H drugs) can carry serious health risks.\n\nPlease upload your doctor's prescription for a safe, simplified analysis and dosage tracker:\n\n* 📄 [Upload Prescription for Analysis](/prescriptions)`,
          isError: false,
          status: 'sent' as const
        }]);
      }, 800);
      return;
    }

    // 4. Feature Shortcut Links Intercept
    if (FEATURE_PATTERNS.some(p => p.test(queryText))) {
      setMessages(prev => [...prev, { ...userMessage, status: 'sent' as const }]);
      setInput('');
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model' as const,
          text: `### 📄 **Pulse Feature Guide**\n\nYou can easily navigate to the correct section of the Pulse platform using the quick links below:\n\n* 📈 **Health Trends**: Check your bio-marker history in [Trends Center](/trends).\n* ❤️ **Saved Facilities**: View your bookmarked clinics in [Saved Hospitals](/saved).\n* 📄 **Reports**: Upload clinical document scans in [Report Center](/reports).\n* 💊 **Prescriptions**: Extract and parse dosage timelines in [Prescription Center](/prescriptions).`,
          isError: false,
          status: 'sent' as const
        }]);
      }, 800);
      return;
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('chat:message', { text: userMessage.text });
    } else {
      console.warn('[ChatAssistant] Socket offline. Queuing message.');
      setPendingMessages(prev => [...prev, userMessage]);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    dragStartPos.current = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    };
    pointerStartCoords.current = {
      x: e.clientX,
      y: e.clientY
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const nextX = e.clientX - dragStartPos.current.x;
    const nextY = e.clientY - dragStartPos.current.y;
    
    // Bounds check to keep button within viewport
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 360;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 640;
    
    const maxLeftX = -screenWidth + 80;
    const maxRightX = 20;
    const maxUpY = -screenHeight + 140;
    const maxDownY = 20;
    
    currentOffset.current = {
      x: Math.min(Math.max(nextX, maxLeftX), maxRightX),
      y: Math.min(Math.max(nextY, maxUpY), maxDownY)
    };
    
    setDragOffset(currentOffset.current);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    // Check if it was a simple tap/click
    const dx = e.clientX - pointerStartCoords.current.x;
    const dy = e.clientY - pointerStartCoords.current.y;
    const moveDistance = Math.sqrt(dx * dx + dy * dy);
    
    if (moveDistance < 6) {
      setIsOpen(true);
      return;
    }

    // Snap to left or right edge of screen
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 360;
    const threshold = -screenWidth / 2;
    
    if (currentOffset.current.x < threshold) {
      // Snap to left
      currentOffset.current.x = -screenWidth + 90;
      
      setDragOffset(currentOffset.current);
      
      if (fabRef.current) {
        fabRef.current.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
        fabRef.current.style.transform = `translate(${currentOffset.current.x}px, ${currentOffset.current.y}px)`;
        
        setTimeout(() => {
          if (fabRef.current) {
            fabRef.current.style.transition = 'none';
          }
        }, 400);
      }
    } else {
      // Snap to right
      currentOffset.current.x = 0;
      
      setDragOffset(currentOffset.current);
      
      if (fabRef.current) {
        // Add a smooth easing transition only for the snap effect
        fabRef.current.style.transition = 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)';
        fabRef.current.style.transform = `translate(${currentOffset.current.x}px, ${currentOffset.current.y}px)`;
        
        // Remove the transition after it finishes so next drag is smooth again
        setTimeout(() => {
          if (fabRef.current) {
            fabRef.current.style.transition = 'none';
          }
        }, 400);
      }
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-50 flex flex-col items-end pointer-events-none">
      {/* Floating Button with Label */}
      {!isOpen && !isKeyboardActive && (
        <div 
          ref={fabRef}
          className="flex items-center gap-2 pointer-events-auto cursor-grab active:cursor-grabbing bg-blue-600 hover:bg-blue-700 text-white rounded-full py-1.5 pl-1.5 pr-4 shadow-xl border border-blue-500/30 transition-transform hover:scale-105 active:scale-95 shrink-0" 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`, touchAction: 'none' }}
        >
          <div className="size-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
            <PulseLogo variant="icon" size={20} />
          </div>
          <span className="font-bold text-xs tracking-wide whitespace-nowrap">Pulse AI</span>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-full sm:w-[400px] h-[450px] sm:h-[500px] max-h-[80vh] flex flex-col bg-[#0B0F19]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-blue-900/20 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto transition-all">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-white border border-white/10 flex items-center justify-center shadow-inner">
                <PulseLogo variant="icon" size={20} />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Pulse AI</h3>
                <p className="text-blue-400/60 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-6 h-6 rounded-full bg-white flex-shrink-0 flex items-center justify-center mt-1 shadow-sm border border-slate-200">
                    <PulseLogo variant="icon" size={14} />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? `bg-blue-600 text-white rounded-tr-sm ${msg.status === 'sending' ? 'opacity-70' : ''}` 
                    : msg.isError 
                      ? 'bg-red-500/20 border border-red-500/30 text-red-200 rounded-tl-sm'
                      : 'bg-white/10 text-gray-200 rounded-tl-sm'
                }`}>
                  {msg.role === 'user' ? (
                    <div className="relative">
                      {msg.text}
                      {msg.status === 'sending' && (
                        <span className="block text-[9px] text-blue-200 text-right mt-0.5 animate-pulse">Sending...</span>
                      )}
                    </div>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h2: ({children}) => <h2 className="text-blue-400 font-semibold text-sm mt-2 mb-1">{children}</h2>,
                        h3: ({children}) => <h3 className="text-blue-300 font-medium text-xs mt-2 mb-1">{children}</h3>,
                        p: ({children}) => <p className="text-gray-200 text-sm mb-1.5 leading-relaxed">{children}</p>,
                        ul: ({children}) => <ul className="list-disc list-inside text-gray-300 text-sm space-y-0.5 ml-1">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal list-inside text-gray-300 text-sm space-y-0.5 ml-1">{children}</ol>,
                        li: ({children}) => <li className="text-sm">{children}</li>,
                        strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                        em: ({children}) => <em className="text-gray-400 italic">{children}</em>,
                        hr: () => <hr className="border-white/10 my-2" />,
                        code: ({children}) => <code className="bg-white/10 px-1 py-0.5 rounded text-blue-300 text-xs">{children}</code>,
                        a: ({href, children}) => {
                          const isInternal = href && href.startsWith('/');
                          if (isInternal) {
                            return (
                              <button
                                onClick={() => {
                                  setIsOpen(false);
                                  navigate(href);
                                }}
                                className="text-blue-400 font-bold hover:underline transition-colors cursor-pointer text-left bg-transparent border-none p-0 inline"
                              >
                                {children}
                              </button>
                            );
                          }
                          return <a href={href} className="text-blue-400 font-bold hover:underline transition-colors">{children}</a>;
                        },
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0 flex items-center justify-center mt-1">
                    <User size={14} className="text-gray-300" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Render Isolated Streaming Response Bubble (Task 3) */}
            {activeStreamText !== null && (
              <div className="flex gap-3 justify-start animate-in fade-in duration-200">
                <div className="w-6 h-6 rounded-full bg-white flex-shrink-0 flex items-center justify-center mt-1 shadow-sm border border-slate-200">
                  <PulseLogo variant="icon" size={14} />
                </div>
                <div className="max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed bg-white/10 text-gray-200 rounded-tl-sm">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({children}) => <h2 className="text-blue-400 font-semibold text-sm mt-2 mb-1">{children}</h2>,
                      h3: ({children}) => <h3 className="text-blue-300 font-medium text-xs mt-2 mb-1">{children}</h3>,
                      p: ({children}) => <p className="text-gray-200 text-sm mb-1.5 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="list-disc list-inside text-gray-300 text-sm space-y-0.5 ml-1">{children}</ul>,
                      ol: ({children}) => <ol className="list-decimal list-inside text-gray-300 text-sm space-y-0.5 ml-1">{children}</ol>,
                      li: ({children}) => <li className="text-sm">{children}</li>,
                      strong: ({children}) => <strong className="text-white font-semibold">{children}</strong>,
                      em: ({children}) => <em className="text-gray-400 italic">{children}</em>,
                      hr: () => <hr className="border-white/10 my-2" />,
                      code: ({children}) => <code className="bg-white/10 px-1 py-0.5 rounded text-blue-300 text-xs">{children}</code>,
                      a: ({href, children}) => {
                        const isInternal = href && href.startsWith('/');
                        if (isInternal) {
                          return (
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                navigate(href);
                              }}
                              className="text-blue-400 font-bold hover:underline transition-colors cursor-pointer text-left bg-transparent border-none p-0 inline"
                            >
                              {children}
                            </button>
                          );
                        }
                        return <a href={href} className="text-blue-400 font-bold hover:underline transition-colors">{children}</a>;
                      },
                    }}
                  >
                    {activeStreamText}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 justify-start animate-pulse">
                <div className="w-6 h-6 rounded-full bg-blue-600/20 flex-shrink-0 flex items-center justify-center mt-1">
                  <Bot size={14} className="text-blue-400" />
                </div>
                <div className="bg-white/10 text-gray-400 rounded-2xl rounded-tl-sm px-4 py-2 text-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-black/20 border-t border-white/5">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your health..."
                className="w-full bg-white/5 border border-white/10 text-white placeholder:text-gray-500 rounded-full py-2.5 pl-4 pr-12 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all text-sm"
              />
              <button 
                type="submit"
                disabled={!input.trim() || isTyping}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/5 disabled:text-gray-500 text-white rounded-full transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
            <div className="mt-2 text-[10px] text-center text-gray-500 leading-tight">
              I am an AI and can make mistakes. Always consult with your doctor before making medical decisions.
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
