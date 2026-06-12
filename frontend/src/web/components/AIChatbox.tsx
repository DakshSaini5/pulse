import React, { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Sparkles, Bot, Loader2 } from "lucide-react"
import { cn } from "@core/utils/utils"
import io, { Socket } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen, isTyping])

  // Socket initialization
  useEffect(() => {
    // Only connect when opened for the first time
    if (isOpen && !socketRef.current) {
      const url = import.meta.env.VITE_API_URL || undefined;
      const token = localStorage.getItem('pulse_token');
      const socket = io(url as any, {
        auth: { token },
        transports: ['websocket']
      });
      
      socket.on('connect', () => {
        console.log('Chat socket connected');
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          text: 'Hi! I\'m Pulse AI. Ask me anything about nearby hospitals, your prescriptions, or health conditions.'
        }]);
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

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:bottom-6 sm:right-6 sm:left-auto z-[200] pointer-events-none flex flex-col items-end">
      {/* Chat Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-full sm:w-[350px] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[200] pointer-events-auto"
          style={{ height: "480px", maxHeight: "80vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-primary">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="size-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Pulse AI</p>
                <p className="text-[10px] text-white/70 mt-0.5 flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-green-400 animate-pulse"></span>
                  Powered by Gemini
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
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="size-3.5 text-primary" />
                  </div>
                )}
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

          {/* Input */}
          <div className="px-3 pb-3 pt-1 border-t border-border bg-card">
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
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "size-14 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 z-[200] pointer-events-auto",
          isOpen ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground shadow-primary/30"
        )}
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
      >
        {isOpen ? <X className="size-6" /> : <MessageCircle className="size-6" />}
      </button>
    </div>
  )
}

export default AIChatbox;
