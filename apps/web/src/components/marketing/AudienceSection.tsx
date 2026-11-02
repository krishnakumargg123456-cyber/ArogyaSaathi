'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ROLE_PROFILES } from '@/config/siteData';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { 
  HeartHandshake, 
  Stethoscope, 
  UserPlus, 
  Building2, 
  Compass, 
  Sliders,
  CheckCircle2,
  Lock
} from 'lucide-react';

const iconMap: Record<string, any> = {
  HeartHandshake,
  Stethoscope,
  UserPlus,
  Building2,
  Compass,
  Sliders
};

export const AudienceSection: React.FC = () => {
  const { language } = useLanguage();

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionHeading
          badge={language === 'hi' ? 'लक्षित उपयोगकर्ता' : 'Who We Serve'}
          title={language === 'hi' ? 'ग्रामीण स्वास्थ्य तंत्र के प्रत्येक स्तर का सशक्तिकरण' : 'Engineered for Every Tier of Rural Healthcare'}
          subtitle={language === 'hi' ? 'गाँव के घर से लेकर ज़िला अस्पताल तक — हर कार्यकर्ता के लिए स्पष्ट भूमिका और सुरक्षित डेटा सीमा।' : 'From household doorstep visits to district surveillance — tailored roles with strict data boundaries.'}
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {ROLE_PROFILES.map((profile) => {
            const Icon = iconMap[profile.iconName] || HeartHandshake;
            return (
              <Card
                key={profile.id}
                hoverEffect
                className="p-6 sm:p-7 flex flex-col justify-between border-slate-200"
              >
                <div>
                  
                  {/* Top Bar */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center shrink-0">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg leading-tight">
                        {language === 'hi' ? profile.roleHi : profile.role}
                      </h3>
                      <span className="text-xs text-brand-700 font-medium">
                        {profile.operationalSetting}
                      </span>
                    </div>
                  </div>

                  {/* Subtitle / Tagline */}
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    {language === 'hi' ? profile.taglineHi : profile.tagline}
                  </p>

                  {/* Responsibilities list */}
                  <div className="space-y-2 mb-4">
                    {profile.responsibilities.map((resp, rIdx) => (
                      <div key={rIdx} className="flex items-start gap-2 text-xs text-slate-600 leading-snug">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{resp}</span>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Scoped Access Boundary Box */}
                <div className="pt-3 border-t border-slate-100 bg-slate-50/70 p-3 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Lock className="w-3 h-3 text-brand-700" />
                    <span>Authorized Scope:</span>
                  </div>
                  <p>{profile.dataScope}</p>
                </div>

              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
};
