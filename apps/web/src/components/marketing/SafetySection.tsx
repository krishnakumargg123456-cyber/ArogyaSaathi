'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { ShieldCheck, FileCheck, Lock, AlertTriangle, ArrowRight } from 'lucide-react';

export const SafetySection: React.FC = () => {
  const { language } = useLanguage();

  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-slate-50 to-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionHeading
          badge={language === 'hi' ? 'सुरक्षा एवं गोपनीयता' : 'Clinical Safety & Governance'}
          title={language === 'hi' ? 'जिम्मेदार प्रौद्योगिकी — सख्त क्लिनिकल सुरक्षा सीमाएं' : 'Responsible Technology Built on Strict Clinical Safeguards'}
          subtitle={language === 'hi' ? 'हम तकनीक का उपयोग कार्यकर्ताओं की सहायता के लिए करते हैं, लेकिन नैदानिक उत्तरदायित्व हमेशा प्रमाणित चिकित्सकों का होता है।' : 'We leverage voice and computing to assist frontline workflows while preserving human accountability at every clinical juncture.'}
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          
          <Card className="p-6 sm:p-7 border-slate-200 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-700 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Zero Autonomous Diagnosis
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                The platform explicitly prohibits AI from generating medical prescriptions, diagnosing illnesses, or making unassisted emergency determinations. Generative models assist exclusively with speech-to-text and structuring raw symptoms.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-100 text-xs font-semibold text-red-700">
              PRD Mandate § 13.1 Compliance
            </div>
          </Card>

          <Card className="p-6 sm:p-7 border-slate-200 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Deterministic Red-Flag Rules
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                All triage escalations are evaluated by an isolated deterministic rule engine running versioned protocols signed off by qualified clinical leads. Every evaluation is recorded in an immutable audit snapshot.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-100 text-xs font-semibold text-emerald-700">
              Clinician-Approved Protocols
            </div>
          </Card>

          <Card className="p-6 sm:p-7 border-slate-200 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                DPDP Act Consent & Scoping
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Built to align with India’s Digital Personal Data Protection (DPDP) Act. Patient records require documented purpose-specific consent. Health worker access is strictly partitioned by village, preventing cross-jurisdiction leakage.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t border-slate-100 text-xs font-semibold text-brand-800">
              Privacy by Design Standard
            </div>
          </Card>

        </div>

        {/* Notice on Clinical Certification */}
        <div className="mt-8 bg-brand-50/70 border border-brand-200 rounded-2xl p-5 sm:p-6 text-xs sm:text-sm text-brand-900 leading-relaxed flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="font-bold block">Scientific & Regulatory Integrity:</span>
            <p className="text-slate-600 text-xs">
              ArogyaSaathi does not claim unreviewed legal compliance or clinical certification. All deployment pilots require institutional ethics review, hospital governance sign-off, and supervised dry runs.
            </p>
          </div>
          <Link
            href="/about#safety-charter"
            className="shrink-0 text-xs font-bold text-brand-900 hover:text-brand-950 inline-flex items-center gap-1 underline underline-offset-4"
          >
            <span>Read Safety Charter</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </section>
  );
};
