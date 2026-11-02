import React, { useState } from 'react';
import { Card, Button, Input, Badge } from '../../design-system';
import { mobileApiFetch } from '../../core/api/client';

interface PatientRegistrationWizardProps {
  onCancel: () => void;
  onSuccess: (newPatient: any) => void;
}

export const PatientRegistrationWizard: React.FC<PatientRegistrationWizardProps> = ({
  onCancel,
  onSuccess
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    gender: 'MALE',
    phone: '',
    village_id: '',
    landmark: '',
    has_hypertension: false,
    has_diabetes: false,
    is_pregnant: false,
    consent_obtained: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [villages, setVillages] = useState<{ id: string; name: string; block: string; district: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    mobileApiFetch<{ id: string; name: string; block: string; district: string }[]>('/patients/villages')
      .then((records) => {
        if (!active) return;
        setVillages(records);
        setFormData((current) => ({ ...current, village_id: current.village_id || records[0]?.id || '' }));
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load assigned villages.');
      });
    return () => {
      active = false;
    };
  }, []);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.full_name || !formData.age) {
        alert('Please fill in name and age');
        return;
      }
      setDuplicateWarning(null);
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (!formData.village_id) {
        throw new Error('No assigned village is available for this account.');
      }

      const conditions = [
        formData.has_hypertension ? 'HYPERTENSION' : '',
        formData.has_diabetes ? 'DIABETES' : '',
        formData.is_pregnant ? 'PREGNANCY' : ''
      ].filter(Boolean).join(', ');
      const result = await mobileApiFetch<{ patient: any; potential_duplicates: { patient_id: string; internal_id: string; name: string; match_reason: string }[] }>('/patients', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.full_name.trim(),
          age: Number(formData.age),
          gender: formData.gender,
          phone: formData.phone.trim() || null,
          village_id: formData.village_id,
          address: formData.landmark.trim() || null,
          chronic_conditions: conditions || null,
          consent_method: 'TICK_ACK'
        })
      });

      if (result.potential_duplicates.length) {
        setDuplicateWarning(
          `Possible existing match: ${result.potential_duplicates.map((item) => `${item.name} (${item.internal_id})`).join(', ')}.`
        );
      }
      const village = villages.find((item) => item.id === formData.village_id);
      onSuccess({
        ...result.patient,
        full_name: result.patient.name,
        village_name: village?.name ?? 'Unassigned',
        is_high_risk: formData.has_hypertension || formData.has_diabetes || formData.is_pregnant
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Patient registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Wizard Progress Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
          <span>Step {step} of 4: {['Personal Details', 'Address & Village', 'Medical Baseline', 'Consent & Review'][step - 1]}</span>
          <span className="text-[#0B6E4F]">{step * 25}%</span>
        </div>
        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
          <div
            className="bg-[#0B6E4F] h-full transition-all duration-300"
            style={{ width: `${step * 25}%` }}
          />
        </div>
      </div>

      {duplicateWarning && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-2">
          <div className="font-bold flex items-center gap-1.5">
            <span>⚠️ Duplicate Warning</span>
          </div>
          <p>{duplicateWarning}</p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setDuplicateWarning(null)}>
              Proceed Anyway
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              View Existing Patient
            </Button>
          </div>
        </div>
      )}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</div>}

      {/* Step Content */}
      <Card variant="elevated" padding="lg" className="space-y-4">
        {step === 1 && (
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">1. Personal Information</h3>
            <Input
              label="Full Name (पूरा नाम) *"
              placeholder="e.g. Rekha Devi"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Age (उम्र) *"
                type="number"
                placeholder="Years"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
              />
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Gender (लिंग)
                </label>
                <select
                  className="w-full rounded-xl border border-gray-300 py-2.5 px-3 text-sm focus:border-[#0B6E4F] focus:outline-none"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="FEMALE">Female (महिला)</option>
                  <option value="MALE">Male (पुरुष)</option>
                  <option value="OTHER">Other (अन्य)</option>
                </select>
              </div>
            </div>
            <Input
              label="Phone Number (मोबाइल नंबर)"
              placeholder="10-digit mobile"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <Input
              label="ABHA Number (optional)"
              placeholder="14-digit ABHA ID"
              value={formData.abha_number}
              onChange={(e) => setFormData({ ...formData, abha_number: e.target.value })}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">2. Village & Location Details</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Village (गाँव) *
              </label>
              <select
                className="w-full rounded-xl border border-gray-300 py-2.5 px-3 text-sm focus:border-[#0B6E4F] focus:outline-none"
                value={formData.village_id}
                onChange={(e) => setFormData({ ...formData, village_id: e.target.value })}
              >
                <option value="">Select an assigned village</option>
                {villages.map((village) => (
                  <option key={village.id} value={village.id}>{village.name} ({village.block}, {village.district})</option>
                ))}
              </select>
            </div>
            <Input
              label="Landmark / House Info"
              placeholder="Near Primary School / Panchayat Ghar"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">3. Medical Baseline & Conditions</h3>
            <p className="text-xs text-gray-500">Tick relevant known chronic illnesses or health states:</p>
            <div className="space-y-2.5">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#0B6E4F] rounded border-gray-300 focus:ring-[#0B6E4F]"
                  checked={formData.has_hypertension}
                  onChange={(e) => setFormData({ ...formData, has_hypertension: e.target.checked })}
                />
                <div className="text-xs">
                  <div className="font-semibold text-gray-800">Hypertension / High BP (उच्च रक्तचाप)</div>
                  <div className="text-gray-500">Regular BP monitoring required</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#0B6E4F] rounded border-gray-300 focus:ring-[#0B6E4F]"
                  checked={formData.has_diabetes}
                  onChange={(e) => setFormData({ ...formData, has_diabetes: e.target.checked })}
                />
                <div className="text-xs">
                  <div className="font-semibold text-gray-800">Diabetes / Sugar (मधुमेह)</div>
                  <div className="text-gray-500">Blood glucose tracking required</div>
                </div>
              </label>

              {formData.gender === 'FEMALE' && (
                <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#0B6E4F] rounded border-gray-300 focus:ring-[#0B6E4F]"
                    checked={formData.is_pregnant}
                    onChange={(e) => setFormData({ ...formData, is_pregnant: e.target.checked })}
                  />
                  <div className="text-xs">
                    <div className="font-semibold text-gray-800">Pregnant Woman / ANC (गर्भवती महिला)</div>
                    <div className="text-gray-500">Enrolls into maternal health tracking protocol</div>
                  </div>
                </label>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3.5">
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">4. Informed Consent & Final Review</h3>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-700 space-y-1.5">
              <div className="font-bold text-[#064E3B]">Summary:</div>
              <p>Name: <strong>{formData.full_name}</strong> ({formData.gender}, {formData.age} yrs)</p>
              <p>Village: <strong>{villages.find((village) => village.id === formData.village_id)?.name ?? 'Not selected'}</strong> | Phone: {formData.phone || 'None'}</p>
              <p>Conditions: {[formData.has_hypertension && 'HTN', formData.has_diabetes && 'DM', formData.is_pregnant && 'ANC'].filter(Boolean).join(', ') || 'None recorded'}</p>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-xl bg-[#E6F4EF]/50 border border-[#0B6E4F]/20 cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4 mt-0.5 text-[#0B6E4F] rounded border-gray-300 focus:ring-[#0B6E4F]"
                checked={formData.consent_obtained}
                onChange={(e) => setFormData({ ...formData, consent_obtained: e.target.checked })}
              />
              <div className="text-xs text-gray-700">
                <span className="font-bold text-[#064E3B]">Verbal/Written Consent Obtained:</span> Patient has consented to the recording and storage of their basic demographic and medical details for public health follow-ups.
              </div>
            </label>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex gap-2 pt-2 border-t">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
          )}

          {step < 4 ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={villages.length === 0 && step === 2}
              className="flex-1"
            >
              Next Step →
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!formData.consent_obtained}
              className="flex-1"
            >
              Save & Register
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
