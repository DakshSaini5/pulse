import React, { useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import { reportAPI, hospitalAPI, Hospital, MedicalReport } from '@core/services/api';
import { getInitialLocation } from '@core/utils/geolocation';
import { 
  FileText, UploadCloud, CheckCircle, AlertTriangle, 
  HelpCircle, Sparkles, Plus, Trash2, Edit, Save, 
  ArrowRight, ShieldCheck, Heart, User, MapPin, Gauge
} from 'lucide-react';
import { useAuth } from '@core/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MedicalDisclaimer, AIModalDisclaimer } from '../components/MedicalDisclaimer';
import toast from 'react-hot-toast'; // BUG-07 FIX

const parseReportValuesFromRawText = (text: string, category: string): Array<{ key: string; value: number; unit: string; referenceRange: string; isAbnormal: boolean; description?: string; category: string }> => {
  if (!text) return [{ key: '', value: 0, unit: '', referenceRange: '', isAbnormal: false, description: '', category }];
  
  const lines = text.split('\n');
  const found: Array<{ key: string; value: number; unit: string; referenceRange: string; isAbnormal: boolean; description?: string; category: string }> = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Matches marker key name, numeric value, unit, and reference range
    // e.g. "TSH (Thyroid Stimulating Hormone): 5.85 uIU/mL (Reference: 0.40 - 4.50)"
    const match = trimmed.match(/^([A-Za-z\s\(\)\-\/0-9]+?)\s*:\s*(\d+(?:\.\d+)?)\s*([A-Za-z\/\^\d%]+)\s*(?:\(Reference:?\s*([^\)]+)\)|\(([^\)]+)\))?/i);
    if (match) {
      const key = match[1].trim();
      const value = parseFloat(match[2]);
      const unit = match[3].trim();
      const referenceRange = (match[4] || match[5] || '').trim();
      
      let isAbnormal = false;
      if (referenceRange) {
        const rangeMatch = referenceRange.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
        if (rangeMatch) {
          const min = parseFloat(rangeMatch[1]);
          const max = parseFloat(rangeMatch[2]);
          if (value < min || value > max) {
            isAbnormal = true;
          }
        }
      }
      
      if (key && !isNaN(value)) {
        found.push({
          key,
          value,
          unit,
          referenceRange,
          isAbnormal,
          description: '',
          category
        });
      }
    }
  }
  
  if (found.length === 0) {
    return [{ key: '', value: 0, unit: '', referenceRange: '', isAbnormal: false, description: '', category }];
  }
  return found;
};

