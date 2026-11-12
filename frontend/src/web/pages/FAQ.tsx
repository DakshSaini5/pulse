import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Mail, HelpCircle } from 'lucide-react';

export const FAQ: React.FC = () => {
  useEffect(() => {
    document.title = 'Frequently Asked Questions | Pulse';
  }, []);

  const [openIndex, setOpenIndex] = useState<number | null>(0); // First question open by default

  const faqs = [
    {
      q: 'Is Pulse free?',
      a: 'Yes. Searching, comparing hospitals and understanding reports are free.',
    },
    {
      q: 'Does Pulse diagnose illnesses?',
      a: 'No. Pulse explains your reports and medical terms in simple words. Only a doctor can diagnose or treat you.',
    },
    {
      q: 'Do I need an account?',
      a: 'No. You need an account only to upload and save reports.',
    },
    {
      q: 'Is my health data safe?',
      a: 'We never sell your health information. Your reports are private to your account, and you can delete them anytime.',
    },
    {
      q: 'Which cities does Pulse cover?',
      a: 'Bengaluru, Delhi and Mumbai.',
    },
    {
      q: 'Can I book an appointment through Pulse?',
      a: "Not yet. Direct booking is planned for Pulse Plus. For now, Pulse shows each hospital's phone number and directions.",
    },
    {
      q: 'How do I contact you?',
      a: 'You can email our team directly at pulsehealthcare.app@gmail.com. We typically respond within 24 hours.',
    },
  ];

  return (
    <div className="w-full max-w-[800px] mx-auto py-8 sm:py-12 text-left">
      <div className="mb-8 sm:mb-10">
        <div className="w-12 h-12 rounded-full bg-[#EEF2FC] flex items-center justify-center text-[#1A3BAA] mb-4">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h1 className="text-[28px] sm:text-[40px] font-bold text-[#121414] dark:text-white leading-[1.2] tracking-[-0.02em]">
          Frequently Asked Questions
        </h1>
        <p className="text-base text-[#4B5563] dark:text-slate-400 mt-2">
          Find clear answers to common questions about Pulse, our medical report tools, and your data privacy.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.q}
              className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-base text-[#121414] dark:text-white hover:text-[#1A3BAA] transition-colors"
                aria-expanded={isOpen}
              >
                <h3 className="text-base sm:text-lg font-semibold text-[#121414] dark:text-white">
                  {faq.q}
                </h3>
                <ChevronDown
                  className={`w-5 h-5 text-[#4B5563] shrink-0 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-base text-[#4B5563] dark:text-slate-300 leading-[1.6] border-t border-slate-100 dark:border-slate-800">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Still have questions box */}
      <div className="mt-12 p-6 bg-[#F5F7FA] dark:bg-slate-900/40 border border-[#E5E7EB] dark:border-slate-800 rounded-xl text-center space-y-3">
        <h3 className="text-lg font-bold text-[#121414] dark:text-white">Still have questions?</h3>
        <p className="text-sm text-[#4B5563] dark:text-slate-400 max-w-md mx-auto">
          We are here to help. Reach out to our team with any questions or suggestions.
        </p>
        <div>
          <a
            href="mailto:pulsehealthcare.app@gmail.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1A3BAA] hover:bg-[#142E86] text-white font-semibold text-sm transition-colors"
          >
            <Mail className="w-4 h-4" />
            <span>Email our team</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default FAQ;

