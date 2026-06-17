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
import { cn } from "@/utils/utils"
import { useQuery } from "@tanstack/react-query"
import { hospitalAPI, Hospital } from "@/core/services/api"

interface DiscoverScreenProps {
  onTabChange?: (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => void
  onHospitalClick?: (id: string) => void
  showMap?: boolean
  onToggleMap?: () => void
  activeScreen?: string
  onNavigate?: (screen: string) => void
  onPanic?: () => void
}



export function DiscoverScreen({ onTabChange, onHospitalClick, showMap = false, onToggleMap, activeScreen, onNavigate, onPanic }: DiscoverScreenProps) {
  const [radius, setRadius] = useState([15])
  const [hasER, setHasER] = useState(false)
  const [savedHospitals, setSavedHospitals] = useState<string[]>([])
  const [likedHospitals, setLikedHospitals] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState("General")
  const [searchQuery, setSearchQuery] = useState("")

  const { data: hospitals = [], isLoading } = useQuery({
    queryKey: ['hospitals', searchQuery, activeFilter, radius[0], hasER],
    queryFn: () => hospitalAPI.search(searchQuery, activeFilter === "All Specialties" ? "" : activeFilter, radius[0])
  })

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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading hospitals...</div>
          ) : hospitals.map((hospital: Hospital) => (
            <div key={hospital.id} className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-foreground text-base leading-tight">{hospital.name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground line-clamp-1">{hospital.address}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs font-medium text-primary">{hospital.distance ? `${hospital.distance.toFixed(1)} km` : ''}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{hospital.phone || 'N/A'}</span>
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
                    <span className="text-sm font-bold text-foreground">{hospital.rating ? hospital.rating.toFixed(1) : "0.0"}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold border-[var(--pulse-amber)]/40 text-[var(--pulse-amber)] bg-[color:oklch(0.97_0.04_75)]">
                    Score: {hospital.recommendationScore ? Math.round(hospital.recommendationScore * 100) : 0}%
                  </Badge>
                </div>

                {hospital.explanation && (
                  <div className="mt-2.5 bg-secondary rounded-2xl p-3 border border-primary/10">
                    <div className="flex items-start gap-2">
                      <Sparkles className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground leading-relaxed">{hospital.explanation}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/40">
                <div className="flex items-center gap-1.5">
                  <div className={cn("size-2 rounded-full", hospital.workingHours ? "bg-[var(--pulse-green)]" : "bg-destructive")} />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {hospital.workingHours || "Contact Facility"}
                  </span>
                </div>
                <button onClick={() => onHospitalClick?.(hospital.id)} className="flex items-center gap-1 text-xs font-bold text-primary">
                  Full Departments <ExternalLink className="size-3" />
                </button>
              </div>
            </div>
          ))}

          {!isLoading && hospitals.length > 0 && (
            <div className="mt-2 p-4 bg-card border border-border rounded-2xl shadow-sm flex flex-col gap-3">
              <div>
                <strong className="text-[10px] font-bold text-foreground block mb-1">Ratings Disclaimer</strong>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Ratings shown are sourced from Google Reviews (public data). Pulse is not responsible for the accuracy of this information.
                </p>
              </div>
              <div className="border-t border-border pt-3">
                <strong className="text-[10px] font-bold text-foreground block mb-1">Hospital/Clinic Comparison Disclaimer</strong>
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Information is based on publicly available data. Users should contact the hospital/clinic directly for the latest and most accurate details.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}