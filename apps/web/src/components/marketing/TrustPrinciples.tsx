'use client';

import React from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { ShieldCheck, UserCheck, Lock, GitCommit } from 'lucide-react';

export const TrustPrinciples: React.FC = () => {
  const { t } = useLanguage();

  const principles = [
    {
      icon: ShieldCheck,
      title: t.principles.p1Title,
      desc: t.principles.p1Desc,
      tag: "Deterministic Safety"
    },
    {
      icon: UserCheck,
      title: t.principles.p2Title,
      desc: t.principles.p2Desc,
      tag: "Human-in-the-Loop"
    },
    {
      icon: Lock,
      title: t.principles.p3Title,
      desc: t.principles.p3Desc,
      tag: "DPDP Act Aligned"
    },
    {
      icon: GitCommit,
      title: t.principles.p4Title,
      desc: t.principles.p4Desc,
      tag: "End-to-End Audit"
    }
  ];

  return (
    <section className="py-16 sm:py-20 bg-white border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionHeading
          badge={t.principles.badge}
          title={t.principles.heading}
          subtitle={t.principles.subheading}
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {principles.map((p, idx) => {
            const Icon = p.icon;
            return (
              <Card 
                key={idx}
                hoverEffect
                className="p-6 flex flex-col justify-between border-slate-200/90 relative group overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-700 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div>
                  <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center mb-4 group-hover:bg-brand-900 group-hover:text-white transition-colors shadow-xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <span className="text-[11px] font-bold text-brand-700 uppercase tracking-wider mb-1 block">
                    {p.tag}
                  </span>
                  
                  <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug">
                    {p.title}
                  </h3>
                  
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {p.desc}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Principle {idx + 1} of 4</span>
                  <span className="text-emerald-700 font-medium">Core Commitment</span>
                </div>
              </Card>
            );
          })}
        </div>

      </div>
    </section>
  );
};
