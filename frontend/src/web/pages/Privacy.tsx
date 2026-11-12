import React, { useEffect } from 'react';
import { ShieldCheck, HardDriveUpload, Database, Trash2, FileText, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Privacy: React.FC = () => {
  useEffect(() => {
    document.title = 'Privacy policy | Pulse';
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pulseTint text-primary text-xs font-semibold">
          Data Protection &amp; Privacy
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Last updated: July 2026 • Compliant with the Digital Personal Data Protection Act (DPDPA), India
        </p>
      </div>

      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
          <strong>Our core commitment:</strong> We do not sell your personal or medical data to advertisers, insurance providers, or third-party brokers. Your medical reports are stored in your private account and can be deleted at any time.
        </div>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <div className="bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pulseTint text-primary flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Information we collect</h2>
          </div>
          <p>We collect only the minimum information required to deliver hospital discovery and report explanation services:</p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li><strong className="text-slate-800 dark:text-slate-200">Account details:</strong> Name and email address when you register. Mobile number is used solely to verify account ownership via OTP.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Medical reports:</strong> Lab reports, blood tests, and medical documents you explicitly choose to upload to explain values.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Location coordinates:</strong> Approximate city or GPS coordinates (only when you click &ldquo;Use my location&rdquo;) to calculate distance to nearby hospitals. We never track your background location.</li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pulseTint text-primary flex items-center justify-center shrink-0">
              <HardDriveUpload className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Storage and security</h2>
          </div>
          <p>We protect your information using modern security safeguards:</p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li>All network communications use TLS 1.3 encryption in transit.</li>
            <li>Stored user documents and database records are encrypted with AES-256.</li>
            <li>Report analysis is conducted in isolated processing environments. Uploaded files are associated only with your authenticated user account.</li>
          </ul>
        </div>

        {/* Section 3 */}
        <div className="bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pulseTint text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. Compliance with Indian DPDPA Guidelines</h2>
          </div>
          <p>
            In accordance with the Digital Personal Data Protection Act (DPDPA), 2023 of India, you retain absolute ownership over your digital health records:
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-400">
            <li><strong className="text-slate-800 dark:text-slate-200">Right to access:</strong> View all saved reports and personal data inside your profile.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Right to correction:</strong> Update your name, contact information, and preferences at any time.</li>
            <li><strong className="text-slate-800 dark:text-slate-200">Right to erasure:</strong> Permanently delete your account and all uploaded records at the click of a button.</li>
          </ul>
        </div>

        {/* Section 4 */}
        <div className="bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 text-pulseRed flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. How to delete your account &amp; data</h2>
          </div>
          <p>
            You can delete your account and all associated health reports at any time with immediate effect:
          </p>
          <ol className="space-y-2 list-decimal list-inside text-slate-600 dark:text-slate-400">
            <li>Log in and visit your <strong className="text-slate-800 dark:text-slate-200">Profile</strong> page.</li>
            <li>Under the Danger Zone section, click <strong className="text-slate-800 dark:text-slate-200">&ldquo;Delete account&rdquo;</strong>.</li>
            <li>Confirm deletion. Your account, saved hospitals, and uploaded medical reports are instantly and permanently purged from our database and storage systems.</li>
          </ol>
          <p className="text-slate-600 dark:text-slate-400">
            You can also email your deletion request to{' '}
            <a href="mailto:pulsehealthcare.app@gmail.com" className="text-primary hover:underline font-medium">
              pulsehealthcare.app@gmail.com
            </a>{' '}
            from your registered email address and we will process it promptly.
          </p>
        </div>
      </div>

      <div className="p-6 bg-surface dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl text-center space-y-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Questions about our privacy practices?</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Contact our Data Protection Grievance Officer at{' '}
          <a href="mailto:pulsehealthcare.app@gmail.com" className="text-primary font-semibold hover:underline">
            pulsehealthcare.app@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default Privacy;
