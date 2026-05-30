import React, { useState, useEffect } from 'react';
import { prescriptionAPI, Prescription } from '../services/api';
import { 
  ClipboardList, UploadCloud, CheckCircle, AlertTriangle, 
  HelpCircle, Sparkles, Plus, Trash2, Edit, Save, FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const parseMedicinesFromRawText = (text: string): Array<{ name: string; dosage: string; instructions: string }> => {
  if (!text) return [{ name: '', dosage: '', instructions: '' }];
  
  const lines = text.split('\n');
  const found: Array<{ name: string; dosage: string; instructions: string }> = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Matches: [Optional bullet/number] [Name] [Dosage - e.g. 500mg or 20 mg] [Instructions]
    const match = trimmed.match(/^(?:[\-\*\d\.]+\s*)?([A-Za-z0-9\s\-\/]+?)\s+(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|tab|caps?|units?|tbs))\b\s*(.*)$/i);
    if (match) {
      const name = match[1].trim();
      const dosage = match[2].trim();
      const instructions = match[3].trim();
      
      // Exclude header words
      if (name && !/^(prescription|rx|patient|date|doctor|clinic|hospital|name|age|gender|sex)$/i.test(name)) {
        found.push({ name, dosage, instructions });
      }
    }
  }
  
  if (found.length === 0) {
    return [{ name: '', dosage: '', instructions: '' }];
  }
  return found;
};

