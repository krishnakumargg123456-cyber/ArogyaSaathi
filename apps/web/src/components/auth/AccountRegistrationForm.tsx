'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, HeartPulse, Stethoscope } from 'lucide-react';
import { getCountries, getCountryCallingCode, parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { GoogleIdentityButton } from '@/components/auth/GoogleIdentityButton';
import { apiRequest } from '@/lib/api';

type RegistrationType = 'patient' | 'doctor';

interface LookupOption {
  id: string;
  name: string;
}

interface RegistrationResponse {
  status: string;
  message: string;
  mobile: string;
}

export function AccountRegistrationForm({ type }: { type: RegistrationType }) {
  const isPatient = type === 'patient';
  const [country, setCountry] = useState<CountryCode>('IN');
  const [facilities, setFacilities] = useState<LookupOption[]>([]);
  const [departments, setDepartments] = useState<LookupOption[]>([]);
  const [lookupError, setLookupError] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<RegistrationResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleCredential, setGoogleCredential] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isPatient) return;
    let active = true;
    Promise.all([
      apiRequest<LookupOption[]>('/facilities'),
      apiRequest<LookupOption[]>('/departments'),
    ]).then(([facilityOptions, departmentOptions]) => {
      if (!active) return;
      setFacilities(facilityOptions);
      setDepartments(departmentOptions);
    }).catch((requestError) => {
      if (active) setLookupError(requestError instanceof Error ? requestError.message : 'Could not load facility details.');
    });
    return () => { active = false; };
  }, [isPatient]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get('password') ?? '');
    if (!googleCredential && password !== formData.get('confirm_password')) {
      setError('Passwords do not match.');
      return;
    }

    const parsedPhone = parsePhoneNumberFromString(String(formData.get('mobile') ?? ''), country);
    if (!parsedPhone?.isValid()) {
      setError('Enter a valid mobile number for the selected country.');
      return;
    }
    if (isPatient && !otpSent) {
      setError('Verify your mobile number before creating your account.');
      return;
    }

    const body: Record<string, FormDataEntryValue | string | boolean> = {
      mobile: parsedPhone.number,
      accepted_terms: formData.get('accepted_terms') === 'on',
    };
    if (googleCredential) {
      body.credential = googleCredential;
    } else {
      body.full_name = formData.get('full_name') ?? '';
      body.password = password;
    }

    if (isPatient) {
      body.age = String(formData.get('age') ?? '');
      body.gender = formData.get('gender') ?? '';
      body.otp_code = otpCode;
    } else {
      for (const field of ['facility_id', 'department_id', 'specialization', 'qualification', 'registration_number']) {
        body[field] = formData.get(field) ?? '';
      }
    }

    setBusy(true);
    try {
      const result = await apiRequest<RegistrationResponse>(
        isPatient ? '/auth/patient/register' : '/auth/doctor/register',
        { method: 'POST', body: JSON.stringify(body) },
      );
      setSuccess(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Registration failed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function requestPatientOtp() {
    const form = formRef.current;
    if (!form) return;
    const formData = new FormData(form);
    const parsedPhone = parsePhoneNumberFromString(String(formData.get('mobile') ?? ''), country);
    if (!parsedPhone?.isValid()) {
      setError('Enter a valid mobile number before requesting a code.');
      return;
    }
    setError('');
    setDemoCode('');
    setBusy(true);
    try {
      const result = await apiRequest<{ status: string; demo_mode?: boolean; demo_code?: string }>('/auth/patient/otp/start', {
        method: 'POST',
        body: JSON.stringify({ mobile: parsedPhone.number, purpose: 'patient_register' }),
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-mint-50 via-white to-slate-100 px-4 py-10">
      <section className="mx-auto max-w-2xl">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-brand-900">
          <ArrowLeft className="h-4 w-4" />Back to sign in
        </Link>
        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-premium">
          <div className="bg-brand-900 p-7 text-white sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              {isPatient ? <HeartPulse className="h-6 w-6" /> : <Stethoscope className="h-6 w-6" />}
            </div>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
              {isPatient ? 'Patient & family' : 'Healthcare professional'}
            </p>
            <h1 className="mt-2 text-3xl font-extrabold">
              {isPatient ? 'Create your patient account' : 'Doctor registration'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-emerald-50">
              {isPatient
                ? 'Register yourself and access your care account right away.'
                : 'Submit your professional details. Your account becomes active after administrator approval.'}
            </p>
          </div>

          {success ? (
            <div className="p-7 sm:p-9">
              <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm leading-6 text-emerald-950">
                <h2 className="text-lg font-bold">{isPatient ? 'Registration complete' : 'Request sent for review'}</h2>
                <p className="mt-2">{success.message}</p>
                {!isPatient && <p className="mt-1">Sign-in will be available once an administrator approves your account.</p>}
              </div>
              <Link href="/login" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-brand-900 px-5 font-semibold text-white">
                Go to sign in
              </Link>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="grid gap-5 p-6 sm:grid-cols-2 sm:p-9">
              {!isPatient && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 sm:col-span-2">
                  Administrator approval is required. Your professional credentials will be reviewed before access is enabled.
                </div>
              )}
              {lookupError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{lookupError}</p>}
              <div className="space-y-2 sm:col-span-2">
                <GoogleIdentityButton onCredential={setGoogleCredential} />
                <p className="text-center text-xs text-slate-500">Or continue with mobile number and password</p>
                {googleCredential && <p role="status" className="text-center text-sm font-medium text-emerald-800">Google account selected. Its identity will be verified when you submit the form.</p>}
              </div>
              {!googleCredential && <label className="text-sm font-semibold text-slate-800 sm:col-span-2">
                Full name <span className="text-red-600">*</span>
                <input required name="full_name" autoComplete="name" minLength={2} maxLength={100} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
              </label>}
              <div className="sm:col-span-2">
                <label htmlFor="phone-country" className="mb-2 block text-sm font-semibold text-slate-800">Mobile number <span className="text-red-600">*</span></label>
                <div className="grid gap-2 sm:grid-cols-[minmax(12rem,0.8fr)_1fr]">
                  <select id="phone-country" value={country} onChange={(event) => {
                    const selected = getCountries().find((code) => code === event.target.value);
                    if (selected) {
                      setCountry(selected);
                      setOtpSent(false);
                    }
                  }} className="min-h-12 rounded-xl border border-slate-300 bg-white px-3">
                    <option value="IN">India (+91)</option>
                    <CountryOptions />
                  </select>
                  <input required name="mobile" type="tel" autoComplete="tel-national" placeholder="Mobile number" onChange={() => { setOtpSent(false); setDemoCode(''); setOtpCode(''); }} className="min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
                </div>
              </div>

              {isPatient ? (
                <>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:col-span-2">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <p className="flex-1 self-center text-sm leading-5 text-emerald-950">
                        {otpSent ? 'Enter the 6-digit code sent to your mobile. It expires in 5 minutes.' : 'Verify your mobile number with a one-time SMS code.'}
                      </p>
                      <button type="button" onClick={requestPatientOtp} disabled={busy} className="min-h-11 rounded-xl bg-emerald-800 px-4 text-sm font-bold text-white disabled:opacity-60">
                        {busy ? 'Sending…' : otpSent ? 'Send again' : 'Send SMS code'}
                      </button>
                    </div>
                    {otpSent && <input required aria-label="SMS verification code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="6-digit verification code" className="mt-3 min-h-12 w-full rounded-xl border border-emerald-300 bg-white px-3 tracking-[0.3em]" />}
                    {demoCode && <p role="status" className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-950">Local demo only — no SMS was sent. Test code: <span className="font-mono tracking-widest">{demoCode}</span></p>}
                  </div>
                  <label className="text-sm font-semibold text-slate-800">
                    Age <span className="text-red-600">*</span>
                    <input required name="age" type="number" min={0} max={125} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
                  </label>
                  <label className="text-sm font-semibold text-slate-800">
                    Gender <span className="text-red-600">*</span>
                    <select required name="gender" defaultValue="" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
                      <option value="" disabled>Select gender</option><option>Female</option><option>Male</option><option>Other</option>
                    </select>
                  </label>
                </>
              ) : (
                <>
                  <label className="text-sm font-semibold text-slate-800">
                    Qualification <span className="text-red-600">*</span>
                    <input required name="qualification" placeholder="e.g. MBBS, MD" maxLength={100} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
                  </label>
                  <label className="text-sm font-semibold text-slate-800">
                    Specialization <span className="text-red-600">*</span>
                    <input required name="specialization" placeholder="e.g. General Medicine" maxLength={100} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
                  </label>
                  <label className="text-sm font-semibold text-slate-800 sm:col-span-2">
                    Medical registration number <span className="text-red-600">*</span>
                    <input required name="registration_number" maxLength={80} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
                  </label>
                  <label className="text-sm font-semibold text-slate-800">
                    Facility <span className="text-red-600">*</span>
                    <select required name="facility_id" defaultValue="" disabled={facilities.length === 0} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
                      <option value="" disabled>Select facility</option>
                      {facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.name}</option>)}
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-slate-800">
                    Department <span className="text-red-600">*</span>
                    <select required name="department_id" defaultValue="" disabled={departments.length === 0} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal">
                      <option value="" disabled>Select department</option>
                      {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                    </select>
                  </label>
                </>
              )}

              {!googleCredential && <>
                <label className="text-sm font-semibold text-slate-800">
                  Password <span className="text-red-600">*</span>
                  <input required name="password" type="password" autoComplete="new-password" minLength={8} maxLength={72} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
                </label>
                <label className="text-sm font-semibold text-slate-800">
                  Confirm password <span className="text-red-600">*</span>
                  <input required name="confirm_password" type="password" autoComplete="new-password" minLength={8} maxLength={72} className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-3 font-normal" />
                </label>
              </>}
              <label className="flex items-start gap-3 text-sm leading-6 text-slate-700 sm:col-span-2">
                <input required name="accepted_terms" type="checkbox" className="mt-1 h-4 w-4 accent-emerald-800" />
                <span>{isPatient
                  ? 'I consent to creating a patient account and storing these details for healthcare coordination.'
                  : 'I confirm these professional details are accurate and understand an administrator must approve access.'}</span>
              </label>
              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 sm:col-span-2">{error}</p>}
              <button type="submit" disabled={busy || Boolean(lookupError) || (isPatient && !otpSent) || (!isPatient && (!facilities.length || !departments.length))} className="min-h-12 rounded-xl bg-brand-900 px-6 font-semibold text-white hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60 sm:col-span-2">
                {busy ? 'Submitting…' : isPatient ? 'Create patient account' : 'Submit for admin approval'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function CountryOptions() {
  const [options, setOptions] = useState<{ code: CountryCode; name: string; callingCode: string }[]>([]);

  useEffect(() => {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    setOptions(getCountries()
      .filter((country) => country !== 'IN')
      .map((code) => ({
        code,
        name: names.of(code) ?? code,
        callingCode: getCountryCallingCode(code),
      }))
      .sort((first, second) => first.name.localeCompare(second.name)));
  }, []);

  return <>{options.map(({ code, name, callingCode }) => <option key={code} value={code}>{name} (+{callingCode})</option>)}</>;
}
