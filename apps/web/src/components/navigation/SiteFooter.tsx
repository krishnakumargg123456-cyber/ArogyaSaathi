'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { FEATURE_MODULES } from '@/config/siteData';
import { 
  Heart, 
  ShieldCheck, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  HelpCircle
} from 'lucide-react';

export const SiteFooter: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<'idle' | 'success' | 'preview'>('idle');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // Honest non-submitting development preview behaviour
    setSubscribeStatus('preview');
  };

  return (
    <footer className="bg-brand-950 text-slate-300 border-t border-brand-900/60 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-brand-900/70">
          
          {/* Brand & Purpose Column (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 inline-block">
              <div className="w-10 h-10 rounded-xl bg-brand-700 flex items-center justify-center text-white shadow-inner">
                <Heart className="w-5 h-5 fill-white/20 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-white">
                  Arogya<span className="text-brand-400">Saathi</span>
                </span>
                <p className="text-xs text-brand-300 font-medium">
                  {language === 'hi' ? 'हर गाँव, हर घर, स्वस्थ भारत' : 'Health for Every Indian'}
                </p>
              </div>
            </Link>

            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              {t.footer.mission}
            </p>

            {/* Principles Badges */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-900/60 text-brand-300 border border-brand-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Safety-First Architecture</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-900/60 text-brand-300 border border-brand-800">
                <Globe className="w-3.5 h-3.5" />
                <span>Bilingual En/Hi Ready</span>
              </span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              {t.footer.quickLinks}
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="text-slate-400 hover:text-white transition-colors">
                  {t.nav.home}
                </Link>
              </li>
              <li>
                <Link href="/features" className="text-slate-400 hover:text-white transition-colors">
                  {t.nav.features}
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="text-slate-400 hover:text-white transition-colors">
                  {t.nav.howItWorks}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-slate-400 hover:text-white transition-colors">
                  {t.nav.about}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-slate-400 hover:text-white transition-colors">
                  {t.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Core Modules Column */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              {t.footer.modules}
            </h3>
            <ul className="space-y-2 text-xs">
              {FEATURE_MODULES.slice(0, 6).map((mod) => (
                <li key={mod.id}>
                  <Link 
                    href={`/features#${mod.slug}`} 
                    className="text-slate-400 hover:text-brand-300 transition-colors flex items-center gap-1"
                  >
                    <span>{language === 'hi' ? mod.titleHi.split('(')[0] : mod.title}</span>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/features" className="text-brand-400 hover:text-brand-300 font-medium">
                  View all 9 modules →
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Stay Updated */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">
              {t.footer.resources}
            </h3>
            <ul className="space-y-2.5 text-sm mb-6">
              <li>
                <Link href="/resources" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-400" />
                  <span>Field Manuals & Guides</span>
                </Link>
              </li>
              <li>
                <Link href="/resources#faqs" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-brand-400" />
                  <span>Clinical FAQs</span>
                </Link>
              </li>
              <li>
                <Link href="/about#safety-charter" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                  <span>{t.footer.clinicalSafetyCharter}</span>
                </Link>
              </li>
              <li>
                <Link href="/request-access" className="text-brand-400 hover:text-white transition-colors font-medium">
                  Request Pilot Access
                </Link>
              </li>
            </ul>

            {/* Newsletter Preview */}
            <div className="pt-2 border-t border-brand-900/60">
              <span className="text-xs font-medium text-slate-300 block mb-2">
                {t.footer.stayConnected}
              </span>
              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.footer.emailPlaceholder}
                    className="w-full bg-brand-900/40 border border-brand-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-400"
                    aria-label="Institutional email for research updates"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 px-2.5 bg-brand-700 hover:bg-brand-600 rounded text-white text-xs flex items-center justify-center transition-colors"
                    aria-label="Submit"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
                {subscribeStatus === 'preview' && (
                  <p className="text-[11px] text-brand-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-brand-400 shrink-0" />
                    <span>Preview mode: Newsletter backend will be active in pilot launch.</span>
                  </p>
                )}
              </form>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright, Language, Disclaimer */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          
          <div className="flex flex-wrap items-center gap-4">
            <span>© {new Date().getFullYear()} {t.footer.rights}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{t.footer.madeWith} 🇮🇳</span>
            <span className="text-slate-600">|</span>
            <span className="text-brand-400 bg-brand-950 px-2 py-0.5 rounded border border-brand-800/80">
              PRD v1.1 Implementation Baseline
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link href="/resources#privacy" className="hover:text-slate-300 transition-colors">
              {t.footer.privacyPolicy}
            </Link>
            <Link href="/resources#terms" className="hover:text-slate-300 transition-colors">
              {t.footer.termsOfService}
            </Link>
            
            {/* Language Quick Switch in Footer */}
            <div className="flex items-center gap-1 border-l border-slate-700 pl-4">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 rounded ${language === 'en' ? 'text-white font-bold bg-brand-800' : 'hover:text-white'}`}
              >
                EN
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`px-1.5 py-0.5 rounded ${language === 'hi' ? 'text-white font-bold bg-brand-800' : 'hover:text-white'}`}
              >
                हिन्दी
              </button>
            </div>
          </div>

        </div>

        {/* Non-Claim Disclaimer Notice */}
        <div className="mt-6 pt-4 border-t border-brand-900/40 text-[11px] text-slate-500 text-center leading-relaxed">
          Disclaimer: ArogyaSaathi is an assistive healthcare coordination platform. It does not provide autonomous medical diagnosis or clinical treatment. Clinical escalation is governed by versioned deterministic rules under licensed physician supervision.
        </div>

      </div>
    </footer>
  );
};
