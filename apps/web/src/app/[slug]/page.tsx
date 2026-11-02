import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, HeartPulse, ShieldCheck } from 'lucide-react';
import { Accordion } from '@/components/ui/Accordion';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { SiteFooter } from '@/components/navigation/SiteFooter';
import { SiteHeader } from '@/components/navigation/SiteHeader';
import { PublicForm } from '@/components/public/PublicForm';
import { AccountRegistrationForm } from '@/components/auth/AccountRegistrationForm';
import { FEATURE_MODULES, WORKFLOW_STEPS } from '@/config/siteData';
import { LanguageProvider } from '@/context/LanguageContext';

const faqs = [
  {
    id: 'ai-safety',
    title: 'Does ArogyaSaathi diagnose or prescribe?',
    content: 'No. Voice tools assist with capturing and structuring symptoms. Urgency uses clinician-approved deterministic rules, and clinical decisions remain with qualified healthcare professionals.',
    badge: 'Clinical safety',
  },
  {
    id: 'offline',
    title: 'Can frontline workers use it with weak connectivity?',
    content: 'The mobile workflows are designed for offline-first capture and later synchronization. The simulator marks sample records as illustrative; production data behavior depends on the configured deployment.',
    badge: 'Field operations',
  },
  {
    id: 'privacy',
    title: 'Who can view patient information?',
    content: 'Access is intended to be role- and geography-scoped. Patient registration requires documented consent, and phone numbers are masked in default registry views.',
    badge: 'Privacy',
  },
  {
    id: 'pilot',
    title: 'How can a district request a pilot?',
    content: 'Use the institutional access request form. Submitting the current preview form does not transmit or store information; an approved deployment needs an authorized intake channel.',
    badge: 'Pilot',
  },
];

function PageFrame({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <SiteHeader />
      <main className="min-h-[65vh] flex-1">{children}</main>
      <SiteFooter />
    </LanguageProvider>
  );
}

function PageIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <section className="bg-gradient-to-b from-mint-50 to-white py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">{eyebrow}</p>
        <h1 className="max-w-4xl text-3xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
      </div>
    </section>
  );
}

function FeaturesPage() {
  const categories = Array.from(new Set(FEATURE_MODULES.map((item) => item.category)));
  return (
    <>
      <PageIntro eyebrow="The platform" title="Tools for connected rural care" description="Explore the care, safety, and governance workflows. Planned capabilities are identified honestly; this page does not imply clinical certification." />
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => <span key={category} className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-900">{category}</span>)}
        </div>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURE_MODULES.map((feature, index) => (
            <article id={feature.slug} key={feature.id} className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-mono font-bold text-brand-700">{feature.id}</span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">{feature.status}</span>
              </div>
              <h2 className="mt-4 text-xl font-bold text-slate-900">{String(index + 1).padStart(2, '0')}. {feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{feature.fullDesc}</p>
              <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                {feature.keyCapabilities.slice(0, 3).map((capability) => (
                  <li key={capability} className="flex gap-2 text-xs leading-5 text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />{capability}</li>
                ))}
              </ul>
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600"><strong className="text-slate-800">Safety boundary:</strong> {feature.safetyBoundaries}</p>
              <Link
                href={`/workspace?module=${feature.slug}`}
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-800 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:ring-offset-2"
              >
                Open dashboard preview <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function JourneyPage() {
  return (
    <>
      <PageIntro eyebrow="How it works" title="A clear path from household visit to follow-up" description="A human-led workflow keeps frontline workers, facilities, and clinicians connected at each handoff." />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {WORKFLOW_STEPS.map((step) => (
            <article key={step.step} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[64px_1fr] sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-900 text-lg font-extrabold text-white">{step.step}</div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{step.actorRole}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-900">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
                <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-950"><strong>Safety checkpoint:</strong> {step.safetyCheck}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function AboutPage() {
  return (
    <>
      <PageIntro eyebrow="About ArogyaSaathi" title="Technology that supports the people who deliver care" description="Rural health services depend on trusted local workers and coordinated facilities. ArogyaSaathi is designed to make those handoffs easier to record, follow, and review." />
      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article className="rounded-3xl bg-brand-950 p-7 text-white sm:p-10">
          <HeartPulse className="h-9 w-9 text-emerald-300" />
          <h2 className="mt-5 text-2xl font-bold">Our mission</h2>
          <p className="mt-3 text-sm leading-7 text-brand-100">Connect community care with facility care through accessible, consent-aware workflows—without taking clinical judgment away from health professionals.</p>
        </article>
        <article id="safety-charter" className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-10">
          <ShieldCheck className="h-9 w-9 text-brand-700" />
          <h2 className="mt-5 text-2xl font-bold text-slate-900">Responsible technology charter</h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
            <li>AI may support transcription and summarization; it does not diagnose or prescribe.</li>
            <li>Urgency escalation is determined by versioned, deterministic safety rules.</li>
            <li>Critical decisions and public-health alerts require authorized human review.</li>
            <li>Access is designed around role, geography, consent, and auditable actions.</li>
          </ul>
        </article>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-slate-900">Designed for a supervised rollout</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">Before real-world use, deployments need institutional approval, local protocol review, staff training, privacy safeguards, and supervised validation. The current workspace includes illustrative test data.</p>
      </section>
    </>
  );
}

function ResourcesPage() {
  return (
    <>
      <PageIntro eyebrow="Resources" title="Guidance for a careful rollout" description="Operational materials and answers for frontline teams, facilities, and public-health partners." />
      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 grid gap-4 md:grid-cols-3">
          {[
            ['ASHA field handbook', 'Patient consent, household visits, symptom capture, and referral follow-up.'],
            ['Facility workflow guide', 'Referral acknowledgement, appointment coordination, and clinical handoffs.'],
            ['Governance notes', 'Protocol ownership, audit review, access scopes, and pilot readiness.'],
          ].map(([title, description]) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              <span className="mt-4 inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">Draft resource outline</span>
            </article>
          ))}
        </div>
        <SectionHeading title="Frequently asked questions" subtitle="Clear answers about safety, privacy, and deployment." />
        <Accordion items={faqs} className="mt-7" />
      </section>
    </>
  );
}

export default function PublicSubPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  let content: React.ReactNode;

  if (slug === 'features') content = <FeaturesPage />;
  else if (slug === 'how-it-works') content = <JourneyPage />;
  else if (slug === 'about') content = <AboutPage />;
  else if (slug === 'resources') content = <ResourcesPage />;
  else if (slug === 'contact') content = <><PageIntro eyebrow="Contact" title="Talk with the ArogyaSaathi team" description="For district health departments, facilities, NGOs, and research partners exploring a supervised pilot." /><PublicForm mode="contact" /></>;
  else if (slug === 'patient-register') content = <AccountRegistrationForm type="patient" />;
  else if (slug === 'doctor-register') content = <AccountRegistrationForm type="doctor" />;
  else if (slug === 'request-access') content = <><PageIntro eyebrow="Health worker registration" title="Create your ArogyaSaathi account" description="Register with your mobile number and password. Your account remains inactive until an administrator approves your access." /><PublicForm mode="access" /></>;
  else notFound();

  return <PageFrame>{content}</PageFrame>;
}