export const PrescriptionCenter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Creation States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  
  // Verification dual-pane states
  const [rawText, setRawText] = useState('');
  const [medicineFields, setMedicineFields] = useState<Array<{ name: string; dosage: string; instructions: string }>>([]);
  const [verifying, setVerifying] = useState(false);

  const fetchPrescriptions = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const data = await prescriptionAPI.getAll();
      setPrescriptions(data);
      if (data.length > 0) {
        setActivePrescription(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      e.target.value = ''; // Reset native input value
    }
  };

  const handleRemoveFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      let lastRes: Prescription | null = null;
      const uploadedList: Prescription[] = [];

      for (const file of selectedFiles) {
        const res = await prescriptionAPI.upload(file);
        uploadedList.push(res);
        lastRes = res;
      }

      setPrescriptions(prev => [...uploadedList, ...prev]);

      if (lastRes) {
        setActivePrescription(lastRes);
        const rawOcrText = lastRes.ocrResult?.rawText || '';
        setRawText(rawOcrText);
        if (lastRes.prescriptionAnalysis && lastRes.prescriptionAnalysis.length > 0) {
          setMedicineFields(lastRes.prescriptionAnalysis.map(med => ({
            name: med.medicineName,
            dosage: med.dosage,
            instructions: med.instructions
          })));
        } else {
          setMedicineFields(parseMedicinesFromRawText(rawOcrText));
        }
      }
      setSelectedFiles([]);
    } catch (err) {
      console.error(err);
      alert('OCR extraction failed. Let us try fallback simulators.');
    } finally {
      setUploading(false);
    }
  };

  const handleAddField = () => {
    setMedicineFields(prev => [...prev, { name: '', dosage: '', instructions: '' }]);
  };

  const handleRemoveField = (idx: number) => {
    setMedicineFields(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFieldChange = (idx: number, key: 'name' | 'dosage' | 'instructions', val: string) => {
    setMedicineFields(prev => {
      const copy = [...prev];
      copy[idx][key] = val;
      return copy;
    });
  };

  const handleVerifySubmit = async () => {
    if (!activePrescription) return;
    setVerifying(true);
    try {
      const payload = {
        rawText,
        medicines: medicineFields
      };
      const res = await prescriptionAPI.verify(activePrescription.id, payload);
      
      // Update local listing
      setPrescriptions(prev => prev.map(p => p.id === res.id ? res : p));
      setActivePrescription(res);
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const selectPrescription = (pres: Prescription) => {
    setActivePrescription(pres);
    const rawOcrText = pres.ocrResult?.rawText || '';
    setRawText(rawOcrText);
    if (pres.prescriptionAnalysis.length > 0) {
      setMedicineFields(pres.prescriptionAnalysis.map(med => ({
        name: med.medicineName,
        dosage: med.dosage,
        instructions: med.instructions
      })));
    } else {
      setMedicineFields(parseMedicinesFromRawText(rawOcrText));
    }
  };

  return (
    <div className="space-y-8 pb-16 text-left">
      <div className="text-left space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          <ClipboardList className="text-primary w-8 h-8 animate-pulse" />
          Prescription scanner & Analyzer
        </h1>
        <p className="text-xs text-slate-500">Scan handwritten or digital clinic prescriptions. Verify extracted keywords, and let Gemini clarify dosages in plain English.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Listing & File Upload */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upload panel */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/50 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-primary" />
              Upload Prescription File
            </h3>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="border border-dashed border-slate-200 hover:border-primary/50 transition-colors rounded-2xl p-6 text-center bg-white/[0.005] cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <span className="text-xs text-slate-600 block font-semibold">
                  Select or drag prescription file(s)
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">Supports PNG, JPG, PDF up to 5MB</span>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-3 text-left">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Selected Files ({selectedFiles.length})</label>
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white/70 shadow-sm text-xs text-slate-700 animate-fadeIn">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="truncate font-medium max-w-[180px]">{file.name}</span>
                          <span className="text-[9px] text-slate-500 font-light">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="text-slate-400 hover:text-danger hover:bg-slate-100 p-1 rounded-lg transition-colors shrink-0 flex items-center justify-center"
                          title="Remove File"
                        >
                          <span className="text-base leading-none font-bold">&times;</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFiles.length > 0 && (
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-slate-900 text-xs font-bold rounded-xl shadow-lg shadow-primary/20 transition-all"
                >
                  {uploading ? 'Extracting OCR Text...' : `Start Scan & OCR (${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''})`}
                </button>
              )}
            </form>
          </div>

          {/* Historical Scans */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Scanned Document History</h3>

            {loading ? (
              <div className="space-y-3">
                <div className="h-10 bg-slate-800 rounded animate-pulse" />
                <div className="h-10 bg-slate-800 rounded animate-pulse" />
              </div>
            ) : prescriptions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No prescriptions scanned yet.</p>
            ) : (
              <div className="space-y-2">
                {prescriptions.map(pres => (
                  <button
                    key={pres.id}
                    onClick={() => selectPrescription(pres)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                      activePrescription?.id === pres.id
                        ? 'border-primary bg-primary/10 text-slate-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span className="block truncate max-w-[140px] text-xs font-semibold">
                          {pres.prescriptionAnalysis && pres.prescriptionAnalysis.length > 0 
                            ? pres.prescriptionAnalysis.map(m => m.medicineName).join(', ')
                            : `Scan #${pres.id.slice(0, 8)}`}
                        </span>
                        <span className="text-[9px] text-slate-500 block leading-none mt-1">Status: {pres.status}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(pres.createdAt).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {activePrescription ? (
            <>
              {/* Dual-Pane Editor for Verification */}
              {activePrescription.status === 'PENDING' || activePrescription.status === 'OCR_COMPLETED' ? (
                <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Dual-Pane Verification</h2>
                      <p className="text-[10px] text-slate-500">Review raw extracted scanned text on the left, and fill/correct medicine details on the right.</p>
                    </div>
                    <span className="text-[10px] bg-warning/15 border border-warning/25 text-warning px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Verify OCR Draft
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Pane: Raw Text */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Raw Scanned OCR Output</label>
                      <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        rows={12}
                        className="w-full p-4 rounded-2xl glass-input text-xs font-mono leading-relaxed text-slate-600"
                        placeholder="OCR text output goes here..."
                      />
                    </div>

                    {/* Right Pane: Structured Fields Verification */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Medicine Form Fields</label>
                        <button
                          onClick={handleAddField}
                          className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Drug Row
                        </button>
                      </div>

                      <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                        {medicineFields.map((field, idx) => (
                          <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-white/[0.01] space-y-2 relative">
                            <button
                              onClick={() => handleRemoveField(idx)}
                              className="absolute top-2 right-2 text-slate-500 hover:text-danger p-1"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div className="space-y-2 text-[10px] font-medium">
                              <div>
                                <label className="text-slate-500 uppercase block mb-1">Medicine Name</label>
                                <input
                                  type="text"
                                  value={field.name}
                                  onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                                  placeholder="e.g. Amoxicillin"
                                  className="w-full p-2 rounded-lg glass-input text-xs text-slate-900"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-slate-500 uppercase block mb-1">Dosage</label>
                                  <input
                                    type="text"
                                    value={field.dosage}
                                    onChange={(e) => handleFieldChange(idx, 'dosage', e.target.value)}
                                    placeholder="e.g. 500 mg"
                                    className="w-full p-2 rounded-lg glass-input text-xs text-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="text-slate-500 uppercase block mb-1">Instructions / Freq</label>
                                  <input
                                    type="text"
                                    value={field.instructions}
                                    onChange={(e) => handleFieldChange(idx, 'instructions', e.target.value)}
                                    placeholder="e.g. TID PC (Three times daily)"
                                    className="w-full p-2 rounded-lg glass-input text-xs text-slate-900"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={handleVerifySubmit}
                      disabled={verifying}
                      className="px-6 py-3 bg-primary hover:bg-primary-hover text-slate-900 text-xs font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 animate-spin" />
                      {verifying ? 'Running Gemini analysis...' : 'Submit & Analyze with Gemini'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Gemini Structured Results display */
                <div className="space-y-6">
                  {/* Results cards */}
                  <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6 relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100/50">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Prescription Analysis</h2>
                        <span className="text-[10px] text-slate-500">Scan ID: {activePrescription.id.slice(0, 8)}</span>
                      </div>
                      {activePrescription.prescriptionAnalysis.length > 0 ? (
                        <span className="text-[10px] bg-success/15 border border-success/25 text-success px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Analyzed Successfully
                        </span>
                      ) : (
                        <span className="text-[10px] bg-warning/15 border border-warning/25 text-warning px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          Warning: No Meds Found
                        </span>
                      )}
                    </div>

                    {activePrescription.prescriptionAnalysis.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl max-w-lg mx-auto space-y-3 animate-fadeIn">
                        <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                        <h4 className="font-extrabold text-slate-800 text-sm">No Medicines Extracted</h4>
                        <p className="text-xs text-slate-500 leading-relaxed font-light">
                          This document does not seem to contain recognizable medication dosages, or it may be an imaging report (such as an Ultrasound, X-Ray, or Lab panel).
                        </p>
                        <p className="text-xs text-slate-500 leading-relaxed font-light">
                          If this is a medicine prescription, you can upload a clearer photo, or verify manually by writing your drugs in the form editor!
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activePrescription.prescriptionAnalysis.map((med, index) => (
                          <div key={index} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <h4 className="font-extrabold text-slate-900 text-sm">{med.medicineName}</h4>
                                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Dosage: {med.dosage}</span>
                                </div>
                              </div>

                              <div className="space-y-2 text-[11px]">
                                <div>
                                  <span className="text-[9px] text-primary font-bold uppercase block tracking-wider">Dosing Instructions</span>
                                  <p className="text-slate-700 mt-0.5 leading-normal">{med.instructions}</p>
                                </div>

                                <div>
                                  <span className="text-[9px] text-slate-500 font-bold uppercase block tracking-wider">Simplified Definition</span>
                                  <p className="text-slate-500 mt-0.5 leading-normal font-light">{med.simplifiedExplanation}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2 pt-3 border-t border-slate-200">
                              <div className="p-2 bg-warning/5 border border-warning/15 rounded-xl text-[10px] text-slate-500">
                                <strong className="text-warning block mb-0.5">⚠️ Side Effects:</strong>
                                {med.sideEffects}
                              </div>
                              <div className="p-2 bg-danger/5 border border-danger/15 rounded-xl text-[10px] text-slate-500">
                                <strong className="text-danger block mb-0.5">🚫 Drug Interactions:</strong>
                                {med.drugInteractions}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mandatory Safety Alert banner */}
                  <div className="p-4 bg-danger/10 border border-danger/25 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5 animate-bounce" />
                    <div>
                      <span className="text-xs font-bold text-danger block uppercase">Mandatory Health Disclaimer</span>
                      <p className="text-[10px] text-slate-500 leading-relaxed font-light mt-1">
                        AI-generated information is for educational purposes only and should not replace professional medical advice. Pulse does not dispense diagnoses or clinical guidance. Always consult with a licensed primary care practitioner or physician before making changes to medications or regimens.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="glass-panel rounded-3xl p-16 border border-slate-200 text-center text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
              <ClipboardList className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
              <p className="text-sm font-semibold">No active scan workspace open.</p>
              <p className="text-xs text-slate-500 mt-1">Please upload a prescription image to start, or select a past scan from the history board.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
