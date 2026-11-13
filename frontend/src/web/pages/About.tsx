import React, { useEffect } from 'react';
import { Shield, Eye, Building2, HeartHandshake, MapPin, Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const About: React.FC = () => {
  useEffect(() => {
    document.title = 'About us | Pulse';
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 sm:py-16 space-y-16">
      {/* Hero Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pulseTint text-primary text-xs font-semibold">
          About Pulse
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          Clear healthcare information for people and families.
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
          Pulse was built in Bengaluru to solve a simple problem: healthcare in India can feel confusing, opaque, and stressful. We help you find nearby hospitals, compare their facilities, and understand your lab test reports in plain English.
        </p>
      </div>

      {/* Why We Built Pulse */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4 text-slate-700 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Why we started</h2>
          <p>
            When someone in the family falls ill, people often spend stressful hours calling hospital reception desks to ask if an ICU bed or an emergency physician is available, deciphering diagnostic reports packed with medical shorthand, or worrying about hidden costs.
          </p>
          <p>
            Pulse gives you one honest place to check hospital emergency status, ICU bed counts, verified phone numbers, and doctors on duty. We also explain what the numbers in your CBC or thyroid test actually mean before you sit down with your doctor.
          </p>
        </div>

        <div className="bg-surface dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Our headquarters</h3>
          <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>Bengaluru, Karnataka, India</span>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <a href="mailto:pulsehealthcare.app@gmail.com" className="text-primary hover:underline">
                pulsehealthcare.app@gmail.com
              </a>
            </div>
          </div>
          <div className="pt-2">
            <Link
              to="/contact"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              Get in touch with us <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Our 3 Principles */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">What we believe</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-pulseTint text-primary flex items-center justify-center font-bold">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No paid rankings</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Hospitals cannot pay us to rank higher in search results or comparisons. All listings are based on verified address, emergency facilities, bed counts, and distance from you.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-pulseTint text-primary flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Plain English summaries</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Medical jargon causes needless panic. We summarize complex lab values into simple explanations so you can have an informed conversation with your treating physician.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-pulseTint text-primary flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Strict health privacy</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Your health reports belong exclusively to you. We do not sell your personal data or health history to insurance companies, advertising networks, or third-party brokers.
            </p>
          </div>
        </div>
      </div>

      {/* Medical Disclaimer Banner */}
      <div className="p-6 bg-surface dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl space-y-2">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Important medical note</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Pulse is an informational discovery and educational tool. Pulse is not a hospital, does not provide medical treatment or medical diagnoses, and does not replace the clinical judgment of a licensed healthcare professional. In a medical emergency, call 112 immediately or proceed to the nearest emergency room.
        </p>
      </div>
    </div>
  );
};

export default About;
