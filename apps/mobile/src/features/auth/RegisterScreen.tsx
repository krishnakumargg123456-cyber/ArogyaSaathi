import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartPulse,
  ShieldCheck
} from 'lucide-react';
import { Button, Card, Input } from '../../design-system';
import {
  getMobileDeviceId,
  mobileApiFetch,
  type MobileSession
} from '../../core/api/client';

type RegistrationRole = 'PATIENT' | 'DOCTOR' | 'ASHA';

interface RegisterScreenProps {
  onBack: () => void;
  onSuccess?: (session: MobileSession) => void;
  onFirstLogin?: (userId: string) => void;
}

interface RegistrationResponse {
  status: string;
  message: string;
  mobile: string;
}

interface OtpStartResponse {
  status: string;
  message: string;
  expires_in_seconds: number;
  demo_mode: boolean;
  demo_code?: string;
}

interface DirectoryItem {
  id: string;
  name: string;
  district?: string | null;
  block?: string | null;
}

const normalizeMobile = (value: string, requireInternational = false) => {
  const cleaned = value.trim().replace(/[\s()-]/g, '');
  if (/^\d{10}$/.test(cleaned)) return `+91${cleaned}`;
  if (/^\+\d{7,15}$/.test(cleaned)) return cleaned;
  if (!requireInternational && /^\d{10,15}$/.test(cleaned)) return cleaned;
  return '';
};

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onBack,
  onSuccess,
  onFirstLogin
}) => {
  const [role, setRole] = useState<RegistrationRole>('PATIENT');
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegistrationResponse | null>(null);
  const [patientLoginFailed, setPatientLoginFailed] = useState(false);

  // Patient fields
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Female');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [demoCode, setDemoCode] = useState<string | null>(null);

  // Doctor fields
  const [facilities, setFacilities] = useState<DirectoryItem[]>([]);
  const [departments, setDepartments] = useState<DirectoryItem[]>([]);
  const [facilityId, setFacilityId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  // Existing ASHA fields
  const [district, setDistrict] = useState('');
  const [block, setBlock] = useState('');

  useEffect(() => {
    if (role !== 'DOCTOR') return;

    let active = true;
    setDirectoryLoading(true);
    setDirectoryError(null);

    Promise.all([
      mobileApiFetch<DirectoryItem[]>('/facilities'),
      mobileApiFetch<DirectoryItem[]>('/departments')
    ])
      .then(([facilityData, departmentData]) => {
        if (!active) return;
        setFacilities(Array.isArray(facilityData) ? facilityData : []);
        setDepartments(Array.isArray(departmentData) ? departmentData : []);
      })
      .catch((err) => {
        if (!active) return;
        setDirectoryError(
          err instanceof Error ? err.message : 'Could not load facilities and departments.'
        );
      })
      .finally(() => {
        if (active) setDirectoryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [role]);

  const validateCommon = () => {
    if (fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return false;
    }

    if (!normalizeMobile(mobile)) {
      setError('Enter a valid 10-digit mobile number or international number.');
      return false;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return false;
    }

    if (new TextEncoder().encode(password).length > 72) {
      setError('Password must be 72 bytes or fewer.');
      return false;
    }

    if (!acceptedTerms) {
      setError('Please accept the terms and privacy notice.');
      return false;
    }

    return true;
  };

  const startPatientOtp = async () => {
    setError(null);

    const normalizedMobile = normalizeMobile(mobile, true);
    if (!normalizedMobile) {
      setError('Enter a valid mobile number. Indian 10-digit numbers use +91 automatically.');
      return;
    }

    setIsLoading(true);
    setDemoCode(null);

    try {
      const response = await mobileApiFetch<OtpStartResponse>(
        '/auth/patient/otp/start',
        {
          method: 'POST',
          body: JSON.stringify({
            mobile: normalizedMobile,
            purpose: 'patient_register'
          })
        }
      );

      setOtpSent(true);
      setOtpMessage(response.message || 'Verification request processed.');
      setDemoCode(response.demo_mode ? response.demo_code || null : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not request verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitPatientRegistration = async () => {
    if (!validateCommon()) return;

    if (!otpSent) {
      setError('Request a verification code first.');
      return;
    }

    if (!/^\d{6}$/.test(otpCode.trim())) {
      setError('Enter the six-digit verification code.');
      return;
    }

    const parsedAge = Number(age);
    if (!age.trim() || !Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 125) {
      setError('Enter a valid age between 0 and 125.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const normalizedMobile = normalizeMobile(mobile, true);

    try {
      const registration = await mobileApiFetch<RegistrationResponse>(
        '/auth/patient/register',
        {
          method: 'POST',
          body: JSON.stringify({
            full_name: fullName.trim(),
            mobile: normalizedMobile,
            password,
            otp_code: otpCode.trim(),
            age: parsedAge,
            gender,
            accepted_terms: true
          })
        }
      );

      setResult(registration);

      // Patient accounts are active immediately. Obtain a real backend session.
      try {
        const session = await mobileApiFetch<MobileSession>('/auth/patient/login', {
          method: 'POST',
          body: JSON.stringify({
            identifier: normalizedMobile,
            password,
            device_id: getMobileDeviceId(),
            device_model: 'ArogyaSaathi Mobile'
          })
        });

        if (session.role !== 'PATIENT' || !session.access_token || !session.user_id) {
          throw new Error('The server did not return a valid patient session.');
        }

        onFirstLogin?.(session.user_id);
        onSuccess?.(session);
      } catch {
        // Registration succeeded, but do not pretend that sign-in succeeded.
        setPatientLoginFailed(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Patient registration could not be completed.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const submitDoctorRegistration = async () => {
    if (!validateCommon()) return;

    if (!facilityId || !departmentId) {
      setError('Select an available facility and department.');
      return;
    }

    if (specialization.trim().length < 2) {
      setError('Enter your specialization.');
      return;
    }

    if (qualification.trim().length < 2) {
      setError('Enter your qualification.');
      return;
    }

    if (registrationNumber.trim().length < 3) {
      setError('Enter your professional registration number.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await mobileApiFetch<RegistrationResponse>(
        '/auth/doctor/register',
        {
          method: 'POST',
          body: JSON.stringify({
            full_name: fullName.trim(),
            mobile: normalizeMobile(mobile),
            password,
            facility_id: facilityId,
            department_id: departmentId,
            specialization: specialization.trim(),
            qualification: qualification.trim(),
            registration_number: registrationNumber.trim(),
            accepted_terms: true
          })
        }
      );

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Doctor registration could not be completed.');
    } finally {
      setIsLoading(false);
    }
  };

  const submitAshaRegistration = async () => {
    if (!validateCommon()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await mobileApiFetch<RegistrationResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          full_name: fullName.trim(),
          mobile: normalizeMobile(mobile),
          password,
          district: district.trim() || null,
          block: block.trim() || null,
          accepted_terms: true
        })
      });

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ASHA registration could not be completed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isLoading) return;

    if (role === 'PATIENT') {
      if (!otpSent) {
        await startPatientOtp();
      } else {
        await submitPatientRegistration();
      }
    } else if (role === 'DOCTOR') {
      await submitDoctorRegistration();
    } else {
      await submitAshaRegistration();
    }
  };

  if (result && role !== 'PATIENT') {
    const isDoctor = role === 'DOCTOR';

    return (
      <main className="min-h-screen min-h-[100dvh] bg-[#F5F8F6] flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <Card padding="lg" className="!rounded-[26px] !border-[#E5ECE7] text-center space-y-5 !shadow-[0_12px_40px_rgba(20,55,40,0.07)]">
            <div className="mx-auto w-16 h-16 rounded-full bg-[#E5F3EC] flex items-center justify-center">
              <CheckCircle2 size={34} className="text-[#0B6E4F]" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-[0.15em] uppercase text-[#0B6E4F]">
                Registration submitted
              </p>
              <h2 className="text-2xl font-bold text-[#172B25] mt-2">
                Awaiting approval
              </h2>
              <p className="text-sm text-[#718078] mt-2 leading-6">
                {result.message || 'Your registration has been submitted for administrator approval.'}
              </p>
            </div>
            <div className="rounded-xl bg-[#F3F7F4] p-4 text-left space-y-1">
              <p className="text-xs text-[#7A8780]">Registered mobile number</p>
              <p className="font-semibold text-[#172B25]">{result.mobile || mobile}</p>
              <p className="text-xs text-[#7A8780] pt-2">
                {isDoctor
                  ? 'You can sign in after an administrator approves your doctor account.'
                  : 'You can sign in after your healthcare worker account is approved.'}
              </p>
            </div>
            <Button type="button" fullWidth size="lg" onClick={onBack}>
              Back to Sign In
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  if (result && role === 'PATIENT' && patientLoginFailed) {
    return (
      <main className="min-h-screen min-h-[100dvh] bg-[#F5F8F6] flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <Card padding="lg" className="!rounded-[26px] !border-[#E5ECE7] text-center space-y-5">
            <CheckCircle2 size={42} className="mx-auto text-[#0B6E4F]" />
            <h2 className="text-xl font-bold text-[#172B25]">Account created successfully</h2>
            <p className="text-sm text-[#718078]">
              Your patient account is active, but automatic sign-in could not be completed. Please return to sign in with your registered mobile number and password.
            </p>
            <Button type="button" fullWidth onClick={onBack}>
              Continue to Sign In
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen min-h-[100dvh] bg-[#F5F8F6] px-5 py-7">
      <div className="w-full max-w-md mx-auto space-y-5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#547066] hover:text-[#0B6E4F]"
        >
          <ArrowLeft size={18} /> Back to Sign In
        </button>

        <header className="flex items-center gap-3">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br from-[#176B52] to-[#0B4437] flex items-center justify-center">
            <HeartPulse size={26} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#172B25]">Create your account</h1>
            <p className="text-xs text-[#7A8780] mt-0.5">
              Choose the account type you want to register.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-2">
          {([
            ['PATIENT', 'Patient'],
            ['DOCTOR', 'Doctor'],
            ['ASHA', 'ASHA Worker']
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setRole(value);
                setError(null);
                setResult(null);
              }}
              aria-pressed={role === value}
              className={`rounded-xl border px-2 py-3 text-sm font-semibold transition ${
                role === value
                  ? 'border-[#0B6E4F] bg-[#EAF4EF] text-[#0B6E4F] ring-1 ring-[#0B6E4F]'
                  : 'border-[#E5ECE7] bg-white text-[#718078]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <Card padding="lg" className="!rounded-[24px] !border-[#E5ECE7] space-y-5 !shadow-[0_12px_40px_rgba(20,55,40,0.06)]">
          <div>
            <h2 className="text-lg font-bold text-[#172B25]">
              {role === 'PATIENT' ? 'Patient registration' : role === 'DOCTOR' ? 'Doctor registration' : 'ASHA registration'}
            </h2>
            <p className="text-xs text-[#7A8780] mt-1">
              {role === 'PATIENT'
                ? 'Verify your mobile number to create an active patient account.'
                : role === 'DOCTOR'
                  ? 'Submit your professional details for administrator approval.'
                  : 'Complete your details to request healthcare worker access.'}
            </p>
          </div>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full name"
              placeholder="Enter your full name"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              minLength={2}
              maxLength={100}
              required
            />

            <Input
              label="Mobile number"
              placeholder="10-digit mobile number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (otpSent) {
                  setOtpSent(false);
                  setOtpCode('');
                  setDemoCode(null);
                }
              }}
              maxLength={20}
              required
            />

            <Input
              label="Create password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={72}
              rightIcon={
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((value) => !value)}
                  className="p-1 text-[#718078] hover:text-[#0B6E4F]"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              required
            />

            {role === 'PATIENT' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Age"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={125}
                    placeholder="Your age"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-[#46574F] mb-2">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full h-[46px] rounded-xl border border-[#DCE6DF] bg-white px-3 text-sm text-[#172B25]"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {otpSent && (
                  <div className="space-y-3 rounded-xl border border-[#DCE9E0] bg-[#F5F9F6] p-3">
                    <p className="text-sm font-semibold text-[#174C39]">Mobile verification</p>
                    <p className="text-xs text-[#64766C]">{otpMessage}</p>

                    {demoCode && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <p className="text-xs font-semibold text-amber-800">Local testing code — no SMS was sent</p>
                        <p className="text-xl font-bold tracking-[0.25em] text-amber-900 mt-1">{demoCode}</p>
                      </div>
                    )}

                    <Input
                      label="Six-digit verification code"
                      placeholder="Enter OTP"
                      inputMode="numeric"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                    />

                    <button
                      type="button"
                      onClick={startPatientOtp}
                      disabled={isLoading}
                      className="text-xs font-semibold text-[#0B6E4F] underline disabled:opacity-50"
                    >
                      Resend verification code
                    </button>
                  </div>
                )}
              </>
            )}

            {role === 'DOCTOR' && (
              <>
                {directoryLoading && (
                  <p className="text-xs text-[#718078]">Loading available facilities and departments…</p>
                )}

                {directoryError && (
                  <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    {directoryError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#46574F] mb-2">Healthcare facility</label>
                  <select
                    value={facilityId}
                    onChange={(e) => setFacilityId(e.target.value)}
                    disabled={directoryLoading || facilities.length === 0}
                    required
                    className="w-full h-[46px] rounded-xl border border-[#DCE6DF] bg-white px-3 text-sm text-[#172B25] disabled:opacity-60"
                  >
                    <option value="">Select facility</option>
                    {facilities.map((facility) => (
                      <option key={facility.id} value={facility.id}>
                        {facility.name}{facility.district ? ` — ${facility.district}` : ''}
                      </option>
                    ))}
                  </select>
                  {!directoryLoading && facilities.length === 0 && (
                    <p className="text-xs text-amber-700 mt-1">No active facilities are currently available.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#46574F] mb-2">Department</label>
                  <select
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                    disabled={directoryLoading || departments.length === 0}
                    required
                    className="w-full h-[46px] rounded-xl border border-[#DCE6DF] bg-white px-3 text-sm text-[#172B25] disabled:opacity-60"
                  >
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>{department.name}</option>
                    ))}
                  </select>
                  {!directoryLoading && departments.length === 0 && (
                    <p className="text-xs text-amber-700 mt-1">No active departments are currently available.</p>
                  )}
                </div>

                <Input
                  label="Specialization"
                  placeholder="e.g. General Medicine"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                />

                <Input
                  label="Qualification"
                  placeholder="e.g. MBBS, MD"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  minLength={2}
                  maxLength={100}
                  required
                />

                <Input
                  label="Medical registration number"
                  placeholder="Enter professional registration number"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  minLength={3}
                  maxLength={80}
                  required
                />
              </>
            )}

            {role === 'ASHA' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="District (optional)"
                  placeholder="Your district"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  maxLength={60}
                />
                <Input
                  label="Block (optional)"
                  placeholder="Your block"
                  value={block}
                  onChange={(e) => setBlock(e.target.value)}
                  maxLength={60}
                />
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer py-1">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#0B6E4F]"
                required
              />
              <span className="text-xs leading-5 text-[#68776F]">
                I confirm that the information provided is correct and agree to the applicable terms and privacy policy.
              </span>
            </label>

            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              disabled={role === 'DOCTOR' && (directoryLoading || facilities.length === 0 || departments.length === 0)}
              className="!rounded-xl !h-[50px]"
            >
              {role === 'PATIENT'
                ? otpSent ? 'Verify and create account' : 'Send verification code'
                : role === 'DOCTOR' ? 'Submit for approval' : 'Submit registration'}
              <ArrowRight size={17} />
            </Button>
          </form>
        </Card>

        <p className="flex items-center justify-center gap-2 text-xs text-[#87948D] text-center">
          <ShieldCheck size={15} className="text-[#0B6E4F]" />
          {role === 'PATIENT'
            ? 'Mobile verification is required. Patient accounts activate after successful registration.'
            : 'Account access is subject to administrator approval.'}
        </p>
      </div>
    </main>
  );
};
