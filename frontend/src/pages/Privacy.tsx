import React from 'react';
import { ShieldCheck, HardDriveUpload, UserX, FileText } from 'lucide-react';

export const Privacy: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-16 space-y-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full text-primary mb-2">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Privacy &amp; Security Policy</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Pulse Healthcare is built on trust. We implement enterprise-grade security protocols to ensure complete compliance with HIPAA regulations and absolute confidentiality of all medical records.
        </p>
      </div>

      {/* Policy Blocks */}
      <div className="space-y-6">
        
        {/* Block 1 */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
              <ShieldCheck className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">HIPAA Compliance</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Pulse Healthcare strictly adheres to the Health Insurance Portability and Accountability Act (HIPAA). All Protected Health Information (PHI) is encrypted at rest and in transit using advanced AES-256 and TLS 1.3 encryption mechanisms. Our infrastructure runs on HIPAA-compliant cloud storage environments that undergo rigorous third-party penetration testing.
          </p>
        </div>

        {/* Block 2 */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <HardDriveUpload className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Secure OCR Processing</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Our Optical Character Recognition (OCR) pipeline parses medical reports and prescriptions inside isolated volatile memory environments. Once the file is processed and verified, temporary image uploads are immediately purged from our servers. We never utilize patient-submitted prescriptions or medical data to train external artificial intelligence models.
          </p>
        </div>

        {/* Block 3 */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
              <UserX className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Access Audits &amp; Role Governance</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Pulse utilizes strict Role-Based Access Control (RBAC). Patient records are completely confidential. Only the registered user (and verified administrators during explicit support requests) can view uploaded health documents. Every data access request is immutably logged for safety and security auditing.
          </p>
        </div>

        {/* Block 4 */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 flex-shrink-0">
              <FileText className="w-5.5 h-5.5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Consent &amp; Deletion Rights</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            You maintain full ownership of your data. You can delete individual reports, prescriptions, or trigger a complete account deletion from the settings menu at any time. When you request account deletion, all personal data, contact information, and medical scans are immediately and permanently erased from our production databases.
          </p>
        </div>

      </div>

    </div>
  );
};

export default Privacy;
