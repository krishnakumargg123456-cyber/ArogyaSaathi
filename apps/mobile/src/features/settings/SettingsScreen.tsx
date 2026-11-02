import React, { useState } from 'react';
import { Card, Button, Badge } from '../../design-system';

interface SettingsScreenProps {
  user: any;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ user, onLogout }) => {
  const [language, setLanguage] = useState<'hi' | 'en'>('hi');
  const [biometricsEnabled, setBiometricsEnabled] = useState(true);
  const [fontSize, setFontSize] = useState<'normal' | 'large'>('normal');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">App Settings & Profile</h2>
        <p className="text-xs text-gray-500">Device security, language and display options</p>
      </div>

      {/* Profile Card */}
      <Card variant="elevated" padding="md" className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#E6F4EF] text-[#064E3B] font-bold text-lg flex items-center justify-center">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 text-sm">{user?.name || 'Healthcare Worker'}</h3>
            <Badge variant="success" size="sm">{user?.role || 'ASHA'}</Badge>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            Facility: {user?.facility || 'PHC Sitapur'} • ID: {user?.identifier || 'ASHA-001'}
          </div>
        </div>
      </Card>

      {/* Preferences */}
      <Card variant="elevated" padding="md" className="space-y-3.5">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Preferences</h3>

        {/* Language switcher */}
        <div className="flex items-center justify-between text-xs">
          <div>
            <div className="font-semibold text-gray-800">Language (भाषा)</div>
            <div className="text-gray-500">Field interface language</div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setLanguage('hi')}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                language === 'hi' ? 'bg-[#0B6E4F] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                language === 'en' ? 'bg-[#0B6E4F] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Font size */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
          <div>
            <div className="font-semibold text-gray-800">Text Size (अक्षर का आकार)</div>
            <div className="text-gray-500">Accessible high-contrast reading</div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setFontSize('normal')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                fontSize === 'normal' ? 'bg-[#0B6E4F] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setFontSize('large')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                fontSize === 'large' ? 'bg-[#0B6E4F] text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Large (बड़ा)
            </button>
          </div>
        </div>

        {/* Biometrics */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
          <div>
            <div className="font-semibold text-gray-800">Fingerprint / Biometric Unlock</div>
            <div className="text-gray-500">Quick authentication on device wake</div>
          </div>
          <input
            type="checkbox"
            checked={biometricsEnabled}
            onChange={(e) => setBiometricsEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-[#0B6E4F] border-gray-300 focus:ring-[#0B6E4F]"
          />
        </div>
      </Card>

      {/* Device Binding & Hardware Security */}
      <Card variant="flat" padding="md" className="space-y-2 text-xs text-gray-600 bg-gray-50">
        <div className="font-bold text-gray-800">Bound Device Information</div>
        <div className="flex justify-between">
          <span>Device Hardware ID:</span>
          <span className="font-mono text-gray-800">DEV-ASHA-001-SITAPUR</span>
        </div>
        <div className="flex justify-between">
          <span>App Version:</span>
          <span className="font-semibold text-gray-800">v2.1.0-release</span>
        </div>
        <div className="flex justify-between">
          <span>Offline DB Size:</span>
          <span className="font-semibold text-gray-800">4.2 MB (Encrypted)</span>
        </div>
      </Card>

      {/* Logout */}
      <div className="pt-2">
        <Button variant="danger" fullWidth onClick={onLogout}>
          Sign Out of Field Device
        </Button>
      </div>
    </div>
  );
};

