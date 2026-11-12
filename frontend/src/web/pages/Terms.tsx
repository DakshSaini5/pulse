import React, { useEffect } from 'react';
import { Scale, FileText, CheckSquare, AlertCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Terms: React.FC = () => {
  useEffect(() => {
    document.title = 'Terms of service | Pulse';
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-12 sm:py-16 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pulseTint text-primary text-xs font-semibold">
          Legal Agreement
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Last updated: July 2026 • Please read carefully before using Pulse Healthcare
        </p>
      </div>

      {/* Emergency Callout */}
      <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-pulseRed shrink-0 mt-0.5" />
        <div className="text-sm text-red-900 dark:text-red-200 leading-relaxed">
          <strong>Not an emergency service:</strong> Pulse is an informational tool. In an acute medical emergency, do not wait for online answers. Call <strong>112</strong> immediately or proceed to the nearest emergency room.
        </div>
      </div>

      <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <div className="bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pulseTint text-primary flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">1. Informational purpose only</h2>
          </div>
          <p>
            Pulse provides hospital directory information, facility comparisons, and automated plain-English summaries of medical laboratory reports. Pulse does not provide clinical diagnoses, does not prescribe treatments or medications, and does not replace consultation with a qualified medical professional.
          </p>
          <p>
            Always verify test findings and treatment decisions with your registered medical practitioner before taking or changing any medication or course of care.
          </p>
        </div>

        {/* Section 2 */}
        <div className="bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pulseTint text-primary flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">2. Hospital listings and verification</h2>
          </div>
          <p>
            While we actively verify hospital contact details, emergency readiness, and ICU bed capacities, healthcare facility statuses can change rapidly. Users are strongly advised to call the hospital at the verified telephone number displayed on their listing before traveling in critical situations.
          </p>
          <p>
            Pulse does not charge hospitals for listing placement or ranking positions. Hospital comparisons are objective and based on distance and published facility metrics.
          </p>
        </div>

        {/* Section 3 */}
        <div className="bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pulseTint text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">3. User responsibilities &amp; document uploads</h2>
          </div>
          <p>
            You agree to upload only medical reports and records belonging to yourself or family members for whom you have explicit authorization. You retain complete ownership of all uploaded documents.
          </p>
          <p>
            We do not sell your health data to third parties. For full details on how your records are stored, encrypted, and deleted, please review our{' '}
            <Link to="/privacy" className="text-primary hover:underline font-medium">
              Privacy Policy
            </Link>.
          </p>
        </div>

        {/* Section 4 */}
        <div className="bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">4. Governing law and jurisdiction</h2>
          <p>
            These terms are governed by the laws of India. Any disputes arising out of the use of Pulse shall be subject to the exclusive jurisdiction of the competent courts in Bengaluru, Karnataka, India.
          </p>
        </div>
      </div>

      <div className="p-6 bg-surface dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl text-center space-y-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">Questions about our Terms?</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Contact our legal and support team at{' '}
          <a href="mailto:pulsehealthcare.app@gmail.com" className="text-primary font-semibold hover:underline">
            pulsehealthcare.app@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default Terms;
