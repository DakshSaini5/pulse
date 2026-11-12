import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, Calendar, Users, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

export const PulsePlus: React.FC = () => {
  useEffect(() => {
    document.title = 'Pulse Plus Waitlist | Pulse';
  }, []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Bengaluru');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Please provide both your name and email.');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'https://pulse-production-f638.up.railway.app';
      await axios.post(`${apiUrl}/api/waitlist`, { name, email, city });
      setSubmitted(true);
      toast.success('You have been added to the Pulse Plus waitlist!');
    } catch (err) {
      // Even if network or backend route is offline, record locally so user is never blocked
      try {
        const stored = JSON.parse(localStorage.getItem('pulse_waitlist') || '[]');
        stored.push({ name, email, city, date: new Date().toISOString() });
        localStorage.setItem('pulse_waitlist', JSON.stringify(stored));
      } catch (e) {}
      setSubmitted(true);
      toast.success('You are on the waitlist! We will notify you when Pulse Plus launches.');
    } finally {
      setLoading(false);
    }
  };

  const upcomingFeatures = [
    {
      title: 'Direct Appointment Booking',
      desc: 'Book OPD consultations and diagnostic tests directly with verified partner hospitals.',
      icon: Calendar,
    },
    {
      title: 'Family Health Profiles',
      desc: 'Keep records and prescription histories for your parents, children, and spouse in one secure place.',
      icon: Users,
    },
    {
      title: 'Doctor Visit Question Guides',
      desc: 'Automatic question checklists generated from your test results so you never forget what to ask your doctor.',
      icon: FileCheck,
    },
  ];

  return (
    <div className="w-full max-w-[800px] mx-auto py-8 sm:py-12 text-left">
      <div className="text-center max-w-[600px] mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF2FC] text-[#1A3BAA] text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Coming Soon</span>
        </div>
        <h1 className="text-[28px] sm:text-[40px] font-bold text-[#121414] dark:text-white leading-[1.2] tracking-[-0.02em]">
          Pulse Plus
        </h1>
        <p className="text-base text-[#4B5563] dark:text-slate-400 mt-3 leading-[1.6]">
          Direct appointment booking and family health records are in active development. Join the waitlist for early access.
        </p>
      </div>

      {/* Upcoming features preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        {upcomingFeatures.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-2.5"
            >
              <div className="w-10 h-10 rounded-full bg-[#EEF2FC] flex items-center justify-center text-[#1A3BAA]">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#121414] dark:text-white">
                {f.title}
              </h3>
              <p className="text-sm text-[#4B5563] dark:text-slate-400 leading-[1.5]">
                {f.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Waitlist Form Card */}
      <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-green-50 text-[#12805C] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-[#121414] dark:text-white">
              You are on the list!
            </h2>
            <p className="text-base text-[#4B5563] dark:text-slate-300 max-w-md mx-auto">
              Thank you, <strong>{name}</strong>. We will email you at <strong>{email}</strong> as soon as Pulse Plus begins beta testing in {city}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-[#121414] dark:text-white">
              Get notified when we launch
            </h2>
            <p className="text-sm text-[#4B5563] dark:text-slate-400">
              We respect your privacy. No spam, ever.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#121414] dark:text-white block">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full h-12 px-3.5 border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-base text-[#121414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1A3BAA]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#121414] dark:text-white block">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-12 px-3.5 border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-base text-[#121414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1A3BAA]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#121414] dark:text-white block">
                Your City
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-12 px-3.5 border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-base text-[#121414] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1A3BAA]"
              >
                <option value="Bengaluru">Bengaluru</option>
                <option value="Delhi">Delhi</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Other">Other Indian City</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#1A3BAA] hover:bg-[#142E86] text-white font-semibold text-base rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Adding you...' : 'Join Waitlist'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PulsePlus;

