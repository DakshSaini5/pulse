"use client"

import { useState } from "react"
import {
  FileText, Upload, Trash2, CheckCircle2, Clock, Zap,
  ShieldCheck, ScanLine, ClipboardList, HelpCircle, Sparkles, Plus
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PulseNav } from "./PulseNav"
import { cn } from "@/utils/utils"

interface RecordsScreenProps {
  onTabChange?: (tab: "discover" | "records" | "panic" | "trends" | "compare" | "more") => void
  activeScreen?: string
  onNavigate?: (screen: string) => void
  onPanic?: () => void
  
  prescriptions: Array<any>
  activePrescription: any
  selectPrescription: (p: any) => void
  handleDeletePrescription: (id: string, e: any) => void
  handleFileChange: (e: any) => void
  handleUploadSubmit: (e: any) => void
  selectedFiles: File[]
  uploading: boolean
  rawText: string
  setRawText: (val: string) => void
  medicineFields: Array<any>
  handleAddField: () => void
  handleRemoveField: (idx: number) => void
  handleFieldChange: (idx: number, key: "name" | "dosage" | "instructions", val: string) => void
  initiateVerifySubmit: () => void
  verifying: boolean
  checkingInteractions: boolean
  handleCheckInteractions: () => void
  interactionResult: any
  setInteractionResult: (val: any) => void
}

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  PENDING: { color: "text-[var(--pulse-amber)]", bg: "bg-warning/10", icon: Clock },
  OCR_COMPLETED: { color: "text-primary", bg: "bg-secondary", icon: ScanLine },
  ANALYZED: { color: "text-[var(--pulse-green)]", bg: "bg-success/10", icon: CheckCircle2 },
}

