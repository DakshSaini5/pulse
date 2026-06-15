Here is the complete final code for all components:

---

## `app/globals.css`

```css
@import 'tailwindcss';
@import 'tw-animate-css';
@import 'shadcn/tailwind.css';

@custom-variant dark (&:is(.dark *));

@theme inline {
  --font-heading: var(--font-sans);
  --font-sans: var(--font-geist-sans), 'Geist Fallback';
  --font-mono: var(--font-geist-mono), 'Geist Mono Fallback';
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --color-foreground: var(--foreground);
  --color-background: var(--background);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

:root {
  --pulse-blue: oklch(0.52 0.22 254);
  --pulse-blue-light: oklch(0.95 0.04 254);
  --pulse-blue-dark: oklch(0.38 0.22 254);
  --pulse-red: oklch(0.55 0.22 25);
  --pulse-red-light: oklch(0.96 0.04 25);
  --pulse-navy: oklch(0.22 0.04 250);
  --pulse-green: oklch(0.58 0.16 152);
  --pulse-amber: oklch(0.76 0.14 75);

  --background: oklch(0.975 0.005 250);
  --foreground: oklch(0.18 0.04 250);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.18 0.04 250);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0.04 250);
  --primary: oklch(0.52 0.22 254);
  --primary-foreground: oklch(1 0 0);
  --secondary: oklch(0.95 0.04 254);
  --secondary-foreground: oklch(0.38 0.22 254);
  --muted: oklch(0.96 0.006 250);
  --muted-foreground: oklch(0.52 0.02 250);
  --accent: oklch(0.95 0.04 254);
  --accent-foreground: oklch(0.38 0.22 254);
  --destructive: oklch(0.55 0.22 25);
  --border: oklch(0.91 0.01 250);
  --input: oklch(0.94 0.008 250);
  --ring: oklch(0.52 0.22 254);
  --chart-1: oklch(0.52 0.22 254);
  --chart-2: oklch(0.58 0.16 152);
  --chart-3: oklch(0.76 0.14 75);
  --chart-4: oklch(0.55 0.22 25);
  --chart-5: oklch(0.65 0.15 290);
  --radius: 0.875rem;
  --sidebar: oklch(1 0 0);
  --sidebar-foreground: oklch(0.18 0.04 250);
  --sidebar-primary: oklch(0.52 0.22 254);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent: oklch(0.95 0.04 254);
  --sidebar-accent-foreground: oklch(0.38 0.22 254);
  --sidebar-border: oklch(0.91 0.01 250);
  --sidebar-ring: oklch(0.52 0.22 254);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.205 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.205 0 0);
  --popover-foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  --primary-foreground: oklch(0.205 0 0);
  --secondary: oklch(0.269 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.708 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
  --border: oklch(1 0 0 / 10%);
  --input: oklch(1 0 0 / 15%);
  --ring: oklch(0.556 0 0);
  --chart-1: oklch(0.87 0 0);
  --chart-2: oklch(0.556 0 0);
  --chart-3: oklch(0.439 0 0);
  --chart-4: oklch(0.371 0 0);
  --chart-5: oklch(0.269 0 0);
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

---

## `app/layout.tsx`

```tsx
import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Pulse — No Queue For Your Cure',
  description: 'AI-powered healthcare navigation. Find hospitals, manage prescriptions, and track your health trends.',
  generator: 'v0.app',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
```

---

## `app/page.tsx`

```tsx
"use client"

import { useState } from "react"
import { ShieldAlert } from "lucide-react"
import { LandingScreen } from "@/components/pulse/LandingScreen"
import { HomeScreen } from "@/components/pulse/HomeScreen"
import { DiscoverScreen } from "@/components/pulse/DiscoverScreen"
import { RecordsScreen } from "@/components/pulse/RecordsScreen"
import { TrendsScreen } from "@/components/pulse/TrendsScreen"
import { HospitalCompareScreen } from "@/components/pulse/HospitalCompareScreen"
import { AIChatbox } from "@/components/pulse/AIChatbox"

type Screen = "landing" | "home" | "discover" | "records" | "trends" | "compare"

