import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';
import { PulseLogo } from './PulseLogo';
import io, { Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isNativeApp, useKeyboardActive } from '@core/utils/platform';
import { chatAPI } from '@core/services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

const ChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const isKeyboardActive = useKeyboardActive();
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('pulse-ai:open', handleOpen);
    return () => window.removeEventListener('pulse-ai:open', handleOpen);
  }, []);

  // Socket initialization
  useEffect(() => {
    // Only connect when opened for the first time
    if (isOpen && !socketRef.current) {
      const url = import.meta.env.VITE_API_URL || undefined;
      const token = localStorage.getItem('pulse_token');
      const socket = io(url as any, {
        auth: { token },
        transports: ['polling', 'websocket'] // Use polling first for maximum compatibility on native apps
      });
      
      socket.on('connect', () => {
        const loadHistory = async () => {
          try {
            const history = await chatAPI.getHistory();
            if (history && history.length > 0) {
              setMessages(history.map(msg => ({
                id: msg.id,
                role: msg.role === 'model' ? 'model' : 'user',
                text: msg.content
              })));
            } else {
              setMessages([{
                id: 'welcome',
                role: 'model',
                text: 'Hi there! I am PulseAI. How can I help you with your health reports or prescriptions today?'
              }]);
            }
          } catch (err) {
            console.error("Failed to load chat history:", err);
            setMessages([{
              id: 'welcome',
              role: 'model',
              text: 'Hi there! I am PulseAI. How can I help you with your health reports or prescriptions today?'
            }]);
          }
        };

        loadHistory();
      });

      socket.on('chat:response', (data: { text: string, isError: boolean }) => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: data.text,
          isError: data.isError
        }]);
      });

      socket.on('chat:response:start', (data: { id: string }) => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: data.id || Date.now().toString(),
          role: 'model',
          text: '',
          isError: false
        }]);
      });

      socket.on('chat:response:chunk', (data: { text: string }) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsgIndex = newMessages.length - 1;
          if (lastMsgIndex >= 0 && newMessages[lastMsgIndex].role === 'model') {
            newMessages[lastMsgIndex] = {
              ...newMessages[lastMsgIndex],
              text: newMessages[lastMsgIndex].text + data.text
            };
          }
          return newMessages;
        });
      });

      socketRef.current = socket;
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    if (socketRef.current) {
      socketRef.current.emit('chat:message', { text: userMessage.text });
    } else {
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: "I'm sorry, I'm currently disconnected from the chat server. Please check your internet connection or try again later.",
          isError: true
        }]);
      }, 1000);
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
                className={`flex gap-3 \${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-6 h-6 rounded-full bg-white flex-shrink-0 flex items-center justify-center mt-1 shadow-sm border border-slate-200">
                    <PulseLogo variant="icon" size={14} />
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed \${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-sm' 
                    : msg.isError 
                      ? 'bg-red-500/20 border border-red-500/30 text-red-200 rounded-tl-sm'
                      : 'bg-white/10 text-gray-200 rounded-tl-sm'
                }`}>
                  {msg.role === 'user' ? (
                    msg.text
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
