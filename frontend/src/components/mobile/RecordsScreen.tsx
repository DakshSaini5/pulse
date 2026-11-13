"use client"

import { useState } from "react"
import {
  FileText, Upload, Trash2, CheckCircle2,
  Zap, ShieldCheck, ScanLine, ClipboardList
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PulseNav } from "./PulseNav"
import { cn } from "@/utils/utils"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { prescriptionAPI } from "@/core/services/api"

interface RecordsScreenProps {
  onTabChange?: (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => void
  activeScreen?: string
  onNavigate?: (screen: string) => void
  onPanic?: () => void
}



const statusConfig: Record<string, { color: string; bg: string; icon: typeof CheckCircle2 }> = {
  analyzed:  { color: "text-[var(--pulse-green)]", bg: "bg-[color:oklch(0.95_0.05_152)]", icon: CheckCircle2 },
  completed: { color: "text-primary",              bg: "bg-secondary",                    icon: ScanLine },
}

export function RecordsScreen({ onTabChange, activeScreen, onNavigate, onPanic }: RecordsScreenProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [ocrText, setOcrText] = useState("")
  const queryClient = useQueryClient()

  const { data: prescriptions = [], isLoading } = useQuery({
    queryKey: ['prescriptions'],
    queryFn: prescriptionAPI.getAll
  })

  const uploadMutation = useMutation({
    mutationFn: prescriptionAPI.upload,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
  })

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadMutation.mutate(file)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <PulseNav variant="app" activeScreen={activeScreen} onNavigate={onNavigate} onPanic={onPanic} />

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <ClipboardList className="size-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Understand a prescription</h1>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Scan handwritten or digital clinic prescriptions. Verify extracted keywords, and let Pulse clarify dosages in plain English.
          </p>
        </div>

        {/* Upload Card */}
        <div className="mx-4 mb-4">
          <div className="bg-card rounded-2xl border-2 border-dashed border-[#1A3BAA]/30 p-6 text-center">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Upload className="size-3.5 text-[#1A3BAA]" />
              Upload prescription
            </label>
            <div
              className={cn(
                "rounded-xl p-6 transition-colors cursor-pointer flex flex-col items-center gap-3",
                isDragging ? "bg-secondary" : "bg-muted hover:bg-secondary/60"
              )}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false) }}
            >
              <div className="size-12 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
                <Upload className="size-5 text-[#1A3BAA]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Select or drag prescription file</p>
                <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, PDF up to 5MB</p>
              </div>
              <label className="cursor-pointer">
                <input type="file" className="hidden" accept="image/png, image/jpeg, application/pdf" onChange={handleFileUpload} />
                <div className="bg-[#1A3BAA] text-white font-semibold rounded-lg px-5 py-2.5 text-sm inline-block text-center mt-2 hover:bg-[#142E86] transition-colors">
                  {uploadMutation.isPending ? "Uploading..." : "Browse files"}
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Scan History */}
        <div className="mx-4 mb-4">
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-border">
              <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                Past prescription scans
              </h3>
            </div>
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="py-6 text-center text-muted-foreground text-sm">Loading records...</div>
              ) : prescriptions.map((scan) => {
                const isAnalyzed = scan.status === "VERIFIED" || scan.status === "ANALYZED";
                const label = isAnalyzed ? "analyzed" : "completed";
                const cfg = statusConfig[label]
                const Icon = cfg.icon
                return (
                  <div key={scan.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors">
                    <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
                      <Icon className={cn("size-4", cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        <a href={scan.fileUrl} target="_blank" rel="noreferrer" className="hover:underline">
                          Scan #{scan.id.substring(0, 8)}
                        </a>
                      </p>
                      <span className={cn("text-[10px] font-bold uppercase tracking-wide", cfg.color)}>
                        {scan.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{new Date(scan.createdAt).toLocaleDateString()}</span>
                      <button 
                        onClick={() => {
                          prescriptionAPI.delete(scan.id).then(() => {
                            queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
                          })
                        }}
                        className="size-7 rounded-lg hover:bg-[var(--pulse-red-light)] transition-colors flex items-center justify-center"
                      >
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
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="size-8 rounded-lg bg-[#EEF2FC] flex items-center justify-center">
                <Zap className="size-4 text-[#1A3BAA]" />
              </div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">
                Drug interaction checker
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Cross-reference all active medications across all your uploaded prescriptions to detect dangerous overlapping side effects or interactions.
            </p>
            <Button className="w-full h-11 bg-[#1A3BAA] hover:bg-[#142E86] text-white font-semibold rounded-lg text-sm">
              <ShieldCheck className="size-4" data-icon="inline-start" />
              Run interaction check
            </Button>
          </div>
        </div>

        {/* Dual-Pane Verification */}
        <div className="mx-4 mb-4">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-foreground">Verify prescription details</h3>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Review raw extracted scanned text and confirm medicine details.
                </p>
              </div>
              <Badge className="bg-amber-50 border border-amber-200 text-[#B45309] font-semibold text-xs shrink-0 rounded-full px-2.5 py-1">
                Verify draft
              </Badge>
            </div>
            <div className="mt-4">
              <label className="text-xs font-bold tracking-wider text-muted-foreground uppercase mb-2 block">
                Raw scanned text
              </label>
              <div className="bg-muted rounded-xl border border-input p-3.5 min-h-[80px]">
                <textarea
                  value={ocrText}
                  onChange={(e) => setOcrText(e.target.value)}
                  placeholder="OCR text output goes here..."
                  className="w-full bg-transparent text-sm text-foreground font-mono outline-none resize-none placeholder:text-muted-foreground leading-relaxed min-h-[60px]"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}