import React, { useState } from 'react';
import { Card, Button, Badge } from '../../design-system';

interface PinLockScreenProps {
  userName: string;
  role: string;
  onUnlock: () => void;
  onSwitchUser: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  userName,
  role,
  onUnlock,
  onSwitchUser
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        // Mock PIN check (1234 or any 4 digits for demo)
        setTimeout(() => {
          if (nextPin === '1234' || nextPin === '0000' || nextPin.length === 4) {
            onUnlock();
          } else {
            setError(true);
            setPin('');
          }
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError(false);
  };

  return (
    <div className="min-h-screen bg-[#F0FDF4] flex flex-col justify-between px-6 py-10 max-w-md mx-auto">
      {/* Header Info */}
      <div className="text-center pt-8 space-y-3">
        <div className="w-20 h-20 mx-auto rounded-full bg-[#0B6E4F]/10 border-2 border-[#0B6E4F]/30 flex items-center justify-center text-3xl font-bold text-[#064E3B]">
          {userName.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{userName}</h2>
          <Badge variant="success" size="sm" className="mt-1">{role}</Badge>
        </div>
        <p className="text-sm text-gray-500">Enter your 4-digit PIN to unlock</p>
      </div>

      {/* PIN Dots */}
      <div className="flex justify-center gap-4 py-6">
        {[0, 1, 2, 3].map((idx) => (
          <div
            key={idx}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              pin.length > idx
                ? 'bg-[#0B6E4F] border-[#0B6E4F] scale-110'
                : 'border-gray-300 bg-white'
            } ${error ? 'border-red-500 bg-red-100' : ''}`}
          />
        ))}
      </div>

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-4 pb-4">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleKeyPress(digit)}
            className="h-16 rounded-2xl bg-white shadow-sm border border-gray-200 text-xl font-semibold text-gray-800 active:bg-gray-100 active:scale-95 transition"
          >
            {digit}
          </button>
        ))}
        <button
          onClick={() => {
            // Biometric simulation
            onUnlock();
          }}
          className="h-16 rounded-2xl bg-white/60 border border-gray-200 text-xs font-semibold text-[#0B6E4F] flex flex-col items-center justify-center active:scale-95 transition"
        >
          <span>Fingerprint</span>
        </button>
        <button
          onClick={() => handleKeyPress('0')}
          className="h-16 rounded-2xl bg-white shadow-sm border border-gray-200 text-xl font-semibold text-gray-800 active:bg-gray-100 active:scale-95 transition"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="h-16 rounded-2xl bg-white/60 border border-gray-200 text-sm font-semibold text-gray-600 flex items-center justify-center active:scale-95 transition"
        >
          Clear
        </button>
      </div>

      {/* Switch User Footer */}
      <div className="text-center pt-2">
        <button
          onClick={onSwitchUser}
          className="text-xs font-semibold text-[#0B6E4F] hover:underline"
        >
          Not you? Switch Account / Re-login
        </button>
      </div>
    </div>
  );
};

