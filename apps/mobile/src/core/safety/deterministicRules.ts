/**
 * ArogyaSaathi On-Device Deterministic Safety Engine
 * PRD Section 10.5 APP-TRI-06 & APP-TRI-07
 */

export interface SymptomInput {
  name: string;
  duration_days?: number;
  severity?: "MILD" | "MODERATE" | "SEVERE";
  confidence?: number;
}

export interface VitalsInput {
  systolic_bp?: number;
  diastolic_bp?: number;
  blood_glucose?: number;
  temperature?: number;
  spo2?: number;
}

export interface SafetyDecisionResult {
  decision_id: string;
  protocol_version: string;
  escalation_level: "ROUTINE" | "PRIORITY" | "EMERGENCY";
  is_urgent: boolean;
  triggered_rules: string[];
  clinical_explanation: string;
  recommended_action: string;
  missing_required_inputs: string[];
  evaluated_at: string;
}

export const PROTOCOL_VERSION = "IN_RURAL_ACUTE_CARE_V2.1";

export function evaluateOnDeviceSafetyRules(
  symptoms: SymptomInput[],
  vitals: VitalsInput = {},
  patientContext: { is_pregnant?: boolean; age?: number; gender?: string } = {}
): SafetyDecisionResult {
  const triggered: string[] = [];
  const missingInputs: string[] = [];
  const explanations: string[] = [];
  let level: "ROUTINE" | "PRIORITY" | "EMERGENCY" = "ROUTINE";

  const symMap = new Map<string, SymptomInput>();
  for (const s of symptoms) {
    symMap.set(s.name.toLowerCase().trim(), s);
  }

  // 1. Missing inputs check
  if (symMap.has("fever") && vitals.temperature === undefined) {
    missingInputs.push("temperature");
  }

  // 2. Rule: Hypertensive Crisis (>= 180 / 120 mmHg)
  const sysBp = vitals.systolic_bp;
  const diaBp = vitals.diastolic_bp;
  if ((sysBp && sysBp >= 180) || (diaBp && diaBp >= 120)) {
    triggered.push("RULE_BP_002_HYPERTENSIVE_CRISIS");
    level = "EMERGENCY";
    explanations.push(`Blood pressure (${sysBp}/${diaBp} mmHg) exceeds hypertensive emergency threshold (>=180/120).`);
  }

  // 3. Rule: Severe Respiratory Distress / Stridor
  const respKeywords = ["difficulty_breathing", "stridor", "chest_indrawing", "shortness_of_breath"];
  for (const r of respKeywords) {
    if (symMap.has(r)) {
      const sObj = symMap.get(r)!;
      if (sObj.severity === "SEVERE" || r === "stridor" || r === "chest_indrawing") {
        triggered.push("RULE_RESP_001_SEVERE_DISTRESS");
        level = "EMERGENCY";
        explanations.push(`Severe respiratory distress symptom (${r}) detected.`);
        break;
      }
    }
  }

  // 4. Rule: Prolonged High Fever with Confusion
  const hasConfusion = ["altered_mental_status", "confusion", "lethargy", "unconscious"].some(k => symMap.has(k));
  if (symMap.has("fever") && hasConfusion) {
    triggered.push("RULE_FEV_004_FEVER_WITH_CONFUSION");
    level = "EMERGENCY";
    explanations.push("Fever combined with altered mental status indicates urgent systemic or neurological emergency.");
  }

  // 5. Rule: Severe Glucose Breach (<60 or >=300)
  const glucose = vitals.blood_glucose;
  if (glucose !== undefined) {
    if (glucose < 60) {
      triggered.push("RULE_GLU_002_SEVERE_HYPOGLYCEMIA");
      level = "EMERGENCY";
      explanations.push(`Blood glucose (${glucose} mg/dL) critically low (<60 mg/dL).`);
    } else if (glucose >= 300) {
      triggered.push("RULE_GLU_001_SEVERE_HYPERGLYCEMIA");
      level = "EMERGENCY";
      explanations.push(`Blood glucose (${glucose} mg/dL) critically elevated (>=300 mg/dL).`);
    }
  }

  // 6. Rule: Severe Anemia in Pregnancy
  if (patientContext.is_pregnant && (symMap.has("severe_pallor") || (symMap.has("pallor") && symMap.get("pallor")?.severity === "SEVERE"))) {
    triggered.push("RULE_OBS_001_SEVERE_ANEMIA_PREGNANCY");
    level = "EMERGENCY";
    explanations.push("Severe pallor observed during pregnancy indicates life-threatening obstetric anemia.");
  }

  // 7. Rule: Stage 2 Hypertension (>= 140 / 90 mmHg)
  if (level !== "EMERGENCY" && ((sysBp && sysBp >= 140) || (diaBp && diaBp >= 90))) {
    triggered.push("RULE_BP_001_HYPERTENSION_STAGE2");
    level = "PRIORITY";
    explanations.push(`Blood pressure (${sysBp}/${diaBp} mmHg) indicates Stage 2 Hypertension.`);
  }

  const isUrgent = level === "EMERGENCY";
  let action = "Provide supportive counseling and schedule routine follow-up visit in 7 days.";
  if (level === "EMERGENCY") {
    action = "Immediate transfer to nearest CHC or District Hospital with medical escort. Call 108 / PHC Ambulance.";
  } else if (level === "PRIORITY") {
    action = "Schedule Medical Officer evaluation at PHC within 24-48 hours. Monitor symptoms closely.";
  }

  return {
    decision_id: `LOCAL-DEC-${Date.now()}`,
    protocol_version: PROTOCOL_VERSION,
    escalation_level: level,
    is_urgent: isUrgent,
    triggered_rules: triggered,
    clinical_explanation: explanations.length > 0 ? explanations.join(" ") : "No acute red-flag rules triggered.",
    recommended_action: action,
    missing_required_inputs: missingInputs,
    evaluated_at: new Date().toISOString()
  };
}

