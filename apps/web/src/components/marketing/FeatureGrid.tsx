'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { FEATURE_MODULES } from '@/config/siteData';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { 
  Users, 
  Mic, 
  HeartPulse, 
  Send, 
  MapPin, 
  BarChart3, 
  Bell, 
  ShieldCheck, 
  Globe,
  ArrowRight
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Users,
  Mic,
  HeartPulse,
  Send,
  MapPin,
  BarChart3,
  Bell,
  ShieldCheck,
  Globe
};

export const FeatureGrid: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <section id="features" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionHeading
          badge={t.features.badge}
          title={t.features.heading}
          subtitle={t.features.subheading}
        />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {FEATURE_MODULES.map((feature, idx) => {
            const Icon = iconMap[feature.iconName] || Users;
            return (
              <Card
                key={feature.id}
                hoverEffect
                className="p-6 sm:p-7 flex flex-col justify-between border-slate-200 group transition-all"
              >
                <div>
                  
                  {/* Top Bar: Icon + Status */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-800 flex items-center justify-center group-hover:bg-brand-900 group-hover:text-white transition-colors shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <StatusBadge status={feature.status} size="sm" />
                  </div>

                  {/* Title & Short Description */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-400 font-semibold">
                        0{idx + 1}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-900 transition-colors">
                        {language === 'hi' ? feature.titleHi.split('(')[0] : feature.title}
                      </h3>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed">
                      {language === 'hi' ? feature.shortDescHi : feature.shortDesc}
                    </p>
                  </div>

                  {/* Target Roles */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-1.5">
                    {feature.targetRoles.map((role, rIdx) => (
                      <span 
                        key={rIdx} 
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600"
                      >
                        {role}
                      </span>
                    ))}
                  </div>

                </div>

                <div className="mt-6 flex items-center justify-between gap-3">
                  <Link
                    href={`/workspace?module=${feature.slug}`}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-900 px-3.5 text-xs font-bold text-white transition-colors hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2"
                    aria-label={`Open ${feature.title} dashboard preview`}
                  >
                    <span>{language === 'hi' ? 'डैशबोर्ड खोलें' : 'Open dashboard'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href={`/features#${feature.slug}`}
                    className="text-xs font-semibold text-brand-800 group-hover:text-brand-950 inline-flex items-center gap-1.5 transition-colors focus:outline-none"
                    aria-label={`View details for ${feature.title}`}
                  >
                    <span>{t.features.viewDetails}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

              </Card>
            );
          })}
        </div>

        {/* Bottom CTA to Features Page */}
        <div className="mt-12 text-center">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-mint-100 text-brand-900 font-semibold hover:bg-mint-200 transition-colors border border-brand-200 shadow-xs"
          >
            <span>{t.features.exploreAll}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
};