export function RecordsScreen({
  activeScreen,
  onNavigate,
  onPanic,
  prescriptions,
  activePrescription,
  selectPrescription,
  handleDeletePrescription,
  handleFileChange,
  handleUploadSubmit,
  selectedFiles,
  uploading,
  rawText,
  setRawText,
  medicineFields,
  handleAddField,
  handleRemoveField,
  handleFieldChange,
  initiateVerifySubmit,
  verifying,
  checkingInteractions,
  handleCheckInteractions,
  interactionResult,
  setInteractionResult
}: RecordsScreenProps) {
  const [isDragging, setIsDragging] = useState(false)

  return (
    <main className="flex-1 overflow-y-auto pb-24 text-left w-full">
      {/* Header */}
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
      <form onSubmit={handleUploadSubmit} className="mx-4 mb-4">
        <div className="bg-card rounded-3xl border-2 border-dashed border-primary/30 p-6 text-center relative">
          <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-4 block text-left flex items-center gap-2">
            <Upload className="size-3.5 text-primary" />
            Upload Prescription File
          </label>
          <div
            className={cn(
              "rounded-2xl p-8 transition-colors cursor-pointer flex flex-col items-center gap-3 relative",
              isDragging ? "bg-secondary" : "bg-muted hover:bg-secondary/60"
            )}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false) }}
          >
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              multiple
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="size-14 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
              <Upload className="size-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Select or drag prescription file(s)</p>
              <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPG, PDF up to 5MB</p>
            </div>
            <Button size="sm" type="button" className="bg-primary text-primary-foreground font-semibold rounded-xl px-6 pointer-events-none">
              Browse Files
            </Button>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mt-4 text-left">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Selected Files ({selectedFiles.length})</p>
              <div className="space-y-1">
                {selectedFiles.map((f, i) => (
                  <div key={i} className="text-xs text-foreground bg-muted px-3 py-2 rounded-lg truncate">{f.name}</div>
                ))}
              </div>
              <Button type="submit" disabled={uploading} className="w-full mt-4 bg-primary font-bold rounded-xl h-11 text-white">
                {uploading ? "Extracting OCR Text..." : `Start Scan & OCR`}
              </Button>
            </div>
          )}
        </div>
      </form>

      {/* Scanned Document History */}
      <div className="mx-4 mb-4">
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-3 border-b border-border">
            <h3 className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              Scanned Document History
            </h3>
          </div>
          <div className="divide-y divide-border">
            {prescriptions.length === 0 ? (
              <div className="p-5 text-center text-xs text-muted-foreground">No prescriptions scanned yet.</div>
            ) : (
              prescriptions.map((scan) => {
                const cfg = statusConfig[scan.status] || statusConfig.PENDING
                const Icon = cfg.icon
                return (
                  <div 
                    key={scan.id} 
                    onClick={() => selectPrescription(scan)}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors",
                      activePrescription?.id === scan.id ? "bg-primary/5" : "hover:bg-muted/50"
                    )}
                  >
                    <div className={cn("size-9 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
                      <Icon className={cn("size-4", cfg.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {scan.prescriptionAnalysis && scan.prescriptionAnalysis.length > 0 
                          ? scan.prescriptionAnalysis.map((m: any) => m.medicineName).join(', ')
                          : `Scan #${scan.id.slice(0, 8)}`}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn("text-[10px] font-bold uppercase tracking-wide", cfg.color)}>
                          {scan.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">{new Date(scan.createdAt).toLocaleDateString()}</span>
                      <button 
                        onClick={(e) => handleDeletePrescription(scan.id, e)}
                        className="size-7 rounded-lg hover:bg-[var(--pulse-red-light)] transition-colors flex items-center justify-center"
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Global Drug Interaction Check */}
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
            Cross-reference all active medications across all your uploaded prescriptions to detect any
            dangerous overlapping side effects or interactions.
          </p>
          
          {interactionResult ? (
            <div className={cn("p-4 rounded-2xl border mb-4", interactionResult.severity === 'HIGH' ? 'bg-[var(--pulse-red-light)] border-destructive/20 text-destructive' : interactionResult.severity === 'MODERATE' ? 'bg-warning/10 border-warning/20 text-warning' : 'bg-[color:oklch(0.95_0.05_152)] border-[var(--pulse-green)]/20 text-[var(--pulse-green)]')}>
              <p className="text-xs font-bold mb-1">Severity: {interactionResult.severity}</p>
              <p className="text-[10px] leading-relaxed">{interactionResult.interactions}</p>
              <p className="text-[9px] mt-2 opacity-70">Analyzed {interactionResult.checked} active medications.</p>
              <button onClick={() => setInteractionResult(null)} className="text-[9px] mt-2 underline hover:opacity-80">Reset</button>
            </div>
          ) : (
            <Button 
              onClick={handleCheckInteractions}
              disabled={checkingInteractions || prescriptions.length === 0}
              className="w-full h-12 bg-foreground text-background font-bold rounded-2xl text-sm disabled:opacity-50"
            >
              {checkingInteractions ? <Sparkles className="size-4 animate-spin" /> : <ShieldCheck className="size-4" data-icon="inline-start" />}
              {checkingInteractions ? "Checking..." : "Run Interaction Scan"}
            </Button>
          )}
        </div>
      </div>

      {/* Active Workspace */}
      {activePrescription && (
        <div className="mx-4 mb-4">
          {(activePrescription.status === 'PENDING' || activePrescription.status === 'OCR_COMPLETED') ? (
            <div className="bg-card rounded-3xl border border-border shadow-sm p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-base font-bold text-foreground">Dual-Pane Verification</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    Review raw extracted scanned text, and fill/correct medicine details.
                  </p>
                </div>
                <Badge className="bg-[var(--pulse-amber)] text-white font-bold text-[10px] shrink-0 rounded-xl px-2.5 py-1.5 leading-tight text-center">
                  VERIFY OCR
                </Badge>
              </div>

              {/* OCR Pane */}
              <div className="mt-4 mb-4">
                <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-2 block">
                  Raw Scanned OCR Output
                </label>
                <div className="bg-muted rounded-2xl border border-input p-4 min-h-[80px]">
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="OCR text output goes here..."
                    className="w-full bg-transparent text-xs text-foreground font-mono outline-none resize-none placeholder:text-muted-foreground leading-relaxed min-h-[100px]"
                  />
                </div>
              </div>

              {/* Fields Pane */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    Medicine Fields
                  </label>
                  <button onClick={handleAddField} className="text-[10px] font-bold text-primary flex items-center gap-1">
                    <Plus className="size-3" /> Add Row
                  </button>
                </div>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {medicineFields.map((field, idx) => (
                    <div key={idx} className="bg-muted border border-input rounded-2xl p-3 relative">
                      <button onClick={() => handleRemoveField(idx)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                        <Trash2 className="size-3.5" />
                      </button>
                      <div className="space-y-2 text-xs">
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                          placeholder="Medicine Name"
                          className="w-full bg-card border border-border rounded-lg p-2 outline-none"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={field.dosage}
                            onChange={(e) => handleFieldChange(idx, 'dosage', e.target.value)}
                            placeholder="Dosage"
                            className="w-1/2 bg-card border border-border rounded-lg p-2 outline-none"
                          />
                          <input
                            type="text"
                            value={field.instructions}
                            onChange={(e) => handleFieldChange(idx, 'instructions', e.target.value)}
                            placeholder="Instructions"
                            className="w-1/2 bg-card border border-border rounded-lg p-2 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                onClick={initiateVerifySubmit}
                disabled={verifying}
                className="w-full h-12 bg-primary text-white font-bold rounded-2xl"
              >
                {verifying ? "Analyzing..." : "Submit & Analyze with Gemini"}
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-3xl border border-border shadow-sm p-5 relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-900/50">
              <div className="flex justify-between items-center mb-4 border-b border-border pb-3">
                <div>
                  <h2 className="text-base font-bold text-foreground">Analysis Results</h2>
                  <span className="text-[10px] text-muted-foreground">Scan ID: {activePrescription.id.slice(0, 8)}</span>
                </div>
              </div>

              {activePrescription.prescriptionAnalysis.length === 0 ? (
                <div className="text-center py-6">
                  <HelpCircle className="size-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-bold">No Medicines Found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activePrescription.prescriptionAnalysis.map((med: any, idx: number) => (
                    <div key={idx} className="bg-card border border-border rounded-2xl p-4">
                      <h4 className="font-bold text-sm text-foreground">{med.medicineName}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Dosage: {med.dosage}</p>
                      <div className="space-y-2 mb-3">
                        <p className="text-xs bg-secondary p-2 rounded-xl text-primary font-medium">{med.instructions}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{med.simplifiedExplanation}</p>
                      </div>
                      <div className="space-y-1">
                        <div className="p-2 bg-warning/10 rounded-xl text-[10px] text-warning">
                          <strong>⚠️ Side Effects:</strong> {med.sideEffects}
                        </div>
                        <div className="p-2 bg-[var(--pulse-red-light)] rounded-xl text-[10px] text-destructive">
                          <strong>🚫 Interactions:</strong> {med.drugInteractions}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
