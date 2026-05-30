import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, Search, ShieldCheck, Heart, FileText, ArrowRight, 
  MapPin, Star, Play, Sparkles, Check
} from 'lucide-react';

export const Landing: React.FC = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Search,
      title: 'Smart Hospital Discovery',
      description: 'Locate top clinics and emergency rooms immediately based on specialty matches and geographic distance calculations.'
    },
    {
      icon: Activity,
      title: 'Provider Comparison Matrix',
      description: 'Compare ratings, open departments, costs, and current availability parameters side-by-side in real-time.'
    },
    {
      icon: FileText,
      title: 'Medical Report Explainer',
      description: 'Upload complex blood profiles or hormone metrics and instantly decode results into plain, friendly layperson definitions.'
    },
    {
      icon: Heart,
      title: 'Specialist Mapping router',
      description: 'Automatically trace out-of-range lab metrics to critical specialist categories (like Hematologists, Endocrinologists).'
    }
  ];

  return (
    <div className="space-y-24 pb-16">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto pt-8 space-y-8 relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-2 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          Pulse Intelligent Healthcare Platform
        </div>
        
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-b from-slate-900 via-slate-800 to-slate-600 bg-clip-text text-transparent">
          Find the Right Care, <br className="hidden sm:inline"/>
          <span className="bg-gradient-to-r from-primary via-blue-600 to-emerald-600 bg-clip-text text-transparent">Faster and Smarter.</span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto font-light leading-relaxed">
          An AI-powered navigation assistant that simplifies complex medical files, tracks your core trends, and recommends highly suited hospitals in plain English.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            to={user ? "/search" : "/register"}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary hover:bg-primary-hover text-slate-900 font-semibold text-md shadow-xl shadow-primary/25 hover:shadow-primary/35 transition-all flex items-center justify-center gap-2 group"
          >
            Start Analyzing Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/search"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl glass-panel hover:bg-slate-50 border border-slate-200 hover:border-slate-300 font-semibold text-md transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 text-primary fill-primary" />
            Discover Hospitals Map
          </Link>
        </div>

        {/* Global liability note required by safety rules */}
        <div className="pt-8 max-w-xl mx-auto">
          <p className="text-[10px] text-slate-500 italic bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            ⚠️ <strong>AI Safety notice:</strong> Pulse-generated summaries are for general educational purposes only. The platform does not diagnose conditions, write prescriptions, or substitute for licensed medical practitioners.
          </p>
        </div>
      </section>

      {/* Numerical Dashboards and stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {[
          { value: '150+', label: 'Registered Hospitals' },
          { value: '98.6%', label: 'OCR Extraction Precision' },
          { value: '25+', label: 'Clinical Specialist Maps' },
          { value: '10k+', label: 'Active Healthy Users' }
        ].map((stat, i) => (
          <div key={i} className="glass-panel rounded-2xl p-6 text-center border border-slate-200">
            <p className="text-3xl sm:text-4xl font-extrabold text-primary mb-1">{stat.value}</p>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Feature cards Grid layout */}
      <section className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Platform Core Offerings</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">Empowering healthcare choices through unified clinical data aggregation and interactive mapping layers.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <div key={idx} className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between border border-slate-200 text-left group">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors">{feature.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-light">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Simulated Dashboard Carousel Mock */}
      <section className="glass-panel rounded-3xl p-8 border border-slate-200 max-w-6xl mx-auto bg-gradient-to-b from-slate-50 to-slate-100/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-5 space-y-6 text-left">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Understand medical reports with ease.</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-light">
              No more looking up medical abbreviations in search engines. Pulse scans files and lists out-of-range metrics with friendly definitions and charts them in visual timelines.
            </p>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-success" />
                </div>
                Detailed analysis of CBC, HbA1c, Lipids & Vitamin levels
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-success" />
                </div>
                Interactive dials plotting normal vs out of range thresholds
              </li>
              <li className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success/20 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-success" />
                </div>
                Direct reference maps linking abnormalities to clinics
              </li>
            </ul>
          </div>
          
          <div className="lg:col-span-7 p-4 rounded-2xl bg-black/40 border border-slate-200 shadow-2xl relative overflow-hidden flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-danger animate-pulse" />
                <span className="text-xs font-bold text-slate-900">Interactive Health Snapshot</span>
              </div>
              <span className="text-[10px] text-slate-500">Demo Simulation</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500">Hemoglobin (Hb)</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-bold text-danger">11.2</span>
                  <span className="text-xs text-slate-500">g/dL</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-danger h-full w-[45%]" />
                </div>
                <span className="text-[9px] text-danger/80 block mt-1">⚠ Low range (Ref: 12.0 - 15.0)</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500">Thyroid Stimulating Hormone (TSH)</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-xl font-bold text-success">2.4</span>
                  <span className="text-xs text-slate-500">uIU/mL</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-success h-full w-[65%]" />
                </div>
                <span className="text-[9px] text-success/80 block mt-1">✓ Normal (Ref: 0.4 - 4.5)</span>
              </div>
            </div>

            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl space-y-1">
              <span className="text-xs font-bold text-primary flex items-center gap-1">
                🔬 specialist Map Referral
              </span>
              <p className="text-[10px] text-slate-600">
                Pulse mapped your low Hemoglobin value to a **Hematologist** (95% confidence score). We recommend checking clinics equipped with clinical hematology laboratories.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic pricing boxes */}
      <section className="space-y-12 max-w-5xl mx-auto">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Simple SaaS Pricing</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-sm">Select the membership level matching your diagnostic upload requirements.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: 'Guest Explorer',
              price: '$0',
              period: 'forever',
              desc: 'For individuals seeking basic clinic searches and side-by-side matches.',
              features: ['Search hospitals by specialty & distance', 'Side-by-Side compare hospitals', 'Read public reviews', 'No document file uploads supported'],
              cta: 'Search Hospitals Map',
              link: '/search',
              popular: false
            },
            {
              title: 'Pulse Premium',
              price: '$9',
              period: 'month',
              desc: 'For individuals wanting active AI interpretations and biological tracking.',
              features: ['Unlimited prescription OCR scanning', 'Complete lab medical reports parsing', 'Full Specialist mapping logic', 'Historical health trend charts', 'Weekly Email digests'],
              cta: 'Register Pulse Account',
              link: '/register',
              popular: true
            },
            {
              title: 'Pulse Professional',
              price: '$29',
              period: 'month',
              desc: 'Designed for family units managing multiple dynamic profiles.',
              features: ['Supports up to 5 family members', 'Priority OCR queue processing', 'Admin audit logs access', 'Sentry-grade API priority hooks', 'Direct PDF outputs'],
              cta: 'Upgrade Pro Plan',
              link: '/register',
              popular: false
            }
          ].map((plan, i) => (
            <div 
              key={i} 
              className={`glass-panel rounded-3xl p-8 border flex flex-col justify-between text-left relative ${
                plan.popular ? 'border-primary bg-primary/[0.03] shadow-lg shadow-primary/10' : 'border-slate-200'
              }`}
            >
              {plan.popular && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-primary text-slate-900 text-[10px] font-bold uppercase tracking-wider">
                  Recommended Plan
                </span>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{plan.desc}</p>
                </div>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                  <span className="text-xs text-slate-500">/{plan.period}</span>
                </div>

                <div className="w-full h-px bg-slate-50" />

                <ul className="space-y-3">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-600">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-8">
                <Link
                  to={plan.link}
                  className={`w-full py-3 rounded-xl text-xs font-bold text-center block transition-all ${
                    plan.popular 
                      ? 'bg-primary hover:bg-primary-hover text-slate-900 shadow-md shadow-primary/20' 
                      : 'glass-panel hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
