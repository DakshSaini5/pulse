"use client"

import { useState } from "react"
import { TrendingUp, Activity, Plus, ChevronRight, Info, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { PulseNav } from "./PulseNav"
import { cn } from "@/utils/utils"

interface TrendsScreenProps {
  onTabChange?: (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => void
  activeScreen?: string
  onNavigate?: (screen: string) => void
  onPanic?: () => void

  markers: any[]
  activeMarker: string
  setActiveMarker: (val: string) => void
  filteredData: any[]
  handleAssessRisk: () => void
  assessingRisk: boolean
  riskResult: any
  trends: any[]
}

function MiniChart({ data }: { data: { date: string; value: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="h-16 flex items-center justify-center text-xs text-muted-foreground">No data yet</div>;
  }
  
  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const height = 60
  const width = 100
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width || 50
    const y = height - ((d.value - min) / range) * (height - 12) - 6
    return `${x},${y}`
  }).join(" ")

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-16" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke="oklch(0.52 0.22 254)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((d, i) => {
        const x = (i / (data.length - 1)) * width || 50
        const y = height - ((d.value - min) / range) * (height - 12) - 6
        return i === data.length - 1 || data.length === 1 ? (
          <circle key={i} cx={x} cy={y} r="3.5" fill="oklch(0.52 0.22 254)" />
        ) : null
      })}
    </svg>
  )
}

function getStatus(value: number, min: number, max: number) {
  if (value < min) return { label: "Low", color: "text-[var(--pulse-amber)]", bg: "bg-[color:oklch(0.97_0.04_75)]" }
  if (value > max) return { label: "High", color: "text-destructive", bg: "bg-[var(--pulse-red-light)]" }
  return { label: "Normal", color: "text-[var(--pulse-green)]", bg: "bg-[color:oklch(0.95_0.05_152)]" }
}

