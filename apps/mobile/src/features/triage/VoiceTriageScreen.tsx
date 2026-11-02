import React, { useState } from 'react';
import { Card, Button, Badge } from '../../design-system';
import { mobileApiFetch } from '../../core/api/client';

interface TriageResult {
  decision_id: string;
  protocol_version: string;
  escalation_level: 'ROUTINE' | 'PRIORITY' | 'EMERGENCY';
  is_urgent: boolean;
  triggered_rules: string[];
  clinical_explanation: string;
  recommended_action: string;
  missing_required_inputs: string[];
  evaluated_at: string;
}

interface VoiceTriageScreenProps {
  patient?: any;
  onReferralCreate: (triageResult: TriageResult) => void;
  onBack: () => void;
}

const symptomOptions = [
  { key: 'difficulty_breathing', label: 'Difficulty breathing' },
  { key: 'shortness_of_breath', label: 'Shortness of breath' },
  { key: 'stridor', label: 'Stridor' },
  { key: 'chest_indrawing', label: 'Chest indrawing' },
  { key: 'fever', label: 'Fever' },
  { key: 'confusion', label: 'Confusion / altered mental state' },
  { key: 'lethargy', label: 'Lethargy' },
  { key: 'unconscious', label: 'Unconscious' },
  { key: 'pallor', label: 'Pallor' },
  { key: 'severe_pallor', label: 'Severe pallor' }
];

