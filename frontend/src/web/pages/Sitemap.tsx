import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Map, ArrowRight } from 'lucide-react';

export const Sitemap: React.FC = () => {
  useEffect(() => {
    document.title = 'Sitemap | Pulse';
  }, []);

  const sections = [
    {
      category: 'Features',
      pages: [
        { name: 'Find hospitals', path: '/search', desc: 'Search hospitals by distance, city, and specialty.' },
        { name: 'Compare hospitals', path: '/compare', desc: 'Side-by-side comparison of hospital facilities and emergency care.' },
        { name: 'Understand a report', path: '/reports', desc: 'Upload and decode laboratory tests and blood reports in plain English.' },
        { name: 'Understand a prescription', path: '/prescriptions', desc: 'Upload and clarify clinic prescriptions, dosages, and drug interactions.' },
        { name: 'Explain a medical term', path: '/medical-terms', desc: 'Simple explanations for prescription words and medical terminology.' },
        { name: 'Pulse Plus (Waitlist)', path: '/pulse-plus', desc: 'Direct appointment booking and family health records (coming soon).' },
      ],
    },
    {
      category: 'Company',
      pages: [
        { name: 'Home', path: '/', desc: 'Pulse homepage and search discovery.' },
        { name: 'About Pulse', path: '/about', desc: 'Our mission, team, and why Pulse was built in Bengaluru.' },
        { name: 'How Pulse works', path: '/how-it-works', desc: 'Simple 3-step walkthrough of how Pulse helps you navigate healthcare.' },
        { name: 'FAQs', path: '/faq', desc: 'Frequently asked questions regarding our platform and privacy.' },
        { name: 'Contact us', path: '/contact', desc: 'Get in touch with our team in Bengaluru.' },
      ],
    },
    {
      category: 'Account',
      pages: [
        { name: 'Sign in', path: '/login', desc: 'Log in to your Pulse account.' },
        { name: 'Create account', path: '/register', desc: 'Sign up to securely save your reports and hospitals.' },
        { name: 'Saved Hospitals', path: '/saved', desc: 'View your bookmarked hospitals and emergency contacts.' },
        { name: 'Health Trends', path: '/trends', desc: 'Track your health metrics and report observations over time.' },
        { name: 'My Profile', path: '/profile', desc: 'Manage your emergency contacts and account details.' },
        { name: 'Settings', path: '/settings', desc: 'Update application preferences and security settings.' },
      ],
    },
    {
      category: 'Legal',
      pages: [
        { name: 'Privacy Policy', path: '/privacy', desc: 'How we protect and never sell your personal health data.' },
        { name: 'Terms of Use', path: '/terms', desc: 'Terms and conditions for using the Pulse platform.' },
        { name: 'Medical Disclaimer', path: '/disclaimer', desc: 'Important medical notices and emergency guidance.' },
      ],
    },
  ];

  return (
    <div className="w-full max-w-[1000px] mx-auto py-8 sm:py-12 text-left">
      <div className="mb-10">
        <div className="w-12 h-12 rounded-full bg-[#EEF2FC] flex items-center justify-center text-[#1A3BAA] mb-4">
          <Map className="w-6 h-6" />
        </div>
        <h1 className="text-[28px] sm:text-[40px] font-bold text-[#121414] dark:text-white leading-[1.2] tracking-[-0.02em]">
          Sitemap
        </h1>
        <p className="text-base text-[#4B5563] dark:text-slate-400 mt-2">
          An organized overview of all public pages, tools, and legal resources across Pulse.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {sections.map((sec) => (
          <div
            key={sec.category}
            className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
          >
            <h2 className="text-xl font-bold text-[#121414] dark:text-white pb-3 border-b border-[#E5E7EB] dark:border-slate-800 mb-4">
              {sec.category}
            </h2>
            <ul className="space-y-4">
              {sec.pages.map((p) => (
                <li key={p.path}>
                  <Link
                    to={p.path}
                    className="group flex items-start justify-between gap-3 text-left"
                  >
                    <div>
                      <span className="text-base font-semibold text-[#1A3BAA] group-hover:underline">
                        {p.name}
                      </span>
                      <p className="text-sm text-[#4B5563] dark:text-slate-400 mt-0.5 leading-[1.5]">
                        {p.desc}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#1A3BAA] mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sitemap;

