'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { 
  Users, 
  Send, 
  HeartPulse, 
  MapPin, 
  CheckCircle2, 
  ExternalLink,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';

export const ProductPreview: React.FC = () => {
  const { language } = useLanguage();
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'features' | 'radar'>('dashboard');

  const screens = [
    {
      id: 'dashboard',
      label: language === 'hi' ? 'फ़ील्ड डैशबोर्ड (Dashboard)' : 'Field Dashboard',
      subtitle: language === 'hi' ? 'आशा कार्यकर्ता एवं प्राथमिक स्वास्थ्य केंद्र दृश्य' : 'ASHA Worker & PHC Coordinator Overview',
      image: '/images/dashboard-preview.jpg',
      alt: 'ArogyaSaathi Frontline Health Dashboard with patient counters, visit charts, risk map, and quick actions',
      highlights: [
        'Total Patients & Priority Alerts Counters (248 Patients, 18 Follow-ups due)',
        'Epidemiological Risk Heatmap with village fever alert levels',
        'Recent Patients List with village and visit status tags',
        'Quick Action triggers: Register Patient, Start Voice Triage, Create Referral'
      ]
    },
    {
      id: 'features',
      label: language === 'hi' ? 'विशेषताएं अवलोकन (All Modules)' : 'Nine Core Modules',
      subtitle: language === 'hi' ? 'मरीज पंजीकरण से लेकर सार्वजनिक स्वास्थ्य निगरानी तक' : 'From Frontline Registration to District Intelligence',
      image: '/images/features-grid-preview.jpg',
      alt: 'Comprehensive 9-module feature matrix showing voice triage, chronic care, and referral workflows',
      highlights: [
        'Patient Management with longitudinal health records and consent tracking',
        'Voice Triage in Hindi with deterministic red-flag rule evaluation',
        'Chronic Care tracking BP and glucose with overdue follow-up queues',
        'Closed-Loop Referrals connecting sub-centres to district hospitals'
      ]
    },
    {
      id: 'radar',
      label: language === 'hi' ? 'हेल्थ रडार मानचित्र (Health Radar)' : 'Health Radar Surveillance',
      subtitle: language === 'hi' ? 'संक्रामक रोग क्लस्टर की पूर्व चेतावनी' : 'Village-Level Syndromic Cluster Early Warning',
      image: '/images/all-screens-overview.jpg',
      alt: 'ArogyaSaathi multi-screen overview highlighting mobile, desktop, and clinical workflows',
      highlights: [
        'Aggregated syndromic trends (Fever, Respiratory, Diarrhea)',
        'Privacy-preserving k-anonymity for rural village populations',
        'Candidate alert review workflow for district epidemiologists',
        'Traceable investigation logs without premature public panic'
      ]
    }
  ];

  const current = screens.find(s => s.id === activeScreen) || screens[0];

  return (
    <section id="platform-overview" className="py-16 sm:py-24 bg-gradient-to-b from-white via-mint-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionHeading
          badge={language === 'hi' ? 'उत्पाद पूर्वावलोकन' : 'Product Preview'}
          title={language === 'hi' ? 'कार्यप्रणाली का व्यावहारिक प्रदर्शन' : 'A Unified Healthcare Coordination Interface'}
          subtitle={language === 'hi' ? 'देखें कि आरोग्यसाथी किस प्रकार ज़मीनी कार्यकर्ताओं और डॉक्टरों के बीच समन्वय स्थापित करता है।' : 'Explore how ArogyaSaathi coordinates frontline village contacts, referral transit, and facility care in real time.'}
        />

        {/* Tab Navigation */}
        <div className="mt-10 flex flex-wrap justify-center gap-2 sm:gap-3">
          {screens.map((screen) => {
            const isActive = activeScreen === screen.id;
            return (
              <button
                key={screen.id}
                type="button"
                onClick={() => setActiveScreen(screen.id as any)}
                className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-900 text-white shadow-md'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {screen.label}
              </button>
            );
          })}
        </div>

        {/* Preview Frame */}
        <div className="mt-8 bg-white rounded-3xl border border-slate-200 shadow-premium overflow-hidden">
          
          {/* Header Bar of Preview */}
          <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                https://portal.arogyasaathi.in/{activeScreen}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Demonstration Preview · Synthetic Records
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Visual Image Presentation (Span 8) */}
            <div className="lg:col-span-8 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative group min-h-[320px] sm:min-h-[440px] flex items-center justify-center">
              <Image
                src={current.image}
                alt={current.alt}
                width={1200}
                height={750}
                className="w-full h-auto object-cover group-hover:scale-[1.01] transition-transform duration-500"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <p className="text-white text-xs font-medium">
                  {current.alt}
                </p>
              </div>
            </div>

            {/* Explanatory Highlights (Span 4) */}
            <div className="lg:col-span-4 space-y-5 text-left">
              <div>
                <span className="text-xs font-bold text-brand-700 uppercase tracking-wider block mb-1">
                  System View
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  {current.subtitle}
                </h3>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Key Capabilities Demonstrated:
                </p>
                <ul className="space-y-2.5">
                  {current.highlights.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <Button
                  href="/features"
                  variant="primary"
                  size="sm"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Explore All Capabilities
                </Button>
                <p className="text-[11px] text-slate-400">
                  * Note: Interfaces display synthetic demonstration fixtures. Real production records will be provisioned during supervised pilots.
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
