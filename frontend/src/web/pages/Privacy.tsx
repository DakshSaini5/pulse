import React from 'react';
import { ShieldCheck, HardDriveUpload, UserX, FileText, Database, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Privacy: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-16 space-y-12 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-full text-primary mb-2">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Privacy &amp; Data Policy</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Pulse Healthcare is built on trust. We implement enterprise-grade security protocols to ensure complete compliance with HIPAA regulations and absolute confidentiality of all medical records.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Last updated: June 2026</p>
      </div>

      {/* Policy Blocks */}
      <div className="space-y-6">

        {/* CLAUSE 1: What Data We Collect */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 flex-shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">1. What Data We Collect</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            To provide you with personalised healthcare assistance, Pulse collects the following categories of information:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 list-none">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              <span><strong className="text-slate-700 dark:text-slate-300">Identity Information:</strong> Full name and email address provided during account registration.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              <span><strong className="text-slate-700 dark:text-slate-300">Contact Information:</strong> Mobile phone number (optional, used for emergency contact alerts).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              <span><strong className="text-slate-700 dark:text-slate-300">Prescription Images:</strong> Photographs or scans of medical prescriptions uploaded by you for OCR analysis.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              <span><strong className="text-slate-700 dark:text-slate-300">Medical Reports:</strong> Blood test reports, diagnostic files, and other health documents uploaded for AI-powered analysis.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              <span><strong className="text-slate-700 dark:text-slate-300">AI Chat History:</strong> Conversations with the Pulse AI triage assistant, stored solely to personalise your session.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
              <span><strong className="text-slate-700 dark:text-slate-300">Profile Details (Optional):</strong> Age, gender, and weight, if you choose to add them to personalise AI health responses.</span>
            </li>
          </ul>
        </div>

        {/* CLAUSE 2: How Data Is Stored Securely */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
              <HardDriveUpload className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">2. How Your Data Is Stored Securely</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            All Protected Health Information (PHI) is treated with the highest level of security:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 list-none">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span><strong className="text-slate-700 dark:text-slate-300">Encryption at Rest &amp; In Transit:</strong> All data is encrypted using AES-256 at rest and TLS 1.3 in transit on every request.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span><strong className="text-slate-700 dark:text-slate-300">HIPAA-Compliant Cloud Infrastructure:</strong> Medical documents are stored on enterprise-grade, HIPAA-compliant cloud servers that undergo rigorous third-party audits.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span><strong className="text-slate-700 dark:text-slate-300">Isolated OCR Processing:</strong> Prescription and report images are parsed inside isolated volatile memory environments. Temporary files are purged from our servers immediately after processing.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span><strong className="text-slate-700 dark:text-slate-300">Role-Based Access Control (RBAC):</strong> Your records are visible only to you. Administrators may access data exclusively during explicit support requests, with every access immutably logged.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
              <span><strong className="text-slate-700 dark:text-slate-300">JWT Authentication:</strong> All API sessions are secured with short-lived JSON Web Tokens and 30-day rotating refresh tokens stored in your device's local storage.</span>
            </li>
          </ul>
        </div>

        {/* CLAUSE 3: No Third-Party Sale Declaration */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border-2 border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">3. We Do Not Sell Your Data</h3>
          </div>
          <div className="p-4 bg-red-500/10 border border-red-300 dark:border-red-700 rounded-2xl">
            <p className="text-sm font-bold text-red-700 dark:text-red-400 text-center leading-relaxed">
              ⚠️ We do not sell medical data or personal information to third parties. Ever.
            </p>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Your health data is your property alone. Pulse Healthcare does not sell, rent, trade, or disclose your personal information or Protected Health Information (PHI) to any third-party companies, advertisers, data brokers, or partners. Your prescription images and medical reports are never used to train external artificial intelligence models.
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            We may share anonymised, aggregated, and non-identifiable statistical data (e.g., "30% of users scanned blood reports") solely to improve our services. No individual can ever be identified from this data.
          </p>
        </div>

        {/* CLAUSE 4: Account Deletion Instructions */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-500 dark:text-slate-400 flex-shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">4. How to Delete Your Account &amp; Data</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            You have the right to permanently delete your account and all associated data at any time. When you request account deletion, the following data is immediately and irreversibly erased from our production databases:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 list-none">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              <span>Your name, email address, and all personal contact information.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              <span>All uploaded prescription images and medical report files (deleted from cloud storage).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              <span>All AI chat history and health trend data.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
              <span>All emergency contacts and notification history.</span>
            </li>
          </ul>
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">To delete your account:</p>
            <ol className="space-y-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 list-decimal list-inside">
              <li>Log in to the Pulse app.</li>
              <li>Navigate to <strong className="text-slate-700 dark:text-slate-300">My Profile</strong> from the navigation menu.</li>
              <li>Scroll down to the <strong className="text-red-600">Danger Zone</strong> section.</li>
              <li>Click <strong className="text-red-600">"Delete Account"</strong> and confirm the permanent deletion.</li>
            </ol>
            <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
              Alternatively, email us at <strong>pulsehealthcare22@gmail.com</strong> with the subject "Account Deletion Request" from your registered email address, and we will process your request within 30 days in accordance with GDPR and CCPA regulations.
            </p>
          </div>
          <div className="flex justify-center pt-2">
            <Link
              to="/profile"
              className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
              Go to Account Deletion
            </Link>
          </div>
        </div>

        {/* HIPAA / Access Audits Block */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">5. HIPAA Compliance &amp; Your Rights</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Pulse Healthcare strictly adheres to the Health Insurance Portability and Accountability Act (HIPAA). Our infrastructure undergoes rigorous third-party penetration testing. You maintain full ownership of your data at all times and have the right to access, correct, or export your data on request.
          </p>
        </div>

        {/* Contact */}
        <div className="text-center py-4 space-y-1">
          <p className="text-xs text-slate-400 dark:text-slate-500">Questions about this policy?</p>
          <a href="mailto:support@pulse-health.app" className="text-sm font-bold text-primary hover:underline">
            support@pulse-health.app
          </a>
        </div>

      </div>
    </div>
  );
};

export default Privacy;
