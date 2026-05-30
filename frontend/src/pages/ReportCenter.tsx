import React, { useState, useEffect } from 'react';
import { reportAPI, hospitalAPI, Hospital, MedicalReport } from '../services/api';
import { 
  FileText, UploadCloud, CheckCircle, AlertTriangle, 
  HelpCircle, Sparkles, Plus, Trash2, Edit, Save, 
  ArrowRight, ShieldCheck, Heart, User, MapPin, Gauge
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  
  // Verification dual-pane states
  const [rawText, setRawText] = useState('');
  const [reportType, setReportType] = useState('CBC');
  const [reportValues, setReportValues] = useState<Array<{ key: string; value: number; unit: string; referenceRange: string; isAbnormal: boolean; description?: string; category: string }>>([]);
  const [verifying, setVerifying] = useState(false);
  const [matchedHospitals, setMatchedHospitals] = useState<Hospital[]>([]);

  const fetchReports = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setLoading(true);
    try {
      const data = await reportAPI.getAll();
      setReports(data);
      if (data.length > 0) {
        selectReport(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchedHospitals = async (specialtyName: string) => {
    try {
      const data = await hospitalAPI.search('', specialtyName, 25);
      setMatchedHospitals(data.slice(0, 3));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const selectReport = (rep: MedicalReport) => {
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
      fetchMatchedHospitals(rep.specialists[0].specialtyName);
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;
    setUploading(true);
    try {
      let lastRes: MedicalReport | null = null;
      const uploadedList: MedicalReport[] = [];

      for (const file of selectedFiles) {
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
      alert('OCR extraction failed. Let us try fallback simulators.');
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
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 text-left">
      <div className="text-left space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
          <FileText className="text-primary w-8 h-8 animate-pulse" />
          Medical Report Analytics & Simplifier
        </h1>
        <p className="text-xs text-slate-500">Scan blood panels, thyroid sheets or general lab reports. Review extraction parameters, verify indexes, and receive expert specialist suggestions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left column: upload & history listing */}
        <div className="lg:col-span-4 space-y-6">
          {/* Upload card */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/50 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-primary" />
              Upload Medical Report File
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
                  Select or drag lab report sheet(s)
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

          {/* Historical Listing */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-200 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Report Scan History</h3>

            {loading ? (
              <div className="space-y-3">
                <div className="h-10 bg-slate-800 rounded animate-pulse" />
                <div className="h-10 bg-slate-800 rounded animate-pulse" />
              </div>
            ) : reports.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No reports analyzed yet.</p>
            ) : (
              <div className="space-y-2">
                {reports.map(rep => (
                  <button
                    key={rep.id}
                    onClick={() => selectReport(rep)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between text-xs transition-all ${
                      activeReport?.id === rep.id
                        ? 'border-primary bg-primary/10 text-slate-900 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <div>
                        <span className="block truncate max-w-[140px] text-xs font-semibold">
                          {rep.status === 'ANALYZED' || rep.reportType !== 'GENERAL'
                            ? `${rep.reportType === 'GENERAL' ? 'Medical' : rep.reportType} Report`
                            : `Scan #${rep.id.slice(0, 8)}`}
                        </span>
                        <span className="text-[9px] text-slate-500 block leading-none mt-1">Status: {rep.status}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500">{new Date(rep.createdAt).toLocaleDateString()}</span>
                  </button>
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
                <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Report Verification Desk</h2>
                      <p className="text-[10px] text-slate-500">Review raw extracted scanned text on the left, and fill/correct lab parameters on the right.</p>
                    </div>
                    <span className="text-[10px] bg-warning/15 border border-warning/25 text-warning px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Verify report Draft
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Pane: Raw Text */}
                    <div className="space-y-3 text-left">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Report Category Type</label>
                        <select
                          value={reportType}
                          onChange={(e) => setReportType(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl glass-input text-xs text-slate-900"
                        >
                          <option value="CBC">🫁 CBC (Blood Panel)</option>
                          <option value="THYROID">🦋 Thyroid Profile</option>
                          <option value="HBA1C">🍭 HbA1c (Diabetes)</option>
                          <option value="LIPID">🫀 Lipid Panel (Cholesterol)</option>
                          <option value="VITAMIN">🍊 Vitamin Profile</option>
                          <option value="GENERAL">🔬 General Chemistry</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Raw Scanned OCR Output</label>
                        <textarea
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          rows={12}
                          className="w-full p-4 rounded-2xl glass-input text-xs font-mono leading-relaxed text-slate-600"
                        />
                      </div>
                    </div>

                    {/* Right Pane: Structured Fields Verification */}
                    <div className="space-y-4 text-left">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Biological Parameters</label>
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
                          <div key={idx} className="p-3 border border-slate-200 rounded-xl bg-white/[0.01] space-y-2 relative">
                            <button
                              onClick={() => handleRemoveField(idx)}
                              className="absolute top-2 right-2 text-slate-500 hover:text-danger p-1"
                              title="Delete Row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                            <div className="space-y-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-slate-500 block mb-0.5">Marker (e.g. TSH, Hb)</label>
                                  <input
                                    type="text"
                                    value={field.key}
                                    onChange={(e) => handleFieldChange(idx, 'key', e.target.value)}
                                    placeholder="TSH"
                                    className="w-full p-2 rounded-lg glass-input text-xs text-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="text-slate-500 block mb-0.5">Value</label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={field.value}
                                    onChange={(e) => handleFieldChange(idx, 'value', parseFloat(e.target.value))}
                                    placeholder="2.4"
                                    className="w-full p-2 rounded-lg glass-input text-xs text-slate-900"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-slate-500 block mb-0.5">Unit</label>
                                  <input
                                    type="text"
                                    value={field.unit}
                                    onChange={(e) => handleFieldChange(idx, 'unit', e.target.value)}
                                    placeholder="uIU/mL"
                                    className="w-full p-2 rounded-lg glass-input text-xs text-slate-900"
                                  />
                                </div>
                                <div>
                                  <label className="text-slate-500 block mb-0.5">Ref Range</label>
                                  <input
                                    type="text"
                                    value={field.referenceRange}
                                    onChange={(e) => handleFieldChange(idx, 'referenceRange', e.target.value)}
                                    placeholder="0.4 - 4.5"
                                    className="w-full p-2 rounded-lg glass-input text-xs text-slate-900"
                                  />
                                </div>
                                <div className="text-left flex flex-col justify-end pb-1.5 pl-2">
                                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 text-xs">
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

                  <div className="pt-4 border-t border-slate-200 flex justify-end">
                    <button
                      onClick={handleVerifySubmit}
                      disabled={verifying}
                      className="px-6 py-3 bg-primary hover:bg-primary-hover text-slate-900 text-xs font-bold rounded-xl shadow-lg shadow-primary/20 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 animate-spin" />
                      {verifying ? 'Generating report analysis...' : 'Submit & Analyze with Gemini'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Analyzed Interactive dashboard view */
                <div className="space-y-6 text-left">
                  {/* Summary Box */}
                  <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-4 relative overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100/50">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
                    
                    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                      <div>
                        <h2 className="text-lg font-bold text-slate-900">Report Snapshot: {activeReport.reportType}</h2>
                        <span className="text-[10px] text-slate-500">Recorded: {new Date(activeReport.reportDate).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                        activeReport.summary?.overallStatus === 'STABLE'
                          ? 'bg-success/15 border-success/25 text-success'
                          : 'bg-danger/15 border-danger/25 text-danger'
                      }`}>
                        Status: {activeReport.summary?.overallStatus || 'STABLE'}
                      </span>
                    </div>

                    {activeReport.summary && (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-600 font-light leading-relaxed">
                          {activeReport.summary.healthSummary}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 max-w-sm">
                          <div className="p-3 bg-success/10 border border-success/15 rounded-xl">
                            <span className="text-[10px] text-slate-500 block font-bold uppercase">Normal Findings</span>
                            <span className="text-2xl font-extrabold text-success mt-1 block">
                              {activeReport.summary.normalFindingsCount}
                            </span>
                          </div>
                          <div className="p-3 bg-danger/10 border border-danger/15 rounded-xl">
                            <span className="text-[10px] text-slate-500 block font-bold uppercase">Abnormal Findings</span>
                            <span className="text-2xl font-extrabold text-danger mt-1 block">
                              {activeReport.summary.abnormalFindingsCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Biological dials cards */}
                  <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Gauge className="w-4.5 h-4.5 text-primary" />
                      Parameter index values
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeReport.values.map((val) => (
                        <div 
                          key={val.id} 
                          className={`p-4 border rounded-2xl flex flex-col justify-between space-y-3 ${
                            val.isAbnormal 
                              ? 'border-danger/20 bg-danger/[0.01]' 
                              : 'border-slate-200 bg-white/[0.005]'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <span className="text-xs font-bold text-slate-900">{val.key}</span>
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                val.isAbnormal ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success'
                              }`}>
                                {val.isAbnormal ? 'Out of Range' : 'Normal'}
                              </span>
                            </div>
                            
                            <div className="flex items-baseline gap-1 mt-2">
                              <span className={`text-2xl font-extrabold ${val.isAbnormal ? 'text-danger' : 'text-slate-900'}`}>
                                {val.value}
                              </span>
                              <span className="text-[10px] text-slate-500">{val.unit}</span>
                            </div>
                            
                            <span className="text-[10px] text-slate-500 font-medium block mt-1">Ref Range: {val.referenceRange}</span>
                          </div>

                          {val.description && (
                            <p className="text-[10px] text-slate-500 font-light border-t border-slate-200 pt-2 leading-relaxed">
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
                      <div className="md:col-span-5 glass-panel rounded-3xl p-6 border border-slate-200 space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">🔬 Specialist Referral</h3>
                        
                        <div className="space-y-4">
                          {activeReport.specialists.map((spec, i) => (
                            <div key={i} className="p-4 bg-primary/10 border border-primary/20 rounded-2xl space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-extrabold text-slate-900">{spec.specialtyName}</span>
                                <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full">
                                  {Math.round(spec.confidenceScore * 100)}% Confidence
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-600 leading-normal font-light">
                                {spec.reason}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Matching Hospitals links */}
                      <div className="md:col-span-7 glass-panel rounded-3xl p-6 border border-slate-200 space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">🏥 Specialty Facilities Nearby</h3>
                        
                        <div className="space-y-3">
                          {matchedHospitals.length === 0 ? (
                            <p className="text-xs text-slate-500 py-4 text-center">Locating matching specialist clinics near Delhi...</p>
                          ) : (
                            matchedHospitals.map(h => (
                              <div 
                                key={h.id} 
                                className="p-3 bg-slate-50 border border-slate-200 hover:border-primary/20 hover:bg-primary/[0.01] rounded-2xl flex items-center justify-between transition-all cursor-pointer"
                                onClick={() => navigate(`/hospitals/${h.id}`)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-200 text-xs font-bold text-slate-700">
                                    H
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-slate-900 block truncate max-w-[160px]">{h.name}</span>
                                    <span className="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5 truncate max-w-[160px]">
                                      <MapPin className="w-3.5 h-3.5" />
                                      {h.address}
                                    </span>
                                  </div>
                                </div>

                                <div className="text-right flex items-center gap-2">
                                  <div className="text-xs font-semibold">
                                    <span className="text-[10px] text-slate-500 block uppercase leading-none">Match Score</span>
                                    <span className="text-primary font-extrabold mt-0.5 block leading-none">{h.recommendationScore}%</span>
                                  </div>
                                  <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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
              <FileText className="w-12 h-12 text-slate-600 mb-3 animate-pulse" />
              <p className="text-sm font-semibold">No active scan workspace open.</p>
              <p className="text-xs text-slate-500 mt-1">Please upload a blood sheet or lab report to start, or select a past scan from the history board.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
