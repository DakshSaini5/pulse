import React, { useState, useEffect } from 'react';
import { Mail, Clock, Send, CheckCircle, MapPin, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    document.title = 'Contact us | Pulse';
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in your name, email, and message.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Thank you! Your message has been received.');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-12 sm:py-16 space-y-12">
      {/* Header */}
      <div className="space-y-3 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pulseTint text-primary text-xs font-semibold">
          Contact Support &amp; Feedback
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          We are here to help.
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400">
          Have a question about hospital listings, report explainer, or want to suggest a hospital correction? Send us a note.
        </p>
      </div>

      {/* Emergency Callout */}
      <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-pulseRed shrink-0 mt-0.5" />
        <div className="text-sm text-red-900 dark:text-red-200">
          <span className="font-bold">Medical emergency?</span> Do not use this contact form. Call 112 or your local emergency ambulance immediately.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Contact Info */}
        <div className="space-y-6">
          <div className="bg-surface dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-pulseTint text-primary flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email support</div>
                <a
                  href="mailto:pulsehealthcare.app@gmail.com"
                  className="text-base font-bold text-primary hover:underline break-all"
                >
                  pulsehealthcare.app@gmail.com
                </a>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  We review queries Monday to Friday and respond within 24 hours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-pulseTint text-primary flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</div>
                <div className="text-sm font-semibold text-slate-800 dark:text-white">Bengaluru, Karnataka, India</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Built for patients and families across Indian cities.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-pulseTint text-primary flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Operating hours</div>
                <div className="text-sm font-semibold text-slate-800 dark:text-white">Monday – Friday</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">9:30 AM – 6:30 PM IST</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white dark:bg-slate-900 border border-pulseBorder dark:border-slate-800 rounded-2xl p-6 sm:p-8">
          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Message received</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
                Thank you for reaching out. We will get back to you at your email address within one business day.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-sm text-primary font-semibold hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Send us a message</h3>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Your name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pulseBorder dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Email address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pulseBorder dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Subject (optional)</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Hospital listing correction or report inquiry"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pulseBorder dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help you?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-pulseBorder dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {loading ? 'Sending...' : 'Send message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
