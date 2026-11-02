'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { TARGET_METRICS } from '@/config/siteData';
import { Card } from '@/components/ui/Card';
import { Target, Info, Sparkles, Building2, MapPin, Users } from 'lucide-react';

const icons = [Users, Building2, MapPin, Target];

export const ImpactBand: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <section className="py-16 bg-brand-900 text-white relative overflow-hidden">
      
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#5FB79C_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-800 text-emerald-300 border border-brand-700 mb-3">
            <Target className="w-3.5 h-3.5" />
            <span>Target Goals & Scale</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
            {t.impact.heading}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-brand-200">
            {t.impact.subheading}
          </p>
        </div>

        {/* 4 Metric Target Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TARGET_METRICS.map((metric, idx) => {
            const Icon = icons[idx] || Users;
            return (
              <div
                key={idx}
                className="bg-brand-950/60 rounded-2xl p-6 border border-brand-800/80 backdrop-blur-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-800/80 text-emerald-300 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-brand-800 text-brand-300">
                      Target
                    </span>
                  </div>

                  <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {metric.value}
                  </div>

                  <div className="mt-1 text-sm font-bold text-emerald-300">
                    {language === 'hi' ? metric.labelHi : metric.label}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-brand-900 text-xs text-brand-300/80">
                  {language === 'hi' ? metric.subtextHi : metric.subtext}
                </div>
              </div>
            );
          })}
        </div>

        {/* Transparent Compliance Disclaimer */}
        <div className="mt-10 max-w-3xl mx-auto bg-brand-950/80 border border-brand-800 rounded-xl p-4 flex items-start gap-3 text-xs text-brand-200 leading-relaxed">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-white">Ethical Product Commitment: </span>
            {t.impact.disclaimer}
          </div>
        </div>

      </div>
    </section>
  );
};
