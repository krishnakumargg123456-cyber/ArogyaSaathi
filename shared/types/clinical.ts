/**
 * ArogyaSaathi Clinical & Safety TypeScript Definitions
 * Aligned with Protocol IN_RURAL_ACUTE_CARE_V2.1
 */

export type ClinicalUrgency = 'EMERGENCY' | 'URGENT' | 'ROUTINE';

export interface VitalsMeasurement {
  systolic_bp?: number;
  diastolic_bp?: number;
  pulse_rate?: number;
  spo2_percent?: number;
  temperature_f?: number;
  random_blood_sugar_mgdl?: number;
  respiratory_rate?: number;
}

export interface TriageEvaluationRequest {
  transcript: string;
  patient_age: number;
  patient_gender: 'MALE' | 'FEMALE' | 'OTHER';
  is_pregnant?: boolean;
  vitals?: VitalsMeasurement;
}

export interface TriageEvaluationResult {
  protocol_version: string;
  rule_id: string;
  urgency: ClinicalUrgency;
  confidence_score: number;
  requires_referral: boolean;
  recommended_action: string;
  extracted_signals: string[];
}