export const VoiceTriageScreen: React.FC<VoiceTriageScreenProps> = ({
  patient,
  onReferralCreate,
  onBack
}) => {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSeverity, setSymptomSeverity] = useState<'MILD' | 'MODERATE' | 'SEVERE'>('MODERATE');
  const [isPregnant, setIsPregnant] = useState(false);
  const [vitals, setVitals] = useState({
    systolic_bp: '',
    diastolic_bp: '',
    temperature: '',
    blood_glucose: '',
    spo2: ''
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [decision, setDecision] = useState<TriageResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateVital = (key: keyof typeof vitals, value: string) => {
    setVitals((current) => ({ ...current, [key]: value }));
  };

  const toggleSymptom = (key: string) => {
    setSelectedSymptoms((current) => current.includes(key)
      ? current.filter((item) => item !== key)
      : [...current, key]);
    setDecision(null);
  };

  const evaluateTriage = async () => {
    if (!patient?.id) {
      setError('Select a registered patient before evaluating triage.');
      return;
    }

    const submittedVitals = Object.fromEntries(
      Object.entries(vitals)
        .filter(([, value]) => value.trim() !== '')
        .map(([key, value]) => [key, Number(value)])
    );
    if (!selectedSymptoms.length && !Object.keys(submittedVitals).length) {
      setError('Select at least one symptom or enter a measured vital sign.');
      return;
    }
    if (Object.values(submittedVitals).some((value) => !Number.isFinite(value))) {
      setError('Vital signs must contain valid numbers.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setDecision(null);
    try {
      const result = await mobileApiFetch<TriageResult>('/triage/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          patient_id: patient.id,
          symptoms: selectedSymptoms.map((name) => ({
            name,
            severity: symptomSeverity,
            duration_days: 1
          })),
          vitals: Object.keys(submittedVitals).length ? submittedVitals : null,
          is_pregnant: isPregnant
        })
      });
      setDecision(result);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Triage evaluation failed.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-xs font-semibold text-[#0B6E4F] flex items-center gap-1 hover:underline">
          ← Back
        </button>
        <Badge variant="info" size="sm">Server evaluated</Badge>
      </div>

      {patient ? (
        <div className="p-2.5 bg-[#E6F4EF] rounded-xl flex items-center justify-between text-xs text-[#064E3B]">
          <span>Patient: <strong>{patient.full_name ?? patient.name}</strong> ({patient.gender}, {patient.age}y)</span>
          <span className="font-mono text-[11px]">{patient.internal_id}</span>
        </div>
      ) : (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Select a patient from the registry before starting a clinical evaluation.
        </p>
      )}

      <Card variant="elevated" padding="lg" className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-gray-900">Clinical Safety Evaluation</h2>
          <p className="text-xs text-gray-600 mt-1">
            Speech transcription is not configured. Enter observed symptoms and measured vitals; the backend applies the active deterministic protocol.
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-xs font-bold text-gray-700 uppercase tracking-wider">Observed symptoms</legend>
          <div className="grid grid-cols-2 gap-2">
            {symptomOptions.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 rounded-xl border border-gray-200 p-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedSymptoms.includes(key)}
                  onChange={() => toggleSymptom(key)}
                  className="h-4 w-4 accent-[#0B6E4F]"
                />
                {label}
              </label>
            ))}
          </div>
          <label className="block text-xs font-semibold text-gray-700">
            Symptom severity
            <select
              value={symptomSeverity}
              onChange={(event) => setSymptomSeverity(event.target.value as typeof symptomSeverity)}
              className="mt-1.5 w-full rounded-xl border border-gray-300 bg-white p-2.5"
            >
              <option value="MILD">Mild</option>
              <option value="MODERATE">Moderate</option>
              <option value="SEVERE">Severe</option>
            </select>
          </label>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-xs font-bold text-gray-700 uppercase tracking-wider">Measured vitals (optional)</legend>
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-gray-600">Systolic BP
              <input inputMode="decimal" value={vitals.systolic_bp} onChange={(event) => updateVital('systolic_bp', event.target.value)} className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <label className="text-xs text-gray-600">Diastolic BP
              <input inputMode="decimal" value={vitals.diastolic_bp} onChange={(event) => updateVital('diastolic_bp', event.target.value)} className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <label className="text-xs text-gray-600">Temperature (°C)
              <input inputMode="decimal" value={vitals.temperature} onChange={(event) => updateVital('temperature', event.target.value)} className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <label className="text-xs text-gray-600">Blood glucose (mg/dL)
              <input inputMode="decimal" value={vitals.blood_glucose} onChange={(event) => updateVital('blood_glucose', event.target.value)} className="mt-1 w-full rounded-lg border p-2" />
            </label>
            <label className="text-xs text-gray-600">SpO₂ (%)
              <input inputMode="decimal" value={vitals.spo2} onChange={(event) => updateVital('spo2', event.target.value)} className="mt-1 w-full rounded-lg border p-2" />
            </label>
          </div>
        </fieldset>

        <label className="flex items-center gap-2 text-xs text-gray-700">
          <input type="checkbox" checked={isPregnant} onChange={(event) => setIsPregnant(event.target.checked)} className="h-4 w-4 accent-[#0B6E4F]" />
          Patient is currently pregnant
        </label>

        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}

        <Button size="md" fullWidth onClick={() => void evaluateTriage()} isLoading={isAnalyzing} disabled={!patient?.id}>
          Evaluate with Clinical Safety Protocol
        </Button>
      </Card>

      {decision && (
        <Card
          variant="elevated"
          padding="lg"
          className={`space-y-4 border-2 ${decision.escalation_level === 'EMERGENCY' ? 'border-red-500 bg-red-50/20' : 'border-[#0B6E4F] bg-[#E6F4EF]/20'}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <Badge variant={decision.escalation_level === 'EMERGENCY' ? 'danger' : decision.escalation_level === 'PRIORITY' ? 'warning' : 'success'} size="md" dot>
                {decision.escalation_level} DISPOSITION
              </Badge>
              <h3 className="text-base font-bold text-gray-900 mt-1.5">{decision.recommended_action}</h3>
            </div>
            <div className="text-right text-[11px] font-mono text-gray-500">
              <div>{decision.decision_id}</div>
              <div>{decision.protocol_version}</div>
            </div>
          </div>

          <p className="rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-700">{decision.clinical_explanation}</p>
          {decision.triggered_rules.length > 0 && (
            <div className="text-xs text-gray-600">
              Triggered rules: {decision.triggered_rules.join(', ')}
            </div>
          )}
          {decision.missing_required_inputs.length > 0 && (
            <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              Additional required measurements: {decision.missing_required_inputs.join(', ')}
            </p>
          )}

          <div className="flex gap-2">
            {decision.is_urgent && (
              <Button variant="danger" fullWidth onClick={() => onReferralCreate(decision)}>
                Initiate Immediate Referral
              </Button>
            )}
            <Button variant={decision.is_urgent ? 'outline' : 'primary'} fullWidth onClick={onBack}>
              Done / Return
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
