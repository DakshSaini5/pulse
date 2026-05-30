import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Socket initialization
  useEffect(() => {
    // Only connect when opened for the first time
    if (isOpen && !socketRef.current) {
      const url = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const socket = io(url);
      
      socket.on('connect', () => {
        console.log('Chat socket connected');
        setMessages([{
          id: 'welcome',
          role: 'model',
          text: 'Hi there! I am PulseAI. How can I help you with your health reports or prescriptions today?'
        }]);
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

      socketRef.current = socket;
    }

    return () => {
      // We keep socket open unless component unmounts
    };
  }, [isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim()
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    socketRef.current.emit('chat:message', input.trim());
    setInput('');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg shadow-blue-500/30 transition-transform hover:scale-110 active:scale-95 flex items-center justify-center"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[500px] max-h-[80vh] flex flex-col bg-[#0B0F19]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-blue-900/20 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">PulseAI Assistant</h3>
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
                  <div className="w-6 h-6 rounded-full bg-blue-600/20 flex-shrink-0 flex items-center justify-center mt-1">
                    <Bot size={14} className="text-blue-400" />
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
          </div>
          
        </div>
      )}
    </div>
  );
};

export default ChatAssistant;
