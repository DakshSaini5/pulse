import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, X, Phone, User, Heart } from 'lucide-react';
import { emergencyAPI } from '@core/services/api';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EmergencyContactModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !relationship) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await emergencyAPI.addContact({ name, phoneNumber: phone, relationship });
      toast.success('Emergency contact saved securely!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save contact');
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#111827] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="bg-red-50 dark:bg-red-500/10 p-6 flex items-start justify-between border-b border-red-100 dark:border-red-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Emergency Contact</h2>
              <p className="text-sm text-red-600 dark:text-red-400 mt-1">Required for Panic Button feature</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Add a trusted contact. If you use the Panic Button, we will instantly notify them with your location.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contact Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:focus:ring-red-500/20 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your mobile number"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:focus:ring-red-500/20 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship</label>
            <div className="relative">
              <Heart className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                placeholder="Relationship"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-[#1F2937] border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 dark:focus:ring-red-500/20 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
            >
              Skip for now
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg shadow-red-500/30 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default EmergencyContactModal;