const SCREEN_LABELS: Record<Screen, string> = {
  landing: "Landing",
  home: "Home",
  discover: "Discover",
  records: "Records",
  trends: "Trends",
  compare: "Compare",
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>("landing")
  const [panicActive, setPanicActive] = useState(false)

  const handleTabChange = (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => {
    if (tab === "panic") { setPanicActive(true); return }
    if (tab === "discover") setScreen("home")
    else if (tab === "records") setScreen("records")
    else if (tab === "trends") setScreen("trends")
    else if (tab === "compare") setScreen("compare")
  }

  const isAppScreen = screen !== "landing"

  return (
    <div className="min-h-screen bg-[oklch(0.92_0.01_250)] flex flex-col items-center">
      {/* Screen switcher pill */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 bg-card/90 backdrop-blur-md border border-border rounded-full px-2 py-1.5 shadow-xl">
        {(Object.keys(SCREEN_LABELS) as Screen[]).map((s) => (
          <button
            key={s}
            onClick={() => setScreen(s)}
            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
              screen === s
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {SCREEN_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Mobile viewport wrapper */}
      <div className="w-full max-w-[390px] min-h-screen bg-background shadow-2xl relative overflow-hidden">
        <div className="h-12" />

        {screen === "landing" && (
          <LandingScreen
            onGetStarted={() => setScreen("home")}
            onDiscoverMap={() => setScreen("discover")}
          />
        )}
        {screen === "home" && (
          <HomeScreen
            onTabChange={handleTabChange}
            onServiceClick={() => setScreen("discover")}
            activeScreen={screen}
            onNavigate={setScreen}
            onPanic={() => setPanicActive(true)}
          />
        )}
        {screen === "discover" && (
          <DiscoverScreen
            onTabChange={handleTabChange}
            onHospitalClick={() => {}}
            activeScreen={screen}
            onNavigate={setScreen}
            onPanic={() => setPanicActive(true)}
          />
        )}
        {screen === "records" && (
          <RecordsScreen
            onTabChange={handleTabChange}
            activeScreen={screen}
            onNavigate={setScreen}
            onPanic={() => setPanicActive(true)}
          />
        )}
        {screen === "trends" && (
          <TrendsScreen
            onTabChange={handleTabChange}
            activeScreen={screen}
            onNavigate={setScreen}
            onPanic={() => setPanicActive(true)}
          />
        )}
        {screen === "compare" && (
          <HospitalCompareScreen
            onTabChange={handleTabChange}
            activeScreen={screen}
            onNavigate={setScreen}
            onPanic={() => setPanicActive(true)}
          />
        )}

        {/* PANIC ATTACK modal */}
        {panicActive && (
          <div className="absolute inset-0 z-[300] flex flex-col items-center justify-center bg-destructive/95 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-6 px-8 text-center">
              <div className="size-24 rounded-full bg-white/20 ring-8 ring-white/30 flex items-center justify-center">
                <ShieldAlert className="size-12 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight">PANIC ATTACK</h2>
                <p className="text-white/80 text-sm mt-2 leading-relaxed">
                  Contacting nearest hospital and sharing your live location...
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full">
                <div className="bg-white/10 rounded-2xl px-5 py-3 border border-white/20">
                  <p className="text-xs text-white/70 font-medium">Nearest Emergency</p>
                  <p className="text-base font-bold text-white mt-0.5">CGHS Inderpuri — 2.1 km</p>
                  <p className="text-xs text-white/60 mt-0.5">011-25836573 · Open 24 Hours</p>
                </div>
                <a
                  href="tel:108"
                  className="flex items-center justify-center gap-2 bg-white text-destructive font-black text-base py-4 rounded-2xl shadow-lg"
                >
                  Call 108 — Ambulance
                </a>
                <button
                  onClick={() => setPanicActive(false)}
                  className="text-white/60 text-sm font-semibold underline underline-offset-2 mt-1"
                >
                  Cancel — I am safe
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Chatbox (app screens only) */}
        {isAppScreen && <AIChatbox />}
      </div>
    </div>
  )
}
```

---

## `components/pulse/PulseNav.tsx`

```tsx
"use client"

import { useState } from "react"
import {
  Bell, MapPin, Menu, X, Home, Search, FileText,
  TrendingUp, GitCompareArrows, Settings,
  HelpCircle, LogOut, User, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  { id: "settings", label: "Settings",   icon: Settings },
  { id: "help",     label: "Help & FAQ", icon: HelpCircle },
  { id: "logout",   label: "Sign Out",   icon: LogOut },
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
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-destructive flex items-center justify-center shadow-sm">
              <MapPin className="size-5 text-white fill-white" strokeWidth={0} />
            </div>
            <div>
              <p className="font-bold text-foreground text-base leading-none tracking-tight">pulse</p>
              <p className="text-[9px] font-semibold tracking-[0.12em] text-muted-foreground uppercase mt-0.5">
                No Queue For Your Cure
              </p>
            </div>
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
              {/* PANIC ATTACK Button */}
              <button
                onClick={onPanic}
                className="px-3 py-1.5 rounded-lg bg-destructive hover:bg-destructive/90 transition-colors font-bold text-xs text-white tracking-wide shadow-md shadow-destructive/20"
                aria-label="PANIC ATTACK emergency"
              >
                PANIC ATTACK
              </button>

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

      {/* Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[200] bg-foreground/30 backdrop-blur-[2px]"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-in drawer */}
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
                <span className={cn(
                  "size-8 rounded-lg flex items-center justify-center shrink-0",
                  activeScreen === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="size-4" />
                </span>
                {label}
              </span>
              {activeScreen === id && <ChevronRight className="size-3.5 text-primary" />}
            </button>
          ))}

          <div className="my-3 border-t border-border mx-3" />

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
              <span className={cn(
                "size-8 rounded-lg flex items-center justify-center shrink-0",
                id === "logout" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
              )}>
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
```

---

## `components/pulse/LandingScreen.tsx`

```tsx
"use client"

import { ArrowRight, Play, Sparkles, ShieldCheck, Brain, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PulseNav } from "./PulseNav"

interface LandingScreenProps {
  onGetStarted?: () => void
  onDiscoverMap?: () => void
}

export function LandingScreen({ onGetStarted, onDiscoverMap }: LandingScreenProps) {
  const features = [
    { icon: Brain,       label: "AI Analysis",      desc: "Gemini-powered insights" },
    { icon: MapPin,      label: "Hospital Map",      desc: "Find care near you" },
    { icon: ShieldCheck, label: "Secure Records",    desc: "Your data, protected" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PulseNav variant="landing" onGetStarted={onGetStarted} onJoin={onGetStarted} />

      <main className="flex-1 flex flex-col">
        <div className="px-5 pt-10 pb-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="size-3 text-primary" />
            </div>
            <span className="text-xs font-semibold tracking-widest text-primary uppercase">
              Pulse Intelligent Healthcare
            </span>
          </div>

          <h1 className="text-[2.4rem] font-extrabold leading-[1.1] text-foreground mb-4 text-balance">
            Find the Right Care,{" "}
            <span className="text-primary">Faster and Smarter.</span>
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed mb-8 text-pretty">
            An AI-powered navigation assistant that simplifies complex medical files, tracks your
            core trends, and recommends highly suited hospitals in plain English.
          </p>

          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground font-semibold text-base h-14 rounded-2xl shadow-md shadow-primary/20"
              onClick={onGetStarted}
            >
              Start Analyzing Free
              <ArrowRight className="size-5" data-icon="inline-end" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full font-semibold text-base h-14 rounded-2xl border-2"
              onClick={onDiscoverMap}
            >
              <Play className="size-4 fill-primary text-primary" data-icon="inline-start" />
              Discover Hospitals Map
            </Button>
          </div>
        </div>

        <div className="px-5 pb-6">
          <div className="bg-card rounded-3xl border border-border shadow-sm p-5">
            <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase mb-4">
              What Pulse does for you
            </p>
            <div className="flex flex-col gap-3">
              {features.map((f) => {
                const Icon = f.icon
                return (
                  <div key={f.label} className="flex items-center gap-4">
                    <div className="size-11 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-5 pb-8 flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ShieldCheck className="size-4 text-[var(--pulse-green)]" />
            <span className="text-xs font-medium">HIPAA Safe</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Sparkles className="size-4 text-primary" />
            <span className="text-xs font-medium">Gemini AI</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="size-4 text-destructive" />
            <span className="text-xs font-medium">Live Data</span>
          </div>
        </div>
      </main>
    </div>
  )
}
```

---

## `components/pulse/HomeScreen.tsx`

```tsx
"use client"

import { useState } from "react"
import {
  Stethoscope, Syringe, FlaskConical, Bone, Heart, Brain,
  Eye, Baby, Search, HelpCircle, MapPin, ChevronRight, AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PulseNav } from "./PulseNav"
import { cn } from "@/lib/utils"

interface HomeScreenProps {
  onTabChange?: (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => void
  onServiceClick?: (service: string) => void
  activeScreen?: string
  onNavigate?: (screen: string) => void
  onPanic?: () => void
}

const services = [
  { id: "general",      label: "General",     icon: Stethoscope,  color: "text-primary bg-secondary" },
  { id: "vaccination",  label: "Vaccination", icon: Syringe,      color: "text-[var(--pulse-green)] bg-[color:oklch(0.95_0.05_152)]" },
  { id: "blood-test",   label: "Blood Test",  icon: FlaskConical, color: "text-destructive bg-[var(--pulse-red-light)]" },
  { id: "dental",       label: "Dental",      icon: Bone,         color: "text-[var(--pulse-amber)] bg-[color:oklch(0.97_0.04_75)]" },
  { id: "cardiology",   label: "Cardiology",  icon: Heart,        color: "text-destructive bg-[var(--pulse-red-light)]" },
  { id: "neurology",    label: "Neurology",   icon: Brain,        color: "text-[color:oklch(0.55_0.18_290)] bg-[color:oklch(0.96_0.04_290)]" },
  { id: "eye-care",     label: "Eye Care",    icon: Eye,          color: "text-primary bg-secondary" },
  { id: "pediatrics",   label: "Pediatrics",  icon: Baby,         color: "text-[var(--pulse-amber)] bg-[color:oklch(0.97_0.04_75)]" },
]

export function HomeScreen({ onTabChange, onServiceClick, activeScreen, onNavigate, onPanic }: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PulseNav variant="app" notificationCount={2} activeScreen={activeScreen} onNavigate={onNavigate} onPanic={onPanic} />

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Alert Banner */}
        <div className="mx-4 mt-3 mb-1 bg-[var(--pulse-red-light)] rounded-2xl p-3 flex items-start gap-2.5 border border-destructive/20">
          <AlertTriangle className="size-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive leading-relaxed">
            Location access is required for the Panic Button feature to work accurately.
          </p>
        </div>

        {/* Greeting */}
        <div className="px-5 pt-5 pb-2">
          <h2 className="text-2xl font-bold text-foreground">Hi, Daksh Saini</h2>
          <div className="flex items-center gap-1.5 mt-1.5">
            <MapPin className="size-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              Showing care services in <strong className="text-foreground">Delhi, India</strong>
            </span>
            <button className="text-xs font-medium text-primary border border-primary/30 rounded-full px-2 py-0.5 ml-1">
              Change
            </button>
          </div>

          <div className="flex gap-2.5 mt-4">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-border bg-card hover:border-primary/40 transition-colors">
              <HelpCircle className="size-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Need Help?</span>
            </button>
            <button
              onClick={() => onTabChange?.("discover")}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary border-2 border-primary/30 hover:bg-secondary/80 transition-colors"
            >
              <span className="size-4 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="size-2 bg-primary rounded-sm" />
              </span>
              <span className="text-sm font-semibold text-primary">Find Hospitals</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-3">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2.5 bg-card border border-border rounded-2xl px-4 h-12 shadow-sm">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Search services, hospitals, or conditions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <Button
              className="h-12 px-5 bg-primary text-primary-foreground font-semibold rounded-2xl shadow-sm"
              onClick={() => onTabChange?.("discover")}
            >
              Search
            </Button>
          </div>
        </div>

        {/* Browse Services */}
        <div className="px-4 pt-2 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-foreground">Browse Services</h3>
            <button className="flex items-center gap-1 text-xs font-semibold text-primary">
              View all <ChevronRight className="size-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <button
                  key={service.id}
                  onClick={() => onServiceClick?.(service.id)}
                  className="flex flex-col items-center gap-2.5 bg-card rounded-2xl p-3.5 border border-border hover:border-primary/30 hover:shadow-sm transition-all active:scale-95"
                >
                  <div className={cn("size-12 rounded-xl flex items-center justify-center", service.color)}>
                    <Icon className="size-5" />
                  </div>
                  <span className="text-xs font-semibold text-foreground text-center leading-tight">
                    {service.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Health Summary */}
        <div className="px-4 pb-4">
          <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Your Health Summary
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Scans",     value: "4",  sub: "prescriptions" },
                { label: "Hospitals", value: "12", sub: "saved" },
                { label: "Trends",    value: "3",  sub: "tracked" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col items-center bg-muted rounded-xl p-3">
                  <span className="text-2xl font-extrabold text-primary">{stat.value}</span>
                  <span className="text-[10px] font-semibold text-foreground leading-none mt-0.5">{stat.label}</span>
                  <span className="text-[10px] text-muted-foreground">{stat.sub}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

---

## `components/pulse/DiscoverScreen.tsx`

```tsx
"use client"

import { useState } from "react"
import {
  Search, MapPin, ChevronDown, Star, Heart, Bookmark,
  ExternalLink, Phone, Sparkles, X, CheckSquare, Map
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { PulseNav } from "./PulseNav"
import { cn } from "@/lib/utils"

interface DiscoverScreenProps {
  onTabChange?: (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => void
  onHospitalClick?: (id: string) => void
  showMap?: boolean
  onToggleMap?: () => void
  activeScreen?: string
  onNavigate?: (screen: string) => void
  onPanic?: () => void
}

const hospitals = [
  {
    id: "dispensary-pusa",
    name: "Dispensary Pusa",
    area: "Delhi Area",
    phone: "011-26183201",
    rating: 4.3,
    score: 91,
    isOpen: true,
    openText: "OPEN: Contact Facility to Confirm",
    matchReason: "Recommended because this clinic provides expert General Medicine services, is located highly close to you (1.6 km away), maintains excellent patient reviews (4.3 stars), and works general OPD hours.",
    distance: "1.6 km",
  },
  {
    id: "cghs-inderpuri",
    name: "CGHS Dispensary Inderpuri",
    area: "Delhi Area",
    phone: "011-25836573",
    rating: 4.7,
    score: 93,
    isOpen: true,
    openText: "OPEN: Open 24 Hours",
    matchReason: "CGHS-affiliated dispensary providing comprehensive primary care with high patient satisfaction.",
    distance: "2.1 km",
  },
  {
    id: "grover-nursing",
    name: "Doctor Grover's Nursing Home",
    area: "Rajouri Garden",
    phone: "011-25178432",
    rating: 4.5,
    score: 95,
    isOpen: true,
    openText: "OPEN: Open 24 Hours",
    matchReason: "Full-service nursing home with a wide range of specialties and emergency care available round the clock.",
    distance: "3.2 km",
  },
]

export function DiscoverScreen({ onTabChange, onHospitalClick, showMap = false, onToggleMap, activeScreen, onNavigate, onPanic }: DiscoverScreenProps) {
  const [radius, setRadius] = useState([15])
  const [hasER, setHasER] = useState(false)
  const [savedHospitals, setSavedHospitals] = useState<string[]>([])
  const [likedHospitals, setLikedHospitals] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState("General")

  const toggleSaved = (id: string) =>
    setSavedHospitals(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id])
  const toggleLiked = (id: string) =>
    setLikedHospitals(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PulseNav variant="app" activeScreen={activeScreen} onNavigate={onNavigate} onPanic={onPanic} />

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <Search className="size-4 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">Healthcare Navigation</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Discover hospitals matching your specialty, distance, and emergency needs.
          </p>
        </div>

        <div className="px-4 mb-3">
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
            <MapPin className="size-4 text-primary shrink-0" />
            <span className="text-sm text-muted-foreground flex-1">
              Active Location: <strong className="text-foreground">Delhi, India</strong>
            </span>
            <button className="text-xs font-semibold text-primary border border-primary/30 rounded-full px-3 py-1">
              Change
            </button>
          </div>
        </div>

        {/* Search Filters Card */}
        <div className="mx-4 mb-4 bg-card rounded-3xl border border-border shadow-sm p-5">
          <div className="mb-4">
            <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
              Hospital Name / Keywords
            </label>
            <div className="flex items-center gap-2.5 bg-muted border border-input rounded-xl px-3 h-11">
              <Search className="size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search hospital or specialty name..."
                className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
              Clinical Specialty
            </label>
            <div className="flex items-center justify-between bg-muted border border-input rounded-xl px-4 h-11 cursor-pointer">
              <span className="text-sm text-foreground">All Specialties</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Max Radius
              </label>
              <Badge variant="secondary" className="font-bold text-primary">{radius[0]} km</Badge>
            </div>
            <Slider value={radius} onValueChange={setRadius} min={1} max={50} step={1} className="w-full" />
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
              Sort By
            </label>
            <div className="flex items-center justify-between bg-muted border border-input rounded-xl px-4 h-11 cursor-pointer">
              <span className="text-sm text-foreground">Nearest First</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex gap-2.5">
            <button
              onClick={() => setHasER(!hasER)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors",
                hasER ? "border-primary bg-secondary text-primary" : "border-border bg-transparent text-muted-foreground"
              )}
            >
              <CheckSquare className="size-4" />
              24/7 ER Room
            </button>
            <Button className="flex-1 h-10 bg-primary text-primary-foreground font-semibold rounded-xl">
              <Search className="size-4" data-icon="inline-start" />
              Search
            </Button>
          </div>
        </div>

        {activeFilter && (
          <div className="mx-4 mb-3 flex items-center justify-between bg-secondary rounded-2xl px-4 py-2.5 border border-primary/20">
            <div className="flex items-center gap-2">
              <Search className="size-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">
                Active Filter: <span className="text-primary">{activeFilter}</span>
              </span>
            </div>
            <button onClick={() => setActiveFilter("")} className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1">
              <X className="size-3.5" /> Clear
            </button>
          </div>
        )}

        <div className="mx-4 mb-3">
          <button
            onClick={onToggleMap}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-semibold transition-colors",
              showMap ? "border-primary bg-secondary text-primary" : "border-border text-muted-foreground hover:border-primary/40"
            )}
          >
            <Map className="size-4" />
            {showMap ? "Hide Map" : "View on Map"}
          </button>
        </div>

        <div className="px-4 flex flex-col gap-3 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">{hospitals.length} Results Found</h3>
            <span className="text-xs text-muted-foreground">sorted by nearest</span>
          </div>

          {hospitals.map((hospital) => (
            <div key={hospital.id} className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-foreground text-base leading-tight">{hospital.name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{hospital.area}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs font-medium text-primary">{hospital.distance}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{hospital.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => toggleLiked(hospital.id)}
                      className={cn(
                        "size-8 rounded-full border flex items-center justify-center transition-colors",
                        likedHospitals.includes(hospital.id) ? "bg-[var(--pulse-red-light)] border-destructive/30" : "border-border bg-card"
                      )}
                    >
                      <Heart className={cn("size-4", likedHospitals.includes(hospital.id) ? "text-destructive fill-destructive" : "text-muted-foreground")} />
                    </button>
                    <button
                      onClick={() => toggleSaved(hospital.id)}
                      className={cn(
                        "size-8 rounded-full border flex items-center justify-center transition-colors",
                        savedHospitals.includes(hospital.id) ? "bg-secondary border-primary/30" : "border-border bg-card"
                      )}
                    >
                      <Bookmark className={cn("size-4", savedHospitals.includes(hospital.id) ? "text-primary fill-primary" : "text-muted-foreground")} />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="size-3.5 text-[var(--pulse-amber)] fill-[var(--pulse-amber)]" />
                    <span className="text-sm font-bold text-foreground">{hospital.rating}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold border-[var(--pulse-amber)]/40 text-[var(--pulse-amber)] bg-[color:oklch(0.97_0.04_75)]">
                    Score: {hospital.score}%
                  </Badge>
                </div>

                <div className="mt-2.5 bg-secondary rounded-2xl p-3 border border-primary/10">
                  <div className="flex items-start gap-2">
                    <Sparkles className="size-3.5 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground leading-relaxed">{hospital.matchReason}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/40">
                <div className="flex items-center gap-1.5">
                  <div className={cn("size-2 rounded-full", hospital.isOpen ? "bg-[var(--pulse-green)]" : "bg-destructive")} />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {hospital.openText}
                  </span>
                </div>
                <button onClick={() => onHospitalClick?.(hospital.id)} className="flex items-center gap-1 text-xs font-bold text-primary">
                  Full Departments <ExternalLink className="size-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
```

---

## `components/pulse/RecordsScreen.tsx`

```tsx
"use client"

import { useState } from "react"
import {
  FileText, Upload, Trash2, CheckCircle2,
  Zap, ShieldCheck, ScanLine, ClipboardList
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PulseNav } from "./PulseNav"
import { cn } from "@/lib/utils"

interface RecordsScreenProps {
  onTabChange?: (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => void
  activeScreen?: string
  onNavigate?: (screen: string) => void
  onPanic?: () => void
}

const scanHistory = [
  { id: "bf29d368",   name: "Scan #bf29d368",           status: "OCR_COMPLETED", date: "11/6/2026", label: "completed" },
  { id: "metformin",  name: "Metformin Hydrochlor...",   status: "ANALYZED",      date: "11/6/2026", label: "analyzed" },
  { id: "47275162",   name: "Scan #47275162",            status: "OCR_COMPLETED", date: "11/6/2026", label: "completed" },
  { id: "metformin2", name: "Metformin Hydrochlor...",   status: "ANALYZED",      date: "11/6/2026", label: "analyzed" },
  { id: "cf90b214",   name: "Scan #cf90b214",            status: "OCR_COMPLETED", date: "11/6/2026", label: "completed" },
]

const statusConfig: Record<string, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  analyzed:  { color: "text-[var(--pulse-green)]", bg: "bg-[color:oklch(0.95_0.05_152)]", icon: CheckCircle2 },
  completed: { color: "text-primary",              bg: "bg-secondary",                    icon: ScanLine },
}

export function RecordsScreen({ onTabChange, activeScreen, onNavigate, onPanic }: RecordsScreenProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [ocrText, setOcrText] = useState("")

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PulseNav variant="app" activeScreen={activeScreen} onNavigate={onNavigate} onPanic={onPanic} />

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="size-4 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">Prescription Scanner</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Scan handwritten or digital clinic prescriptions. Verify extracted keywords, and let Gemini clarify dosages in plain English.
          </p>
        </div>

        {/* Upload Card */}
        <div className="mx-4 mb-4">
          <div className="bg-card rounded-3xl border-2 border-dashed border-primary/30 p-6 text-center">
            <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-4 flex items-center gap-2">
              <Upload className="size-3.5 text-primary" />
              Upload Prescription File
            </label>
            <div
              className={cn(
                "rounded-2xl p-8 transition-colors cursor-pointer flex flex-col items-center gap-3",
                isDragging ? "bg-secondary" : "bg-muted hover:bg-secondary/60"
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false) }}
            >
              <div className="size-14 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
                <Upload className="size-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Select or drag prescription file(s)</p>
                <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, PDF up to 5MB</p>
              </div>
              <Button size="sm" className="bg-primary text-primary-foreground font-semibold rounded-xl px-6">
                Browse Files
              </Button>
            </div>
          </div>
        </div>

        {/* Scan History */}
        <div className="mx-4 mb-4">
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-border">
              <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                Scanned Document History
              </h3>
            </div>
            <div className="divide-y divide-border">
              {scanHistory.map((scan) => {
                const cfg = statusConfig[scan.label]
                const Icon = cfg.icon
                return (
                  <div key={scan.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors">
                    <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
                      <Icon className={cn("size-4", cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{scan.name}</p>
                      <span className={cn("text-[10px] font-bold uppercase tracking-wide", cfg.color)}>
                        {scan.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{scan.date}</span>
                      <button className="size-7 rounded-lg hover:bg-[var(--pulse-red-light)] transition-colors flex items-center justify-center">
                        <Trash2 className="size-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Drug Interaction Check */}
        <div className="mx-4 mb-4">
          <div className="bg-card rounded-3xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="size-4 text-primary" />
              </div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Global Drug Interaction Check
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Cross-reference all active medications across all your uploaded prescriptions to detect dangerous overlapping side effects or interactions.
            </p>
            <Button className="w-full h-12 bg-foreground text-background font-bold rounded-2xl text-sm">
              <ShieldCheck className="size-4" data-icon="inline-start" />
              Run Interaction Scan
            </Button>
          </div>
        </div>

        {/* Dual-Pane Verification */}
        <div className="mx-4 mb-4">
          <div className="bg-card rounded-3xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-foreground">Dual-Pane Verification</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Review raw extracted scanned text and fill/correct medicine details.
                </p>
              </div>
              <Badge className="bg-[var(--pulse-amber)] text-white font-bold text-[10px] shrink-0 rounded-xl px-2.5 py-1.5">
                VERIFY OCR DRAFT
              </Badge>
            </div>
            <div className="mt-4">
              <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
                Raw Scanned OCR Output
              </label>
              <div className="bg-muted rounded-2xl border border-input p-4 min-h-[80px]">
                <textarea
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  placeholder="OCR text output goes here..."
                  className="w-full bg-transparent text-xs text-foreground font-mono outline-none resize-none placeholder:text-muted-foreground leading-relaxed min-h-[60px]"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
```

---

## `components/pulse/TrendsScreen.tsx`

```tsx
"use client"

import { useState } from "react"
import { TrendingUp, Plus, ChevronRight, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PulseNav } from "./PulseNav"
import { cn } from "@/lib/utils"

interface TrendsScreenProps {
  onTabChange?: (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => void
  activeScreen?: string
  onNavigate?: (screen: string) => void
  onPanic?: () => void
}

const biomarkers = [
  { id: "hemoglobin",  name: "Hemoglobin",   unit: "g/dL",    desc: "Carries oxygen throughout red blood cells.",           value: 13.8, normalMin: 12,  normalMax: 17  },
  { id: "hba1c",       name: "HbA1c",        unit: "%",       desc: "Averages your blood glucose level over 3 months.",     value: 5.4,  normalMin: 4,   normalMax: 5.7 },
  { id: "tsh",         name: "TSH",          unit: "uIU/mL",  desc: "Indicates active metabolic and thyroid rates.",        value: 2.1,  normalMin: 0.4, normalMax: 4.0 },
  { id: "cholesterol", name: "Cholesterol",  unit: "mg/dL",   desc: "Measures cardiovascular plaque and fat profiles.",     value: 182,  normalMin: 0,   normalMax: 200 },
  { id: "vitamin-d",   name: "Vitamin D",    unit: "ng/mL",   desc: "Essential for bone health and immune function.",       value: 28,   normalMin: 20,  normalMax: 50  },
]

const trendData = [
  { month: "Aug", value: 12.4 },
  { month: "Sep", value: 12.9 },
  { month: "Oct", value: 13.1 },
  { month: "Nov", value: 13.5 },
  { month: "Dec", value: 13.6 },
  { month: "Jan", value: 13.8 },
]

function MiniChart({ data }: { data: { month: string; value: number }[] }) {
  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const height = 60
  const width = 100
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((d.value - min) / range) * (height - 12) - 6
    return `${x},${y}`
  }).join(" ")

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="oklch(0.52 0.22 254)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * width
        const y = height - ((d.value - min) / range) * (height - 12) - 6
        return i === data.length - 1 ? <circle key={i} cx={x} cy={y} r="3.5" fill="oklch(0.52 0.22 254)" /> : null
      })}
    </svg>
  )
}

function getStatus(value: number, min: number, max: number) {
  if (value < min) return { label: "Low",    color: "text-[var(--pulse-amber)]",  bg: "bg-[color:oklch(0.97_0.04_75)]"    }
  if (value > max) return { label: "High",   color: "text-destructive",           bg: "bg-[var(--pulse-red-light)]"        }
  return             { label: "Normal", color: "text-[var(--pulse-green)]",  bg: "bg-[color:oklch(0.95_0.05_152)]"   }
}

export function TrendsScreen({ onTabChange, activeScreen, onNavigate, onPanic }: TrendsScreenProps) {
  const [selectedMarker, setSelectedMarker] = useState("hemoglobin")
  const selected = biomarkers.find(b => b.id === selectedMarker) || biomarkers[0]
  const status = getStatus(selected.value, selected.normalMin, selected.normalMax)
  const rangePercent = selected.normalMax > selected.normalMin
    ? Math.min(100, Math.max(0, ((selected.value - selected.normalMin) / (selected.normalMax - selected.normalMin)) * 100))
    : 50

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PulseNav variant="app" activeScreen={activeScreen} onNavigate={onNavigate} onPanic={onPanic} />

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="size-4 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">Health Trends Tracker</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Track and monitor important clinical indexes over time.
          </p>
        </div>

        {/* Chart Card */}
        <div className="mx-4 mb-4">
          <div className="bg-card rounded-3xl border border-border shadow-sm p-5">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-lg font-extrabold text-foreground">{selected.name}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{selected.desc}</p>
              </div>
              <Badge className={cn("font-bold text-sm rounded-xl px-3 py-1", status.bg, status.color)}>
                {selected.value} {selected.unit}
              </Badge>
            </div>

            <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2 mb-3", status.bg, status.color)}>
              <div className="size-1.5 rounded-full bg-current" />
              {status.label}
            </div>

            <div className="bg-muted rounded-2xl p-3 mb-3">
              <MiniChart data={trendData} />
              <div className="flex justify-between mt-1">
                {trendData.map((d) => (
                  <span key={d.month} className="text-[9px] text-muted-foreground font-medium">{d.month}</span>
                ))}
              </div>
            </div>

            <div className="mt-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-muted-foreground">Reference Range</span>
                <span className="text-xs text-muted-foreground">{selected.normalMin}–{selected.normalMax} {selected.unit}</span>
              </div>
              <Progress value={rangePercent} className="h-2 rounded-full" />
              <div className="flex justify-between mt-1">
                <span className="text-[10px] text-muted-foreground">Low</span>
                <span className="text-[10px] font-bold text-primary">Current: {selected.value}</span>
                <span className="text-[10px] text-muted-foreground">High</span>
              </div>
            </div>
          </div>
        </div>

        {/* Biomarker List */}
        <div className="mx-4 mb-4">
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Select Laboratory Marker</h3>
              <button className="size-7 rounded-lg bg-primary flex items-center justify-center">
                <Plus className="size-4 text-white" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {biomarkers.map((marker) => {
                const mStatus = getStatus(marker.value, marker.normalMin, marker.normalMax)
                return (
                  <button
                    key={marker.id}
                    onClick={() => setSelectedMarker(marker.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-4 transition-colors text-left",
                      selectedMarker === marker.id ? "bg-secondary border-l-4 border-l-primary" : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-bold text-sm", selectedMarker === marker.id ? "text-primary" : "text-foreground")}>
                          {marker.name}
                        </span>
                        <Badge className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", mStatus.bg, mStatus.color)}>
                          {mStatus.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{marker.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded-full",
                        selectedMarker === marker.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                      )}>
                        {marker.unit}
                      </span>
                      <ChevronRight className="size-3.5 text-muted-foreground" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mx-4 mb-4">
          <div className="bg-secondary rounded-2xl border border-primary/20 p-4 flex items-start gap-3">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reference parameters are based on standard clinical guidelines. Always consult your doctor for a personalized interpretation of your results.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
```

---

## `components/pulse/HospitalCompareScreen.tsx`

```tsx
"use client"

import { useState } from "react"
import {
  GitCompareArrows, Star, MapPin, Clock,
  CheckCircle2, XCircle, Sparkles, Plus
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PulseNav } from "./PulseNav"
import { cn } from "@/lib/utils"

interface HospitalCompareScreenProps {
  onTabChange?: (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => void
  activeScreen?: string
  onNavigate?: (screen: string) => void
  onPanic?: () => void
}

const hospitals = [
  {
    id: "dispensary-pusa",   name: "Dispensary Pusa",       area: "Delhi Area",     phone: "011-26183201", rating: 4.3, score: 91, distance: "1.6 km", isOpen: true, er: false, beds: 45,  specialists: 8,  waitTime: "~20 min",
    features: { "General Medicine": true,  "Cardiology": false, "Neurology": false, "Pediatrics": true,  "24/7 Emergency": false, "Blood Lab": true,  "Pharmacy": true,  "CGHS Empanelled": true  },
  },
  {
    id: "cghs-inderpuri",    name: "CGHS Inderpuri",         area: "Delhi Area",     phone: "011-25836573", rating: 4.7, score: 93, distance: "2.1 km", isOpen: true, er: true,  beds: 110, specialists: 22, waitTime: "~10 min",
    features: { "General Medicine": true,  "Cardiology": true,  "Neurology": false, "Pediatrics": true,  "24/7 Emergency": true,  "Blood Lab": true,  "Pharmacy": true,  "CGHS Empanelled": true  },
  },
  {
    id: "grover-nursing",    name: "Dr Grover's Home",       area: "Rajouri Garden", phone: "011-25178432", rating: 4.5, score: 95, distance: "3.2 km", isOpen: true, er: true,  beds: 78,  specialists: 15, waitTime: "~5 min",
    features: { "General Medicine": true,  "Cardiology": true,  "Neurology": true,  "Pediatrics": false, "24/7 Emergency": true,  "Blood Lab": true,  "Pharmacy": false, "CGHS Empanelled": false },
  },
]

const featureKeys = ["General Medicine","Cardiology","Neurology","Pediatrics","24/7 Emergency","Blood Lab","Pharmacy","CGHS Empanelled"]

export function HospitalCompareScreen({ onTabChange, activeScreen, onNavigate, onPanic }: HospitalCompareScreenProps) {
  const [selected, setSelected] = useState<string[]>(["dispensary-pusa", "cghs-inderpuri"])

  const toggleHospital = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(h => h !== id) : prev.length < 3 ? [...prev, id] : prev)

  const compareHospitals = hospitals.filter(h => selected.includes(h.id))

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PulseNav variant="app" activeScreen={activeScreen} onNavigate={onNavigate} onPanic={onPanic} />

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <GitCompareArrows className="size-4 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">Hospital Compare</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select up to 3 hospitals to compare features, ratings, and availability side-by-side.
          </p>
        </div>

        {/* Hospital Selector */}
        <div className="px-4 mb-4">
          <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2">
            Select Hospitals ({selected.length}/3)
          </p>
          <div className="flex flex-col gap-2">
            {hospitals.map((h) => {
              const isSelected = selected.includes(h.id)
              return (
                <button
                  key={h.id}
                  onClick={() => toggleHospital(h.id)}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left",
                    isSelected ? "border-primary bg-secondary" : "border-border bg-card hover:border-primary/30"
                  )}
                >
                  <div className={cn(
                    "size-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-colors",
                    isSelected ? "bg-primary border-primary" : "bg-muted border-border"
                  )}>
                    {isSelected ? <CheckCircle2 className="size-4 text-white" /> : <Plus className="size-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{h.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{h.distance}</span>
                      <span className="text-muted-foreground">·</span>
                      <Star className="size-3 text-[var(--pulse-amber)] fill-[var(--pulse-amber)]" />
                      <span className="text-xs font-semibold text-foreground">{h.rating}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <Badge variant="secondary" className="font-bold text-primary text-[10px] shrink-0">
                      Score {h.score}%
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Comparison Table */}
        {compareHospitals.length >= 2 && (
          <div className="mx-4 mb-4">
            <div className="bg-secondary rounded-2xl border border-primary/20 px-4 py-3 mb-3 flex items-start gap-2.5">
              <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-relaxed">
                <strong>AI Recommendation:</strong>{" "}
                {compareHospitals[0].score > (compareHospitals[1]?.score ?? 0) ? compareHospitals[0].name : compareHospitals[1].name}{" "}
                scores highest overall. Consider it if emergency access and specialist coverage are priorities.
              </p>
            </div>

            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className={cn("grid border-b border-border", compareHospitals.length === 2 ? "grid-cols-3" : "grid-cols-4")}>
                <div className="px-3 py-3 bg-muted/50" />
                {compareHospitals.map((h) => (
                  <div key={h.id} className="px-3 py-3 border-l border-border">
                    <p className="text-[11px] font-bold text-foreground leading-tight">{h.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className={cn("size-1.5 rounded-full", h.isOpen ? "bg-[var(--pulse-green)]" : "bg-destructive")} />
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase">{h.isOpen ? "Open" : "Closed"}</span>
                    </div>
                  </div>
                ))}
              </div>

              {[
                { label: "Rating",      render: (h: typeof compareHospitals[0]) => <div className="flex items-center gap-1"><Star className="size-3 text-[var(--pulse-amber)] fill-[var(--pulse-amber)]" /><span className="text-sm font-bold text-foreground">{h.rating}</span></div> },
                { label: "Match Score", render: (h: typeof compareHospitals[0]) => <Badge variant="outline" className="text-[10px] font-bold border-[var(--pulse-amber)]/40 text-[var(--pulse-amber)]">{h.score}%</Badge> },
                { label: "Distance",    render: (h: typeof compareHospitals[0]) => <span className="text-sm font-semibold text-primary">{h.distance}</span> },
                { label: "Wait Time",   render: (h: typeof compareHospitals[0]) => <div className="flex items-center gap-1"><Clock className="size-3 text-muted-foreground" /><span className="text-xs font-semibold text-foreground">{h.waitTime}</span></div> },
                { label: "Beds",        render: (h: typeof compareHospitals[0]) => <span className="text-sm font-semibold text-foreground">{h.beds}</span> },
                { label: "Specialists", render: (h: typeof compareHospitals[0]) => <span className="text-sm font-semibold text-foreground">{h.specialists}</span> },
              ].map((row, i) => (
                <div key={row.label} className={cn("grid border-b border-border last:border-b-0", compareHospitals.length === 2 ? "grid-cols-3" : "grid-cols-4")}>
                  <div className={cn("px-3 py-3 bg-muted/30 flex items-center", i % 2 === 1 && "bg-muted/50")}>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">{row.label}</span>
                  </div>
                  {compareHospitals.map((h) => (
                    <div key={h.id} className={cn("px-3 py-3 border-l border-border flex items-center", i % 2 === 1 && "bg-muted/20")}>
                      {row.render(h)}
                    </div>
                  ))}
                </div>
              ))}

              <div className="px-4 py-2.5 bg-muted/50 border-t border-border">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Available Services</p>
              </div>

              {featureKeys.map((feature, i) => (
                <div key={feature} className={cn("grid border-b border-border last:border-b-0", compareHospitals.length === 2 ? "grid-cols-3" : "grid-cols-4")}>
                  <div className={cn("px-3 py-3 bg-muted/30 flex items-center", i % 2 === 1 && "bg-muted/50")}>
                    <span className="text-[10px] font-semibold text-muted-foreground leading-tight">{feature}</span>
                  </div>
                  {compareHospitals.map((h) => {
                    const has = h.features[feature as keyof typeof h.features]
                    return (
                      <div key={h.id} className={cn("px-3 py-3 border-l border-border flex items-center justify-center", i % 2 === 1 && "bg-muted/20")}>
                        {has ? <CheckCircle2 className="size-4 text-[var(--pulse-green)]" /> : <XCircle className="size-4 text-muted-foreground/40" />}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}

        {compareHospitals.length < 2 && (
          <div className="mx-4 mb-4 bg-card rounded-3xl border-2 border-dashed border-border p-10 flex flex-col items-center gap-3">
            <GitCompareArrows className="size-10 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground text-center">
              Select at least 2 hospitals above to start comparing.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
```

---

## `components/pulse/AIChatbox.tsx`

```tsx
"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Sparkles, Bot } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  text: string
}

const INITIAL_MESSAGES: Message[] = [
  { id: "welcome", role: "assistant", text: "Hi! I'm Pulse AI. Ask me anything about nearby hospitals, your prescriptions, or health conditions." },
]

const QUICK_PROMPTS = ["Find hospitals near me", "Check drug interactions", "What is HbA1c?"]

const MOCK_RESPONSES: Record<string, string> = {
  default:  "I can help you with hospital discovery, prescription queries, and health information. Could you clarify your question a bit more?",
  hospital: "Based on your location in Delhi, I found 3 highly rated hospitals nearby. Dispensary Pusa (1.6 km, 4.3★) and CGHS Inderpuri (2.1 km, 4.7★) are both open right now.",
  drug:     "To run a drug interaction check, please upload your prescriptions in the Records tab. I can then cross-reference all active medications for dangerous overlaps.",
  hba1c:    "HbA1c (glycated hemoglobin) measures your average blood glucose over the past 2–3 months. A normal range is 4–5.7%. Values above 6.5% may indicate diabetes.",
}

function getMockResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes("hospital") || lower.includes("near")) return MOCK_RESPONSES.hospital
  if (lower.includes("drug") || lower.includes("interaction") || lower.includes("prescription")) return MOCK_RESPONSES.drug
  if (lower.includes("hba1c") || lower.includes("hemoglobin") || lower.includes("a1c")) return MOCK_RESPONSES.hba1c
  return MOCK_RESPONSES.default
}

export function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    setMessages(prev => [...prev, { id: Date.now().toString(), role: "user", text: text.trim() }])
    setInput("")
    setIsTyping(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", text: getMockResponse(text) }])
      setIsTyping(false)
    }, 900)
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
                <div className={cn("px-3 py-2 rounded-2xl text-xs leading-relaxed", msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm")}>
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

          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
              {QUICK_PROMPTS.map((prompt) => (
                <button key={prompt} onClick={() => sendMessage(prompt)} className="text-[10px] font-semibold text-primary bg-secondary border border-primary/20 rounded-full px-2.5 py-1 hover:bg-primary/10 transition-colors">
                  {prompt}
                </button>
              ))}
            </div>
          )}

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
```

---

That is the complete, final, production-ready code for all 10 files in the Pulse redesign. The app is structured as a single `max-w-[390px]` mobile wrapper with 6 screens routed from `page.tsx`, a persistent `PulseNav` with hamburger drawer and PANIC ATTACK button in every app screen, a global PANIC ATTACK fullscreen modal, and a floating AI chatbox FAB — all styled with the Pulse design system using OKLch color tokens.