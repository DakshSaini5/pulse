import React from 'react';
import { Shield, Activity, Dna, FileSearch, Stethoscope, Users } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-16 space-y-20 animate-in fade-in duration-500">
      
      {/* Hero Section */}
      <div className="text-center space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          Clinical Discovery Platform
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Pioneering <span className="bg-gradient-to-r from-primary to-sky-500 bg-clip-text text-transparent">AI-Powered</span> Healthcare
        </h1>
        <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed">
          Pulse Healthcare simplifies medical report analytics and prescription management. Our advanced OCR technology accurately scans prescriptions, while our intelligent routing connects patients to the right clinical specialists and hospitals seamlessly.
        </p>
      </div>

      {/* Grid Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <div className="glass-panel p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <FileSearch className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Smart OCR Scanning</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Instantly digitize complex written prescriptions and laboratory reports with high-precision Optical Character Recognition (OCR), extracting crucial drug names, dosages, and clinical observations.
            </p>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <Stethoscope className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Hospital Routing</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Find and compare nearby healthcare facilities dynamically, complete with emergency status checks, navigation coordinates, and verified patient reviews.
            </p>
          </div>
        </div>

        <div className="glass-panel p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl flex flex-col justify-between group hover:scale-[1.02] transition-all duration-300">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
              <Dna className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Clinical Insights</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Translate complex clinical jargon into simple, patient-friendly explanations, checking for potential drug interactions, side effects, and health trends.
            </p>
          </div>
        </div>

      </div>

      {/* Core Values Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-slate-50 dark:bg-slate-900/40 p-8 sm:p-12 rounded-3xl border border-slate-200/60 dark:border-slate-800">
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">Our Mission &amp; Values</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            At Pulse, we believe that access to clear medical information is a fundamental right. We are dedicated to providing secure, advanced technology that puts the patient in control of their health data, reducing the burden of clinical administration and building trust across the care continuum.
          </p>
          <div className="space-y-4 pt-2">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Privacy First</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Strict HIPAA compliance, encrypted storage, and ephemeral processing.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Users className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Patient-Centric Navigation</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Connecting users to clinicians without intermediaries or biased recommendation scores.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative h-[300px] w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
          <img 
            alt="Clinical background visualization" 
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBk5y_u9bszMtgFpVUhZZ5lfapFEyiup0PLhyFAagGEDKCr5PyK0JRaBVRu84ORz8SJVhG06XZ_GLaQVGPqUDzw0oDzu5mRHaKr1b1oultOY8Mz0tTNMyxJhmzqjXoNv6bvC7Nd5I2bX4b6Uvz1v5J-N7NJ2dRmxo45mNShaPcu3zW1_hP8kg5amoMvViIrllQJBxlASjAS9baUKfo-VZ3z0d5Vr9ATKJUSxQXSpE3rZktvE3PVWcuSa0hK73yAul1J6UbFdZ3rlM"
          />
        </div>
      </div>

    </div>
  );
};

export default About;
