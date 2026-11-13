import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { prescriptionAPI, Prescription } from '@core/services/api';
import {
  ClipboardList, UploadCloud, FileText, CheckCircle2,
  AlertTriangle, Plus, Trash2, ArrowRight, ShieldCheck,
  Activity, Info
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import { MedicalDisclaimer, AIModalDisclaimer } from '../components/MedicalDisclaimer';
import toast from 'react-hot-toast';

const SAMPLE_PRESCRIPTION: Prescription = {
  id: 'sample-prescription',
  fileUrl: '',
  status: 'COMPLETED',
  createdAt: new Date().toISOString(),
  ocrResult: {
    rawText: "Rx\n1. Tab. Paracetamol 650mg - 1 tablet three times daily after meals for 3 days.\n2. Cap. Amoxicillin 500mg - 1 capsule twice daily after food for 5 days.\n3. Tab. Cetirizine 10mg - 1 tablet at night before sleeping for 5 days.",
    verifiedData: "Paracetamol 650mg, Amoxicillin 500mg, Cetirizine 10mg prescribed for acute respiratory infection with fever.",
  },
  prescriptionAnalysis: [
    {
      medicineName: 'Paracetamol 650mg',
      dosage: '650mg',
      instructions: '1 tablet 3 times daily after meals for 3 days',
      simplifiedExplanation: 'Common fever reducer and pain reliever. Take with water after eating.',
      sideEffects: 'Mild nausea or stomach discomfort if taken on an empty stomach. Do not exceed 4,000mg per day.',
      drugInteractions: 'Avoid combining with other cold medications that already contain paracetamol/acetaminophen.',
    },
    {
      medicineName: 'Amoxicillin 500mg',
      dosage: '500mg',
      instructions: '1 capsule twice daily after meals for 5 days',
      simplifiedExplanation: 'Penicillin-class antibiotic used to treat bacterial throat, ear, or chest infections. Complete the full 5-day course.',
      sideEffects: 'Mild stomach upset, soft stools, or allergic rash.',
      drugInteractions: 'May reduce the effectiveness of oral contraceptives. Inform your doctor if you take blood thinners.',
    },
    {
      medicineName: 'Cetirizine 10mg',
      dosage: '10mg',
      instructions: '1 tablet at night before sleeping for 5 days',
      simplifiedExplanation: 'Antihistamine that relieves runny nose, sneezing, itchy throat, and watery eyes.',
      sideEffects: 'Drowsiness, dry mouth, mild tiredness.',
      drugInteractions: 'Avoid alcohol and sedatives as they amplify drowsiness.',
    },
  ],
};

const parseMedicinesFromRawText = (text: string): Array<{ name: string; dosage: string; instructions: string }> => {
  if (!text) return [{ name: '', dosage: '', instructions: '' }];
  
  const lines = text.split('\n');
  const found: Array<{ name: string; dosage: string; instructions: string }> = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const match = trimmed.match(/^(?:[\-\*\d\.]+\s*)?([A-Za-z0-9\s\-\/]+?)\s+(\d+(?:\.\d+)?\s*(?:mg|g|mcg|ml|tab|caps?|units?|tbs))\b\s*(.*)$/i);
    if (match) {
      const name = match[1].trim();
      const dosage = match[2].trim();
      const instructions = match[3].trim();
      
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

  useEffect(() => {
    document.title = 'Understand a prescription | Pulse';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Upload handwritten or clinic doctor prescriptions. Clarify medicine dosages, timing, and check for unsafe drug interactions in plain English.');
  }, []);

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Creation States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activePrescription, setActivePrescription] = useState<Prescription | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  
  // Dual-pane verification states
  const [rawText, setRawText] = useState('');
  const [medicineFields, setMedicineFields] = useState<Array<{ name: string; dosage: string; instructions: string }>>([]);
  const [verifying, setVerifying] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [hasAcknowledgedAi, setHasAcknowledgedAi] = useState(false);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [interactionResult, setInteractionResult] = useState<{ interactions: string; severity: string; checked: number } | null>(null);

  const fetchPrescriptions = async () => {
    if (!user) {
      setPrescriptions([SAMPLE_PRESCRIPTION]);
      selectPrescription(SAMPLE_PRESCRIPTION);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await prescriptionAPI.getAll();
      const list = Array.isArray(data) ? data : [];
      setPrescriptions(list);
      if (list.length > 0) {
        selectPrescription(list[0]);
      } else {
        // Fallback to sample for preview
        selectPrescription(SAMPLE_PRESCRIPTION);
      }
    } catch (err) {
      console.error(err);
      selectPrescription(SAMPLE_PRESCRIPTION);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);
      e.target.value = '';
    }
  };

  const handleRemoveFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleDeletePrescription = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === 'sample-prescription') {
      toast.error('The sample prescription demonstration cannot be deleted.');
      return;
    }
    if (!window.confirm('Delete this prescription record? This cannot be undone.')) return;
    try {
      await prescriptionAPI.delete(id);
      setPrescriptions(prev => prev.filter(p => p.id !== id));
      if (activePrescription?.id === id) {
        setActivePrescription(prescriptions[0] || SAMPLE_PRESCRIPTION);
      }
      toast.success('Prescription deleted.');
    } catch (err) {
      toast.error('Failed to delete prescription.');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=/prescriptions');
      toast.error('Please sign in to upload and save your prescriptions.');
      return;
    }
    if (!consentGiven) {
      toast.error('Please agree to processing before uploading your prescription.');
      return;
    }
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      let lastRes: Prescription | null = null;
      const uploadedList: Prescription[] = [];

      for (let file of selectedFiles) {
        if (file.type.startsWith('image/')) {
          try {
            const options = {
              maxSizeMB: 1,
              maxWidthOrHeight: 1200,
              useWebWorker: true,
            };
            const compressedBlob = await imageCompression(file, options);
            file = new File([compressedBlob], file.name, { type: compressedBlob.type, lastModified: Date.now() });
          } catch (compressErr) {
            console.error('Image compression failed, using original file', compressErr);
          }
        }
        const res = await prescriptionAPI.upload(file);
        uploadedList.push(res);
        lastRes = res;
      }

      setPrescriptions(prev => [...uploadedList, ...prev.filter(p => p.id !== 'sample-prescription')]);

      if (lastRes) {
        selectPrescription(lastRes);
      }
      setSelectedFiles([]);
      toast.success('Prescription uploaded and scanned successfully.');
    } catch (err) {
      console.error(err);
      toast.error('OCR extraction failed. Please try a clearer photo or a higher-quality PDF.');
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

  const initiateVerifySubmit = () => {
    if (!hasAcknowledgedAi) {
      setShowAiModal(true);
    } else {
      handleVerifySubmit();
    }
  };

  const handleAcknowledgeAi = () => {
    setHasAcknowledgedAi(true);
    setShowAiModal(false);
    handleVerifySubmit();
  };

  const handleVerifySubmit = async () => {
    if (!activePrescription) return;
    if (activePrescription.id === 'sample-prescription') {
      toast.success('Sample prescription updated in preview.');
      return;
    }
    setVerifying(true);
    try {
      const payload = {
        rawText,
        medicines: medicineFields,
      };
      const res = await prescriptionAPI.verify(activePrescription.id, payload);
      setPrescriptions(prev => prev.map(p => p.id === res.id ? res : p));
      setActivePrescription(res);
      toast.success('Analysis updated.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'AI engine failed to parse the prescription. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const selectPrescription = (pres: Prescription) => {
    setActivePrescription(pres);
    const rawOcrText = pres.ocrResult?.rawText || '';
    setRawText(rawOcrText);
    if (pres.prescriptionAnalysis && pres.prescriptionAnalysis.length > 0) {
      setMedicineFields(pres.prescriptionAnalysis.map(med => ({
        name: med.medicineName,
        dosage: med.dosage,
        instructions: med.instructions,
      })));
    } else {
      setMedicineFields(parseMedicinesFromRawText(rawOcrText));
    }
  };

  const handleCheckInteractions = async () => {
    if (!user) {
      setInteractionResult({
        interactions: 'No adverse interactions detected between Paracetamol, Amoxicillin, and Cetirizine. Take Cetirizine at bedtime to minimize daytime drowsiness.',
        severity: 'LOW',
        checked: 3,
      });
      return;
    }
    setCheckingInteractions(true);
    try {
      const res = await prescriptionAPI.checkInteractions();
      setInteractionResult({ interactions: res.interactions, severity: res.severity, checked: res.medicinesChecked });
    } catch (err) {
      console.error(err);
      toast.error('Failed to check interactions.');
    } finally {
      setCheckingInteractions(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 text-left">
      {showAiModal && <AIModalDisclaimer onAcknowledge={handleAcknowledgeAi} />}

      {/* Top Document Switcher: Lab reports vs Prescriptions */}
      <div className="flex items-center gap-2 border-b border-[#E5E7EB] dark:border-slate-800 pb-3">
        <Link
          to="/reports"
          className="px-4 py-2 rounded-lg text-sm font-medium text-[#4B5563] dark:text-slate-400 hover:text-[#121414] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          <span>Lab reports</span>
        </Link>
        <Link
          to="/prescriptions"
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#1A3BAA] text-white flex items-center gap-2 shadow-sm"
        >
          <ClipboardList className="w-4 h-4" />
          <span>Prescriptions</span>
        </Link>
      </div>

      <div className="text-left space-y-1.5">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#121414] dark:text-white flex items-center gap-2">
          <ClipboardList className="text-[#1A3BAA] w-7 h-7" />
          Understand a prescription
        </h1>
        <p className="text-sm text-[#4B5563] dark:text-slate-400">
          Upload handwritten or digital clinic prescriptions. Clarify medicine dosages, timing, and check for unsafe drug interactions in plain English.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload & History Listing */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upload Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
            <h3 className="text-sm font-bold text-[#121414] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-[#1A3BAA]" />
              Upload prescription
            </h3>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              <div className="border border-dashed border-[#E5E7EB] dark:border-slate-700 hover:border-[#1A3BAA] transition-colors rounded-xl p-6 text-center bg-[#F5F7FA] dark:bg-slate-800/50 cursor-pointer relative">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  multiple
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-[#1A3BAA] mx-auto mb-2" />
                <span className="text-sm text-[#121414] dark:text-slate-200 block font-semibold">
                  Select or drag prescription file
                </span>
                <span className="text-xs text-[#4B5563] dark:text-slate-400 mt-1 block">Supports PNG, JPG, PDF up to 5MB</span>
              </div>

              {/* Consent Checkbox */}
              <div className="space-y-2 pt-1 text-left">
                <label className="flex items-start gap-2.5 text-xs text-[#4B5563] dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded border-[#E5E7EB] text-[#1A3BAA] focus:ring-[#1A3BAA]"
                  />
                  <span>I agree to Pulse processing this prescription to explain it to me.</span>
                </label>
                <p className="text-xs text-[#4B5563] dark:text-slate-400 font-medium pl-6">
                  Your prescription is private to your account.
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-3 text-left">
                  <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider block">Selected files ({selectedFiles.length})</label>
                  <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                    {selectedFiles.map((file, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg border border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm text-xs text-slate-700 dark:text-slate-300">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-[#1A3BAA] shrink-0" />
                          <span className="truncate font-medium max-w-[180px]">{file.name}</span>
                          <span className="text-xs text-[#4B5563]">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="text-[#4B5563] hover:text-[#C62828] hover:bg-slate-100 p-1 rounded transition-colors shrink-0 flex items-center justify-center"
                          title="Remove file"
                        >
                          <span className="text-base leading-none font-bold">&times;</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploading}
                className="w-full h-11 bg-[#1A3BAA] hover:bg-[#142E86] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {uploading ? 'Processing prescription...' : selectedFiles.length > 0 ? `Explain prescription (${selectedFiles.length})` : 'Select file to explain'}
              </button>
            </form>
          </div>

          {/* Past Prescription Scans */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
            <h3 className="text-sm font-bold text-[#121414] dark:text-white uppercase tracking-wider">Past prescription scans</h3>

            {loading ? (
              <div className="space-y-3">
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
              </div>
            ) : prescriptions.length === 0 ? (
              <p className="text-sm text-[#4B5563] dark:text-slate-400 text-center py-4">No prescriptions scanned yet.</p>
            ) : (
              <div className="space-y-2">
                {prescriptions.map(pres => (
                  <div
                    key={pres.id}
                    onClick={() => selectPrescription(pres)}
                    className={`w-full p-3 rounded-lg border text-left flex items-center justify-between text-sm transition-all cursor-pointer ${
                      activePrescription?.id === pres.id
                        ? 'border-[#1A3BAA] bg-[#EEF2FC] text-[#121414] font-semibold'
                        : 'border-[#E5E7EB] dark:border-slate-800 bg-white dark:bg-slate-900 text-[#4B5563] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <ClipboardList className="w-4 h-4 text-[#1A3BAA] shrink-0" />
                      <div>
                        <span className="block truncate max-w-[150px] text-sm font-semibold">
                          {pres.id === 'sample-prescription'
                            ? 'Sample prescription (demo)'
                            : pres.prescriptionAnalysis && pres.prescriptionAnalysis.length > 0
                            ? pres.prescriptionAnalysis.map(m => m.medicineName).join(', ')
                            : `Scan #${pres.id.slice(0, 8)}`}
                        </span>
                        <span className="text-xs text-[#4B5563] block leading-none mt-1">Status: {pres.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[#4B5563]">{new Date(pres.createdAt).toLocaleDateString()}</span>
                      {pres.id !== 'sample-prescription' && (
                        <button
                          type="button"
                          onClick={(e) => handleDeletePrescription(pres.id, e)}
                          className="p-1 rounded text-[#4B5563] hover:text-[#C62828] hover:bg-red-50 transition-all"
                          title="Delete prescription"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Drug-Drug Interaction Checker Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
            <h3 className="text-sm font-bold text-[#121414] dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#1A3BAA]" />
              Drug interaction checker
            </h3>
            <p className="text-xs text-[#4B5563] dark:text-slate-400">
              Cross-reference all active medications across your prescriptions to detect potential overlapping side effects or interactions.
            </p>

            {interactionResult ? (
              <div className={`p-4 rounded-lg border text-left ${
                interactionResult.severity === 'HIGH'
                  ? 'bg-red-50 border-red-200 text-[#C62828]'
                  : interactionResult.severity === 'MODERATE'
                  ? 'bg-amber-50 border-amber-200 text-[#B45309]'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}>
                <p className="text-xs font-bold mb-1">Severity: {interactionResult.severity}</p>
                <p className="text-xs leading-relaxed">{interactionResult.interactions}</p>
                <p className="text-[11px] mt-2 opacity-80">Analyzed {interactionResult.checked} active medications.</p>
                <button
                  type="button"
                  onClick={() => setInteractionResult(null)}
                  className="text-xs font-semibold mt-2 underline cursor-pointer"
                >
                  Reset checker
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleCheckInteractions}
                disabled={checkingInteractions}
                className="w-full h-11 bg-[#1A3BAA] hover:bg-[#142E86] text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{checkingInteractions ? 'Checking interactions...' : 'Run interaction check'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Active Workspace */}
        <div className="lg:col-span-8 space-y-6">
          {activePrescription ? (
            <>
              {activePrescription.status === 'PENDING' || activePrescription.status === 'OCR_COMPLETED' ? (
                /* Dual-Pane Editor for Verification */
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB] dark:border-slate-800">
                    <div>
                      <h2 className="text-lg font-bold text-[#121414] dark:text-white">Verify prescription details</h2>
                      <p className="text-xs text-[#4B5563] dark:text-slate-400">Review raw extracted scanned text on the left, and confirm medicine details on the right.</p>
                    </div>
                    <span className="text-xs bg-amber-50 border border-amber-200 text-[#B45309] px-2.5 py-1 rounded-full font-semibold">
                      Verify draft
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Pane: Raw Text */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider block">Raw scanned text</label>
                      <textarea
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        rows={12}
                        className="w-full p-3.5 rounded-lg border border-[#E5E7EB] dark:border-slate-700 bg-[#F5F7FA] dark:bg-slate-800 text-sm leading-relaxed text-[#121414] dark:text-slate-200 font-mono"
                        placeholder="Extracted prescription text..."
                      />
                    </div>

                    {/* Right Pane: Medicine Form Fields */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider">Extracted medicines</label>
                        <button
                          type="button"
                          onClick={handleAddField}
                          className="text-xs font-semibold text-[#1A3BAA] flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add medicine row</span>
                        </button>
                      </div>

                      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                        {medicineFields.map((field, idx) => (
                          <div key={idx} className="p-3 border border-[#E5E7EB] dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 space-y-2 relative">
                            <button
                              type="button"
                              onClick={() => handleRemoveField(idx)}
                              className="absolute top-2 right-2 text-[#4B5563] hover:text-[#C62828] p-1 rounded"
                              title="Delete row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div className="space-y-2 text-xs">
                              <div>
                                <label className="text-[#4B5563] block mb-1 font-medium">Medicine name</label>
                                <input
                                  type="text"
                                  value={field.name}
                                  onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                                  placeholder="e.g. Paracetamol"
                                  className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] dark:border-slate-700 text-sm"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[#4B5563] block mb-1 font-medium">Dosage</label>
                                  <input
                                    type="text"
                                    value={field.dosage}
                                    onChange={(e) => handleFieldChange(idx, 'dosage', e.target.value)}
                                    placeholder="e.g. 650mg"
                                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] dark:border-slate-700 text-sm tabular-nums"
                                  />
                                </div>
                                <div>
                                  <label className="text-[#4B5563] block mb-1 font-medium">Instructions</label>
                                  <input
                                    type="text"
                                    value={field.instructions}
                                    onChange={(e) => handleFieldChange(idx, 'instructions', e.target.value)}
                                    placeholder="e.g. After meals"
                                    className="w-full h-10 px-3 rounded-lg border border-[#E5E7EB] dark:border-slate-700 text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E5E7EB] dark:border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={initiateVerifySubmit}
                      disabled={verifying}
                      className="h-11 px-6 bg-[#1A3BAA] hover:bg-[#142E86] text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <span>{verifying ? 'Running Pulse analysis...' : 'Confirm and explain in plain English'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Structured Results Display */
                <div className="space-y-6">
                  {/* Medical Disclaimer Banner */}
                  <MedicalDisclaimer />

                  <div className="bg-white dark:bg-slate-900 rounded-xl p-5 sm:p-6 border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-6">
                    <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB] dark:border-slate-800">
                      <div>
                        <h2 className="text-lg font-bold text-[#121414] dark:text-white">Prescription analysis</h2>
                        <span className="text-xs text-[#4B5563]">
                          {activePrescription.id === 'sample-prescription' ? 'Sample demonstration' : `Scan ID: ${activePrescription.id.slice(0, 8)}`}
                        </span>
                      </div>
                      <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Analyzed</span>
                      </span>
                    </div>

                    {activePrescription.prescriptionAnalysis.length === 0 ? (
                      <div className="p-8 text-center bg-[#F5F7FA] dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl max-w-lg mx-auto space-y-2">
                        <Info className="w-8 h-8 text-[#1A3BAA] mx-auto" />
                        <h4 className="font-bold text-[#121414] dark:text-white text-base">No medicines recognized</h4>
                        <p className="text-sm text-[#4B5563] dark:text-slate-400">
                          This document may be an ultrasound, radiology report, or lab panel rather than a prescription.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activePrescription.prescriptionAnalysis.map((med, index) => (
                          <div
                            key={index}
                            className="p-5 bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl flex flex-col justify-between space-y-4"
                          >
                            <div className="space-y-3">
                              <div className="flex justify-between items-start gap-4">
                                <div>
                                  <h4 className="font-bold text-[#121414] dark:text-white text-base">{med.medicineName}</h4>
                                  <span className="text-xs font-semibold text-[#1A3BAA] block mt-0.5 tabular-nums">
                                    Dosage: {med.dosage}
                                  </span>
                                </div>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div>
                                  <span className="text-xs font-bold text-[#4B5563] uppercase tracking-wider block">Timing & instructions</span>
                                  <p className="text-[#121414] dark:text-slate-200 mt-0.5 leading-normal">{med.instructions}</p>
                                </div>

                                <div>
                                  <span className="text-xs font-bold text-[#4B5563] uppercase tracking-wider block">Plain-English explanation</span>
                                  <p className="text-[#4B5563] dark:text-slate-400 mt-0.5 leading-normal">{med.simplifiedExplanation}</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2 pt-3 border-t border-[#E5E7EB] dark:border-slate-700">
                              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 text-xs text-[#B45309] rounded-lg">
                                <strong className="block mb-0.5">Common side effects:</strong>
                                {med.sideEffects}
                              </div>
                              <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 text-xs text-[#C62828] rounded-lg">
                                <strong className="block mb-0.5">Important interaction warnings:</strong>
                                {med.drugInteractions}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-12 border border-[#E5E7EB] dark:border-slate-800 text-center text-[#4B5563] flex flex-col items-center justify-center min-h-[350px]">
              <ClipboardList className="w-10 h-10 text-[#1A3BAA] mb-3" />
              <p className="text-base font-semibold text-[#121414] dark:text-white">No active prescription selected</p>
              <p className="text-sm text-[#4B5563] mt-1">Upload a prescription image or select a scan from your history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
