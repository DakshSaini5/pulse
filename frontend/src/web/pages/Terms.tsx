import React from 'react';
import { Scale, FileText, CheckSquare, AlertCircle } from 'lucide-react';

export const Terms: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-16 space-y-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full text-primary mb-2">
          <Scale className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Terms of Service</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Please read these terms carefully before using Pulse Healthcare. By using our platform, you agree to these conditions.
        </p>
      </div>

      {/* Policy Blocks */}
      <div className="space-y-6">
        
        {/* Block 1 */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
              <AlertCircle className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Not Medical Advice</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Pulse Healthcare provides AI-assisted insights, hospital comparisons, and OCR extraction. <strong>We do not provide professional medical advice, diagnosis, or treatment.</strong> You should never disregard professional medical advice or delay in seeking it because of information provided by our platform. Always consult a qualified healthcare provider for medical decisions.
          </p>
        </div>

        {/* Block 2 */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
              <CheckSquare className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Accuracy of Information</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            While we strive to ensure our AI models accurately transcribe and analyze your documents, OCR technology and language models are prone to errors. You are responsible for verifying the accuracy of all extracted data (including dosages and medication names) before relying on them.
          </p>
        </div>

        {/* Block 3 */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-500 flex-shrink-0">
              <FileText className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">User Responsibilities</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            You agree to only upload documents that you are legally authorized to possess and process. You must not use the platform for any illegal activities or to attempt to reverse-engineer our AI infrastructure. We reserve the right to terminate accounts that violate these terms.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Terms;
