"use client"

import { useState } from "react"
import {
  Search, MapPin, ChevronDown, SlidersHorizontal,
  Star, Heart, Bookmark, ExternalLink, Clock, Phone, Sparkles,
  X, CheckSquare, Map
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { PulseNav } from "./PulseNav"
import { cn } from "@/utils/utils"

interface DiscoverScreenProps {
  onTabChange?: (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => void
  onHospitalClick?: (id: string) => void
  showMap?: boolean
  onToggleMap?: () => void
  activeScreen?: string
  onNavigate?: (screen: string) => void
  onPanic?: () => void
  
  hospitals: Array<any>
  savedIds: string[]
  compareIds: string[]
  onToggleSave: (id: string, e: any) => void
  onToggleCompare: (id: string, e: any) => void
  query: string
  setQuery: (val: string) => void
  onSearchSubmit: (e: any) => void
  specialty: string
  setSpecialty: (val: string) => void
  radius: number[]
  setRadius: (val: number[]) => void
  hasER: boolean
  setHasER: (val: boolean) => void
  sortBy: string
  setSortBy: (val: string) => void
  cityName: string
  onChangeLocation: () => void
}

export function DiscoverScreen({ 
  onTabChange, 
  onHospitalClick, 
  showMap = false, 
  onToggleMap, 
  activeScreen, 
  onNavigate, 
  onPanic,
  hospitals,
  savedIds,
  compareIds,
  onToggleSave,
  onToggleCompare,
  query,
  setQuery,
  onSearchSubmit,
  specialty,
  setSpecialty,
  radius,
  setRadius,
  hasER,
  setHasER,
  sortBy,
  setSortBy,
  cityName,
  onChangeLocation
}: DiscoverScreenProps) {
  
  return (
    <main className="flex-1 overflow-y-auto pb-24 w-full">
      {/* Page header */}
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

      {/* Location Bar */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm">
          <MapPin className="size-4 text-primary shrink-0" />
          <span className="text-sm text-muted-foreground flex-1">
            Active Location: <strong className="text-foreground">{cityName || "Locating..."}</strong>
          </span>
          <button onClick={onChangeLocation} className="text-xs font-semibold text-primary border border-primary/30 rounded-full px-3 py-1">
            Change
          </button>
        </div>
      </div>

      {/* Search Filters Card */}
      <form onSubmit={onSearchSubmit} className="mx-4 mb-4 bg-card rounded-3xl border border-border shadow-sm p-5">
        {/* Hospital Name */}
        <div className="mb-4">
          <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
            Hospital Name / Keywords
          </label>
          <div className="flex items-center gap-2.5 bg-muted border border-input rounded-xl px-3 h-11">
            <Search className="size-3.5 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hospital or specialty name..."
              className="flex-1 text-sm bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Clinical Specialty */}
        <div className="mb-4">
          <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
            Clinical Specialty
          </label>
          <div className="flex items-center justify-between bg-muted border border-input rounded-xl px-4 h-11">
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-foreground appearance-none"
            >
              <option value="">All Specialties</option>
              <option value="Cardiology">Cardiology</option>
              <option value="Orthopedics">Orthopedics</option>
              <option value="Neurology">Neurology</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="Gynecology">Gynecology</option>
              <option value="Dermatology">Dermatology</option>
              <option value="Endocrinology">Endocrinology</option>
              <option value="Gastroenterology">Gastroenterology</option>
              <option value="Oncology">Oncology</option>
              <option value="Ophthalmology">Ophthalmology</option>
              <option value="Urology">Urology</option>
              <option value="Psychiatry">Psychiatry</option>
              <option value="ENT">ENT</option>
              <option value="Pulmonology">Pulmonology</option>
              <option value="General Surgery">General Surgery</option>
              <option value="Dental">Dental</option>
              <option value="Emergency Medicine">Emergency Medicine</option>
              <option value="Hematology">Hematology</option>
              <option value="Rheumatology">Rheumatology</option>
              <option value="General Medicine">General Medicine</option>
            </select>
          </div>
        </div>

        {/* Radius Slider */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Max Radius
            </label>
            <Badge variant="secondary" className="font-bold text-primary">
              {radius[0]} km
            </Badge>
          </div>
          <Slider
            value={radius}
            onValueChange={(val) => setRadius(val as number[])}
            min={1}
            max={50}
            step={1}
            className="w-full"
          />
        </div>

        {/* Sort By */}
        <div className="mb-4">
          <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
            Sort By
          </label>
          <div className="flex items-center justify-between bg-muted border border-input rounded-xl px-4 h-11">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-transparent text-sm outline-none text-foreground appearance-none"
            >
              <option value="distance">Nearest First</option>
              <option value="match">Best Match</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={() => setHasER(!hasER)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors",
              hasER
                ? "border-primary bg-secondary text-primary"
                : "border-border bg-transparent text-muted-foreground"
            )}
          >
            <CheckSquare className="size-4" />
            24/7 ER Room
          </button>
          <Button
            type="submit"
            className="flex-1 h-10 bg-primary text-primary-foreground font-semibold rounded-xl"
          >
            <Search className="size-4" data-icon="inline-start" />
            Search
          </Button>
        </div>
      </form>

      {/* Active Filter */}
      {specialty && (
        <div className="mx-4 mb-3 flex items-center justify-between bg-secondary rounded-2xl px-4 py-2.5 border border-primary/20">
          <div className="flex items-center gap-2">
            <Search className="size-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Active Filter: <span className="text-primary">{specialty}</span>
            </span>
          </div>
          <button
            onClick={() => { setSpecialty(""); onSearchSubmit({ preventDefault: () => {} }); }}
            className="text-xs font-bold text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <X className="size-3.5" />
            Clear
          </button>
        </div>
      )}

      {/* Map Toggle */}
      <div className="mx-4 mb-3">
        <button
          onClick={onToggleMap}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-sm font-semibold transition-colors",
            showMap
              ? "border-primary bg-secondary text-primary"
              : "border-border text-muted-foreground hover:border-primary/40"
          )}
        >
          <Map className="size-4" />
          {showMap ? "Hide Map" : "View on Map"}
        </button>
      </div>

      {/* Results */}
      <div className="px-4 flex flex-col gap-3 pb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            {hospitals.length} Results Found
          </h3>
        </div>

        {hospitals.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground text-sm">
            No hospitals found matching your criteria.
          </div>
        ) : (
          hospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-foreground text-base leading-tight">{hospital.name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{hospital.address}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Phone className="size-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{hospital.phone || "No phone available"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-col">
                    <button
                      onClick={(e) => onToggleSave(hospital.id, e)}
                      className={cn(
                        "size-8 rounded-full border flex items-center justify-center transition-colors",
                        savedIds.includes(hospital.id)
                          ? "bg-secondary border-primary/30"
                          : "border-border bg-card"
                      )}
                    >
                      <Bookmark className={cn("size-4", savedIds.includes(hospital.id) ? "text-primary fill-primary" : "text-muted-foreground")} />
                    </button>
                    <button
                      onClick={(e) => onToggleCompare(hospital.id, e)}
                      className={cn(
                        "size-8 rounded-full border flex items-center justify-center transition-colors",
                        compareIds.includes(hospital.id)
                          ? "bg-[color:oklch(0.96_0.04_290)] border-[color:oklch(0.55_0.18_290)]/30"
                          : "border-border bg-card"
                      )}
                      title="Add to compare"
                    >
                      {compareIds.includes(hospital.id) ? (
                         <CheckSquare className="size-4 text-[color:oklch(0.55_0.18_290)]" />
                      ) : (
                         <ExternalLink className="size-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Rating & Score */}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="size-3.5 text-[var(--pulse-amber)] fill-[var(--pulse-amber)]" />
                    <span className="text-sm font-bold text-foreground">{hospital.rating?.toFixed(1)}</span>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold border-[var(--pulse-amber)]/40 text-[var(--pulse-amber)] bg-[color:oklch(0.97_0.04_75)]">
                    Score: {hospital.recommendationScore}%
                  </Badge>
                  {hospital.emergencyAvailable && (
                    <span className="text-[10px] bg-destructive/15 border border-destructive/25 text-destructive px-2 py-0.5 rounded-full font-bold uppercase">
                      24/7 ER
                    </span>
                  )}
                </div>

                {/* Match Reason */}
                {hospital.explanation && (
                  <div className="mt-2.5 bg-secondary rounded-2xl p-3 border border-primary/10">
                    <div className="flex items-start gap-2">
                      <Sparkles className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <p className="text-xs text-foreground leading-relaxed">{hospital.explanation}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/40">
                <div className="flex items-center gap-1.5">
                  <div className={cn("size-2 rounded-full", "bg-[var(--pulse-green)]")} />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    {hospital.workingHours}
                  </span>
                </div>
                <button
                  onClick={() => onHospitalClick?.(hospital.id)}
                  className="flex items-center gap-1 text-xs font-bold text-primary"
                >
                  Full Departments
                  <ExternalLink className="size-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
