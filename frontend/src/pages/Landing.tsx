import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Activity, Search, ShieldCheck, FileText, ArrowRight, 
  Map, Play, Sparkles, Check, Rocket, Globe, Mail, MapPin, Phone, Shield
} from 'lucide-react';

export const Landing: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pricing' | 'about' | 'contact' | 'privacy'>('pricing');

  const features = [
    {
      icon: Search,
      title: 'Smart Hospital Discovery',
      description: 'Locate top clinics and emergency rooms immediately based on specialty matches and geographic distance.',
      color: 'text-primary',
      bg: 'bg-primary/10 group-hover:bg-primary group-hover:text-white'
    },
    {
      icon: Activity,
      title: 'Provider Comparison Matrix',
      description: 'Compare ratings, wait times, and equipment availability across multiple providers in real-time.',
      color: 'text-teal-500',
      bg: 'bg-teal-500/10 group-hover:bg-teal-500 group-hover:text-white'
    },
    {
      icon: FileText,
      title: 'Medical Report Explainer',
      description: 'Upload complex blood profiles or hormone metrics and instantly decode results into plain-friendly language.',
      color: 'text-indigo-500',
      bg: 'bg-indigo-500/10 group-hover:bg-indigo-500 group-hover:text-white'
    },
    {
      icon: Map,
      title: 'Specialist Mapping Router',
      description: 'Automatically trace out-of-range lab metrics to critical specialist categories for immediate follow-up.',
      color: 'text-sky-500',
      bg: 'bg-sky-500/10 group-hover:bg-sky-500 group-hover:text-white'
    }
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-4 md:px-10 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-500/5 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-primary text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700 animate-pulse">
            <Sparkles className="w-4 h-4" />
            Pulse Intelligent Healthcare Platform
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Find the Right Care, <br/>
            <span className="text-primary">Faster and Smarter.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            An AI-powered navigation assistant that simplifies complex medical files, tracks your core trends, and recommends highly suited hospitals in plain English.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to={user ? "/search" : "/register"}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary-hover text-slate-900 dark:text-white font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-3 group"
            >
              Start Analyzing Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/search"
              className="w-full sm:w-auto px-8 py-4 rounded-xl glass-panel bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 font-bold text-lg text-slate-900 dark:text-white transition-all flex items-center justify-center gap-3"
            >
              <Play className="w-5 h-5 text-primary fill-primary" />
              Discover Hospitals Map
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 md:px-10 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { value: '150+', label: 'Registered Hospitals' },
            { value: '98.6%', label: 'OCR Extraction Precision' },
            { value: '25+', label: 'Clinical Specialist Maps' },
            { value: '10k+', label: 'Active Healthy Users' }
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-8 rounded-2xl text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:-translate-y-1 transition-transform duration-300">
              <div className="text-4xl font-extrabold text-primary mb-2">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Core Offerings */}
      <section className="py-24 px-4 md:px-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Platform Core Offerings</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Empowering healthcare choices through unified clinical data aggregation and interactive mapping layers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="glass-panel p-8 rounded-2xl flex flex-col items-start gap-6 hover:-translate-y-2 transition-transform duration-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 group cursor-pointer">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center transition-colors ${feature.bg} ${feature.color}`}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Health Snapshot Showcase */}
      <section className="py-24 px-4 md:px-10 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto glass-panel rounded-3xl overflow-hidden flex flex-col lg:flex-row border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80">
          <div className="lg:w-1/2 p-10 lg:p-16 space-y-8 flex flex-col justify-center">
            <div className="w-14 h-14 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
              Understand medical reports <br/>with ease.
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              No more looking up medical abbreviations in search engines. Pulse scans files and lists out-of-range metrics with friendly definitions and charts them in visual timelines.
            </p>
            <ul className="space-y-4">
              {[
                'Detailed analysis of CBC, HbA1c, Lipids & Vitamin levels',
                'Interactive dials plotting normal vs out of range thresholds',
                'Direct reference maps linking abnormalities to clinics'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700 dark:text-slate-200 font-medium">
                  <Check className="w-5 h-5 text-teal-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="lg:w-1/2 p-8 lg:p-16 bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
            <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-white space-y-6 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-danger animate-pulse"></div>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interactive Health Snapshot</span>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">Demo Simulation</span>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {/* Report Item 1 */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Hemoglobin (Hb)</div>
                      <div className="text-2xl font-black text-danger">11.2 <span className="text-xs font-medium text-slate-500">g/dL</span></div>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-3">
                    <div className="w-1/3 h-full bg-danger"></div>
                  </div>
                  <div className="mt-2 text-[10px] text-danger font-bold flex items-center gap-1">
                    ⚠ Low range (Ref: 12.0 - 15.0)
                  </div>
                </div>
                
                {/* Report Item 2 */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold mb-1">Thyroid Stimulating Hormone (TSH)</div>
                      <div className="text-2xl font-black text-success">2.4 <span className="text-xs font-medium text-slate-500">uIU/mL</span></div>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-3">
                    <div className="w-3/5 h-full bg-success"></div>
                  </div>
                  <div className="mt-2 text-[10px] text-success font-bold flex items-center gap-1">
                    ✓ Normal (Ref: 0.4 - 4.5)
                  </div>
                </div>
              </div>
              
              <div className="bg-primary/10 rounded-xl p-4 border border-primary/20">
                <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase">
                  <Activity className="w-4 h-4" /> Specialist Map Referral
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Pulse mapped your low Hemoglobin value to a <strong>Hematologist</strong> (95% confidence score). We recommend checking clinics equipped with clinical hematology laboratories.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Tabs Section (Pricing, About, Contact, Privacy) */}
      <section className="py-24 px-4 md:px-10">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="flex flex-wrap justify-center gap-4 border-b border-slate-200 dark:border-slate-800">
            {[
              { id: 'pricing', label: 'Pricing' },
              { id: 'about', label: 'About Us' },
              { id: 'contact', label: 'Contact Us' },
              { id: 'privacy', label: 'Privacy Policy' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-6 text-lg font-bold transition-all border-b-2 ${
                  activeTab === tab.id 
                    ? 'text-primary border-primary' 
                    : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-12">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Simple SaaS Pricing</h3>
                  <p className="text-slate-600 dark:text-slate-400">Select the membership level matching your diagnostic upload requirements.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Guest */}
                  <div className="glass-panel p-8 rounded-3xl space-y-8 flex flex-col border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:-translate-y-1 transition-transform">
                    <div>
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Guest Explorer</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">For individuals seeking basic clinic searches.</p>
                    </div>
                    <div className="text-5xl font-black text-slate-900 dark:text-white">$0<span className="text-lg font-normal text-slate-500">/forever</span></div>
                    <ul className="space-y-4 flex-grow">
                      {['Search hospitals by specialty', 'Side-by-Side compare hospitals', 'Read public reviews'].map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                          <Check className="w-5 h-5 text-primary shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Link to="/search" className="w-full py-3 text-center rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Search Hospitals Map</Link>
                  </div>
                  {/* Premium */}
                  <div className="glass-panel p-8 rounded-3xl space-y-8 flex flex-col border-2 border-primary relative overflow-hidden bg-white dark:bg-slate-800 shadow-xl shadow-primary/10 hover:-translate-y-1 transition-transform">
                    <div className="absolute top-0 right-0 bg-primary text-slate-900 dark:text-white px-4 py-1.5 rounded-bl-xl text-[10px] font-black uppercase tracking-wider">Recommended</div>
                    <div>
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Pulse Premium</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">For individuals wanting active AI interpretations.</p>
                    </div>
                    <div className="text-5xl font-black text-slate-900 dark:text-white">$9<span className="text-lg font-normal text-slate-500">/month</span></div>
                    <ul className="space-y-4 flex-grow">
                      {['Unlimited prescription scanning', 'Complete lab medical parsing', 'Full Specialist mapping logic', 'Historical health trend charts'].map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-900 dark:text-white font-medium">
                          <Check className="w-5 h-5 text-primary shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Link to="/register" className="w-full py-4 text-center rounded-xl bg-primary hover:bg-primary-hover text-slate-900 dark:text-white font-bold shadow-lg shadow-primary/25 transition-colors">Register Pulse Account</Link>
                  </div>
                  {/* Professional */}
                  <div className="glass-panel p-8 rounded-3xl space-y-8 flex flex-col border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:-translate-y-1 transition-transform">
                    <div>
                      <h4 className="text-2xl font-bold text-slate-900 dark:text-white">Pulse Professional</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Designed for family units and dynamic profiles.</p>
                    </div>
                    <div className="text-5xl font-black text-slate-900 dark:text-white">$29<span className="text-lg font-normal text-slate-500">/month</span></div>
                    <ul className="space-y-4 flex-grow">
                      {['Supports up to 5 family members', 'Priority OCR queue processing', 'Admin audit logs access'].map((f, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                          <Check className="w-5 h-5 text-primary shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Link to="/register" className="w-full py-3 text-center rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Upgrade Pro Plan</Link>
                  </div>
                </div>
              </div>
            )}

            {/* About Tab */}
            {activeTab === 'about' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <h3 className="text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">Precision Care for Every Pulse.</h3>
                  <p className="text-lg text-slate-600 dark:text-slate-300">
                    Born from the need to bridge the gap between complex clinical data and patient understanding, Pulse was founded in 2024 by a team of medical practitioners and data scientists. 
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Rocket className="w-6 h-6" /></div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Our Mission</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">To democratize clinical information and ensure no diagnosis feels like a foreign language.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Globe className="w-6 h-6" /></div>
                      <div>
                        <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-1">Global Presence</h4>
                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Supporting over 150 hospitals globally with headquarters in London and San Francisco.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative rounded-3xl overflow-hidden aspect-square sm:aspect-video lg:aspect-square shadow-2xl border border-slate-200 dark:border-slate-700">
                  <img 
                    alt="Futuristic medical office" 
                    className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700" 
                    src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=1000"
                  />
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === 'contact' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 lg:grid-cols-2 gap-16">
                <div className="glass-panel p-10 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Send us a Message</h3>
                  <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">First Name</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white" placeholder="Jane" type="text" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Last Name</label>
                        <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white" placeholder="Doe" type="text" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email Address</label>
                      <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white" placeholder="jane.doe@example.com" type="email" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Message</label>
                      <textarea className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white" placeholder="How can we help you today?" rows={4}></textarea>
                    </div>
                    <button className="w-full py-4 rounded-xl bg-primary hover:bg-primary-hover text-slate-900 dark:text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20">
                      Send Message <ArrowRight className="w-5 h-5" />
                    </button>
                  </form>
                </div>
                <div className="space-y-12 py-6">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Our Locations</h3>
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <MapPin className="w-6 h-6 text-primary shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-lg">San Francisco HQ</p>
                          <p className="text-slate-600 dark:text-slate-400 mt-1">450 Medical Plaza, Suite 200<br/>San Francisco, CA 94103</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <MapPin className="w-6 h-6 text-primary shrink-0" />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-lg">London Innovation Hub</p>
                          <p className="text-slate-600 dark:text-slate-400 mt-1">12 King's Cross Bridge<br/>London N1 9NW, UK</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-w-3xl mx-auto glass-panel p-10 md:p-14 rounded-3xl space-y-10 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="flex items-center gap-6 pb-8 border-b border-slate-200 dark:border-slate-700">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                      <Shield className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">Your Data, Secured.</h3>
                      <p className="text-slate-500 dark:text-slate-400">Last updated: June 2024</p>
                    </div>
                  </div>
                  <div className="space-y-8">
                    <section>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">HIPAA Compliance</h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">All Pulse data processing occurs within isolated, HIPAA-compliant cloud environments. We never store your raw health data on our application servers.</p>
                    </section>
                    <section>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">End-to-End Encryption</h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">Your medical reports are encrypted using AES-256 standards both in transit and at rest. Only you have the cryptographic keys to view your detailed summaries.</p>
                    </section>
                    <section>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Third-Party Selling</h4>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">We strictly prohibit the sale of user data to insurance companies, pharmaceutical corporations, or third-party advertisers.</p>
                    </section>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};
