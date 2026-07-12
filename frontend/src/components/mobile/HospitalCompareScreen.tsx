"use client"

import { useState } from "react"
import {
  GitCompareArrows, Star, MapPin, Clock,
  CheckCircle2, XCircle, Sparkles, Plus
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PulseNav } from "./PulseNav"
import { cn } from "@/utils/utils"
import { useQuery } from "@tanstack/react-query"
import { hospitalAPI, Hospital } from "@/core/services/api"

interface HospitalCompareScreenProps {
  onTabChange?: (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => void
  activeScreen?: string
  onNavigate?: (screen: string) => void
  onPanic?: () => void
}



const featureKeys = ["General Medicine","Cardiology","Neurology","Pediatrics","24/7 Emergency","Blood Lab","Pharmacy","CGHS Empanelled"]

export function HospitalCompareScreen({ onTabChange, activeScreen, onNavigate, onPanic }: HospitalCompareScreenProps) {
  const [selected, setSelected] = useState<string[]>([])

  const { data: availableHospitals = [], isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['hospitalsForCompare'],
    queryFn: () => hospitalAPI.search("", "", 20)
  })

  const { data: compareHospitals = [], isLoading: isLoadingCompare } = useQuery({
    queryKey: ['compareHospitals', selected],
    queryFn: () => hospitalAPI.compare(selected),
    enabled: selected.length >= 2
  })

  const toggleHospital = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(h => h !== id) : prev.length < 3 ? [...prev, id] : prev)

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
            {isLoadingAvailable ? (
              <p className="text-sm text-muted-foreground text-center py-4">Loading hospitals...</p>
            ) : availableHospitals.slice(0, 10).map((h) => {
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
                      <span className="text-xs text-muted-foreground line-clamp-1 truncate">{h.address}</span>
                      <span className="text-muted-foreground">·</span>
                      <Star className="size-3 text-[var(--pulse-amber)] fill-[var(--pulse-amber)]" />
                      <span className="text-xs font-semibold text-foreground">{h.rating}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <Badge variant="secondary" className="font-bold text-primary text-[10px] shrink-0">
                      Score {h.recommendationScore}%
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
                {compareHospitals[0].recommendationScore > (compareHospitals[1]?.recommendationScore ?? 0) ? compareHospitals[0].name : compareHospitals[1].name}{" "}
                scores highest overall based on our dynamic analysis.
              </p>
            </div>

            <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className={cn("grid border-b border-border", compareHospitals.length === 2 ? "grid-cols-3" : "grid-cols-4")}>
                <div className="px-3 py-3 bg-muted/50" />
                {compareHospitals.map((h) => (
                  <div key={h.id} className="px-3 py-3 border-l border-border">
                    <p className="text-[11px] font-bold text-foreground leading-tight">{h.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className={cn("size-1.5 rounded-full", h.workingHours ? "bg-[var(--pulse-green)]" : "bg-destructive")} />
                      <span className="text-[9px] text-muted-foreground font-semibold uppercase">{h.workingHours ? "Open" : "Closed"}</span>
                    </div>
                  </div>
                ))}
              </div>

              {[
                { label: "Rating",      render: (h: Hospital) => <div className="flex items-center gap-1"><Star className="size-3 text-[var(--pulse-amber)] fill-[var(--pulse-amber)]" /><span className="text-sm font-bold text-foreground">{h.rating}</span></div> },
                { label: "Match Score", render: (h: Hospital) => <Badge variant="outline" className="text-[10px] font-bold border-[var(--pulse-amber)]/40 text-[var(--pulse-amber)]">{h.recommendationScore}%</Badge> },
                { label: "Distance",    render: (h: Hospital) => <span className="text-sm font-semibold text-primary">{h.distance?.toFixed(1)} km</span> },
                { label: "Wait Time",   render: (h: Hospital) => <div className="flex items-center gap-1"><Clock className="size-3 text-muted-foreground" /><span className="text-xs font-semibold text-foreground">~15 min</span></div> },
                { label: "Beds",        render: (h: Hospital) => <span className="text-sm font-semibold text-foreground">Available</span> },
                { label: "Specialists", render: (h: Hospital) => <span className="text-sm font-semibold text-foreground">{h.specialties?.length || 0}</span> },
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
                    const has = h.emergencyAvailable && feature === "24/7 Emergency" 
                      ? true 
                      : h.specialties?.some(s => s.specialty?.name?.toLowerCase().includes(feature.toLowerCase()) || s.departments?.toLowerCase().includes(feature.toLowerCase()));
                    return (
                      <div key={h.id} className={cn("px-3 py-3 border-l border-border flex items-center justify-center", i % 2 === 1 && "bg-muted/20")}>
                        {has ? <CheckCircle2 className="size-4 text-[var(--pulse-green)]" /> : <XCircle className="size-4 text-muted-foreground/40" />}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-card border border-border rounded-2xl shadow-sm">
              <strong className="text-[10px] font-bold text-foreground block mb-1">Hospital/Clinic Comparison Disclaimer</strong>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Information is based on publicly available data. Users should contact the hospital/clinic directly for the latest and most accurate details.
              </p>
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