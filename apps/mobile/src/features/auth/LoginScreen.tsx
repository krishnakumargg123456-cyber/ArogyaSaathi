import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '../../design-system';
import {
  getMobileDeviceId,
  mobileApiFetch,
  type MobileSession
} from '../../core/api/client';

interface LoginScreenProps {
  onSuccess: (userData: MobileSession) => void;
  onFirstLogin: (userId: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess, onFirstLogin }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const session = await mobileApiFetch<MobileSession>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          device_id: getMobileDeviceId(),
          device_model: 'ArogyaSaathi Mobile'
        })
      });

      if (!session.first_login_done) {
        onFirstLogin(session.user_id);
      }
      onSuccess(session);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col justify-center px-4 py-8">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#0B6E4F] to-[#064E3B] flex items-center justify-center shadow-lg text-white font-bold text-2xl">
            AS
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ArogyaSaathi</h1>
          <p className="text-sm text-gray-600">Health for Every Home | हर घर तक स्वास्थ्य</p>
          <div className="flex justify-center gap-2 pt-1">
            <Badge variant="success" size="sm">Field Verified</Badge>
            <Badge variant="info" size="sm">Offline-First</Badge>
          </div>
        </div>

        {/* Login Card */}
        <Card variant="elevated" padding="lg" className="space-y-5 bg-white border border-gray-100 shadow-md">
          <div className="border-b pb-3">
            <h2 className="text-lg font-bold text-gray-900">Healthcare Worker Login</h2>
            <p className="text-xs text-gray-500 mt-0.5">Enter your assigned Employee ID or Registered Mobile</p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Employee ID / Mobile"
              placeholder="e.g. ASHA-001 or 9876543210"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs font-semibold text-[#0B6E4F] hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              }
              required
            />

            <Button type="submit" fullWidth isLoading={isLoading} size="lg">
              Sign In
            </Button>
          </form>

        </Card>

        {/* Security & Offline Guarantee Footer */}
        <div className="text-center space-y-1 text-xs text-gray-500">
          <p>Protected by Device-Binding & 256-bit Local Database Encryption</p>
          <p className="text-[11px] text-gray-400">Compliant with NDHM / ABDM Rural Architecture</p>
        </div>
      </div>
    </div>
  );
};
