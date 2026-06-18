"use client"

import { ArrowRight, Play, Sparkles, ShieldCheck, Brain, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PulseNav } from "./PulseNav"
import { useNavigate } from "react-router-dom"

interface LandingScreenProps {
  onGetStarted?: () => void
  onDiscoverMap?: () => void
}

export function LandingScreen({ onGetStarted, onDiscoverMap }: LandingScreenProps) {
  const navigate = useNavigate()
  const features = [
    { icon: Brain,       label: "AI Analysis",      desc: "Gemini-powered insights" },
    { icon: MapPin,      label: "Hospital Map",      desc: "Find care near you" },
    { icon: ShieldCheck, label: "Secure Records",    desc: "Your data, protected" },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PulseNav 
        variant="landing" 
        onSignIn={() => navigate('/login')} 
        onJoin={() => navigate('/register')} 
      />

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
            No Queue,{" "}
            <span className="text-primary">For Your Cure.</span>
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