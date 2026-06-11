"use client"

import {
  GitCompareArrows, Star, MapPin, Phone, Clock, CheckCircle2,
  XCircle, ChevronDown, Sparkles, Plus, AlertCircle, ArrowLeft
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PulseNav } from "./PulseNav"
import { cn } from "@/utils/utils"

interface HospitalCompareScreenProps {
  onTabChange?: (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => void
  activeScreen?: string
  onNavigate?: (screen: string) => void
  onPanic?: () => void
  
  hospitals: any[]
  loading: boolean
}

export function HospitalCompareScreen({ 
  onTabChange, 
  activeScreen, 
  onNavigate, 
  onPanic,
  hospitals,
  loading
}: HospitalCompareScreenProps) {
  
  // Aggregate all unique specialties across selected hospitals for feature rows
  const allSpecialties = new Set<string>();
  hospitals.forEach(h => {
    if (h.specialties) {
      h.specialties.forEach((s: any) => allSpecialties.add(s.specialty.name));
    }
  });
  const featureKeys = Array.from(allSpecialties);

  return (
    <div className="flex flex-col min-h-screen bg-background text-left">
      <PulseNav variant="app" activeScreen={activeScreen} onNavigate={onNavigate} onPanic={onPanic} />

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <button onClick={() => onNavigate?.('discover')} className="flex items-center gap-1 text-xs font-bold text-muted-foreground mb-3 hover:text-foreground transition-colors">
            <ArrowLeft className="size-3.5" />
            Back to Maps
          </button>
          <div className="flex items-center gap-2 mb-1">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <GitCompareArrows className="size-4 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">Hospital Compare</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Side-by-side comparison of features, ratings, and availability for your selected hospitals.
          </p>
        </div>

        {loading ? (
          <div className="mx-4 mb-4">
             <div className="h-64 flex items-center justify-center animate-pulse text-muted-foreground text-sm">
                <div className="size-8 rounded-full border-4 border-muted border-t-primary animate-spin mb-2" />
             </div>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="mx-4 mb-4 bg-card rounded-3xl border-2 border-dashed border-border p-10 flex flex-col items-center gap-3">
            <AlertCircle className="size-10 text-warning" />
            <h3 className="font-bold text-foreground">No Hospitals Selected</h3>
            <p className="text-xs text-muted-foreground text-center">
              Please select hospitals to compare from the Discovery Map screen first.
            </p>
            <button 
              onClick={() => onNavigate?.('discover')} 
              className="mt-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl"
            >
              Back to Maps
            </button>
          </div>
        ) : (
          <div className="mx-4 mb-4">
            {/* AI Summary Banner */}
            <div className="bg-secondary rounded-2xl border border-primary/20 px-4 py-3 mb-3 flex items-start gap-2.5">
              <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-relaxed">
                <strong>AI Recommendation:</strong>{" "}
                {hospitals.reduce((prev, current) => (prev.recommendationScore > current.recommendationScore) ? prev : current).name}{" "}
                scores highest overall based on your profile and search criteria.
              </p>
            </div>

            {/* Scrollable table container wrapper */}
            <div className="overflow-x-auto rounded-3xl border border-border shadow-sm">
              <div className="bg-card min-w-[max-content]">
                {/* Column headers */}
                <div className="grid border-b border-border" style={{ gridTemplateColumns: `100px repeat(${hospitals.length}, minmax(120px, 1fr))` }}>
                  <div className="px-3 py-3 bg-muted/50" />
                  {hospitals.map((h) => (
                    <div key={h.id} className="px-3 py-3 border-l border-border flex flex-col justify-between">
                      <p className="text-[11px] font-bold text-foreground leading-tight">{h.name}</p>
                      <button 
                        onClick={() => onNavigate?.(`hospitals/${h.id}`)}
                        className="mt-2 text-[10px] font-bold text-primary hover:underline self-start"
                      >
                        View Profile
                      </button>
                    </div>
                  ))}
                </div>

                {/* Stats rows */}
                {[
                  {
                    label: "Match Score",
                    render: (h: any) => (
                      <Badge variant="outline" className="text-[10px] font-bold border-[var(--pulse-amber)]/40 text-[var(--pulse-amber)] bg-[color:oklch(0.97_0.04_75)]">
                        {h.recommendationScore}%
                      </Badge>
                    ),
                  },
                  {
                    label: "Rating",
                    render: (h: any) => (
                      <div className="flex items-center gap-1">
                        <Star className="size-3 text-[var(--pulse-amber)] fill-[var(--pulse-amber)]" />
                        <span className="text-sm font-bold text-foreground">{h.rating?.toFixed(1)}</span>
                      </div>
                    ),
                  },
                  {
                    label: "24/7 ER",
                    render: (h: any) => (
                      h.emergencyAvailable ? (
                        <span className="text-[9px] bg-[var(--pulse-red-light)] border border-destructive/20 text-destructive px-2 py-0.5 rounded-full font-bold uppercase">
                          Yes - Active
                        </span>
                      ) : (
                        <span className="text-[9px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold uppercase">
                          No
                        </span>
                      )
                    ),
                  },
                  {
                    label: "Hours",
                    render: (h: any) => (
                      <div className="flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground shrink-0" />
                        <span className="text-[10px] font-semibold text-foreground truncate max-w-[80px]">{h.workingHours}</span>
                      </div>
                    ),
                  },
                  {
                    label: "Consult Cost",
                    render: (h: any) => {
                      const costs = h.specialties?.map((s: any) => s.averageCost) || [];
                      const minCost = costs.length > 0 ? Math.min(...costs) : 0;
                      const maxCost = costs.length > 0 ? Math.max(...costs) : 0;
                      return (
                        <span className="text-sm font-semibold text-foreground">${minCost}-${maxCost}</span>
                      )
                    },
                  },
                  {
                    label: "Distance",
                    render: (h: any) => (
                       <span className="text-xs font-semibold text-primary">{h.distance || 'N/A'}</span>
                    ),
                  },
                ].map((row, i) => (
                  <div
                    key={row.label}
                    className="grid border-b border-border last:border-b-0"
                    style={{ gridTemplateColumns: `100px repeat(${hospitals.length}, minmax(120px, 1fr))` }}
                  >
                    <div className={cn("px-3 py-3 bg-muted/30 flex items-center", i % 2 === 1 && "bg-muted/50")}>
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">{row.label}</span>
                    </div>
                    {hospitals.map((h) => (
                      <div key={h.id} className={cn("px-3 py-3 border-l border-border flex items-center", i % 2 === 1 && "bg-muted/20")}>
                        {row.render(h)}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Divider */}
                <div className="px-4 py-2.5 bg-muted/50 border-t border-b border-border">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    Available Departments
                  </p>
                </div>

                {/* Feature rows */}
                {featureKeys.length > 0 ? featureKeys.map((feature, i) => (
                  <div
                    key={feature}
                    className="grid border-b border-border last:border-b-0"
                    style={{ gridTemplateColumns: `100px repeat(${hospitals.length}, minmax(120px, 1fr))` }}
                  >
                    <div className={cn("px-3 py-3 bg-muted/30 flex items-center", i % 2 === 1 && "bg-muted/50")}>
                      <span className="text-[9px] font-semibold text-muted-foreground leading-tight">{feature}</span>
                    </div>
                    {hospitals.map((h) => {
                      const has = h.specialties?.some((s: any) => s.specialty.name === feature);
                      return (
                        <div key={h.id} className={cn("px-3 py-3 border-l border-border flex items-center justify-center", i % 2 === 1 && "bg-muted/20")}>
                          {has ? (
                            <CheckCircle2 className="size-4 text-[var(--pulse-green)]" />
                          ) : (
                            <XCircle className="size-4 text-muted-foreground/40" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                )) : (
                  <div className="p-4 text-center text-xs text-muted-foreground">No departments listed for selected hospitals.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

    </div>
  )
}
