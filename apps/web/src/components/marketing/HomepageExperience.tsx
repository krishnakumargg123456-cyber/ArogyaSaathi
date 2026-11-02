'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  ChevronRight,
  Globe2,
  HeartPulse,
  LogIn,
  MapPin,
  Mic,
  Play,
  Send,
  ShieldCheck,
  Stethoscope,
  Users,
  Wifi,
  ArrowUpRight,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { FEATURE_MODULES } from '@/config/siteData';
import { apiRequest } from '@/lib/api';

interface PlatformStatus {
  api_version: string;
  status: string;
  deterministic_safety_engine: string;
  appointment_engine: string;
  offline_sync: string;
}

interface DoctorDirectoryEntry {
  id: string;
  full_name: string;
  department_name: string;
  facility_name: string;
  specialization: string;
}

interface DepartmentEntry {
  id: string;
  name: string;
}

const featureIcons = [Users, Mic, HeartPulse, Send, MapPin, BarChart3, Bell, ShieldCheck, Globe2];

export function HomepageExperience() {
  const { language } = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);
  const [apiStatus, setApiStatus] = useState<PlatformStatus | null>(null);
  const [doctors, setDoctors] = useState<DoctorDirectoryEntry[] | null>(null);
  const [departments, setDepartments] = useState<DepartmentEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const isHindi = language === 'hi';

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.allSettled([
      apiRequest<PlatformStatus>('/status'),
      apiRequest<DoctorDirectoryEntry[]>('/doctors'),
      apiRequest<DepartmentEntry[]>('/departments'),
    ]).then(([statusResult, doctorsResult, departmentsResult]) => {
      if (!active) return;
      setApiStatus(statusResult.status === 'fulfilled' ? statusResult.value : null);
      setDoctors(doctorsResult.status === 'fulfilled' ? doctorsResult.value : null);
      setDepartments(departmentsResult.status === 'fulfilled' ? departmentsResult.value : null);
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const copy = isHindi
    ? {
        eyebrow: 'ग्रामीण स्वास्थ्य सेवाओं का एक मंच',
        heading: 'हर गाँव तक बेहतर स्वास्थ्य सेवा।',
        description: 'मरीज की सहमति से लेकर रेफरल और फॉलो-अप तक, स्थानीय स्वास्थ्य टीमों के रोज़मर्रा के काम को एक जगह जोड़ें।',
        primary: 'मरीज के रूप में जुड़ें',
        secondary: 'खाते में लॉगिन करें',
        exploreLink: 'ऐप का परिचय देखें',
        watchVideo: 'ऐप का वीडियो देखें',
        videoTitle: 'गाँव से स्वास्थ्य केंद्र तक — देखभाल का सफर',
        videoIntro: 'हिंदी में छोटा परिचय देखें: टीम मरीज की जानकारी कैसे दर्ज करती है, सुरक्षित जांच करती है और आगे की देखभाल जोड़ती है।',
        videoLabel: 'ArogyaSaathi का हिंदी परिचय वीडियो',
        videoNote: 'उदाहरण स्क्रीन और प्रदर्शन डेटा केवल समझाने के लिए हैं।',
        fieldApp: 'फील्ड वर्कर ऐप',
        demoOnly: 'उदाहरण डेटा',
        careRound: 'आज की देखभाल',
        careRoundIntro: 'एक ही कार्यप्रवाह में मरीज, जांच और अगला कदम।',
        consentStep: 'सहमति के साथ मरीज दर्ज करें',
        assessStep: 'लक्षण और जरूरी जानकारी दर्ज करें',
        followUpStep: 'रेफरल और अगली मुलाकात जोड़ें',
        privacyStep: 'निजी जानकारी सुरक्षित रखें',
        workflowHeading: 'पहले स्पष्ट जानकारी, फिर सही अगला कदम',
        workflowCaption: 'स्वास्थ्य कार्यकर्ता और क्लिनिकल टीम मिलकर काम करें — निर्णय की जिम्मेदारी स्वास्थ्य पेशेवरों के पास रहती है।',
        accessNote: 'मरीज सीधे जुड़ सकते हैं · डॉक्टर का पंजीकरण स्वीकृति के बाद सक्रिय होगा।',
        accessTitle: 'आपकी भूमिका, सही प्रवेश',
        accessIntro: 'मरीज, डॉक्टर और प्रशासक के लिए अलग और सुरक्षित रास्ते।',
        patientRole: 'मरीज',
        patientDescription: 'अपना खाता बनाएं और अपनी देखभाल की जानकारी पाएं।',
        doctorRole: 'डॉक्टर',
        doctorDescription: 'पेशेवर विवरण भेजें; स्वीकृति के बाद कार्यक्षेत्र खोलें।',
        adminRole: 'प्रशासक',
        adminDescription: 'पंजीकरण की समीक्षा करें और प्लेटफ़ॉर्म सेटिंग संभालें।',
        registerPatient: 'मरीज पंजीकरण',
        applyDoctor: 'डॉक्टर के रूप में आवेदन',
        adminLogin: 'एडमिन लॉगिन',
        careCard: 'जुड़ी हुई देखभाल',
        patientRecords: 'मरीज रिकॉर्ड',
        referralsCard: 'रेफरल',
        followUps: 'फॉलो-अप',
        secureNetwork: 'सुरक्षित स्वास्थ्य नेटवर्क',
        proof: 'एक जुड़ा हुआ स्वास्थ्य नेटवर्क',
        features: 'देखभाल के हर कदम के लिए',
        featureIntro: 'रोगी पंजीकरण से लेकर रेफरल और फॉलो-अप तक, एक साझा कार्यप्रवाह।',
        explore: 'सभी सुविधाएँ',
        workflow: 'जानकारी से देखभाल तक',
        workflowIntro: 'स्थानीय स्वास्थ्य टीमों के लिए स्पष्ट और सुरक्षित कदम।',
        live: 'प्लेटफ़ॉर्म कनेक्शन',
        retry: 'फिर से जांचें',
        doctors: 'डॉक्टर निर्देशिका',
        departments: 'विभाग',
        available: 'सेवा उपलब्ध',
        unavailable: 'सेवा से संपर्क नहीं हो सका',
        loading: 'जांच जारी है',
        connect: 'कार्यस्थल खोलें',
        browse: 'उपलब्ध डॉक्टर देखें',
      }
    : {
        eyebrow: 'A connected platform for rural healthcare',
        heading: 'Better care, within reach of every village.',
        description: 'Connect the everyday work of local health teams — from patient consent and symptom capture to referrals and follow-ups.',
        primary: 'Join as a patient',
        secondary: 'Sign in to your account',
        exploreLink: 'See how the app works',
        watchVideo: 'Watch the app introduction',
        videoTitle: 'A care journey, from village to health centre',
        videoIntro: 'Watch a short introduction in Hindi to see how teams record a visit, review safety signals, and coordinate the next step.',
        videoLabel: 'Hindi introduction video for ArogyaSaathi',
        videoNote: 'Screens and sample records are illustrative and are shown for explanation only.',
        fieldApp: 'Field worker app',
        demoOnly: 'Illustrative data',
        careRound: 'A day in the field',
        careRoundIntro: 'Keep patient details, a safety review, and the next step in one workflow.',
        consentStep: 'Register with consent',
        assessStep: 'Record symptoms and key details',
        followUpStep: 'Coordinate referral and follow-up',
        privacyStep: 'Keep personal information protected',
        workflowHeading: 'Clear information. A considered next step.',
        workflowCaption: 'Frontline and clinical teams work together; clinical decisions remain with health professionals.',
        accessNote: 'Patients can join directly · doctor accounts activate after admin approval.',
        accessTitle: 'One platform. The right access.',
        accessIntro: 'A clear, secure path for patients, doctors, and administrators.',
        patientRole: 'Patients',
        patientDescription: 'Create your account and keep your care journey close.',
        doctorRole: 'Doctors',
        doctorDescription: 'Submit professional details; access opens after review.',
        adminRole: 'Administrators',
        adminDescription: 'Review registrations and manage platform settings.',
        registerPatient: 'Create patient account',
        applyDoctor: 'Doctor registration',
        adminLogin: 'Admin sign in',
        careCard: 'Connected care',
        patientRecords: 'Patient records',
        referralsCard: 'Referrals',
        followUps: 'Follow-ups',
        secureNetwork: 'A secure care network',
        proof: 'One connected care network',
        features: 'Support for every step of care',
        featureIntro: 'From patient registration to referrals and follow-ups, teams can work from one shared care workflow.',
        explore: 'Explore all capabilities',
        workflow: 'From information to care',
        workflowIntro: 'A clear, safety-led workflow for local health teams.',
        live: 'Platform connection',
        retry: 'Check again',
        doctors: 'Doctors in directory',
        departments: 'Departments',
        available: 'Service available',
        unavailable: 'Could not reach service',
        loading: 'Checking connection',
        connect: 'Open workspace',
        browse: 'Browse doctor directory',
      };

  const workflow = isHindi
    ? [
        ['01', 'रोगी पंजीकरण', 'सहमति के साथ मरीज की जानकारी सुरक्षित रूप से दर्ज करें।'],
        ['02', 'जांच और सुरक्षा', 'लक्षण दर्ज करें और निर्धारित सुरक्षा नियमों से जांचें।'],
        ['03', 'देखभाल का समन्वय', 'रेफरल, अपॉइंटमेंट और फॉलो-अप को टीम के साथ जोड़ें।'],
      ]
    : [
        ['01', 'Register', 'Create a patient record with clear, purpose-specific consent.'],
        ['02', 'Assess safely', 'Capture symptoms and apply deterministic safety checks.'],
        ['03', 'Coordinate care', 'Connect referrals, appointments, and follow-ups across teams.'],
      ];

  const serviceOnline = apiStatus?.status === 'operational';

  return (
    <main>
      <section className="hero-wash relative isolate overflow-hidden bg-[#f7fbf8] text-slate-950">
        <div className="pointer-events-none absolute -right-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-emerald-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -left-36 bottom-0 h-96 w-96 rounded-full bg-amber-100/40 blur-3xl" />
        <div className="relative mx-auto grid min-h-[620px] w-full max-w-7xl grid-cols-1 items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-10">
          <div className="relative z-10 max-w-2xl animate-rise">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3.5 py-2 text-xs font-bold tracking-wide text-emerald-900 shadow-sm sm:text-sm">
              <HeartPulse className="h-4 w-4" />
              {copy.eyebrow}
            </p>
            <h1 className="max-w-2xl text-4xl font-bold leading-[1.1] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.9rem]">
              {copy.heading}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              {copy.description}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/patient-register"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-900 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-950/10 transition hover:-translate-y-0.5 hover:bg-emerald-950"
              >
                {copy.primary}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white/80 px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-emerald-700 hover:text-emerald-900"
              >
                <LogIn className="h-4 w-4" />
                {copy.secondary}
              </Link>
            </div>
            <p className="mt-4 max-w-xl text-xs leading-5 text-slate-500">{copy.accessNote}</p>
            <a href="#product-tour" className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-emerald-900 underline decoration-emerald-300 underline-offset-4 hover:decoration-emerald-800">
              <Play className="h-4 w-4" />{copy.watchVideo}
            </a>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-emerald-900/10 pt-5 text-xs font-semibold text-slate-600">
              <span className="inline-flex items-center gap-2"><Wifi className="h-4 w-4 text-emerald-800" />{isHindi ? 'कमज़ोर नेटवर्क के लिए तैयार' : 'Built for low-connectivity settings'}</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-800" />{isHindi ? 'नियम-आधारित सुरक्षा जांच' : 'Deterministic safety checks'}</span>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[560px] lg:ml-auto">
            <div className="absolute -right-5 -top-5 h-28 w-28 rounded-full bg-emerald-100/80 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-emerald-950/10 bg-white shadow-[0_30px_90px_-45px_rgba(6,78,59,0.5)]">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-white"><HeartPulse className="h-5 w-5" /></span>
                  <div><p className="text-sm font-bold text-slate-900">ArogyaSaathi</p><p className="mt-0.5 text-xs text-slate-500">{copy.fieldApp}</p></div>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">{copy.demoOnly}</span>
              </div>
              <div className="p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-800">{copy.careRound}</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{copy.workflowHeading}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{copy.careRoundIntro}</p></div>
                  <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-900 sm:flex"><Activity className="h-5 w-5" /></span>
                </div>
                <ol className="mt-7 space-y-3">
                  {[copy.consentStep, copy.assessStep, copy.followUpStep].map((step, index) => (
                    <li key={step} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? 'bg-emerald-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{index + 1}</span>
                      <span className="text-sm font-semibold text-slate-800">{step}</span>
                      {index === 0 && <span className="ml-auto text-[10px] font-semibold text-emerald-800">{isHindi ? 'सुरक्षित' : 'Protected'}</span>}
                    </li>
                  ))}
                </ol>
                <p className="mt-5 flex items-start gap-2 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />{copy.workflowCaption}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product-tour" className="scroll-mt-24 bg-white py-14 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-10">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-800">{isHindi ? 'एक छोटी झलक' : 'A short introduction'}</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-950 sm:text-4xl">{copy.videoTitle}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{copy.videoIntro}</p>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" />{copy.videoNote}</p>
            <Link href="/features" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-900 px-4 text-sm font-bold text-white transition hover:bg-emerald-950">
              {copy.explore}<ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-1.5 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.55)]">
            <video
              className="aspect-video w-full rounded-xl bg-slate-950"
              controls
              playsInline
              preload="metadata"
              poster="/images/arogyasaathi-video-poster.svg"
              aria-label={copy.videoLabel}
            >
              <source src="/videos/arogyasaathi-homepage-hi.mp4" type="video/mp4" />
              {isHindi ? 'आपका ब्राउज़र वीडियो चलाने का समर्थन नहीं करता।' : 'Your browser does not support HTML video.'}
            </video>
          </div>
        </div>
      </section>

      <section id="access" className="relative z-10 -mt-2 bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-800">{copy.secureNetwork}</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">{copy.accessTitle}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{copy.accessIntro}</p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            <RoleAccessCard href="/patient-register" icon={HeartPulse} title={copy.patientRole} description={copy.patientDescription} action={copy.registerPatient} theme="green" />
            <RoleAccessCard href="/doctor-register" icon={Stethoscope} title={copy.doctorRole} description={copy.doctorDescription} action={copy.applyDoctor} theme="blue" />
            <RoleAccessCard href="/login?portal=admin" icon={ShieldCheck} title={copy.adminRole} description={copy.adminDescription} action={copy.adminLogin} theme="amber" />
          </div>
        </div>
      </section>

      <section aria-label={copy.proof} className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-slate-200 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3 py-5 sm:px-6 sm:first:pl-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800"><Wifi className="h-5 w-5" /></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{copy.live}</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900" aria-live="polite">
                <span className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-400' : serviceOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                {loading ? copy.loading : serviceOnline ? copy.available : copy.unavailable}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 py-5 sm:px-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-800"><Users className="h-5 w-5" /></div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{copy.doctors}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{doctors === null ? '—' : doctors.length}</p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 py-5 sm:pl-6 sm:pr-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-800"><HeartPulse className="h-5 w-5" /></div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-500">{copy.departments}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{departments === null ? '—' : departments.length}</p>
              </div>
            </div>
            {!serviceOnline && !loading && (
              <button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="inline-flex min-h-10 items-center gap-1 rounded-md border border-slate-300 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                {copy.retry}<ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      <section id="capabilities" className="bg-[#f5f8f5] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-5 border-b border-slate-300 pb-7 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">{copy.proof}</p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">{copy.features}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">{copy.featureIntro}</p>
            </div>
            <Link href="/features" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-sm font-bold text-emerald-900 hover:text-emerald-700">
              {copy.explore}<ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-px border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_MODULES.map((feature, index) => {
              const Icon = featureIcons[index] ?? Users;
              return (
                <Link
                  key={feature.id}
                  href={`/workspace?module=${feature.slug}`}
                  className="group flex min-h-48 flex-col bg-white p-5 transition-colors hover:bg-[#fafffc] sm:p-6"
                >
                  <div className="flex items-start justify-between">
                    <span className={`flex h-11 w-11 items-center justify-center rounded-full ${index % 3 === 0 ? 'bg-emerald-100 text-emerald-900' : index % 3 === 1 ? 'bg-sky-100 text-sky-900' : 'bg-orange-100 text-orange-900'}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold text-slate-400">0{index + 1}</span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-emerald-900">
                    {isHindi ? feature.titleHi.split('(')[0].trim() : feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {isHindi ? feature.shortDescHi : feature.shortDesc}
                  </p>
                  <span className="mt-auto flex items-center gap-1 pt-4 text-xs font-bold text-emerald-800">
                    {isHindi ? 'डैशबोर्ड खोलें' : 'Open dashboard'}<ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">{isHindi ? 'सुरक्षित कार्यप्रवाह' : 'A safety-led workflow'}</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">{copy.workflow}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{copy.workflowIntro}</p>
          </div>
          <div className="mt-9 grid grid-cols-1 border-y border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
            {workflow.map(([number, title, description], index) => (
              <div key={number} className="flex gap-4 border-b border-slate-200 py-6 last:border-b-0 sm:border-b-0 sm:px-6 sm:first:pl-0 sm:last:pr-0">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? 'bg-emerald-100 text-emerald-900' : index === 1 ? 'bg-sky-100 text-sky-900' : 'bg-orange-100 text-orange-900'}`}>{number}</span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#eaf4ef] py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 sm:flex-row sm:items-center sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-900"><ShieldCheck className="h-5 w-5" /><p className="text-xs font-bold uppercase tracking-[0.1em]">{isHindi ? 'स्वास्थ्य टीमों के लिए' : 'For authorized health teams'}</p></div>
            <p className="mt-3 text-xl font-semibold text-slate-950">{isHindi ? 'अपने कार्यक्षेत्र और देखभाल के काम को एक जगह से संभालें।' : 'Bring your local care workflows into one secure workspace.'}</p>
          </div>
          <Link href="/login" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-md bg-[#075b48] px-5 text-sm font-bold text-white transition-colors hover:bg-[#064638]">
            {copy.connect}<ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {doctors && doctors.length > 0 && (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-800">{copy.doctors}</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-950">{isHindi ? 'सेवा देने वाले चिकित्सक' : 'Care teams in the network'}</h2>
              </div>
              <Link href="/login" className="inline-flex min-h-10 items-center gap-2 text-sm font-bold text-emerald-900 hover:text-emerald-700">
                {copy.browse}<ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 divide-y divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3">
              {doctors.slice(0, 3).map((doctor) => (
                <div key={doctor.id} className="flex items-center gap-4 py-5 sm:px-5 sm:first:pl-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-900"><Stethoscope className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">{doctor.full_name}</p>
                    <p className="mt-1 truncate text-xs text-slate-600">{[doctor.specialization, doctor.department_name, doctor.facility_name].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function RoleAccessCard({
  href,
  icon: Icon,
  title,
  description,
  action,
  theme,
}: {
  href: string;
  icon: typeof HeartPulse;
  title: string;
  description: string;
  action: string;
  theme: 'green' | 'blue' | 'amber';
}) {
  const styles = {
    green: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
    blue: 'bg-sky-50 text-sky-900 ring-sky-100',
    amber: 'bg-amber-50 text-amber-900 ring-amber-100',
  }[theme];

  return (
    <Link
      href={href}
      className="group animate-rise rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_20px_50px_-25px_rgba(6,78,59,0.28)] sm:p-6"
    >
      <div className="flex items-start justify-between">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ${styles}`}>
          <Icon className="h-6 w-6" />
        </span>
        <ArrowUpRight className="h-5 w-5 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-emerald-800" />
      </div>
      <h3 className="mt-5 text-lg font-extrabold text-slate-950">{title}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">{description}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-emerald-900">
        {action}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </span>
    </Link>
  );
}