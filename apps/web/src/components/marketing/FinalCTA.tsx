'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, ArrowRight, LogIn } from 'lucide-react';

export const FinalCTA: React.FC = () => {
  const { language } = useLanguage();

  return (
    <section className="py-16 sm:py-20 bg-brand-950 text-white relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-6">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900 border border-brand-800 text-emerald-300 text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Institutional Pilot Onboarding</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
          {language === 'hi'
            ? 'हर गाँव, हर घर तक सुरक्षित स्वास्थ्य समन्वय पहुँचाने के लिए जुड़ें'
            : 'Join Us in Bringing Safe, Connected Care to Every Rural Community'}
        </h2>

        <p className="text-base sm:text-lg text-brand-200 max-w-2xl mx-auto leading-relaxed">
          {language === 'hi'
            ? 'ज़िला स्वास्थ्य समितियां, प्राथमिक स्वास्थ्य केंद्र और गैर-सरकारी संगठन हमारे पर्यवेक्षित परीक्षण कार्यक्रम में भाग लेने के लिए अनुरोध कर सकते हैं।'
            : 'District health societies, primary healthcare centres, and public health organizations can request onboarding for our supervised evaluation pilots.'}
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            href="/request-access"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            {language === 'hi' ? 'पहुंच अनुरोध सबमिट करें' : 'Request Institutional Access'}
          </Button>

          <Button
            href="/login"
            variant="outline"
            size="lg"
            className="w-full sm:w-auto text-white border-brand-700 hover:bg-brand-900"
            leftIcon={<LogIn className="w-4 h-4 text-emerald-300" />}
          >
            {language === 'hi' ? 'कार्यकर्ता पोर्टल लॉगिन' : 'Field Worker Login'}
          </Button>
        </div>

        <p className="text-xs text-slate-400 pt-2">
          {language === 'hi'
            ? '* नोट: अनधिकृत सार्वजनिक पंजीकरण प्रतिबंधित है। पहुंच केवल अनुमोदित स्वास्थ्य कर्मियों को प्रदान की जाती है।'
            : '* Controlled onboarding: Unrestricted public self-registration is restricted. Access is provisioned strictly through health department authorizations.'}
        </p>

      </div>
    </section>
  );
};
