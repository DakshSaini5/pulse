// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Upload, Trash2, CheckCircle2, Clock,
  ScanLine, ClipboardList, Sparkles, Plus, Loader2, Zap, ShieldCheck, HelpCircle
} from 'lucide-react';
import { PulseNav } from './PulseNav';
import axios from 'axios';
import toast from 'react-hot-toast';

const statusConfig = {
  PENDING: { color: 'text-amber-400', bg: 'bg-amber-500/15', icon: Clock },
  OCR_COMPLETED: { color: 'text-[#1E60D5]', bg: 'bg-[#1E60D5]/15', icon: ScanLine },
  ANALYZED: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: CheckCircle2 },
};

interface RecordsScreenProps {
  activeScreen?: string;
}

export function RecordsScreen({ activeScreen }: RecordsScreenProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const token = localStorage.getItem('pulse_token');
  const apiUrl = import.meta.env.VITE_API_URL;

  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [activePrescription, setActivePrescription] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // OCR verification state
  const [rawText, setRawText] = useState('');
  const [medicineFields, setMedicineFields] = useState<any[]>([{ name: '', dosage: '', instructions: '' }]);
  const [verifying, setVerifying] = useState(false);

  // Interaction check
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [interactionResult, setInteractionResult] = useState<any>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const res = await axios.get(`${apiUrl}/api/prescriptions`, { headers: { Authorization: `Bearer ${token}` } });
      setPrescriptions(res.data || []);
    } catch (err) {
      toast.error('Failed to load prescriptions');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setSelectedFiles(Array.from(e.target.files));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(f => formData.append('files', f));
      const res = await axios.post(`${apiUrl}/api/prescriptions/upload`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Prescription uploaded & OCR started!');
      setSelectedFiles([]);
      await fetchPrescriptions();
      // Auto-select the newly created one
      if (res.data?.id) {
        setActivePrescription(res.data);
        setRawText(res.data.rawText || '');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const selectPrescription = (p: any) => {
    setActivePrescription(p);
    setRawText(p.rawText || '');
    if (p.prescriptionAnalysis?.length > 0) {
      setMedicineFields(p.prescriptionAnalysis.map((m: any) => ({
        name: m.medicineName || '',
        dosage: m.dosage || '',
        instructions: m.instructions || '',
      })));
    } else {
      setMedicineFields([{ name: '', dosage: '', instructions: '' }]);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${apiUrl}/api/prescriptions/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setPrescriptions(prev => prev.filter(p => p.id !== id));
      if (activePrescription?.id === id) setActivePrescription(null);
      toast.success('Deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleVerifySubmit = async () => {
    if (!activePrescription) return;
    setVerifying(true);
    try {
      const res = await axios.post(`${apiUrl}/api/prescriptions/${activePrescription.id}/verify`, {
        rawText,
        medicines: medicineFields,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('AI analysis complete!');
      await fetchPrescriptions();
      setActivePrescription(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Analysis failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleCheckInteractions = async () => {
    setCheckingInteractions(true);
    try {
      const res = await axios.get(`${apiUrl}/api/prescriptions/interactions`, { headers: { Authorization: `Bearer ${token}` } });
      setInteractionResult(res.data);
    } catch {
      toast.error('Interaction check failed');
    } finally {
      setCheckingInteractions(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0B0F19]">
      <PulseNav variant="app" activeScreen="records" onNavigate={(id: string) => navigate(`/${id}`)} />

      <main className="flex-1 overflow-y-auto pb-28">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <h1 className="text-xl font-bold text-white">Prescription Scanner</h1>
          <p className="text-xs text-slate-400 mt-1">Upload & scan prescriptions with Pulse AI</p>
        </div>

        {/* Upload Card */}
        <form onSubmit={handleUpload} className="mx-4 mb-4">
          <div className="bg-[#111827] rounded-2xl border-2 border-dashed border-[#1E60D5]/30 p-5 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-3 py-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#1E60D5]/15 border border-[#1E60D5]/20 flex items-center justify-center">
                <Upload className="w-6 h-6 text-[#1E60D5]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Tap to upload prescription</p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, PDF up to 5MB</p>
              </div>
            </button>

            {selectedFiles.length > 0 && (
              <div className="mt-3 text-left">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Selected ({selectedFiles.length})
                </p>
                {selectedFiles.map((f, i) => (
                  <div key={i} className="text-xs text-white bg-[#0B0F19] px-3 py-2 rounded-lg mb-1 truncate">{f.name}</div>
                ))}
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full mt-3 py-3.5 bg-[#1E60D5] text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
                  {uploading ? 'Processing OCR...' : 'Start Scan & OCR'}
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Prescription History */}
        <div className="mx-4 mb-4">
          <div className="bg-[#111827] rounded-2xl border border-slate-800/60 overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-slate-800/40">
              <h3 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Scanned Documents</h3>
            </div>
            <div className="divide-y divide-slate-800/40">
              {loading ? (
                <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 text-[#1E60D5] animate-spin" /></div>
              ) : prescriptions.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">No prescriptions yet.</div>
              ) : (
                prescriptions.map((scan) => {
                  const cfg = statusConfig[scan.status] || statusConfig.PENDING;
                  const Icon = cfg.icon;
                  return (
                    <div
                      key={scan.id}
                      onClick={() => selectPrescription(scan)}
                      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${
                        activePrescription?.id === scan.id ? 'bg-[#1E60D5]/10' : 'active:bg-slate-800/40'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">
                          {scan.prescriptionAnalysis?.length > 0
                            ? scan.prescriptionAnalysis.map((m: any) => m.medicineName).join(', ')
                            : `Scan #${scan.id.slice(0, 8)}`}
                        </p>
                        <span className={`text-[10px] font-bold uppercase tracking-wide ${cfg.color}`}>
                          {scan.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-500">{new Date(scan.createdAt).toLocaleDateString()}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(scan.id); }}
                          className="w-7 h-7 rounded-lg hover:bg-red-500/15 flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Drug Interaction Check */}
        <div className="mx-4 mb-4">
          <div className="bg-[#111827] rounded-2xl border border-slate-800/60 p-4">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#1E60D5]/15 flex items-center justify-center">
                <Zap className="w-4 h-4 text-[#1E60D5]" />
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wide">Drug Interaction Check</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Cross-reference all active medications across prescriptions.
            </p>

            {interactionResult ? (
              <div className={`p-3 rounded-xl border mb-3 ${interactionResult.severity === 'HIGH' ? 'bg-red-500/15 border-red-500/20 text-red-400' : interactionResult.severity === 'MODERATE' ? 'bg-amber-500/15 border-amber-500/20 text-amber-400' : 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'}`}>
                <p className="text-xs font-bold mb-1">Severity: {interactionResult.severity}</p>
                <p className="text-[10px] leading-relaxed">{interactionResult.interactions}</p>
                <button onClick={() => setInteractionResult(null)} className="text-[9px] mt-2 underline">Reset</button>
              </div>
            ) : (
              <button
                onClick={handleCheckInteractions}
                disabled={checkingInteractions || prescriptions.length === 0}
                className="w-full py-3 bg-white text-[#0B0F19] font-bold rounded-xl text-sm disabled:opacity-40 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              >
                {checkingInteractions ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {checkingInteractions ? 'Checking...' : 'Run Interaction Scan'}
              </button>
            )}
          </div>
        </div>

        {/* Active Workspace — Verification / Results */}
        {activePrescription && (
          <div className="mx-4 mb-4">
            {(activePrescription.status === 'PENDING' || activePrescription.status === 'OCR_COMPLETED') ? (
              <div className="bg-[#111827] rounded-2xl border border-slate-800/60 p-4">
                <h3 className="text-base font-bold text-white mb-1">Verify OCR</h3>
                <p className="text-xs text-slate-400 mb-3">Review extracted text and correct medicine details.</p>

                {/* Raw text */}
                <div className="mb-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Raw OCR Text</label>
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="OCR text..."
                    className="w-full bg-[#0B0F19] border border-slate-700 rounded-xl p-3 text-xs text-white font-mono outline-none resize-none min-h-[80px] placeholder:text-slate-600"
                  />
                </div>

                {/* Medicine fields */}
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Medicines</label>
                    <button
                      type="button"
                      onClick={() => setMedicineFields(prev => [...prev, { name: '', dosage: '', instructions: '' }])}
                      className="text-[10px] font-bold text-[#1E60D5] flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {medicineFields.map((field, idx) => (
                      <div key={idx} className="bg-[#0B0F19] border border-slate-700 rounded-xl p-3 relative">
                        <button
                          type="button"
                          onClick={() => setMedicineFields(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute top-2 right-2 text-slate-600 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <div className="space-y-2 text-xs">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => {
                              const next = [...medicineFields];
                              next[idx].name = e.target.value;
                              setMedicineFields(next);
                            }}
                            placeholder="Medicine Name"
                            className="w-full bg-[#111827] border border-slate-700 rounded-lg p-2 text-white outline-none"
                          />
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={field.dosage}
                              onChange={(e) => {
                                const next = [...medicineFields];
                                next[idx].dosage = e.target.value;
                                setMedicineFields(next);
                              }}
                              placeholder="Dosage"
                              className="w-1/2 bg-[#111827] border border-slate-700 rounded-lg p-2 text-white outline-none"
                            />
                            <input
                              type="text"
                              value={field.instructions}
                              onChange={(e) => {
                                const next = [...medicineFields];
                                next[idx].instructions = e.target.value;
                                setMedicineFields(next);
                              }}
                              placeholder="Instructions"
                              className="w-1/2 bg-[#111827] border border-slate-700 rounded-lg p-2 text-white outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleVerifySubmit}
                  disabled={verifying}
                  className="w-full py-3.5 rounded-xl bg-[#1E60D5] text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
                >
                  <Sparkles className="w-4 h-4" />
                  {verifying ? 'Analyzing...' : 'Submit & Analyze with AI'}
                </button>
              </div>
            ) : (
              /* Analysis Results */
              <div className="bg-[#111827] rounded-2xl border border-slate-800/60 p-4">
                <h2 className="text-base font-bold text-white mb-1">Analysis Results</h2>
                <span className="text-[10px] text-slate-500">Scan #{activePrescription.id.slice(0, 8)}</span>

                {(!activePrescription.prescriptionAnalysis || activePrescription.prescriptionAnalysis.length === 0) ? (
                  <div className="text-center py-6">
                    <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-400">No medicines found</p>
                  </div>
                ) : (
                  <div className="space-y-3 mt-3">
                    {activePrescription.prescriptionAnalysis.map((med: any, idx: number) => (
                      <div key={idx} className="bg-[#0B0F19] border border-slate-800/40 rounded-xl p-4">
                        <h4 className="font-bold text-sm text-white">{med.medicineName}</h4>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Dosage: {med.dosage}</p>
                        <p className="text-xs text-[#1E60D5] bg-[#1E60D5]/10 p-2 rounded-lg font-medium mb-1">{med.instructions}</p>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">{med.simplifiedExplanation}</p>
                        <div className="space-y-1">
                          <div className="p-2 bg-amber-500/10 rounded-lg text-[10px] text-amber-400">
                            <strong>⚠️ Side Effects:</strong> {med.sideEffects}
                          </div>
                          <div className="p-2 bg-red-500/10 rounded-lg text-[10px] text-red-400">
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
    </div>
  );
}
