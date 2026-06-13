"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Sparkles, Bot } from "lucide-react"
import { PulseLogo } from "../../web/components/PulseLogo"
import { cn } from "@core/utils/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
}

const INITIAL_MESSAGES: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    text: "Hi! I'm Pulse AI. Ask me anything about nearby hospitals, your prescriptions, or health conditions.",
  },
]

const QUICK_PROMPTS = [
  "Find hospitals near me",
  "Check drug interactions",
  "What is HbA1c?",
]

const MOCK_RESPONSES: Record<string, string> = {
  default:
    "I can help you with hospital discovery, prescription queries, and health information. Could you clarify your question a bit more?",
  hospital:
    "Based on your location in Delhi, I found 3 highly rated hospitals nearby. Dispensary Pusa (1.6 km, 4.3★) and CGHS Inderpuri (2.1 km, 4.7★) are both open right now.",
  drug:
    "To run a drug interaction check, please upload your prescriptions in the Records tab. I can then cross-reference all active medications for dangerous overlaps.",
  hba1c:
    "HbA1c (glycated hemoglobin) measures your average blood glucose over the past 2–3 months. A normal range is 4–5.7%. Values above 6.5% may indicate diabetes.",
}

function getMockResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes("hospital") || lower.includes("near")) return MOCK_RESPONSES.hospital
  if (lower.includes("drug") || lower.includes("interaction") || lower.includes("prescription"))
    return MOCK_RESPONSES.drug
  if (lower.includes("hba1c") || lower.includes("hemoglobin") || lower.includes("a1c"))
    return MOCK_RESPONSES.hba1c
  return MOCK_RESPONSES.default
}

export function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages, isOpen])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        text: getMockResponse(text),
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
    }, 900)
  }

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="absolute bottom-20 right-3 w-[300px] bg-card border border-border rounded-3xl shadow-2xl flex flex-col overflow-hidden z-[200]"
          style={{ maxHeight: "420px" }}
        >
          {/* Header */}
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
            <button
              onClick={() => setIsOpen(false)}
              className="size-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              aria-label="Close chat"
            >
              <X className="size-3.5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2.5" style={{ maxHeight: "280px" }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn("flex gap-2 max-w-[90%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}
              >
                {msg.role === "assistant" && (
                  <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="size-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "px-3 py-2 rounded-2xl text-xs leading-relaxed",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  )}
                >
                  {msg.text}
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
          <div className="px-3 pb-3 pt-1 border-t border-border">
            <div className="flex items-center gap-2 bg-muted rounded-2xl px-3 h-10">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask Pulse AI..."
                className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()}
                className={cn(
                  "size-6 rounded-full flex items-center justify-center transition-colors",
                  input.trim() ? "bg-primary" : "bg-muted-foreground/20"
                )}
                aria-label="Send message"
              >
                <Send className="size-3 text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Label and FAB Toggle Button */}
      {!isOpen && (
        <div 
          onClick={() => setIsOpen(true)}
          className="absolute bottom-[84px] right-[70px] bg-white px-3 py-1.5 rounded-xl rounded-br-sm shadow-xl border border-slate-200 text-[11px] font-bold text-slate-800 z-[200] animate-in slide-in-from-right-2 fade-in duration-500 cursor-pointer flex items-center gap-1"
        >
          Pulse AI <span className="text-sm leading-none">✨</span>
        </div>
      )}
      
      <button
        onClick={() => setIsOpen((v) => !v)}
        className={cn(
          "absolute bottom-20 right-3 size-12 rounded-full shadow-2xl flex items-center justify-center transition-all active:scale-95 z-[200] border border-slate-200",
          isOpen ? "bg-muted-foreground text-white" : "bg-white text-white shadow-red-500/20"
        )}
        aria-label={isOpen ? "Close AI chat" : "Open AI chat"}
      >
        {isOpen ? <X className="size-5" /> : <PulseLogo variant="icon" size={28} />}
      </button>
    </>
  )
}
