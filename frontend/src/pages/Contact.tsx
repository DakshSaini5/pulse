import React, { useState } from 'react';
import { Mail, Clock, Send, ShieldCheck, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const Contact: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in all contact form fields.');
      return;
    }
    setLoading(true);
    // Simulate sending message
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success('Your message has been received! We will be in touch shortly.');
      setName('');
      setEmail('');
      setMessage('');
    }, 1500);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-16 space-y-12 animate-in fade-in duration-500 relative">
      {/* Decorative background blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2/3 h-2/3 bg-primary/5 blur-[100px] rounded-full -z-10" />

      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Get in Touch</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Our dedicated support team is ready to assist you with technical support, partnership inquiries, or platform feedback.
        </p>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 shadow-2xl p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Contact Details Column */}
          <div className="space-y-8 flex flex-col justify-center">
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Support</span>
                <div>
                  <a 
                    href="mailto:pulsehealthcare.app@gmail.com" 
                    className="text-base sm:text-lg font-black text-primary hover:underline"
                  >
                    pulsehealthcare.app@gmail.com
                  </a>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Reach out for any help or inquiries. We respond within 24 hours.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Office Hours</span>
                <p className="text-sm font-bold text-slate-800 dark:text-white">
                  Monday – Friday
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">9:00 AM – 6:00 PM EST</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold block">HIPAA Secure Channel</span>
                Any medical report data or diagnostic queries shared with us is handled on HIPAA-compliant servers and processed confidentially.
              </div>
            </div>

          </div>

          {/* Form Column */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 shadow-md">
            {submitted ? (
              <div className="text-center py-12 space-y-4 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-500 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Message Dispatched!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  Thank you for contacting Pulse Healthcare. Our patient support team has received your message and will review it immediately.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Send a Message</h3>
                
                <div className="space-y-1">
                  <label htmlFor="contact-name" className="text-[10px] font-bold text-slate-400 uppercase">Your Name</label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-xs placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-email" className="text-[10px] font-bold text-slate-400 uppercase">Email Address</label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-xs placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="contact-msg" className="text-[10px] font-bold text-slate-400 uppercase">Message</label>
                  <textarea
                    id="contact-msg"
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your query here..."
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 text-xs placeholder-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all font-medium resize-none text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Sending Message...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};

export default Contact;
