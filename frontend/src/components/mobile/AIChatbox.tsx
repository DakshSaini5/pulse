"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Sparkles, Bot, Flag } from "lucide-react"
import { cn } from "@/utils/utils"
import { io, Socket } from "socket.io-client"
import ReactMarkdown from "react-markdown"
import toast from "react-hot-toast"

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
  isError?: boolean
}

const INITIAL_MESSAGES: Message[] = [
  { id: "welcome", role: "assistant", text: "Hi! I'm Pulse AI. I have access to your medical records and prescriptions. How can I help you today?" },
]

const QUICK_PROMPTS = ["Find hospitals near me", "Check drug interactions", "What is HbA1c?"]

export function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Socket Connection Management
  useEffect(() => {
    if (!isOpen) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
      }
      return
    }

    const token = localStorage.getItem('pulse_token')
    const apiUrl = import.meta.env.VITE_API_URL
    if (!apiUrl) {
      console.error('[AIChatbox] VITE_API_URL is not set. Socket connection will not be established.')
      return
    }

    const newSocket = io(apiUrl, {
      auth: { token },
      transports: ['websocket', 'polling'] // Support fallback
    })

    newSocket.on('connect', () => {
      console.log('Pulse AI Socket Connected')
    })

    // Handle incoming streaming chunk initialization
    newSocket.on('chat:response:start', (data: { id: string }) => {
      setIsTyping(false)
      setMessages(prev => [...prev, { id: data.id, role: "assistant", text: "" }])
    })

    // Handle incoming streaming chunks
    newSocket.on('chat:response:chunk', (data: { text: string }) => {
      setMessages(prev => {
        const newMessages = [...prev]
        const lastMsg = newMessages[newMessages.length - 1]
        if (lastMsg && lastMsg.role === "assistant") {
          lastMsg.text += data.text
        }
        return newMessages
      })
    })

    // Handle end of stream
    newSocket.on('chat:response:end', () => {
      // Stream is finished
    })

    // Handle single complete messages (like errors or fallbacks)
    newSocket.on('chat:response', (data: { text: string, isError?: boolean }) => {
      setIsTyping(false)
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: "assistant", 
        text: data.text,
        isError: data.isError 
      }])
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen, isTyping])

  const sendMessage = (text: string) => {
    if (!text.trim() || !socket) return
    
    // Optimistically add user message
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text: text.trim() }])
    setInput("")
    setIsTyping(true)

    // Emit to backend
    socket.emit('chat:message', text.trim())
  }

  const handleReport = () => {
    toast.success("AI response reported for review.")
  }

  return (
    <>
      {isOpen && (
        <div className="absolute bottom-20 right-3 w-[300px] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[200]" style={{ maxHeight: "420px" }}>
          <div className="flex items-center justify-between px-4 py-3.5 bg-primary">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-full bg-white/20 flex items-center justify-center">
                <Sparkles className="size-3.5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-none">Pulse AI</p>
                <p className="text-[10px] text-white/70 mt-0.5">Powered by Gemini</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="size-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors" aria-label="Close chat">
              <X className="size-3.5 text-white" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5" style={{ maxHeight: "280px" }}>
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-2 max-w-[90%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}>
                {msg.role === "assistant" && (
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="size-3.5 text-primary" />
                  </div>
                )}
                <div className="flex flex-col gap-1">
                  <div className={cn("px-3 py-2 rounded-2xl text-xs leading-relaxed", 
                    msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm whitespace-pre-wrap" : "bg-muted text-foreground rounded-tl-sm prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0",
                    msg.isError && "bg-danger/10 text-danger border border-danger/20"
                  )}>
                    {msg.role === "assistant" ? (
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    ) : (
                      msg.text
                    )}
                  </div>
                  {msg.role === "assistant" && msg.text.trim() !== "" && (
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
                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="size-3.5 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5 flex items-center gap-1">
                  <span className="size-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="size-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="size-1.5 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
              {QUICK_PROMPTS.map((prompt) => (
                <button key={prompt} onClick={() => sendMessage(prompt)} className="text-[10px] font-semibold text-primary bg-secondary border border-primary/20 rounded-full px-2.5 py-1 hover:bg-primary/10 transition-colors">
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

          <div className="px-3 pb-3 pt-1">
            <div className="flex items-center gap-2 bg-muted rounded-2xl px-3 h-10">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask Pulse AI..."
                className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button onClick={() => sendMessage(input)} disabled={!input.trim()} className={cn("size-6 rounded-full flex items-center justify-center transition-colors", input.trim() ? "bg-primary" : "bg-muted-foreground/20")} aria-label="Send message">
                <Send className="size-3 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(v => !v)}
        className={cn("absolute bottom-20 right-3 size-12 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95 z-[200]", isOpen ? "bg-muted-foreground text-white" : "bg-primary text-white shadow-primary/30")}
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
      >
        {isOpen ? <X className="size-5" /> : <MessageCircle className="size-5" />}
      </button>
    </>
  )
}