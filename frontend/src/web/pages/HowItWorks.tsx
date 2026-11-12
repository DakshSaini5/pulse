import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Activity, FileText, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  useEffect(() => {
    document.title = 'How Pulse Works | Pulse';
  }, []);

  const steps = [
    {
      num: '1',
      title: 'Tell us what you need',
      desc: 'Type a hospital name, a medical specialty like Cardiology or Orthopaedics, or select your city. You do not need to sign up or create an account to search.',
      icon: Search,
      actionText: 'Search hospitals',
      actionLink: '/search',
    },
    {
      num: '2',
      title: 'Compare hospitals near you',
      desc: 'Pick 2 or 3 hospitals to see side-by-side comparisons of certified specialties, verified emergency contact numbers, and driving distances.',
      icon: Activity,
      actionText: 'Open compare tool',
      actionLink: '/compare',
    },
    {
      num: '3',
      title: 'Go in prepared, knowing what your reports say',
      desc: 'Upload a prescription or laboratory blood report. Pulse translates complex reference ranges and clinical markers into everyday English so you can ask your doctor the right questions.',
      icon: FileText,
      actionText: 'Understand a report',
      actionLink: '/reports',
    },
  ];

  return (
    <div className="w-full max-w-[900px] mx-auto py-8 sm:py-12 text-left">
      <div className="text-center max-w-[640px] mx-auto mb-12">
        <h1 className="text-[28px] sm:text-[40px] font-bold text-[#121414] dark:text-white leading-[1.2] tracking-[-0.02em]">
          How Pulse works
        </h1>
        <p className="text-base text-[#4B5563] dark:text-slate-400 mt-3 leading-[1.6]">
          Finding the right hospital and understanding your medical files should not be stressful. Here is how Pulse helps in 3 simple steps.
        </p>
      </div>

      {/* Step by step walkthrough */}
      <div className="space-y-8">
        {steps.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.num}
              className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col sm:flex-row items-start gap-6"
            >
              <div className="w-12 h-12 rounded-full bg-[#1A3BAA] text-white font-bold text-lg flex items-center justify-center shrink-0">
                {s.num}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#EEF2FC] flex items-center justify-center text-[#1A3BAA]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h2 className="text-xl font-bold text-[#121414] dark:text-white">
                    {s.title}
                  </h2>
                </div>
                <p className="text-base text-[#4B5563] dark:text-slate-300 leading-[1.6]">
                  {s.desc}
                </p>
                <div className="pt-2">
                  <Link
                    to={s.actionLink}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1A3BAA] hover:underline"
                  >
                    <span>{s.actionText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trust reassurance banner */}
      <div className="mt-12 p-6 bg-[#F5F7FA] dark:bg-slate-900/40 border border-[#E5E7EB] dark:border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-left">
          <ShieldCheck className="w-8 h-8 text-[#1A3BAA] shrink-0" />
          <div>
            <h3 className="text-base font-bold text-[#121414] dark:text-white">
              Private and free to use
            </h3>
            <p className="text-sm text-[#4B5563] dark:text-slate-400">
              We never sell your health data. Search and compare anytime without an account.
            </p>
          </div>
        </div>
        <Link
          to="/search"
          className="px-5 py-2.5 rounded-lg bg-[#1A3BAA] hover:bg-[#142E86] text-white text-sm font-semibold whitespace-nowrap transition-colors"
        >
          Find hospitals near me
        </Link>
      </div>
    </div>
  );
};

export default HowItWorks;

