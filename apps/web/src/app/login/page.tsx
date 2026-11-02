'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartPulse, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { GoogleIdentityButton } from '@/components/auth/GoogleIdentityButton';
import { apiRequest } from '@/lib/api';

type Portal = 'patient' | 'doctor' | 'admin';

interface LoginResponse {
  access_token: string;
  role: string;
  user_id: string;
  full_name: string;
  first_login_done: boolean;
  scope?: Record<string, string>;
}

const portals: { id: Portal; label: string; description: string; icon: typeof UserRound }[] = [
  { id: 'patient', label: 'Patient', description: 'Personal & family care', icon: HeartPulse },
  { id: 'doctor', label: 'Doctor', description: 'Clinical workspace', icon: Stethoscope },
  { id: 'admin', label: 'Admin', description: 'Manage the platform', icon: ShieldCheck },
];

const endpointByPortal: Record<Portal, string> = {
  patient: '/auth/patient/login',
  doctor: '/auth/doctor/login',
  admin: '/auth/admin/login',
};

export default function LoginPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<Portal>('patient');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [patientLoginMethod, setPatientLoginMethod] = useState<'otp' | 'password'>('otp');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoCode, setDemoCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('portal') === 'admin') {
      setPortal('admin');
    }
  }, []);

  async function handleGoogleCredential(credential: string) {
    if (portal === 'admin') return;
    setError('');
    setBusy(true);
    try {
      const session = await apiRequest<LoginResponse>(`/auth/google/${portal}/login`, {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
      sessionStorage.setItem('arogyasaathi_session', JSON.stringify(session));
      router.push(portal === 'patient' ? '/patient-portal' : '/workspace');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Google sign-in failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const parsedPhone = portal === 'patient' && patientLoginMethod === 'otp'
        ? parsePhoneNumberFromString(identifier, 'IN')
        : undefined;
      if (portal === 'patient' && patientLoginMethod === 'otp' && !parsedPhone?.isValid()) {
        setError('Enter a valid mobile number with its country code.');
        setBusy(false);
        return;
      }
      if (portal === 'patient' && patientLoginMethod === 'otp' && !otpSent) {
        setError('Request an SMS code before signing in.');
        setBusy(false);
        return;
      }
      const session = await apiRequest<LoginResponse>(
        portal === 'patient' && patientLoginMethod === 'otp' ? '/auth/patient/otp/login' : endpointByPortal[portal],
        {
        method: 'POST',
        body: JSON.stringify(portal === 'patient' && patientLoginMethod === 'otp'
          ? { mobile: parsedPhone!.number, otp_code: otpCode }
          : { identifier: identifier.trim(), password }),
        },
      );
      sessionStorage.setItem('arogyasaathi_session', JSON.stringify(session));
      router.push(portal === 'patient' ? '/patient-portal' : '/workspace');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sign in failed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function requestPatientLoginOtp() {
    const parsedPhone = parsePhoneNumberFromString(identifier, 'IN');
    if (!parsedPhone?.isValid()) {
      setError('Enter a valid mobile number with its country code before requesting a code.');
      return;
    }
    setError('');
    setDemoCode('');
    setBusy(true);
    try {
      const result = await apiRequest<{ status: string; demo_mode?: boolean; demo_code?: string }>('/auth/patient/otp/start', {
        method: 'POST',
        body: JSON.stringify({ mobile: parsedPhone.number, purpose: 'patient_login' }),
      });
      setOtpSent(true);
      setOtpCode('');
      setDemoCode(result.demo_mode ? result.demo_code ?? '' : '');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not send the verification code.');
    } finally {
      setBusy(false);
    }
  }

  const selectedPortal = portals.find(({ id }) => id === portal)!;

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-100 via-mint-50 to-white px-4 py-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-[2rem] border border-white bg-white shadow-premium lg:grid-cols-[1fr_0.92fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-900 p-10 text-white lg:flex">
          <div className="absolute -right-24 -top-20 h-80 w-80 rounded-full border-[48px] border-white/5" />
          <div className="absolute -bottom-28 -left-20 h-96 w-96 rounded-full border-[56px] border-emerald-300/10" />
          <Link href="/" className="relative flex items-center gap-3 text-lg font-bold">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><HeartPulse className="h-6 w-6" /></span>
            ArogyaSaathi
          </Link>
          <div className="relative max-w-lg">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-200">One trusted care network</p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight">The right access for every role.</h1>
            <p className="mt-5 text-base leading-7 text-emerald-50">Patient accounts are ready right after registration. Doctor accounts are reviewed by an administrator before access.</p>
            <div className="mt-8 space-y-3">
              <p className="flex items-center gap-3 text-sm text-emerald-50"><span className="h-2 w-2 rounded-full bg-emerald-300" />Patient: self-register and sign in</p>
              <p className="flex items-center gap-3 text-sm text-emerald-50"><span className="h-2 w-2 rounded-full bg-amber-300" />Doctor: submit credentials for approval</p>
              <p className="flex items-center gap-3 text-sm text-emerald-50"><span className="h-2 w-2 rounded-full bg-sky-300" />Admin: dedicated administrator sign-in</p>
            </div>
          </div>
          <p className="relative text-xs text-emerald-100/70">Health for Every Home · हर घर तक स्वास्थ्य</p>
        </aside>

        <section className="flex items-center px-5 py-8 sm:px-10 lg:px-12">
          <div className="mx-auto w-full max-w-md">
            <Link href="/" className="text-sm font-semibold text-slate-500 hover:text-brand-900 lg:hidden">← ArogyaSaathi</Link>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-brand-700">Secure sign in</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Choose your account type to continue to the right workspace.</p>

            <div className="mt-7 grid grid-cols-3 gap-2" role="tablist" aria-label="Choose sign-in type">
              {portals.map(({ id, label, description, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={portal === id}
                  onClick={() => { setPortal(id); setError(''); setOtpSent(false); setOtpCode(''); setDemoCode(''); }}
                  className={`rounded-2xl border p-3 text-left transition ${portal === id ? 'border-brand-800 bg-mint-50 ring-2 ring-brand-800/10' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <Icon className={`h-5 w-5 ${portal === id ? 'text-brand-800' : 'text-slate-500'}`} />
                  <span className="mt-2 block text-sm font-bold text-slate-900">{label}</span>
                  <span className="mt-0.5 hidden text-[11px] leading-4 text-slate-500 sm:block">{description}</span>
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">{selectedPortal.label} access</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                {portal === 'patient' && 'Sign in securely with a one-time SMS code, or use your password instead.'}
                {portal === 'doctor' && 'Doctor accounts can sign in after administrator approval.'}
                {portal === 'admin' && 'Administrator accounts are provisioned by the system; public admin registration is disabled.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {portal !== 'admin' && (
                <>
                  <GoogleIdentityButton onCredential={handleGoogleCredential} text="signin_with" />
                  <p className="text-center text-xs text-slate-500">Or sign in with {portal === 'patient' && patientLoginMethod === 'otp' ? 'SMS verification code' : 'mobile number and password'}</p>
                </>
              )}
              <label className="block text-sm font-semibold text-slate-800">
                Mobile number{portal === 'admin' ? ' or employee ID' : ''}
                <input required autoComplete="username" value={identifier} onChange={(event) => { setIdentifier(event.target.value); setOtpSent(false); setOtpCode(''); setDemoCode(''); }} placeholder={portal === 'patient' && patientLoginMethod === 'otp' ? '+91 98765 43210' : ''} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/15" />
              </label>
              {portal === 'patient' && patientLoginMethod === 'otp' ? (
                <div className="space-y-3">
                  <button type="button" onClick={requestPatientLoginOtp} disabled={busy} className="min-h-11 w-full rounded-xl border border-emerald-700 font-bold text-emerald-900 disabled:opacity-60">
                    {busy ? 'Sending…' : otpSent ? 'Send another SMS code' : 'Send SMS sign-in code'}
                  </button>
                  {otpSent && <input required aria-label="SMS verification code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit verification code" className="min-h-12 w-full rounded-xl border border-slate-300 px-3 tracking-[0.3em]" />}
                  {demoCode && <p role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-950">Local demo only — no SMS was sent. Test code: <span className="font-mono tracking-widest">{demoCode}</span></p>}
                  <button type="button" onClick={() => { setPatientLoginMethod('password'); setOtpSent(false); setOtpCode(''); setError(''); }} className="w-full text-center text-xs font-semibold text-brand-800 underline underline-offset-4">Use password instead</button>
                </div>
              ) : (
                <>
                  <label className="block text-sm font-semibold text-slate-800">
                    Password
                    <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal focus:border-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-700/15" />
                  </label>
                  {portal === 'patient' && <button type="button" onClick={() => { setPatientLoginMethod('otp'); setError(''); }} className="w-full text-center text-xs font-semibold text-brand-800 underline underline-offset-4">Sign in with SMS code</button>}
                </>
              )}
              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
              <button disabled={busy || (portal === 'patient' && patientLoginMethod === 'otp' && !otpSent)} className="min-h-12 w-full rounded-xl bg-brand-900 px-4 font-bold text-white transition hover:bg-brand-800 disabled:cursor-wait disabled:opacity-60">
                {busy ? 'Signing in…' : `Sign in as ${selectedPortal.label}`}
              </button>
            </form>

            {portal === 'patient' && (
              <p className="mt-5 text-center text-sm text-slate-600">
                New patient? <Link href="/patient-register" className="font-bold text-brand-800 underline underline-offset-4">Create account</Link>
              </p>
            )}
            {portal === 'doctor' && (
              <p className="mt-5 text-center text-sm text-slate-600">
                New doctor? <Link href="/doctor-register" className="font-bold text-brand-800 underline underline-offset-4">Apply for access</Link>
              </p>
            )}
            <p className="mt-7 border-t border-slate-100 pt-5 text-center text-xs text-slate-500">
              Health worker? <Link href="/worker-login" className="font-semibold text-brand-800 underline underline-offset-4">Open staff sign-in</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
