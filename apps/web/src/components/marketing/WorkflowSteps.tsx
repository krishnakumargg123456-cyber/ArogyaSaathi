'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { WORKFLOW_STEPS } from '@/config/siteData';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { 
  UserCheck, 
  Mic, 
  ShieldAlert, 
  Send, 
  Activity, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const iconMap: Record<string, any> = {
  UserCheck,
  Mic,
  ShieldAlert,
  Send,
  Activity
};

export const WorkflowSteps: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeStep, setActiveStep] = useState(1);

  const currentStepData = WORKFLOW_STEPS.find(s => s.step === activeStep) || WORKFLOW_STEPS[0];
  const ActiveIcon = iconMap[currentStepData.iconName] || UserCheck;

  return (
    <section id="how-it-works" className="py-16 sm:py-24 bg-mint-50/50 border-t border-brand-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <SectionHeading
          badge={t.workflow.badge}
          title={t.workflow.heading}
          subtitle={t.workflow.subheading}
        />

        {/* Stepper Navigation Pills */}
        <div className="mt-12 flex flex-wrap justify-center items-center gap-2 sm:gap-3">
          {WORKFLOW_STEPS.map((s) => {
            const isSelected = activeStep === s.step;
            const isPassed = activeStep > s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => setActiveStep(s.step)}
                className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isSelected
                    ? 'bg-brand-900 text-white shadow-md scale-105'
                    : isPassed
                    ? 'bg-emerald-100/80 text-emerald-900 border border-emerald-300'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                  isSelected ? 'bg-white text-brand-900 font-bold' : isPassed ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {isPassed ? '✓' : s.step}
                </span>
                <span>{language === 'hi' ? s.titleHi.split('(')[0] : s.title}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Step Card */}
        <div className="mt-8 max-w-4xl mx-auto">
          <Card className="p-6 sm:p-10 border-brand-200/90 shadow-premium bg-white">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Step Description (Span 7) */}
              <div className="md:col-span-7 space-y-4 text-left">
                
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-brand-100 text-brand-900 font-bold text-xs uppercase tracking-wider">
                    Step {currentStepData.step} of 5
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Responsible: {language === 'hi' ? currentStepData.actorRoleHi : currentStepData.actorRole}
                  </span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold text-slate-900">
                  {language === 'hi' ? currentStepData.titleHi : currentStepData.title}
                </h3>

                <p className="text-sm font-semibold text-brand-800">
                  {language === 'hi' ? currentStepData.taglineHi : currentStepData.tagline}
                </p>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {language === 'hi' ? currentStepData.descriptionHi : currentStepData.description}
                </p>

                {/* Safety Check Box */}
                <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900">
                    <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Clinical Safety & Verification Gate:</span>
                  </div>
                  <p className="text-amber-800">
                    {language === 'hi' ? currentStepData.safetyCheckHi : currentStepData.safetyCheck}
                  </p>
                </div>

                {/* Stepper Navigation Buttons */}
                <div className="pt-2 flex items-center gap-3">
                  {activeStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setActiveStep(prev => prev - 1)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200"
                    >
                      ← Previous Step
                    </button>
                  )}
                  {activeStep < 5 ? (
                    <button
                      type="button"
                      onClick={() => setActiveStep(prev => prev + 1)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-900 text-white hover:bg-brand-800 flex items-center gap-1"
                    >
                      <span>Next Step</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Link
                      href="/how-it-works"
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-900 text-white hover:bg-brand-800 inline-flex items-center gap-1"
                    >
                      <span>{t.workflow.learnMore}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>

              </div>

              {/* Right Column: Visual Motif & Highlights (Span 5) */}
              <div className="md:col-span-5 bg-gradient-to-br from-brand-900 to-brand-800 rounded-2xl p-6 text-white text-center flex flex-col items-center justify-center space-y-4 shadow-md">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-300">
                  <ActiveIcon className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-lg font-bold">
                    {currentStepData.title}
                  </h4>
                  <p className="text-xs text-brand-200 mt-1">
                    Human-Reviewed Care Continuum
                  </p>
                </div>

                <div className="w-full bg-white/10 rounded-xl p-3 text-left space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Audit Trail Logged</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Role Permissions Verified</span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Zero Data Leakage Outside Scope</span>
                  </div>
                </div>

              </div>

            </div>
          </Card>
        </div>

      </div>
    </section>
  );
};
