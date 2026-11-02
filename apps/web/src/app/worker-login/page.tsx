'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, ShieldCheck } from 'lucide-react';
import { GoogleIdentityButton } from '@/components/auth/GoogleIdentityButton';
import { apiRequest } from '@/lib/api';

interface LoginResponse {
  access_token: string;
  role: string;
  user_id: string;
  full_name: string;
  first_login_done: boolean;
  scope?: Record<string, string>;
}

const staffRoles = new Set(['ASHA', 'ANM', 'PHC_STAFF', 'PUBLIC_HEALTH_OFFICER']);
const WEB_DEVICE_KEY = 'arogyasaathi_web_device_id';

function getWebDeviceId() {
  const existing = localStorage.getItem(WEB_DEVICE_KEY);
  if (existing) return existing;
  const deviceId = `web-${crypto.randomUUID()}`;
  localStorage.setItem(WEB_DEVICE_KEY, deviceId);
  return deviceId;
}

export default function WorkerLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function acceptSession(session: LoginResponse) {
    if (!staffRoles.has(session.role)) {
      setError('Use the Patient, Doctor, or Admin sign-in option for this account.');
      return;
    }
    sessionStorage.setItem('arogyasaathi_session', JSON.stringify({
      ...session,
      device_id: getWebDeviceId(),
    }));
    router.push('/workspace');
  }

  async function handleGoogleCredential(credential: string) {
    setError('');
    setBusy(true);
    try {
      const session = await apiRequest<LoginResponse>('/auth/google/login', {
        method: 'POST',
        body: JSON.stringify({ credential, device_id: getWebDeviceId(), device_model: 'Web Browser' }),
      });
      await acceptSession(session);
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
      const session = await apiRequest<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          device_id: getWebDeviceId(),
          device_model: 'Web Browser',
        }),
      });
      await acceptSession(session);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Sign in failed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-mint-50 via-white to-slate-100 px-4 py-10">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-premium sm:p-9">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-900"><ArrowLeft className="h-4 w-4" />All sign-in options</Link>
        <div className="mt-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-900 text-white"><Heart className="h-6 w-6" /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-brand-700">Authorized staff</p>
        <h1 className="mt-2 text-3xl font-extrabold text-slate-950">Health worker sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use your registered mobile number or employee ID. New staff requests require administrator approval.</p>
        <div className="mt-6"><GoogleIdentityButton onCredential={handleGoogleCredential} text="signin_with" /></div>
        <p className="my-4 text-center text-xs text-slate-500">Or sign in with mobile number / employee ID</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block text-sm font-semibold text-slate-800">Mobile number or employee ID<input required autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label>
          <label className="block text-sm font-semibold text-slate-800">Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <button disabled={busy} className="min-h-12 w-full rounded-xl bg-brand-900 px-4 font-bold text-white disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in securely'}</button>
        </form>
        <p className="mt-5 flex items-start gap-2 rounded-xl bg-mint-50 p-3 text-xs leading-5 text-slate-600"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />New registrations remain inactive until an administrator approves them.</p>
        <p className="mt-5 text-center text-sm text-slate-600">New health worker? <Link href="/request-access" className="font-semibold text-brand-800 underline underline-offset-4">Register account</Link></p>
      </section>
    </main>
  );
}
