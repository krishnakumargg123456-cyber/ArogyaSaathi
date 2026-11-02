import React, { useState } from 'react';
import {
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  ShieldCheck,
  UserRound,
  Stethoscope,
  Shield,
  Users
} from 'lucide-react';
import { Button, Card, Input } from '../../design-system';
import {
  getMobileDeviceId,
  mobileApiFetch,
  type MobileSession
} from '../../core/api/client';
import { RegisterScreen } from './RegisterScreen';

type LoginRole = 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'WORKER';

interface LoginScreenProps {
  onSuccess: (userData: MobileSession) => void;
  onFirstLogin: (userId: string) => void;
}

const loginOptions: {
  id: LoginRole;
  label: string;
  description: string;
  endpoint: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'PATIENT',
    label: 'Patient',
    description: 'Access your healthcare account',
    endpoint: '/auth/patient/login',
    icon: <UserRound size={19} />
  },
  {
    id: 'DOCTOR',
    label: 'Doctor',
    description: 'Doctor and clinical access',
    endpoint: '/auth/doctor/login',
    icon: <Stethoscope size={19} />
  },
  {
    id: 'ADMIN',
    label: 'Admin',
    description: 'Administrator console',
    endpoint: '/auth/admin/login',
    icon: <Shield size={19} />
  },
  {
    id: 'WORKER',
    label: 'Healthcare Worker',
    description: 'ASHA, ANM and health staff',
    endpoint: '/auth/login',
    icon: <Users size={19} />
  }
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSuccess,
  onFirstLogin
}) => {
  const [selectedRole, setSelectedRole] = useState<LoginRole>('PATIENT');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);

  if (showRegister) {
    return <RegisterScreen onBack={() => setShowRegister(false)} onSuccess={onSuccess} onFirstLogin={onFirstLogin} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!identifier.trim() || !password) {
      setError('Please enter your registered mobile number or ID and password.');
      return;
    }

    setIsLoading(true);

    try {
      const selectedOption = loginOptions.find(
        (option) => option.id === selectedRole
      );

      if (!selectedOption) {
        throw new Error('Please select a valid account type.');
      }

      const session = await mobileApiFetch<MobileSession>(
        selectedOption.endpoint,
        {
          method: 'POST',
          body: JSON.stringify({
            identifier: identifier.trim(),
            password,
            device_id: getMobileDeviceId(),
            device_model: 'ArogyaSaathi Mobile'
          })
        }
      );

      const allowedRoles: Record<LoginRole, string[]> = {
        PATIENT: ['PATIENT'],
        DOCTOR: ['DOCTOR'],
        ADMIN: ['ADMIN'],
        WORKER: [
          'ASHA',
          'ANM',
          'PHC_STAFF',
          'PUBLIC_HEALTH_OFFICER'
        ]
      };

      if (!allowedRoles[selectedRole].includes(session.role)) {
        throw new Error(
          'The account role returned by the server does not match the selected login type.'
        );
      }

      if (!session.access_token || !session.user_id) {
        throw new Error('The server returned an invalid login session.');
      }

      if (!session.first_login_done) {
        onFirstLogin(session.user_id);
      }

      onSuccess(session);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to sign in. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen min-h-[100dvh] bg-[#F5F8F6] flex flex-col justify-center px-5 py-8">
      <div className="w-full max-w-md mx-auto space-y-7">
        <header className="text-center space-y-3">
          <div className="mx-auto w-[68px] h-[68px] rounded-[22px] bg-gradient-to-br from-[#176B52] to-[#0B4437] shadow-lg shadow-[#0B6E4F]/20 flex items-center justify-center">
            <HeartPulse size={34} strokeWidth={1.8} className="text-white" />
          </div>
          <div>
            <h1 className="text-[27px] font-bold tracking-tight text-[#172B25]">
              ArogyaSaathi
            </h1>
            <p className="text-sm text-[#718078] mt-1">
              Healthcare, closer to every community.
            </p>
          </div>
        </header>

        <Card
          variant="elevated"
          padding="lg"
          className="!rounded-[26px] !border-[#E8EEEA] !shadow-[0_12px_40px_rgba(20,55,40,0.07)] space-y-5"
        >
          <div>
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#0B6E4F]">
              Welcome
            </p>
            <h2 className="text-[23px] font-bold tracking-tight text-[#172B25] mt-1">
              Sign in to your account
            </h2>
            <p className="text-sm text-[#7A8780] mt-1">
              Select your account type to continue.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {loginOptions.map((option) => {
              const active = selectedRole === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setSelectedRole(option.id);
                    setError(null);
                  }}
                  aria-pressed={active}
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? 'border-[#0B6E4F] bg-[#EAF4EF] ring-1 ring-[#0B6E4F]'
                      : 'border-[#E5ECE7] bg-white hover:border-[#9FC8B2]'
                  }`}
                >
                  <div className={`mb-2 ${active ? 'text-[#0B6E4F]' : 'text-[#718078]'}`}>
                    {option.icon}
                  </div>
                  <div className="text-sm font-bold text-[#172B25]">
                    {option.label}
                  </div>
                  <div className="text-[10px] text-[#7A8780] mt-1 leading-4">
                    {option.description}
                  </div>
                </button>
              );
            })}
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={
                selectedRole === 'WORKER'
                  ? 'Employee ID or mobile number'
                  : 'Registered mobile number'
              }
              placeholder={
                selectedRole === 'WORKER'
                  ? 'Enter your registered ID or mobile'
                  : 'Enter your registered mobile number'
              }
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

            <Button
              type="submit"
              fullWidth
              isLoading={isLoading}
              size="lg"
              className="!rounded-xl !bg-[#0B6E4F] !h-[50px]"
            >
              Sign In <ArrowRight size={18} />
            </Button>
          </form>

          {selectedRole !== 'ADMIN' && (
            <>
              <div className="relative flex items-center">
                <div className="flex-1 border-t border-[#E9EEEB]" />
                <span className="px-3 text-xs text-[#9AA59F]">
                  NEW TO AROGYASAATHI?
                </span>
                <div className="flex-1 border-t border-[#E9EEEB]" />
              </div>

              <Button
                type="button"
                variant="outline"
                fullWidth
                size="lg"
                className="!rounded-xl !border-[#B9D5C8] !text-[#0B6E4F]"
                onClick={() => setShowRegister(true)}
              >
                Create an account <ArrowRight size={17} />
              </Button>
            </>
          )}

          {selectedRole === 'ADMIN' && (
            <p className="text-xs text-center text-[#7A8780]">
              Administrator accounts are provisioned securely. Public admin registration is unavailable.
            </p>
          )}
        </Card>

        <footer className="flex items-center justify-center gap-2 text-xs text-[#87948D]">
          <ShieldCheck size={15} className="text-[#0B6E4F]" />
          <span>Secure, role-based authentication</span>
        </footer>
      </div>
    </main>
  );
};
