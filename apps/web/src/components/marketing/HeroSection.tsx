'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/Button';
import { 
  ShieldCheck, 
  Cpu, 
  Globe2, 
  WifiOff, 
  ArrowRight, 
  Play, 
  CheckCircle2, 
  Activity, 
  Users, 
  Clock, 
  Sparkles,
  PhoneCall,
  FileCheck
} from 'lucide-react';

export const HeroSection: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'asha' | 'doctor' | 'facility'>('asha');

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 bg-gradient-to-b from-mint-50/70 via-white to-mint-50/40">
      
      {/* Subtle background decorative shapes */}
      <div className="absolute top-0 right-1/4 -z-10 w-96 h-96 bg-brand-100/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 -z-10 w-80 h-80 bg-mint-200/30 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid: Headline + Interactive UI Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Value Prop & CTAs (Span 7) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Top Category Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-900 text-xs sm:text-sm font-semibold shadow-xs">
              <span className="flex h-2 w-2 rounded-full bg-brand-600 animate-ping" />
              <span>{t.hero.badge}</span>
            </div>

            {/* Tagline & Main Heading */}
            <div className="space-y-2">
              <p className="text-base sm:text-lg font-bold text-brand-800 tracking-wide">
                {t.hero.tagline}
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                {t.hero.heading}
              </h1>
            </div>

            {/* Subheading */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
              {t.hero.subheading}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Button
                href="/#platform-overview"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {t.hero.ctaPrimary}
              </Button>

              <Button
                href="/how-it-works"
                variant="outline"
                size="lg"
                leftIcon={<Play className="w-4 h-4 text-brand-800 fill-brand-800" />}
              >
                {t.hero.ctaSecondary}
              </Button>
            </div>
            <Link
              href="/saathi"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-bold text-emerald-900 underline-offset-4 hover:underline"
            >
              {language === 'hi' ? 'सेहत साथी से बात करें' : 'Talk to Sehat Saathi'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/workspace"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-brand-800 underline-offset-4 hover:underline"
            >
              {language === 'hi' ? 'इंटरैक्टिव ऐप प्रीव्यू खोलें' : 'Open the interactive app preview'}
              <ArrowRight className="h-4 w-4" />
            </Link>

            {/* Four Trust & Capability Chips */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-200/80">
              
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-brand-800 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-brand-700 shrink-0" />
                  <span>{t.hero.trustSafe}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {t.hero.trustSafeSub}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-brand-800 font-semibold text-xs">
                  <Cpu className="w-4 h-4 text-brand-700 shrink-0" />
                  <span>{t.hero.trustAI}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {t.hero.trustAISub}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-brand-800 font-semibold text-xs">
                  <Globe2 className="w-4 h-4 text-brand-700 shrink-0" />
                  <span>{t.hero.trustLang}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {t.hero.trustLangSub}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 text-brand-800 font-semibold text-xs">
                  <WifiOff className="w-4 h-4 text-brand-700 shrink-0" />
                  <span>{t.hero.trustRural}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {t.hero.trustRuralSub}
                </p>
              </div>

            </div>

          </div>

          {/* Right Column: Interactive Healthcare Coordination Simulation (Span 5) */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              
              {/* Outer Card with subtle glassmorphism */}
              <div className="bg-white/95 rounded-3xl p-5 sm:p-6 shadow-premium border border-brand-200/80 backdrop-blur-sm">
                
                {/* Simulation Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Live Coordination Demo
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    Synthetic Test Fixture
                  </span>
                </div>

                {/* Perspective Switcher Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-slate-100/90 p-1 rounded-xl my-4 text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => setActiveTab('asha')}
                    className={`py-1.5 rounded-lg transition-all ${
                      activeTab === 'asha'
                        ? 'bg-white text-brand-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1. ASHA Field
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('doctor')}
                    className={`py-1.5 rounded-lg transition-all ${
                      activeTab === 'doctor'
                        ? 'bg-white text-brand-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. Doctor Packet
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('facility')}
                    className={`py-1.5 rounded-lg transition-all ${
                      activeTab === 'facility'
                        ? 'bg-white text-brand-900 font-bold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    3. PHC Arrival
                  </button>
                </div>

                {/* Tab Content Display */}
                {activeTab === 'asha' && (
                  <div className="space-y-3.5 animate-fadeIn">
                    <div className="p-3.5 rounded-2xl bg-brand-50/70 border border-brand-200/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-brand-900">Encounter: Home Visit</span>
                        <span className="text-slate-500">Ramnagar Village</span>
                      </div>
                      <div className="mt-2 text-xs text-slate-700">
                        <span className="font-semibold text-slate-900">Patient:</span> Sunita Devi, 32 / F
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Purpose-Specific Consent Verified</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Speech Capture (Hindi):</span>
                        <span className="text-emerald-700 font-medium">98% Transcribed</span>
                      </div>
                      <p className="italic text-slate-800 bg-white p-2 rounded border border-slate-200/80 font-mono text-[11px]">
                        &quot;मुझे पिछले २ दिनों से तेज बुखार और सांस लेने में कठिनाई हो रही है...&quot;
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs">
                      <div className="flex items-center gap-1.5 text-red-800 font-bold">
                        <Activity className="w-4 h-4 text-red-600 shrink-0" />
                        <span>Deterministic Red-Flag Triggered</span>
                      </div>
                      <p className="text-red-700 mt-1 text-[11px]">
                        Rule #RESP-001: High fever with dyspnea. Urgent referral generated to Sitapur CHC.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'doctor' && (
                  <div className="space-y-3.5 animate-fadeIn">
                    <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-sky-900">Inbound Referral Packet #REF-2026-04</span>
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">
                          Urgent
                        </span>
                      </div>
                      <p className="text-xs text-sky-800 mt-1">
                        Referred by: ASHA Seema Devi · Assigned PHC Sitapur
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-2">
                      <div className="font-semibold text-slate-800">Vitals & Symptoms Summary:</div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-1.5 bg-slate-50 rounded">BP: 138/88 mmHg</div>
                        <div className="p-1.5 bg-slate-50 rounded">Temp: 102.4 °F</div>
                        <div className="p-1.5 bg-slate-50 rounded">SpO2: 94%</div>
                        <div className="p-1.5 bg-slate-50 rounded">Duration: 2 days</div>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-center justify-between">
                      <span>Doctor Review Action:</span>
                      <span className="font-bold underline cursor-pointer">Accept & Assign OPD Bed</span>
                    </div>
                  </div>
                )}

                {activeTab === 'facility' && (
                  <div className="space-y-3.5 animate-fadeIn">
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-900">PHC Arrival Desk: Token #A-14</span>
                        <span className="text-slate-500 text-[10px]">10:32 AM</span>
                      </div>
                      <p className="text-xs text-amber-800 mt-1">
                        Patient arrived via emergency escort. Arrival logged in system.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1.5">
                      <div className="flex items-center gap-2 text-slate-800 font-semibold">
                        <FileCheck className="w-4 h-4 text-brand-700" />
                        <span>Closed-Loop Confirmation</span>
                      </div>
                      <p className="text-slate-600 text-[11px]">
                        Automatic notification sent to ASHA Seema Devi confirming patient intake and treatment initiation.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-200 text-[11px] text-brand-900 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-brand-700" />
                      <span>Post-discharge home follow-up automatically queued for 48h.</span>
                    </div>
                  </div>
                )}

                {/* Footer Disclaimer */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                  <p className="text-[10px] text-slate-400">
                    * Illustrated coordination journey simulated with synthetic non-patient test fixtures.
                  </p>
                </div>

              </div>

              {/* Floating Badge */}
              <div className="hidden sm:flex absolute -bottom-4 -left-4 bg-brand-900 text-white px-3.5 py-2 rounded-2xl shadow-lg items-center gap-2 border border-brand-700">
                <Sparkles className="w-4 h-4 text-emerald-300" />
                <span className="text-xs font-semibold">Deterministic Safety · Human Oversight</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
