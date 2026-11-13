import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ArrowRight, Stethoscope, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TermItem {
  term: string;
  category: string;
  simpleExplanation: string;
  context: string;
}

const COMMON_TERMS: TermItem[] = [
  {
    term: 'Hemoglobin (Hb)',
    category: 'Blood Test',
    simpleExplanation: 'The protein inside red blood cells that carries oxygen from your lungs to the rest of your body.',
    context: 'When low, it indicates anemia, which often causes fatigue, weakness, or pale skin.',
  },
  {
    term: 'Platelets (Plt)',
    category: 'Blood Test',
    simpleExplanation: 'Tiny blood cell fragments that stick together to form clots and stop bleeding when you have a cut.',
    context: 'Low levels (thrombocytopenia) make bruising and bleeding more likely.',
  },
  {
    term: 'Creatinine',
    category: 'Kidney Function',
    simpleExplanation: 'A waste product from normal muscle breakdown that healthy kidneys filter out of the blood into urine.',
    context: 'Higher than normal blood levels often point to reduced kidney filtration.',
  },
  {
    term: 'HbA1c (Glycated Hemoglobin)',
    category: 'Diabetes / Blood Sugar',
    simpleExplanation: 'A measure of your average blood glucose (sugar) level over the past 2 to 3 months.',
    context: 'Commonly used to diagnose prediabetes and monitor diabetes treatment plans.',
  },
  {
    term: 'Bilirubin',
    category: 'Liver Function',
    simpleExplanation: 'A yellowish substance made during the normal breakdown of red blood cells, processed by the liver.',
    context: 'Elevated bilirubin can cause yellowing of the skin and eyes (jaundice).',
  },
  {
    term: 'Hypertension',
    category: 'Cardiovascular',
    simpleExplanation: 'High blood pressure, meaning blood pumps against artery walls with higher force than normal.',
    context: 'Often has no daily symptoms but over time strains the heart and blood vessels.',
  },
  {
    term: 'Metformin',
    category: 'Prescription Medication',
    simpleExplanation: 'A first-line medication that helps lower blood sugar by reducing glucose production in the liver.',
    context: 'Frequently prescribed for type 2 diabetes and insulin resistance.',
  },
  {
    term: 'Levothyroxine',
    category: 'Prescription Medication',
    simpleExplanation: 'A daily replacement hormone for an underactive thyroid gland (hypothyroidism).',
    context: 'Helps restore normal energy, metabolism, and body temperature regulation.',
  },
  {
    term: 'ESR (Erythrocyte Sedimentation Rate)',
    category: 'Inflammation Marker',
    simpleExplanation: 'A test measuring how quickly red blood cells settle at the bottom of a test tube.',
    context: 'Faster settling indicates active inflammation in the body from infection or arthritis.',
  },
  {
    term: 'Troponin',
    category: 'Heart Marker',
    simpleExplanation: 'Proteins released into the blood when heart muscle cells undergo stress or injury.',
    context: 'Often measured urgently in the emergency room to check for heart attacks.',
  },
  {
    term: 'Lipid Profile',
    category: 'Cardiovascular',
    simpleExplanation: 'A blood test panel that measures cholesterol levels, including LDL ("bad"), HDL ("good"), and triglycerides.',
    context: 'Used by clinicians to evaluate heart disease risk.',
  },
  {
    term: 'CBC (Complete Blood Count)',
    category: 'General Panel',
    simpleExplanation: 'A comprehensive blood test that counts red cells, white cells, hemoglobin, and platelets.',
    context: 'One of the most common routine health screening tests.',
  },
];

