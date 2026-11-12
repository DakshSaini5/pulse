import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { PulseLogo } from './PulseLogo';
import { ChevronDown, Mail, MapPin } from 'lucide-react';

export const Footer: React.FC = () => {
  // Mobile accordion state for columns (Contact is always open per brief)
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(prev => (prev === section ? null : section));
  };

  return (
    <footer className="w-full bg-[#0F1E4A] text-white pt-10 sm:pt-12 pb-24 md:pb-8 border-t border-[#142E86]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        {/* Main 5-column grid on desktop, accordion on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-8 pb-10">
          
          {/* Column 1: Pulse */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <PulseLogo size={36} showTagline={false} textColor="white" />
            </Link>
            <p className="text-sm text-[#C7D2FE] leading-relaxed max-w-xs">
              Helping you find the right hospital and understand your health reports.
            </p>
            <div className="flex flex-col space-y-2.5 pt-2">
              <Link to="/about" className="text-sm text-[#C7D2FE] hover:text-white transition-colors">
                About us
              </Link>
              <Link to="/how-it-works" className="text-sm text-[#C7D2FE] hover:text-white transition-colors">
                How it works
              </Link>
              <div className="flex items-center gap-2">
                <Link to="/pulse-plus" className="text-sm text-[#C7D2FE] hover:text-white transition-colors">
                  Pulse Plus
                </Link>
                <span className="text-[12px] bg-[#1A3BAA] text-[#C7D2FE] px-2 py-0.5 rounded font-medium">
                  coming soon
                </span>
              </div>
            </div>
          </div>

          {/* Column 2: Features */}
          <div className="border-t border-[#22346B] md:border-none pt-4 md:pt-0">
            <button
              type="button"
              onClick={() => toggleSection('features')}
              className="w-full flex items-center justify-between md:cursor-default text-left"
            >
              <h3 className="text-sm font-semibold text-white tracking-wide">Features</h3>
              <ChevronDown className={`w-4 h-4 md:hidden text-[#C7D2FE] transition-transform ${openSection === 'features' ? 'rotate-180' : ''}`} />
            </button>
            <div className={`space-y-2.5 pt-3 md:block ${openSection === 'features' ? 'block' : 'hidden'}`}>
              <div>
                <Link to="/search" className="text-sm text-[#C7D2FE] hover:text-white transition-colors block">
                  Find hospitals
                </Link>
              </div>
              <div>
                <Link to="/compare" className="text-sm text-[#C7D2FE] hover:text-white transition-colors block">
                  Compare hospitals
                </Link>
              </div>
              <div>
                <Link to="/reports" className="text-sm text-[#C7D2FE] hover:text-white transition-colors block">
                  Understand a report
                </Link>
              </div>
              <div>
                <Link to="/medical-terms" className="text-sm text-[#C7D2FE] hover:text-white transition-colors block">
                  Medical term explainer
                </Link>
              </div>
            </div>
          </div>

          {/* Column 3: Help */}
          <div className="border-t border-[#22346B] md:border-none pt-4 md:pt-0">
            <button
              type="button"
              onClick={() => toggleSection('help')}
              className="w-full flex items-center justify-between md:cursor-default text-left"
            >
              <h3 className="text-sm font-semibold text-white tracking-wide">Help</h3>
              <ChevronDown className={`w-4 h-4 md:hidden text-[#C7D2FE] transition-transform ${openSection === 'help' ? 'rotate-180' : ''}`} />
            </button>
            <div className={`space-y-2.5 pt-3 md:block ${openSection === 'help' ? 'block' : 'hidden'}`}>
              <div>
                <Link to="/faq" className="text-sm text-[#C7D2FE] hover:text-white transition-colors block">
                  FAQs
                </Link>
              </div>
              <div>
                <Link to="/contact" className="text-sm text-[#C7D2FE] hover:text-white transition-colors block">
                  Contact us
                </Link>
              </div>
              <div>
                <Link to="/contact?type=report_problem" className="text-sm text-[#C7D2FE] hover:text-white transition-colors block">
                  Report a problem
                </Link>
              </div>
              <div>
                <Link to="/sitemap" className="text-sm text-[#C7D2FE] hover:text-white transition-colors block">
                  Sitemap
                </Link>
              </div>
            </div>
          </div>

          {/* Column 4: Legal */}
          <div className="border-t border-[#22346B] md:border-none pt-4 md:pt-0">
            <button
              type="button"
              onClick={() => toggleSection('legal')}
              className="w-full flex items-center justify-between md:cursor-default text-left"
            >
              <h3 className="text-sm font-semibold text-white tracking-wide">Legal</h3>
              <ChevronDown className={`w-4 h-4 md:hidden text-[#C7D2FE] transition-transform ${openSection === 'legal' ? 'rotate-180' : ''}`} />
            </button>
            <div className={`space-y-2.5 pt-3 md:block ${openSection === 'legal' ? 'block' : 'hidden'}`}>
              <div>
                <Link to="/privacy" className="text-sm text-[#C7D2FE] hover:text-white transition-colors block">
                  Privacy Policy
                </Link>
              </div>
              <div>
                <Link to="/terms" className="text-sm text-[#C7D2FE] hover:text-white transition-colors block">
                  Terms of Use
                </Link>
              </div>
              <div>
                <Link to="/disclaimer" className="text-sm text-[#C7D2FE] hover:text-white transition-colors block">
                  Medical Disclaimer
                </Link>
              </div>
            </div>
          </div>

          {/* Column 5: Contact (Always open on mobile per brief) */}
          <div className="border-t border-[#22346B] md:border-none pt-4 md:pt-0 space-y-3">
            <h3 className="text-sm font-semibold text-white tracking-wide">Contact</h3>
            <div className="space-y-2.5">
              <a
                href="mailto:pulsehealthcare.app@gmail.com"
                className="text-sm text-[#C7D2FE] hover:text-white transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4 text-[#C7D2FE] shrink-0" />
                <span className="truncate">pulsehealthcare.app@gmail.com</span>
              </a>
              <div className="text-sm text-[#C7D2FE] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C7D2FE] shrink-0" />
                <span>Bengaluru, Karnataka, India</span>
              </div>
            </div>

            {/* App Store Badges */}
            <div className="pt-2 space-y-2">
              <span className="text-xs text-[#C7D2FE] font-medium block">App coming soon</span>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#22346B] bg-[#071333] text-[13px] text-[#C7D2FE] cursor-not-allowed select-none">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.78 1.06-1.85.94-2.94-.91.04-2.03.61-2.68 1.39-.58.67-1.09 1.76-.96 2.82 1.02.08 2.07-.49 2.7-1.27z"/>
                  </svg>
                  <span>App Store</span>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#22346B] bg-[#071333] text-[13px] text-[#C7D2FE] cursor-not-allowed select-none">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a2.02 2.02 0 0 1-.22-.317C3.136 21.36 3 20.73 3 20V4c0-.73.136-1.36.39-1.869.07-.11.144-.22.219-.317zm11.604 11.607l2.25 2.25-11.77 6.643 9.52-8.893zm2.97-1.54l2.58 1.458c.84.475.84 1.246 0 1.72l-2.58 1.459-2.5-2.5 2.5-2.137zm-2.97-1.54l-9.52-8.893 11.77 6.643-2.25 2.25z"/>
                  </svg>
                  <span>Google Play</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Bottom bar separated by 1px in #22346B */}
        <div className="pt-6 border-t border-[#22346B] space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between text-sm text-[#C7D2FE]">
            <span>© 2026 Pulse.</span>
            <div className="flex items-center gap-4 mt-2 sm:mt-0">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <span>•</span>
              <Link to="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
            </div>
          </div>
          <p className="text-sm text-[#C7D2FE] leading-relaxed text-center sm:text-left pt-1">
            Pulse is not a medical device and does not diagnose, treat or prevent any condition. Always consult a qualified doctor. In a medical emergency, call 112.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