export function TrendsScreen({ 
  onTabChange, 
  activeScreen, 
  onNavigate, 
  onPanic,
  markers,
  activeMarker,
  setActiveMarker,
  filteredData,
  handleAssessRisk,
  assessingRisk,
  riskResult,
  trends
}: TrendsScreenProps) {
  const selected = markers.find(b => b.name === activeMarker) || markers[0]
  
  // Calculate current value based on last entry
  const currentValue = filteredData.length > 0 ? filteredData[filteredData.length - 1].value : 0;
  
  // Parse min and max from ref string like "12.0 - 15.0"
  const refParts = selected.ref.split('-').map((s: string) => parseFloat(s.trim()));
  const normalMin = refParts[0] || 0;
  const normalMax = refParts[1] || 100;
  
  const status = getStatus(currentValue, normalMin, normalMax)
  const rangePercent = normalMax > normalMin
    ? Math.min(100, Math.max(0, ((currentValue - normalMin) / (normalMax - normalMin)) * 100))
    : 50

  return (
    <div className="flex flex-col min-h-screen bg-background text-left">
      <PulseNav variant="app" activeScreen={activeScreen} onNavigate={onNavigate} onPanic={onPanic} />

      <main className="flex-1 overflow-y-auto pb-24">
        {/* Header */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="size-4 text-primary" />
            </div>
            <h1 className="text-xl font-extrabold text-foreground">Health Trends Tracker</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Track and monitor important clinical indexes over time. Watch historical adjustments in clean comparative graphs.
          </p>
        </div>

        {/* Selected Marker Chart */}
        {selected && (
          <div className="mx-4 mb-4">
            <div className="bg-card rounded-3xl border border-border shadow-sm p-5">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h3 className="text-lg font-extrabold text-foreground">{selected.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{selected.desc}</p>
                </div>
                {filteredData.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge className={cn("font-bold text-sm rounded-xl px-3 py-1", status.bg, status.color)}>
                      {currentValue} {selected.unit}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Status Badge */}
              {filteredData.length > 0 && (
                <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mt-2 mb-3", status.bg, status.color)}>
                  <div className={cn("size-1.5 rounded-full", status.color.replace("text-", "bg-").replace("[var(", "[color:var("))} />
                  {status.label}
                </div>
              )}

              {/* Chart */}
              <div className="bg-muted rounded-2xl p-3 mb-3 mt-4">
                <MiniChart data={filteredData} />
                {filteredData.length > 0 && (
                  <div className="flex justify-between mt-1">
                    {filteredData.map((d: any) => (
                      <span key={d.date} className="text-[9px] text-muted-foreground font-medium">{d.date.substring(0,3)}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Reference Range */}
              {filteredData.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-muted-foreground">Reference Range</span>
                    <span className="text-xs text-muted-foreground">
                      {normalMin}–{normalMax} {selected.unit}
                    </span>
                  </div>
                  <Progress value={rangePercent} className="h-2 rounded-full" />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">Low</span>
                    <span className="text-[10px] font-bold text-primary">Current: {currentValue}</span>
                    <span className="text-[10px] text-muted-foreground">High</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* AI Health Risk Score */}
        <div className="mx-4 mb-4">
          <div className="bg-card rounded-3xl border border-border shadow-sm p-5 bg-gradient-to-b from-primary/5 to-transparent">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2 mb-2">
              <Activity className="size-4 text-primary" />
              AI Health Risk Score
            </h3>
            <p className="text-[10px] text-muted-foreground mb-4">
              Calculate an overall risk score from 0-100 based on your latest uploaded medical lab markers.
            </p>
            
            {riskResult ? (
              <div className={cn("p-4 rounded-xl border", riskResult.score < 60 ? 'bg-[var(--pulse-red-light)] border-destructive/20 text-destructive' : riskResult.score < 80 ? 'bg-warning/10 border-warning/20 text-warning' : 'bg-[color:oklch(0.95_0.05_152)] border-[var(--pulse-green)]/20 text-[var(--pulse-green)]')}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold">Health Score</span>
                  <span className="text-xl font-black">{riskResult.score} / 100</span>
                </div>
                <p className="text-[10px] leading-relaxed mb-2 text-foreground">{riskResult.summary}</p>
                <p className="text-[9px] mt-2 opacity-70">Analyzed {riskResult.biomarkersAnalyzed} recent lab markers.</p>
                <button onClick={() => handleAssessRisk()} className="text-[9px] mt-2 underline hover:opacity-80">Recalculate</button>
              </div>
            ) : (
              <Button
                onClick={handleAssessRisk}
                disabled={assessingRisk || trends.length === 0}
                className="w-full py-2.5 bg-foreground text-background hover:opacity-90 text-xs font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 flex justify-center items-center gap-2 h-12"
              >
                {assessingRisk ? <div className="size-4 rounded-full border-2 border-background/20 border-t-background animate-spin" /> : <Award className="size-4" />}
                {assessingRisk ? 'Analyzing Lab Data...' : 'Calculate Risk Score'}
              </Button>
            )}
          </div>
        </div>

        {/* Biomarker Selection */}
        <div className="mx-4 mb-4">
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
                Select Laboratory Marker
              </h3>
            </div>
            <div className="divide-y divide-border">
              {markers.map((marker) => {
                // Find latest trend value for this marker
                const markerData = trends.filter(t => t.markerName === marker.name);
                const latestValue = markerData.length > 0 ? markerData[0].value : 0;
                
                const refParts = marker.ref.split('-').map((s: string) => parseFloat(s.trim()));
                const normalMin = refParts[0] || 0;
                const normalMax = refParts[1] || 100;
                const mStatus = getStatus(latestValue, normalMin, normalMax)

                return (
                  <button
                    key={marker.name}
                    onClick={() => setActiveMarker(marker.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-5 py-4 transition-colors text-left",
                      activeMarker === marker.name
                        ? "bg-secondary border-l-4 border-l-primary"
                        : "hover:bg-muted/50"
                    )}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("font-bold text-sm", activeMarker === marker.name ? "text-primary" : "text-foreground")}>
                          {marker.name}
                        </span>
                        {markerData.length > 0 && (
                          <Badge className={cn("text-[9px] font-bold px-2 py-0.5 rounded-full", mStatus.bg, mStatus.color)}>
                            {mStatus.label}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{marker.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        "text-xs font-bold px-2.5 py-1 rounded-full",
                        activeMarker === marker.name
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground"
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

        {/* Reference Parameters Note */}
        <div className="mx-4 mb-4">
          <div className="bg-secondary rounded-2xl border border-primary/20 p-4 flex items-start gap-3">
            <Info className="size-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Reference parameters are based on standard clinical guidelines. Always consult your doctor
              for a personalized interpretation of your results.
            </p>
          </div>
        </div>
      </main>

    </div>
  )
}