export const MedicalTerms: React.FC = () => {
  useEffect(() => {
    document.title = 'Explain a medical term | Pulse';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Look up medical terms, lab biomarkers, and prescription acronyms in plain English.');
  }, []);

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Blood Test', 'Prescription Medication', 'Kidney Function', 'Cardiovascular', 'Liver Function'];

  const filteredTerms = COMMON_TERMS.filter((t) => {
    const matchesQuery =
      t.term.toLowerCase().includes(query.toLowerCase()) ||
      t.simpleExplanation.toLowerCase().includes(query.toLowerCase()) ||
      t.context.toLowerCase().includes(query.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  return (
    <div className="w-full max-w-[900px] mx-auto py-8 sm:py-12 text-left">
      <div className="mb-8 sm:mb-10 text-center max-w-[640px] mx-auto">
        <div className="w-12 h-12 rounded-full bg-[#EEF2FC] flex items-center justify-center text-[#1A3BAA] mx-auto mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
        <h1 className="text-[28px] sm:text-[40px] font-bold text-[#121414] dark:text-white leading-[1.2] tracking-[-0.02em]">
          Medical Term Explainer
        </h1>
        <p className="text-base text-[#4B5563] dark:text-slate-400 mt-2">
          Type any word from your prescription or laboratory test report to read a plain-English explanation.
        </p>
      </div>

      {/* Search Input - 48px tall, 1px #E5E7EB border, 8px radius, label above per brief */}
      <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-4 mb-8">
        <div className="space-y-1.5">
          <label htmlFor="term-search" className="text-sm font-medium text-[#121414] dark:text-white block">
            Search a medical term or drug name
          </label>
          <div className="relative">
            <input
              id="term-search"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Hemoglobin, Metformin, Creatinine, Bilirubin..."
              className="w-full h-12 pl-11 pr-4 border border-[#E5E7EB] dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-base text-[#121414] dark:text-white placeholder-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#1A3BAA]"
            />
            <Search className="w-5 h-5 text-[#1A3BAA] absolute left-3.5 top-3.5" />
          </div>
        </div>

        {/* Filter chips - 36px tall, fully rounded, #F5F7FA fill; selected = #EEF2FC fill with blue text per brief */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-[#4B5563] uppercase tracking-wider mr-1">Filter:</span>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`h-9 px-3.5 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-[#EEF2FC] text-[#1A3BAA] border border-[#1A3BAA]'
                    : 'bg-[#F5F7FA] dark:bg-slate-800 text-[#4B5563] dark:text-slate-300 border border-transparent hover:border-[#E5E7EB]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredTerms.length > 0 ? (
          filteredTerms.map((item) => (
            <div
              key={item.term}
              className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.06)] space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-[#121414] dark:text-white">
                  {item.term}
                </h2>
                <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#EEF2FC] text-[#1A3BAA] border border-[#1A3BAA]/20 self-start sm:self-auto">
                  {item.category}
                </span>
              </div>
              <p className="text-base text-[#121414] dark:text-slate-200 leading-[1.6]">
                {item.simpleExplanation}
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-sm text-[#4B5563] dark:text-slate-400">
                <strong>Why doctors check it:</strong> {item.context}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-[#E5E7EB] dark:border-slate-800 rounded-xl p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-[#4B5563] mx-auto" />
            <h3 className="text-base font-bold text-[#121414] dark:text-white">
              No matching term found for "{query}"
            </h3>
            <p className="text-sm text-[#4B5563] dark:text-slate-400 max-w-md mx-auto">
              Have a full prescription or laboratory report with this word? Upload it to our Report explainer to decode all findings automatically.
            </p>
            <div className="pt-2">
              <Link
                to="/reports"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1A3BAA] hover:bg-[#142E86] text-white text-sm font-semibold transition-colors"
              >
                <span>Upload Report Instead</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Safety Notice per brief */}
      <div className="mt-8 p-4 bg-[#F5F7FA] dark:bg-slate-900/40 border border-[#E5E7EB] dark:border-slate-800 rounded-xl text-xs sm:text-sm text-[#4B5563] dark:text-slate-400 leading-[1.5]">
        <strong>Note:</strong> This explains your reports and medications in simple words. It is not medical advice. Discuss all dosage questions and laboratory results with your doctor.
      </div>
    </div>
  );
};

export default MedicalTerms;

