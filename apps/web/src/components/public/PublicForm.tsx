'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Info } from 'lucide-react';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { GoogleIdentityButton } from '@/components/auth/GoogleIdentityButton';
import { apiRequest } from '@/lib/api';

interface RegistrationResponse {
  status: string;
  message: string;
  mobile: string;
}

export function PublicForm({ mode }: { mode: 'contact' | 'access' }) {
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>('IN');
  const [countries, setCountries] = useState<{ code: CountryCode; name: string; callingCode: string }[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [registeredMobile, setRegisteredMobile] = useState('');
  const [googleCredential, setGoogleCredential] = useState('');
  const isAccess = mode === 'access';

  const handleGoogleCredential = useCallback((credential: string) => {
    setGoogleCredential(credential);
    setError('');
  }, []);

  useEffect(() => {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    setCountries(getCountries()
      .map((code) => ({
        code,
        name: regionNames.of(code) ?? code,
        callingCode: getCountryCallingCode(code),
      }))
      .sort((first, second) => first.name.localeCompare(second.name)));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (!isAccess) {
      setSubmitted(true);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirm_password') ?? '');
    if (!googleCredential && password !== confirmPassword) {
      setError('Passwords do not match. Enter the same password in both fields.');
      return;
    }

    const enteredPhone = String(formData.get('mobile') ?? '').trim();
    const parsedPhone = parsePhoneNumberFromString(enteredPhone, phoneCountry);
    if (!parsedPhone?.isValid()) {
      setError('Enter a valid mobile number for the selected country, including its country code if needed.');
      return;
    }

    setBusy(true);
    try {
      const response = await apiRequest<RegistrationResponse>(
        googleCredential ? '/auth/google/register' : '/auth/register',
        {
        method: 'POST',
          body: JSON.stringify(googleCredential
            ? {
              credential: googleCredential,
              mobile: parsedPhone.number,
              district: formData.get('district') || null,
              block: formData.get('block') || null,
              accepted_terms: formData.get('accepted_terms') === 'on',
            }
            : {
              full_name: formData.get('full_name'),
              mobile: parsedPhone.number,
              password,
              district: formData.get('district') || null,
              block: formData.get('block') || null,
              accepted_terms: formData.get('accepted_terms') === 'on',
            }),
        },
      );
      setRegisteredMobile(response.mobile);
      setSubmitted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Registration failed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft sm:p-9">
        {(!isAccess || !submitted) && (
          <div className="mb-6 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
            {isAccess
              ? <p><strong>Approval required:</strong> Your account stays inactive until an administrator approves it. After approval, sign in with this same mobile number and password.</p>
              : <p><strong>Development preview:</strong> This contact form does not send or save personal information. Please do not enter sensitive patient data.</p>}
          </div>
        )}
        {submitted ? (
          <div role="status" className="rounded-2xl bg-amber-50 p-5 text-sm leading-6 text-amber-950">
            <CheckCircle2 className="mb-2 h-6 w-6 text-amber-700" />
            {isAccess
              ? <p>Registration for {registeredMobile} is pending administrator approval. {googleCredential ? 'After approval, sign in with the same Google account.' : 'After approval, sign in with this mobile number and password.'}</p>
              : <p>Your entries were validated in this preview only; nothing was transmitted. Please contact your authorized ArogyaSaathi program coordinator to submit an official inquiry.</p>}
            {isAccess
              ? <Link href="/login" className="mt-4 inline-flex min-h-10 items-center font-semibold underline underline-offset-4">Go to sign in</Link>
              : <button type="button" onClick={() => setSubmitted(false)} className="mt-4 block font-semibold underline underline-offset-4">Edit the form</button>}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
            {isAccess && (
              <div className="space-y-2 sm:col-span-2">
                <GoogleIdentityButton onCredential={handleGoogleCredential} />
                <p className="text-center text-xs text-slate-500">Or register with your mobile number and password</p>
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Exotel missed-call verification is not configured yet. No verification call will be placed; all registration requests still need administrator approval.</p>
                {googleCredential && <p role="status" className="text-center text-sm font-medium text-emerald-800">Google account selected. Its verified name and email will be used.</p>}
              </div>
            )}
            {!googleCredential && <label className="text-sm font-semibold text-slate-800">Full name <span className="text-red-600">*</span><input required={!googleCredential} name="full_name" autoComplete="name" minLength={2} maxLength={100} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label>}
            {isAccess ? (
              <>
                <div className="text-sm font-semibold text-slate-800 sm:col-span-2">
                  <span>Mobile number <span className="text-red-600">*</span></span>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(12rem,0.8fr)_1fr]">
                    <label className="sr-only" htmlFor="mobile-country">Country and calling code</label>
                    <select id="mobile-country" value={phoneCountry} onChange={(event) => {
                      const selectedCountry = countries.find(({ code }) => code === event.target.value);
                      if (selectedCountry) setPhoneCountry(selectedCountry.code);
                    }} autoComplete="country" className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
                      {countries.length === 0
                        ? <option value="IN">India (+91)</option>
                        : countries.map(({ code, name, callingCode }) => (
                          <option key={code} value={code}>{name} (+{callingCode})</option>
                        ))}
                    </select>
                    <label className="sr-only" htmlFor="mobile-number">Mobile number</label>
                    <input id="mobile-number" required name="mobile" type="tel" autoComplete="tel-national" placeholder="Mobile number" className="min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" />
                  </div>
                  <span className="mt-1 block text-xs font-normal text-slate-500">The country calling code is included when your request is saved. No call or OTP verification is performed.</span>
                </div>
                {!googleCredential && <>
                  <label className="text-sm font-semibold text-slate-800">Password <span className="text-red-600">*</span><input required name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label>
                  <label className="text-sm font-semibold text-slate-800">Confirm password <span className="text-red-600">*</span><input required name="confirm_password" type="password" autoComplete="new-password" minLength={8} maxLength={72} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label>
                </>}
                <label className="text-sm font-semibold text-slate-800">District<input name="district" maxLength={60} autoComplete="address-level2" className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-800">Block<input name="block" maxLength={60} className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label>
                <label className="flex items-start gap-3 text-sm leading-6 text-slate-700 sm:col-span-2"><input required name="accepted_terms" type="checkbox" className="mt-1 h-4 w-4 accent-emerald-800" /><span>I understand access is subject to administrator approval and this request creates an inactive account until approved.</span></label>
              </>
            ) : (
              <>
                <label className="text-sm font-semibold text-slate-800">Work email <span className="text-red-600">*</span><input required type="email" autoComplete="email" className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-800">Organization <span className="text-red-600">*</span><input required className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 font-normal" /></label>
                <label className="text-sm font-semibold text-slate-800">Role <span className="text-red-600">*</span><select required defaultValue="" className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal"><option value="" disabled>Select role</option><option>District health authority</option><option>Facility / PHC</option><option>NGO / research partner</option><option>Other</option></select></label>
                <label className="text-sm font-semibold text-slate-800 sm:col-span-2">How can we help? <span className="text-red-600">*</span><textarea required rows={4} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" /></label>
              </>
            )}
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</p>}
            <button type="submit" disabled={busy} className="min-h-12 rounded-xl bg-brand-900 px-6 font-semibold text-white hover:bg-brand-800 disabled:cursor-wait disabled:opacity-60 sm:col-span-2">{busy ? 'Submitting…' : isAccess ? 'Create registration request' : 'Validate inquiry'}</button>
          </form>
        )}
      </div>
    </section>
  );
}
