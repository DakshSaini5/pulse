import React, { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Sparkles, Bot, Loader2, Flag, MapPin, Plus } from "lucide-react"
import { PulseLogo } from "./PulseLogo"
import { cn } from "@core/utils/utils"
import io, { Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { useAuth } from "@core/context/AuthContext";

interface Message {
  id: string
  role: "user" | "assistant" | "model"
  text: string
  isError?: boolean
}

const QUICK_PROMPTS = [
  "Find hospitals near me",
  "Check drug interactions",
  "What is HbA1c?",
]

export const AIChatbox: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null);

  // Drag state for mobile web
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen, isTyping])

  // Socket initialization
  useEffect(() => {
    // Only connect when opened for the first time
    if (isOpen && !socketRef.current) {
      let url = import.meta.env.VITE_API_URL || undefined;
      if (!url || url === 'undefined' || url.startsWith('/')) {
        url = 'https://pulse-production-f638.up.railway.app';
      }
      const token = localStorage.getItem('pulse_token');
      const socket = io(url as any, {
        auth: { token }
      });
      
      socket.on('connect', () => {
        console.log('Chat socket connected');
        setMessages(prev => {
          if (prev.some(m => m.id === 'welcome')) return prev;
          return [{
            id: 'welcome',
            role: 'assistant',
            text: `Hi ${user?.name ? user.name.split(' ')[0] : ''}! I'm Pulse AI. Ask me anything about nearby hospitals, your prescriptions, or health conditions.`
          }, ...prev];
        });
      });

      socket.on('chat:response', (data: { text: string, isError: boolean }) => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          text: data.text,
          isError: data.isError
        }]);
      });

      socket.on('chat:response:start', (data: { id: string }) => {
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: data.id || Date.now().toString(),
          role: 'assistant',
          text: '',
          isError: false
        }]);
      });

      socket.on('chat:response:chunk', (data: { text: string }) => {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMsgIndex = newMessages.length - 1;
          if (lastMsgIndex >= 0 && newMessages[lastMsgIndex].role === 'assistant') {
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

  const sendMessage = (text: string) => {
    if (!text.trim() || !socketRef.current) return
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)
    socketRef.current.emit('chat:message', text.trim());
  }

  const handleReport = () => {
    toast.success("AI response reported for review.")
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = false;
    dragStartPos.current = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    
    const deltaX = Math.abs(e.clientX - dragStartPos.current.x - dragOffset.x);
    const deltaY = Math.abs(e.clientY - dragStartPos.current.y - dragOffset.y);
    
    if (!isDragging.current && (deltaX > 5 || deltaY > 5)) {
      isDragging.current = true;
    }
    
    if (isDragging.current) {
      setDragOffset({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (!isDragging.current) {
      setIsOpen((v) => !v);
    }
    setTimeout(() => { isDragging.current = false; }, 50);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-[200] pointer-events-none flex flex-col items-end">
      {/* Chat Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-full sm:w-[350px] bg-card border border-border rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[200] pointer-events-auto transition-all"
          style={{ height: "min(400px, 75vh)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-primary">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-full bg-white flex items-center justify-center relative shrink-0">
                <MapPin className="size-5 text-red-500 fill-red-500" />
                <div className="absolute top-[6px] left-1/2 -translate-x-1/2 text-white bg-red-500 rounded-full w-2 h-2 flex items-center justify-center">
                  <Plus className="size-2" strokeWidth={5} />
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Pulse AI</p>
                <p className="text-[10px] text-white/70 mt-0.5 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Powered by Pulse AI
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="size-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <X className="size-3.5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3" >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-2 max-w-[90%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}
              >
                {(msg.role === "assistant" || msg.role === "model") && (
                  <div className="size-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 mt-0.5 relative shadow-sm">
                    <MapPin className="size-4 text-red-500 fill-red-500" />
                    <div className="absolute top-[5px] left-1/2 -translate-x-1/2 text-white bg-red-500 rounded-full w-[6px] h-[6px] flex items-center justify-center">
                      <Plus className="w-1.5 h-1.5" strokeWidth={5} />
                    </div>
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div
                    className={cn(
                      "px-3 py-2 rounded-2xl text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : msg.isError
                          ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm"
                          : "bg-muted text-foreground rounded-tl-sm"
                    )}
                  >
                    {msg.role === 'user' ? (
                      msg.text
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-xs">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.text}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {(msg.role === "assistant" || msg.role === "model") && msg.text.trim() !== "" && (
                    <button onClick={handleReport} className="flex items-center gap-1 text-[9px] text-muted-foreground hover:text-foreground self-start ml-1 mt-0.5" title="Report this response">
                      <Flag className="size-2.5" />
                      Report
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 mr-auto">
                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="size-3.5 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1">
                  <Loader2 className="size-3 text-muted-foreground animate-spin" />
                  <span className="text-[10px] text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-[10px] font-semibold text-primary bg-secondary border border-primary/20 rounded-full px-2.5 py-1 hover:bg-primary/10 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div className="px-3 pb-1 pt-1 border-t border-border bg-muted/30">
            <p className="text-[9px] text-muted-foreground leading-tight text-center">
              <strong className="text-foreground font-semibold">AI Recommendations Disclaimer:</strong> AI-generated recommendations are diagnostic in nature and must be correlated with the user’s overall conditions. All outputs must be validated with a licensed physician and should not be used for direct diagnosis or treatment purposes.
            </p>
          </div>

          {/* Input */}
          <div className="px-3 pb-3 pt-1 bg-card">
            <div className="flex items-center gap-2 bg-muted rounded-2xl px-3 h-10">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask Pulse AI..."
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping}
                className={cn(
                  "size-7 rounded-full flex items-center justify-center transition-colors",
                  input.trim() && !isTyping ? "bg-primary" : "bg-muted-foreground/20"
                )}
                aria-label="Send message"
              >
                <Send className="size-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB Toggle Button */}
      <button
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`, touchAction: 'none' }}
        className={cn(
          "shadow-xl flex items-center justify-center transition-all z-[200] pointer-events-auto cursor-grab active:cursor-grabbing",
          isOpen 
            ? "size-12 sm:size-14 rounded-full bg-muted text-muted-foreground" 
            : "h-12 px-1.5 pr-5 rounded-full bg-[#3B82F6] hover:bg-blue-600 text-white shadow-blue-500/30 gap-2.5"
        )}
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
      >
        {isOpen ? (
          <X className="size-5 sm:size-6" />
        ) : (
          <>
            <div className="size-9 rounded-full bg-white flex items-center justify-center shrink-0 relative">
              <MapPin className="w-6 h-6 text-red-500 fill-red-500" />
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 text-white bg-red-500 rounded-full w-2.5 h-2.5 flex items-center justify-center">
                <Plus className="w-3 h-3" strokeWidth={5} />
              </div>
            </div>
            <span className="font-bold text-sm tracking-wide">Pulse AI</span>
          </>
        )}
      </button>
    </div>
  )
}

export default AIChatbox;
