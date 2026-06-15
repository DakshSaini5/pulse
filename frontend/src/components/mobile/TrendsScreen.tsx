"use client"

import { useState } from "react"
import { TrendingUp, Plus, ChevronRight, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PulseNav } from "./PulseNav"
import { cn } from "@/utils/utils"
import { useQuery } from "@tanstack/react-query"
import { trendAPI } from "@/core/services/api"

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
  
  const { data: trends = [], isLoading } = useQuery({
    queryKey: ['healthTrends'],
    queryFn: trendAPI.getTrends
  })

  // Merge static metadata with actual latest values
  const activeBiomarkers = biomarkers.map(b => {
    const markerTrends = trends.filter(t => t.markerName.toLowerCase() === b.name.toLowerCase()).sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
    const latest = markerTrends.length > 0 ? markerTrends[markerTrends.length - 1].value : b.value
    return { ...b, value: latest, history: markerTrends }
  })

  const selected = activeBiomarkers.find(b => b.id === selectedMarker) || activeBiomarkers[0]
  const status = getStatus(selected.value, selected.normalMin, selected.normalMax)
  const rangePercent = selected.normalMax > selected.normalMin
    ? Math.min(100, Math.max(0, ((selected.value - selected.normalMin) / (selected.normalMax - selected.normalMin)) * 100))
    : 50

  const chartData = selected.history.length > 0 
    ? selected.history.map(t => ({ month: new Date(t.recordedAt).toLocaleDateString('en-US', { month: 'short' }), value: t.value }))
    : [ { month: "N/A", value: selected.value } ]

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
              {isLoading ? (
                <div className="h-16 flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
              ) : (
                <>
                  <MiniChart data={chartData} />
                  <div className="flex justify-between mt-1">
                    {chartData.map((d, i) => (
                      <span key={i} className="text-[9px] text-muted-foreground font-medium">{d.month}</span>
                    ))}
                  </div>
                </>
              )}
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
              {activeBiomarkers.map((marker) => {
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