import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ArrowRight, Heart, Activity, FileText, BookOpen,
  ChevronDown, ShieldCheck, Lock, CheckCircle2, MapPin, AlertCircle,
  Stethoscope, Bone, Baby, Brain, Eye, Sparkles, AlertTriangle,
  HeartPulse, ArrowLeftRight, Star, Phone, CheckSquare, ClipboardList
} from 'lucide-react';
import { PulseLogo } from '../components/PulseLogo';

export const PublicLanding: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Bengaluru');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const cities = ['Bengaluru', 'Delhi', 'Mumbai'];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedCity) params.set('city', selectedCity);
    navigate(`/search?${params.toString()}`);
  };

  const serviceCards = [
    {
      title: 'Find hospitals',
      desc: 'See hospitals near you by specialty and distance.',
      path: '/search',
      icon: Search,
    },
    {
      title: 'Compare hospitals',
      desc: 'Put 2 or 3 hospitals side by side.',
      path: '/compare',
      icon: ArrowLeftRight,
    },
    {
      title: 'Understand a report',
      desc: 'Upload a report and get it explained simply.',
      path: '/reports',
      icon: FileText,
    },
    {
      title: 'Understand a prescription',
      desc: 'Clarify dosages, timing and check drug interactions.',
      path: '/prescriptions',
      icon: ClipboardList,
    },
    {
      title: 'Explain a medical term',
      desc: 'Type any word from your prescription.',
      path: '/medical-terms',
      icon: BookOpen,
    },
  ];

  const specialties = [
    { name: 'Cardiology', icon: Heart, query: 'Cardiology' },
    { name: 'Orthopaedics', icon: Bone, query: 'Orthopaedics' },
    { name: 'Paediatrics', icon: Baby, query: 'Paediatrics' },
    { name: 'Gynaecology', icon: HeartPulse, query: 'Gynaecology' },
    { name: 'Neurology', icon: Brain, query: 'Neurology' },
    { name: 'Dermatology', icon: Sparkles, query: 'Dermatology' },
    { name: 'ENT', icon: Stethoscope, query: 'ENT' },
    { name: 'Emergency care', icon: AlertTriangle, query: 'Emergency' },
  ];

  const trustPoints = [
    {
      title: "We explain, we don't diagnose",
      desc: 'Pulse helps you understand. Your doctor makes the decisions.',
      icon: ShieldCheck,
    },
    {
      title: 'Your data stays yours',
      desc: 'We never sell your health information.',
      icon: Lock,
    },
    {
      title: 'Free to use',
      desc: 'Search, compare and learn without paying.',
      icon: CheckCircle2,
    },
    {
      title: 'Built in Bengaluru',
      desc: 'By a team you can reach at pulsehealthcare.app@gmail.com.',
      icon: MapPin,
    },
  ];

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
  ];

  return (
    <div className="w-full text-[#121414] dark:text-slate-100">
      
      {/* 1. HERO SECTION WITH SEARCH */}
      <section className="pt-8 pb-12 sm:pt-14 sm:pb-16 text-center max-w-[900px] mx-auto">
        <h1 className="text-[28px] sm:text-[40px] font-bold text-[#121414] dark:text-white leading-[1.2] tracking-[-0.02em] [text-wrap:balance]">
          Find the right hospital. Understand your reports.
        </h1>

        {/* Thin ECG line in Pulse Red under the headline (2px) */}
        <div className="flex justify-center my-4">
          <svg className="w-48 h-3" viewBox="0 0 192 12" fill="none">
            <path
              d="M0 6H70L76 1L82 11L88 3L94 9L100 6H192"
              stroke="#E7373A"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <p className="text-base text-[#4B5563] dark:text-slate-300 max-w-[640px] mx-auto leading-[1.6]">
          Compare hospitals near you and get your medical reports explained in plain English. Free to use.
        </p>

        {/* Large 56px Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-stretch gap-2 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-xl p-1.5 sm:p-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)] text-left"
        >
          {/* Search Query Input */}
          <div className="flex-1 flex items-center gap-2 px-3 min-h-[44px] sm:min-h-[48px]">
            <Search className="w-5 h-5 text-[#1A3BAA] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospitals or specialties"
              aria-label="Search hospitals or specialties"
              className="w-full bg-transparent text-sm sm:text-base text-[#121414] dark:text-white placeholder-[#4B5563] focus:outline-none"
            />
          </div>

          {/* City Picker Dropdown */}
          <div className="relative border-t sm:border-t-0 sm:border-l border-[#E5E7EB] dark:border-slate-700 flex items-center min-h-[44px] sm:min-h-[48px]">
            <button
              type="button"
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-3 py-2 text-sm font-medium text-[#121414] dark:text-white hover:text-[#1A3BAA] transition-colors"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1A3BAA] shrink-0" />
                <span>{selectedCity}</span>
              </div>
              <ChevronDown className="w-4 h-4 text-[#4B5563]" />
            </button>

            {cityDropdownOpen && (
              <div className="absolute top-full left-0 right-0 sm:right-auto sm:left-0 mt-2 sm:w-36 bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-700 rounded-lg shadow-lg py-1 z-50">
                {cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setSelectedCity(city);
                      setCityDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-[#EEF2FC] transition-colors ${
                      selectedCity === city ? 'font-semibold text-[#1A3BAA]' : 'text-[#121414] dark:text-white'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="h-11 sm:h-12 px-6 bg-[#1A3BAA] hover:bg-[#142E86] text-white font-semibold text-sm sm:text-base rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
          >
            Search
          </button>
        </form>

        {/* Real Mobile App Screenshot in Modern Phone Frame (Item 37) */}
        <div className="my-10 sm:my-12 flex justify-center">
          <div className="w-[280px] sm:w-[320px] rounded-[36px] p-2.5 bg-slate-900 shadow-2xl border-4 border-slate-800 ring-1 ring-slate-700">
            {/* Notch / Speaker bar */}
            <div className="flex justify-center mb-1.5">
              <div className="w-20 h-4 bg-slate-950 rounded-full flex items-center justify-end px-2">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
              </div>
            </div>

            {/* Inner Phone Screen */}
            <div className="bg-white dark:bg-slate-900 rounded-[28px] overflow-hidden text-left border border-slate-200 dark:border-slate-800 shadow-inner">
              {/* App Status & Header */}
              <div className="px-3.5 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <PulseLogo size={22} showTagline={false} />
                <span className="text-[11px] font-semibold text-[#1A3BAA] bg-[#EEF2FC] px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Bengaluru
                </span>
              </div>

              {/* In-App Mock Search */}
              <div className="p-3 space-y-2.5">
                <div className="flex items-center gap-2 bg-[#F5F7FA] dark:bg-slate-800 px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] dark:border-slate-700 text-slate-400">
                  <Search className="w-3.5 h-3.5 text-[#1A3BAA]" />
                  <span className="text-xs text-slate-500 font-medium truncate">Search hospitals or specialties</span>
                </div>

                {/* Emergency banner in mock app */}
                <div className="bg-red-50 text-[#C62828] border border-red-200 px-2 py-1 rounded-md text-[10px] font-medium flex items-center justify-between">
                  <span>Emergency? Call 112</span>
                  <span className="font-semibold text-[#1A3BAA] underline">24×7 hospitals</span>
                </div>

                {/* Mock Hospital Card */}
                <div className="bg-white dark:bg-slate-800 border border-[#E5E7EB] dark:border-slate-700 rounded-xl p-2.5 shadow-sm space-y-1.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Manipal Hospital</h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        Old Airport Rd, Bengaluru
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      24×7
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold pt-1 border-t border-slate-100 dark:border-slate-700 text-slate-600">
                    <span className="text-[#B45309] flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-[#B45309]" /> 4.6 (420)
                    </span>
                    <span className="text-[#1A3BAA]">1.8 km from you</span>
                  </div>
                </div>

                {/* Mock Feature Pills */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <div className="bg-[#EEF2FC] text-[#1A3BAA] p-2 rounded-lg text-center">
                    <span className="block text-[11px] font-bold">Compare</span>
                    <span className="text-[9px] text-slate-500">2-3 facilities</span>
                  </div>
                  <div className="bg-[#EEF2FC] text-[#1A3BAA] p-2 rounded-lg text-center">
                    <span className="block text-[11px] font-bold">Lab Reports</span>
                    <span className="text-[9px] text-slate-500">Plain English</span>
                  </div>
                </div>
              </div>

              {/* Bottom Nav Mock Tab Bar */}
              <div className="border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex justify-between text-slate-400 bg-white dark:bg-slate-900">
                <span className="text-[10px] font-bold text-[#1A3BAA]">Discover</span>
                <span className="text-[10px] font-medium">Compare</span>
                <span className="text-[10px] font-medium">Reports</span>
                <span className="text-[10px] font-medium">Profile</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. 5 SERVICE CARDS DIRECTLY UNDER SEARCH & PREVIEW */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4 mt-8 sm:mt-10 text-left">
          {serviceCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                to={card.path}
                className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:border-[#1A3BAA] transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-11 h-11 rounded-full bg-[#EEF2FC] flex items-center justify-center mb-3">
                    <Icon className="w-6 h-6 text-[#1A3BAA]" />
                  </div>
                  <h3 className="text-base font-semibold text-[#121414] dark:text-white leading-[1.4] group-hover:text-[#1A3BAA] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-[#4B5563] dark:text-slate-400 mt-1.5 leading-[1.5]">
                    {card.desc}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#1A3BAA]">
                  <span>Explore</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. BROWSE BY SPECIALTY (#F5F7FA band) */}
      <section className="-mx-4 sm:-mx-6 px-4 sm:px-6 py-12 sm:py-16 bg-[#F5F7FA] dark:bg-slate-900/40 border-y border-[#E5E7EB] dark:border-slate-800">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-left mb-6 sm:mb-8">
            <h2 className="text-[22px] sm:text-[30px] font-bold text-[#121414] dark:text-white leading-[1.3] tracking-[-0.02em]">
              Browse by specialty
            </h2>
            <p className="text-sm text-[#4B5563] dark:text-slate-400 mt-1">
              Find hospitals across clinical departments.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 sm:gap-4 text-center">
            {specialties.map((spec) => {
              const Icon = spec.icon;
              return (
                <Link
                  key={spec.name}
                  to={`/search?specialty=${encodeURIComponent(spec.query)}&city=${encodeURIComponent(selectedCity)}`}
                  className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col items-center justify-center gap-2 hover:border-[#1A3BAA] transition-all group shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                >
                  <div className="w-11 h-11 rounded-full bg-[#EEF2FC] text-[#1A3BAA] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-[#1A3BAA]" />
                  </div>
                  <span className="text-sm font-medium text-[#121414] dark:text-white leading-tight">
                    {spec.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Emergency Notice Bar */}
          <div className="mt-6 border border-[#E7373A] bg-red-50 dark:bg-red-950/20 text-[#C62828] dark:text-red-400 rounded-lg p-3 text-sm font-medium flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>Medical emergency? Call 112.</span>
            </div>
            <Link
              to="/search?emergency=true"
              className="text-sm font-semibold underline whitespace-nowrap"
            >
              View 24×7 emergency hospitals →
            </Link>
          </div>
        </div>
      </section>

      {/* 4. HOW PULSE WORKS (White band) */}
      <section className="py-12 sm:py-16 max-w-[1200px] mx-auto text-left">
        <h2 className="text-[22px] sm:text-[30px] font-bold text-[#121414] dark:text-white leading-[1.3] tracking-[-0.02em] mb-8">
          How Pulse works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#1A3BAA] text-white font-bold flex items-center justify-center text-base">
              1
            </div>
            <h3 className="text-lg font-bold text-[#121414] dark:text-white">Tell us what you need</h3>
            <p className="text-sm text-[#4B5563] dark:text-slate-400 leading-[1.6]">
              Search for a doctor, specialty, or hospital in your city without needing an account.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#1A3BAA] text-white font-bold flex items-center justify-center text-base">
              2
            </div>
            <h3 className="text-lg font-bold text-[#121414] dark:text-white">Compare hospitals near you</h3>
            <p className="text-sm text-[#4B5563] dark:text-slate-400 leading-[1.6]">
              Put 2 or 3 hospitals side by side to compare facilities, emergency care, and distance.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#1A3BAA] text-white font-bold flex items-center justify-center text-base">
              3
            </div>
            <h3 className="text-lg font-bold text-[#121414] dark:text-white">Go in prepared</h3>
            <p className="text-sm text-[#4B5563] dark:text-slate-400 leading-[1.6]">
              Understand what your lab reports say in everyday words so you can talk clearly with your doctor.
            </p>
          </div>
        </div>
      </section>

      {/* 5. REPORT EXPLAINER PREVIEW (#F5F7FA band) */}
      <section className="-mx-4 sm:-mx-6 px-4 sm:px-6 py-12 sm:py-16 bg-[#F5F7FA] dark:bg-slate-900/40 border-y border-[#E5E7EB] dark:border-slate-800">
        <div className="max-w-[1200px] mx-auto text-left">
          <div className="mb-8">
            <h2 className="text-[22px] sm:text-[30px] font-bold text-[#121414] dark:text-white leading-[1.3] tracking-[-0.02em]">
              Understand your reports in plain English
            </h2>
            <p className="text-sm text-[#4B5563] dark:text-slate-400 mt-1 max-w-[640px]">
              Medical reports are filled with numbers and technical terms. Pulse translates them into simple words you can understand.
            </p>
          </div>

          {/* Side-by-side comparison preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Left: Sample Blood Report */}
            <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-slate-800 mb-4">
                  <span className="text-sm font-semibold text-[#4B5563]">Sample blood report (CBC)</span>
                  <span className="text-sm text-[#4B5563]">12 July 2026</span>
                </div>
                <div className="space-y-3 font-sans tabular-nums text-sm">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[#121414] dark:text-white font-medium">Hemoglobin (Hb)</span>
                    <span className="text-[#C62828] font-bold">8.2 g/dL (Low)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[#121414] dark:text-white font-medium">Platelet count</span>
                    <span className="text-[#C62828] font-bold">88,000 /uL (Low)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[#121414] dark:text-white font-medium">WBC count</span>
                    <span className="text-[#12805C] font-semibold">6,400 /uL (Normal)</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-slate-800 text-sm text-[#4B5563]">
                Standard laboratory format
              </div>
            </div>

            {/* Right: Plain-English Pulse Summary */}
            <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-slate-800 mb-4">
                  <span className="text-sm font-semibold text-[#1A3BAA]">Pulse plain-English summary</span>
                  <span className="text-sm text-[#12805C] font-medium">Simplified</span>
                </div>
                <div className="space-y-3 text-sm text-[#121414] dark:text-slate-200 leading-[1.6]">
                  <p>
                    <strong className="text-[#121414] dark:text-white">Oxygen levels:</strong> Your hemoglobin is lower than normal, meaning your red blood cells are carrying less oxygen to your body. This can cause tiredness.
                  </p>
                  <p>
                    <strong className="text-[#121414] dark:text-white">Clotting cells:</strong> Your platelet count is below standard, which means blood takes longer to clot.
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E5E7EB] dark:border-slate-800 text-sm text-[#4B5563]">
                This explains your report in simple words. It is not medical advice. Discuss results with your doctor.
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/reports"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-[#1A3BAA] hover:bg-[#142E86] text-white font-semibold text-sm transition-colors"
            >
              <span>Try it with a sample report</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. WHY YOU CAN TRUST PULSE (White band) */}
      <section className="py-12 sm:py-16 max-w-[1200px] mx-auto text-left">
        <h2 className="text-[22px] sm:text-[30px] font-bold text-[#121414] dark:text-white leading-[1.3] tracking-[-0.02em] mb-8">
          Why you can trust Pulse
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPoints.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-[#EEF2FC] flex items-center justify-center text-[#1A3BAA]">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#121414] dark:text-white leading-[1.3]">
                  {item.title}
                </h3>
                <p className="text-sm text-[#4B5563] dark:text-slate-400 leading-[1.6]">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. FAQ PREVIEW (#F5F7FA band) */}
      <section className="-mx-4 sm:-mx-6 px-4 sm:px-6 py-12 sm:py-16 bg-[#F5F7FA] dark:bg-slate-900/40 border-y border-[#E5E7EB] dark:border-slate-800">
        <div className="max-w-[800px] mx-auto text-left">
          <div className="mb-8">
            <h2 className="text-[22px] sm:text-[30px] font-bold text-[#121414] dark:text-white leading-[1.3] tracking-[-0.02em]">
              Frequently asked questions
            </h2>
            <p className="text-sm text-[#4B5563] dark:text-slate-400 mt-1">
              Quick answers about Pulse and how we protect your health data.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-base text-[#121414] dark:text-white hover:text-[#1A3BAA] transition-colors"
                  >
                    <span className="text-base">{faq.q}</span>
                    <ChevronDown className={`w-5 h-5 text-[#4B5563] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-sm text-[#4B5563] dark:text-slate-300 leading-[1.6] border-t border-slate-100 dark:border-slate-800">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/faq"
              className="text-sm font-semibold text-[#1A3BAA] hover:underline"
            >
              See all questions →
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION BAND (Pulse Blue background, white text) */}
      <section className="my-12 sm:my-16 bg-[#1A3BAA] rounded-2xl p-8 sm:p-12 text-center text-white">
        <h2 className="text-[24px] sm:text-[32px] font-bold leading-[1.3] tracking-[-0.02em]">
          Find the right hospital in under a minute.
        </h2>
        <p className="text-sm sm:text-base text-[#EEF2FC] mt-2 max-w-[600px] mx-auto">
          Search, compare and get directions to hospitals near you. Free and accessible to everyone.
        </p>
        <div className="mt-6">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-[#1A3BAA] font-semibold text-base hover:bg-[#EEF2FC] transition-colors shadow-sm"
          >
            <span>Find hospitals near me</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
};

export default PublicLanding;