export const ReportCenter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Creation States
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [activeReport, setActiveReport] = useState<MedicalReport | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);

  const SAMPLE_REPORT: MedicalReport = {
    id: 'sample-report',
    reportType: 'Complete Blood Count (CBC)',
    status: 'COMPLETED',
    reportDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    fileUrl: '',
    ocrResult: {
      rawText: "Hemoglobin (Hb): 8.2 g/dL (Reference: 12.0 - 16.0)\nPlatelet Count: 88,000 /uL (Reference: 150,000 - 450,000)\nWBC Count: 6,400 /uL (Reference: 4,000 - 11,000)",
      verifiedData: "Hemoglobin is below standard reference range. Platelet count indicates mild thrombocytopenia. White blood cell count is normal.",
    },
    values: [
      { id: 'v1', key: 'Hemoglobin (Hb)', value: 8.2, unit: 'g/dL', referenceRange: '12.0 - 16.0', isAbnormal: true, category: 'Complete Blood Count (CBC)', description: 'Low red blood cell oxygen carrying protein' },
      { id: 'v2', key: 'Platelet Count', value: 88000, unit: '/uL', referenceRange: '150,000 - 450,000', isAbnormal: true, category: 'Complete Blood Count (CBC)', description: 'Low blood clotting cell count' },
      { id: 'v3', key: 'WBC Count', value: 6400, unit: '/uL', referenceRange: '4,000 - 11,000', isAbnormal: false, category: 'Complete Blood Count (CBC)', description: 'Normal immune cell count' }
    ],
    summary: {
      healthSummary: "Hemoglobin is below standard reference range. Platelet count indicates mild thrombocytopenia. White blood cell count is normal.",
      normalFindingsCount: 1,
      abnormalFindingsCount: 2,
      overallStatus: "ATTENTION_REQUIRED"
    },
    specialists: [
      { specialtyName: 'General Medicine', reason: 'Comprehensive clinical evaluation', confidenceScore: 0.95, recommendedHospitalsJson: '[]' }
    ]
  };
  
  // Verification dual-pane states
  const [rawText, setRawText] = useState('');
  const [reportType, setReportType] = useState('CBC');
  const [reportValues, setReportValues] = useState<Array<{ key: string; value: number; unit: string; referenceRange: string; isAbnormal: boolean; description?: string; category: string }>>([]);
  const [verifying, setVerifying] = useState(false);
  const [matchedHospitals, setMatchedHospitals] = useState<Hospital[]>([]);
  const [showAiModal, setShowAiModal] = useState(false);
  const [hasAcknowledgedAi, setHasAcknowledgedAi] = useState(false);
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);

  const fetchReports = async (userLat = lat, userLng = lng) => {
    if (!user) {
      setReports([SAMPLE_REPORT]);
      selectReport(SAMPLE_REPORT, userLat, userLng);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const resData = await reportAPI.getAll();
      const reportList = Array.isArray(resData) ? resData : (resData?.data || []);
      setReports(reportList);
      if (reportList.length > 0) {
        selectReport(reportList[0], userLat, userLng);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchedHospitals = async (specialtyName: string, userLat = lat, userLng = lng) => {
    try {
      const data = await hospitalAPI.search('', specialtyName, 25, userLat, userLng);
      setMatchedHospitals(data.slice(0, 3));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const loadLocation = () => {
      getInitialLocation()
        .then((res) => {
          setLat(res.latitude);
          setLng(res.longitude);
          fetchReports(res.latitude, res.longitude);
        })
        .catch(err => {
          console.warn('Geolocation failed:', err);
          fetchReports();
        });
    };

    loadLocation();

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' })
        .then((status) => {
          status.onchange = () => {
            if (status.state === 'granted') {
              loadLocation();
            }
          };
        })
        .catch(err => console.log('Permissions API query not supported:', err));
    }
  }, []);

  const selectReport = (rep: MedicalReport, userLat = lat, userLng = lng) => {
    setActiveReport(rep);
    const rawOcrText = rep.ocrResult?.rawText || '';
    setRawText(rawOcrText);
    setReportType(rep.reportType);
    
    if (rep.values && rep.values.length > 0) {
      setReportValues(rep.values);
    } else {
      setReportValues(parseReportValuesFromRawText(rawOcrText, rep.reportType));
    }
    
    if (rep.specialists && rep.specialists.length > 0) {
      fetchMatchedHospitals(rep.specialists[0].specialtyName, userLat, userLng);
    } else {
      setMatchedHospitals([]);
    }
  };

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

  // BUG-20 FIX: Delete report from history
  const handleDeleteReport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this medical report? This cannot be undone.')) return;
    try {
      await reportAPI.delete(id);
      setReports(prev => prev.filter(r => r.id !== id));
      if (activeReport?.id === id) setActiveReport(null);
      toast.success('Report deleted.');
    } catch (err) {
      toast.error('Failed to delete report.');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=/reports');
      toast.error('Please sign in to upload and save your personal reports.');
      return;
    }
    if (!consentGiven) {
      toast.error('Please agree to processing before uploading your report.');
      return;
    }
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      let lastRes: MedicalReport | null = null;
      const uploadedList: MedicalReport[] = [];

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
        const res = await reportAPI.upload(file);
        uploadedList.push(res);
        lastRes = res;
      }

      setReports(prev => [...uploadedList, ...prev]);

      if (lastRes) {
        selectReport(lastRes);
      }
      setSelectedFiles([]);
    } catch (err) {
      console.error(err);
      toast.error('OCR extraction failed. Please try a clearer image or a higher-quality PDF.'); // BUG-07 FIX
    } finally {
      setUploading(false);
    }
  };

  const handleAddField = () => {
    setReportValues(prev => [...prev, { key: '', value: 0, unit: '', referenceRange: '', isAbnormal: false, description: '', category: reportType }]);
  };

  const handleRemoveField = (idx: number) => {
    setReportValues(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFieldChange = (idx: number, key: string, val: any) => {
    setReportValues(prev => {
      const copy = [...prev];
      (copy[idx] as any)[key] = val;
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
    if (!activeReport) return;
    setVerifying(true);
    try {
      const payload = {
        rawText,
        reportType,
        values: reportValues
      };
      const res = await reportAPI.verify(activeReport.id, payload);
      
      // Update local listing
      setReports(prev => prev.map(p => p.id === res.id ? res : p));
      setActiveReport(res);
      if (res.specialists && res.specialists.length > 0) {
        fetchMatchedHospitals(res.specialists[0].specialtyName);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'AI Engine failed to parse the report. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-left">
      {showAiModal && <AIModalDisclaimer onAcknowledge={handleAcknowledgeAi} />}
      
      <div className="text-left space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#121414] dark:text-white flex items-center gap-2">
          <FileText className="text-[#1A3BAA] w-7 h-7" />
          Understand a report
        </h1>
        <p className="text-sm text-[#4B5563] dark:text-slate-400">
          Upload blood panels, thyroid tests or general laboratory reports to get them explained in plain English.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: upload & history listing */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upload card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
            <h3 className="text-sm font-bold text-[#121414] dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-[#1A3BAA]" />
              Upload Medical Report File
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
                  Select or drag lab report sheet(s)
                </span>
                <span className="text-xs text-[#4B5563] dark:text-slate-400 mt-1 block">Supports PNG, JPG, PDF up to 5MB</span>
              </div>

              {/* Unticked consent checkbox & privacy note per developer brief */}
              <div className="space-y-2 pt-1 text-left">
                <label className="flex items-start gap-2.5 text-xs text-[#4B5563] dark:text-slate-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    className="mt-0.5 rounded border-[#E5E7EB] text-[#1A3BAA] focus:ring-[#1A3BAA]"
                  />
                  <span>I agree to Pulse processing this report to explain it to me.</span>
                </label>
                <p className="text-xs text-[#4B5563] dark:text-slate-400 font-medium pl-6">
                  Your report is private to your account.
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2 mt-3 text-left">
                  <label className="text-xs font-bold text-[#4B5563] uppercase tracking-wider block">Selected Files ({selectedFiles.length})</label>
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
                          title="Remove File"
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
                {uploading ? 'Processing report...' : selectedFiles.length > 0 ? `Explain Report (${selectedFiles.length})` : 'Select File to Explain'}
              </button>
            </form>
          </div>

          {/* Historical Listing */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Report Scan History</h3>

            {loading ? (
              <div className="space-y-3">
                <div className="h-10 bg-slate-800 rounded animate-pulse" />
                <div className="h-10 bg-slate-800 rounded animate-pulse" />
              </div>
            ) : reports.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 text-center py-4">No reports analyzed yet.</p>
            ) : (
              <div className="space-y-2">
                {reports.map(rep => (
                  <div
                    key={rep.id}
                    onClick={() => selectReport(rep)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all cursor-pointer ${
                      activeReport?.id === rep.id
                        ? 'border-primary bg-primary/10 text-slate-900 dark:text-white font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span className="block truncate max-w-[140px] text-xs font-semibold">
                          {rep.status === 'ANALYZED' || rep.reportType !== 'GENERAL'
                            ? `${rep.reportType === 'GENERAL' ? 'Medical' : rep.reportType} Report`
                            : `Scan #${rep.id.slice(0, 8)}`}
                        </span>
                        <span className="text-[9px] text-slate-500 dark:text-slate-400 block leading-none mt-1">Status: {rep.status}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(rep.createdAt).toLocaleDateString()}</span>
                      {/* BUG-20 FIX: Delete button */}
                      <button
                        type="button"
                        onClick={(e) => handleDeleteReport(rep.id, e)}
                        className="p-1 rounded-lg text-slate-400 hover:text-danger hover:bg-danger/10 transition-all"
                        title="Delete report"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column: workspaces */}
        <div className="lg:col-span-8 space-y-6">
          {activeReport ? (
            <>
              {/* Dual-Pane Editor for Verification */}
              {activeReport.status === 'PENDING' || activeReport.status === 'OCR_COMPLETED' ? (
                <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Report Verification Desk</h2>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500">Review raw extracted scanned text on the left, and fill/correct lab parameters on the right.</p>
                    </div>
                    <span className="text-[10px] bg-warning/15 border border-warning/25 text-warning px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Verify report Draft
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Pane: Raw Text */}
                    <div className="space-y-3 text-left">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Report Category Type</label>
                        <select
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-900 dark:text-white"
                        >
                          <option value="CBC">🫁 CBC (Blood Panel)</option>
                          <option value="THYROID">🦋 Thyroid Profile</option>
                          <option value="HBA1C">🍭 HbA1c (Diabetes)</option>
                          <option value="LIPID">🫀 Lipid Panel (Cholesterol)</option>
                          <option value="VITAMIN">🍊 Vitamin Profile</option>
                          <option value="GENERAL">🔬 General Chemistry</option>
                          <option value="IMAGING">📸 Imaging / Scan (Ultrasound, X-Ray, MRI)</option>
                          <option value="NOTES">📝 Clinical Doctor Notes</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Raw Scanned OCR Output</label>
                        <textarea
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          rows={12}
                          className="w-full p-4 rounded-2xl glass-input text-xs font-mono leading-relaxed text-slate-600 dark:text-slate-300"
                        />
                      </div>
                    </div>

                    {/* Right Pane: Structured Fields Verification */}
                    <div className="space-y-4 text-left">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Biological Parameters</label>
                        <button
                          onClick={handleAddField}
                          className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Marker Row
                        </button>
                      </div>

                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2">
                        {reportValues.map((field, idx) => (
                          <div key={idx} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/[0.01] space-y-2 relative">
                            <button
                              onClick={() => handleRemoveField(idx)}
                              className="absolute top-2 right-2 text-slate-500 dark:text-slate-400 dark:text-slate-500 hover:text-danger p-1"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div className="space-y-2 text-[10px] font-semibold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-slate-500 dark:text-slate-400 dark:text-slate-500 block mb-0.5">Marker (e.g. TSH, Hb)</label>
                                  <input
                                    type="text"
                                    value={field.key}
                                    onChange={(e) => handleFieldChange(idx, 'key', e.target.value)}
                                    placeholder="TSH"
                                    className="w-full p-2 rounded-lg glass-input text-xs text-slate-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-slate-500 dark:text-slate-400 dark:text-slate-500 block mb-0.5">Value</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={field.value}
                                    onChange={(e) => handleFieldChange(idx, 'value', parseFloat(e.target.value))}
                                    placeholder="2.4"
                                    className="w-full p-2 rounded-lg glass-input text-xs text-slate-900 dark:text-white"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-slate-500 dark:text-slate-400 dark:text-slate-500 block mb-0.5">Unit</label>
                                  <input
                                    type="text"
                                    value={field.unit}
                                    onChange={(e) => handleFieldChange(idx, 'unit', e.target.value)}
                                    placeholder="uIU/mL"
                                    className="w-full p-2 rounded-lg glass-input text-xs text-slate-900 dark:text-white"
                                  />
                                </div>
                                <div>
                                  <label className="text-slate-500 dark:text-slate-400 dark:text-slate-500 block mb-0.5">Ref Range</label>
                                  <input
                                    type="text"
                                    value={field.referenceRange}
                                    onChange={(e) => handleFieldChange(idx, 'referenceRange', e.target.value)}
                                    placeholder="0.4 - 4.5"
                                    className="w-full p-2 rounded-lg glass-input text-xs text-slate-900 dark:text-white"
                                  />
                                </div>
                                <div className="text-left flex flex-col justify-end pb-1.5 pl-2">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-300 text-xs">
                                    <input
                                      type="checkbox"
                                      checked={field.isAbnormal}
                                      onChange={(e) => handleFieldChange(idx, 'isAbnormal', e.target.checked)}
                                      className="accent-danger w-3.5 h-3.5"
                                    />
                                    Abnormal
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                    <button
                      onClick={initiateVerifySubmit}
                      disabled={verifying}
                      className="px-6 py-3 bg-primary hover:bg-primary-hover text-slate-900 dark:text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 animate-spin" />
                      {verifying ? 'Generating report analysis...' : 'Submit & Analyze with Pulse AI'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Analyzed Interactive dashboard view */
                <div className="space-y-6 text-left">
                  <MedicalDisclaimer />
                  
                  {/* Summary Box */}
                  <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-[#E5E7EB] dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-[#E5E7EB] dark:border-slate-800">
                      <div>
                        <h2 className="text-lg font-bold text-[#121414] dark:text-white">Report Snapshot: {activeReport.reportType}</h2>
                        <span className="text-xs text-[#4B5563] dark:text-slate-400">Recorded: {new Date(activeReport.reportDate).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        activeReport.summary?.overallStatus === 'STABLE'
                          ? 'bg-[#EEF2FC] border-[#1A3BAA]/30 text-[#1A3BAA]'
                          : 'bg-red-50 border-red-200 text-[#C62828]'
                      }`}>
                        Status: {activeReport.summary?.overallStatus || 'STABLE'}
                      </span>
                    </div>

                    {activeReport.summary && (
                      <div className="space-y-4">
                        <p className="text-sm text-[#121414] dark:text-slate-200 leading-[1.6]">
                          {activeReport.summary.healthSummary}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 max-w-sm">
                          <div className="p-3 bg-[#F5F7FA] border border-[#E5E7EB] rounded-lg">
                            <span className="text-xs text-[#4B5563] block font-semibold uppercase">Normal Findings</span>
                            <span className="text-2xl font-extrabold text-[#12805C] mt-1 block">
                              {activeReport.summary.normalFindingsCount}
                            </span>
                          </div>
                          <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                            <span className="text-xs text-[#C62828] block font-semibold uppercase">Abnormal Findings</span>
                            <span className="text-2xl font-extrabold text-[#C62828] mt-1 block">
                              {activeReport.summary.abnormalFindingsCount}
                            </span>
                          </div>
                        </div>

                        {/* Safety note under every report explanation per brief */}
                        <div className="p-3 bg-[#F5F7FA] dark:bg-slate-800/40 border border-[#E5E7EB] dark:border-slate-800 rounded-lg text-xs text-[#4B5563] dark:text-slate-400">
                          This explains your report in simple words. It is not medical advice. Discuss results with your doctor.
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Biological dials cards */}
                  <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 space-y-6">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Gauge className="w-4.5 h-4.5 text-primary" />
                      Parameter index values
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(activeReport.values || []).map((val) => (
                        <div 
                          key={val.id} 
                          className={`p-4 border rounded-2xl flex flex-col justify-between space-y-3 ${
                            val.isAbnormal 
                              ? 'border-danger/20 bg-danger/[0.01]' 
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/[0.005]'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-slate-900 dark:text-white">{val.key}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                val.isAbnormal ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'
                              }`}>
                                {val.isAbnormal ? 'Out of Range' : 'Normal'}
                              </span>
                            </div>
                            
                            <div className="flex items-baseline gap-1 mt-2">
                              <span className={`text-2xl font-extrabold ${val.isAbnormal ? 'text-danger' : 'text-slate-900 dark:text-white'}`}>
                                {val.value}
                              </span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500">{val.unit}</span>
                            </div>
                            
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium block mt-1">Ref Range: {val.referenceRange}</span>
                          </div>

                          {val.description && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 font-light border-t border-slate-200 dark:border-slate-700 pt-2 leading-relaxed">
                              {val.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Specialist Mapping Routing */}
                  {activeReport.specialists && activeReport.specialists.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                      {/* Specialist recommendation card */}
                      <div className="md:col-span-5 glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">🔬 Specialist Referral</h3>
                        
                        <div className="space-y-4">
                          {(activeReport.specialists || []).map((spec, i) => (
                            <div key={i} className="p-4 bg-primary/10 border border-primary/20 rounded-2xl space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-extrabold text-slate-900 dark:text-white">{spec.specialtyName}</span>
                                <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full">
                                  {Math.round(spec.confidenceScore * 100)}% Confidence
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-normal font-light">
                                {spec.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Matching Hospitals links */}
                      <div className="md:col-span-7 glass-panel rounded-3xl p-6 border border-slate-200 dark:border-slate-700 space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">🏥 Specialty Facilities Nearby</h3>
                        
                        <div className="space-y-3">
                          {matchedHospitals.length === 0 ? (
                            <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 py-4 text-center">
                              Locating matching specialist clinics near {localStorage.getItem('pulse_city_name') || 'your area'}...
                            </p>
                          ) : (
                            matchedHospitals.map(h => (
                              <div 
                                key={h.id} 
                                className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-primary/20 hover:bg-primary/[0.01] rounded-2xl flex items-center justify-between transition-all cursor-pointer"
                                onClick={() => navigate(`/hospitals/${h.id}`)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700">
                                    H
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-900 dark:text-white block truncate max-w-[160px]">{h.name}</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 flex items-center gap-0.5 mt-0.5 truncate max-w-[160px]">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {h.address}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right flex items-center gap-2">
                                  <div className="text-xs font-semibold">
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 block uppercase leading-none">Match Score</span>
                                    <span className="text-primary font-extrabold mt-0.5 block leading-none">{h.recommendationScore}%</span>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500 shrink-0" />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="glass-panel rounded-3xl p-16 border border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center min-h-[400px]">
              <FileText className="w-12 h-12 text-slate-600 dark:text-slate-300 mb-3 animate-pulse" />
              <p className="text-sm font-semibold">No active scan workspace open.</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 mt-1">Please upload a blood sheet or lab report to start, or select a past scan from the history board.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
