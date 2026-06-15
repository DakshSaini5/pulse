"use client"

import { useState } from "react"
import {
  Stethoscope, Syringe, FlaskConical, Bone, Heart, Brain,
  Eye, Baby, Search, HelpCircle, MapPin, ChevronRight, AlertTriangle, Phone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { PulseNav } from "./PulseNav"
import { cn } from "@/utils/utils"
import { useAuth } from "@/core/context/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { emergencyAPI } from "@/core/services/api"

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
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")

  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery({
    queryKey: ['emergencyContacts'],
    queryFn: emergencyAPI.getContacts,
    enabled: !!user,
  })

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

        {/* Emergency Contacts */}
        <div className="px-4 pb-4">
          <div className="bg-[var(--pulse-red-light)] rounded-2xl border border-destructive/20 p-4 shadow-sm">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wider mb-3">
              Emergency Contacts
            </p>
            {isLoadingContacts ? (
              <p className="text-sm text-destructive/70">Loading contacts...</p>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-destructive/70">No emergency contacts saved.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {contacts.map(contact => (
                  <div key={contact.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-destructive/10">
                    <div>
                      <p className="text-sm font-bold text-foreground">{contact.name}</p>
                      <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                    </div>
                    <a
                      href={`tel:${contact.phoneNumber}`}
                      className="size-10 rounded-full bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                      aria-label={`Call ${contact.name}`}
                    >
                      <Phone className="size-4 text-destructive" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}