"use client"

import { useState } from "react"
import {
  Bell, MapPin, Menu, X, Home, Search, FileText,
  TrendingUp, GitCompareArrows, Settings,
  HelpCircle, LogOut, User, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/utils/utils"
import { PulseLogo } from "../PulseLogo"

interface PulseNavProps {
  variant?: "landing" | "app"
  notificationCount?: number
  onSignIn?: () => void
  onJoin?: () => void
  activeScreen?: string
  onNavigate?: (screen: string) => void
  onPanic?: () => void
}

const NAV_ITEMS = [
  { id: "home",     label: "Home",              icon: Home },
  { id: "discover", label: "Discover Hospitals", icon: Search },
  { id: "compare",  label: "Hospital Compare",   icon: GitCompareArrows },
  { id: "records",  label: "My Records",         icon: FileText },
  { id: "trends",   label: "Health Trends",      icon: TrendingUp },
]

const SECONDARY_ITEMS = [
  { id: "settings",  label: "Settings",    icon: Settings },
  { id: "help",      label: "Help & FAQ",  icon: HelpCircle },
  { id: "logout",    label: "Sign Out",    icon: LogOut },
]

export function PulseNav({
  variant = "app",
  notificationCount = 2,
  onSignIn,
  onJoin,
  activeScreen,
  onNavigate,
  onPanic,
}: PulseNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleNavigate = (id: string) => {
    setMenuOpen(false)
    onNavigate?.(id)
  }

  return (
    <>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center">
            <PulseLogo size={32} showTagline={true} />
          </div>

          {/* Right side */}
          {variant === "landing" ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-foreground font-medium" onClick={onSignIn}>
                Sign In
              </Button>
              <Button size="sm" className="bg-primary text-primary-foreground font-medium" onClick={onJoin}>
                Join
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {/* Notifications */}
              <button
                className="relative size-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Notifications"
              >
                <Bell className="size-5 text-muted-foreground" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive" />
                )}
              </button>

              {/* Hamburger */}
              <button
                onClick={() => setMenuOpen(true)}
                className="size-9 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                aria-label="Open navigation menu"
                aria-expanded={menuOpen}
              >
                <Menu className="size-5 text-foreground" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Backdrop ── */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[200] bg-foreground/30 backdrop-blur-[2px]"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Slide-in drawer ── */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-[210] h-full w-[280px] bg-card shadow-2xl flex flex-col transition-transform duration-300 ease-in-out",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}
        aria-label="Navigation menu"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground leading-none">Aryan Sharma</p>
              <p className="text-xs text-muted-foreground mt-0.5">aryan@pulse.health</p>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen(false)}
            className="size-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* Primary nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-0.5">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-3 pb-2 pt-1">
            Navigation
          </p>
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleNavigate(id)}
              className={cn(
                "w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                activeScreen === id
                  ? "bg-primary/10 text-primary"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <span className="flex items-center gap-3">
                <span
                  className={cn(
                    "size-8 rounded-lg flex items-center justify-center shrink-0",
                    activeScreen === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  <Icon className="size-4" />
                </span>
                {label}
              </span>
              {activeScreen === id && <ChevronRight className="size-3.5 text-primary" />}
            </button>
          ))}

          {/* Divider */}
          <div className="my-3 border-t border-border mx-3" />

          {/* Secondary links */}
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase px-3 pb-2">
            Account
          </p>
          {SECONDARY_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                id === "logout" ? "text-destructive hover:bg-destructive/10" : "text-foreground hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "size-8 rounded-lg flex items-center justify-center shrink-0",
                  id === "logout" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                )}
              >
                <Icon className="size-4" />
              </span>
              {label}
            </button>
          ))}
        </nav>

        {/* Drawer footer */}
        <div className="px-5 py-4 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            Pulse v2.4.1 &middot; HIPAA Compliant &middot; Powered by Gemini AI
          </p>
        </div>
      </aside>
    </>
  )
}
