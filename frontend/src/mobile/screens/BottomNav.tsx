"use client"

import { Search, FileText, TrendingUp, GitCompareArrows, ShieldAlert } from "lucide-react"
import { cn } from "@core/utils/utils"

interface BottomNavProps {
  active: "discover" | "records" | "panic" | "trends" | "compare"
  onTabChange?: (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => void
}

export function BottomNav({ active, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: "discover" as const, label: "Discover", icon: Search },
    { id: "records" as const, label: "Records", icon: FileText },
    { id: "panic" as const, label: "PANIC", icon: ShieldAlert, isPanic: true },
    { id: "trends" as const, label: "Trends", icon: TrendingUp },
    { id: "compare" as const, label: "Compare", icon: GitCompareArrows },
  ]

  return (
    <nav className="sticky bottom-0 bg-card/95 backdrop-blur-sm border-t border-border z-50">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon
          if (tab.isPanic) {
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                className="flex flex-col items-center gap-1 -mt-6"
                aria-label="Panic emergency button"
              >
                <div className="size-14 rounded-full bg-destructive shadow-lg shadow-destructive/30 flex items-center justify-center ring-4 ring-card">
                  <ShieldAlert className="size-6 text-white" />
                </div>
                <span className="text-[10px] font-bold text-destructive tracking-wide">PANIC</span>
              </button>
            )
          }
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange?.(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-[48px]",
                active === tab.id ? "text-primary" : "text-muted-foreground"
              )}
              aria-label={tab.label}
            >
              <Icon className="size-5" />
              <span className={cn("text-[10px] font-medium", active === tab.id && "text-primary")}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
