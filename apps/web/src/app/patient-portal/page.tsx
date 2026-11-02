'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartPulse, LogOut, MessageCircle, ShieldCheck } from 'lucide-react';

interface PatientSession {
  role: string;
  full_name: string;
}

export default function PatientPortalPage() {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientSession | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('arogyasaathi_session');
    if (!stored) {
      router.replace('/login');
      return;
    }
    try {
      const session = JSON.parse(stored) as PatientSession;
      if (session.role !== 'PATIENT') {
        router.replace('/login');
        return;
      }
      setPatient(session);
    } catch {
      sessionStorage.removeItem('arogyasaathi_session');
      router.replace('/login');
    }
  }, [router]);

  function signOut() {
    sessionStorage.removeItem('arogyasaathi_session');
    router.replace('/login');
  }

  if (!patient) return <main className="min-h-screen bg-mint-50" aria-busy="true" />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-slate-100 px-4 py-10">
      <section className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between rounded-2xl bg-brand-900 p-5 text-white sm:p-7">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><HeartPulse className="h-6 w-6" /></span>
            <div><p className="text-sm font-bold">ArogyaSaathi</p><p className="text-xs text-emerald-100">Patient & family portal</p></div>
          </div>
          <button type="button" onClick={signOut} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20"><LogOut className="h-4 w-4" />Sign out</button>
        </header>
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Your account</p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Namaste, {patient.full_name}</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">Your patient account is active. Appointment and personal health record features will appear here as they are enabled for your care team.</p>
          <div className="mt-7 flex items-start gap-3 rounded-2xl bg-mint-50 p-4 text-sm leading-6 text-slate-700">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
            <p>Your registration details and consent are linked to your patient account. Sign out on shared devices.</p>
          </div>
          <Link href="/saathi" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-brand-900 px-5 text-sm font-bold text-white hover:bg-brand-800">
            <MessageCircle className="h-4 w-4" />Talk to Sehat Saathi
          </Link>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Back to home</Link>
        </div>
      </section>
    </main>
  );
}
