"""
ArogyaSaathi — Deterministic Clinical Safety Engine
PRD Section 10.5 & 15 Compliance:
- Strictly deterministic evaluation (No LLM in the clinical safety path)
- Clinician-approved versioned protocol
- Reproducible golden vectors
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from enum import Enum
from pydantic import BaseModel, Field

class EscalationLevel(str, Enum):
    ROUTINE = "ROUTINE"
    PRIORITY = "PRIORITY"
    EMERGENCY = "EMERGENCY"

PROTOCOL_VERSION_V2_1 = "IN_RURAL_ACUTE_CARE_V2.1"

class SafetyDecision(BaseModel):
    decision_id: str
    protocol_version: str
    escalation_level: EscalationLevel
    is_urgent: bool
    triggered_rules: List[str]
    clinical_explanation: str
    recommended_action: str
    missing_required_inputs: List[str]
    evaluated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

def evaluate_deterministic_safety(
    symptoms: List[Dict[str, Any]],
    vitals: Optional[Dict[str, Any]] = None,
    patient_context: Optional[Dict[str, Any]] = None
) -> SafetyDecision:
    """
    Evaluates symptoms and vitals against clinician-approved deterministic rules.
    Runs identically on server (Python) and mobile (TypeScript).
    """
    vitals = vitals or {}
    patient_context = patient_context or {}
    
    triggered: List[str] = []
    missing_inputs: List[str] = []
    explanations: List[str] = []
    level = EscalationLevel.ROUTINE

    # Helper: Normalize symptom names
    sym_map = {s.get("name", "").lower(): s for s in symptoms}

    # 1. Check Missing Inputs
    has_fever = "fever" in sym_map
    if has_fever and "temperature" not in vitals:
        missing_inputs.append("temperature")

    # 2. Rule: Hypertensive Crisis (Sys >= 180 or Dia >= 120)
    sys_bp = vitals.get("systolic_bp")
    dia_bp = vitals.get("diastolic_bp")
    if (sys_bp and sys_bp >= 180) or (dia_bp and dia_bp >= 120):
        triggered.append("RULE_BP_002_HYPERTENSIVE_CRISIS")
        level = EscalationLevel.EMERGENCY
        explanations.append(f"Blood pressure ({sys_bp}/{dia_bp} mmHg) exceeds hypertensive emergency threshold (>=180/120).")

    # 3. Rule: Severe Respiratory Distress / Stridor
    resp_symptoms = ["difficulty_breathing", "stridor", "chest_indrawing", "shortness_of_breath"]
    for r in resp_symptoms:
        if r in sym_map:
            s_obj = sym_map[r]
            if str(s_obj.get("severity", "")).upper() == "SEVERE" or r in ["stridor", "chest_indrawing"]:
                triggered.append("RULE_RESP_001_SEVERE_DISTRESS")
                level = EscalationLevel.EMERGENCY
                explanations.append(f"Severe respiratory distress symptom ({r}) detected.")
                break

    # 4. Rule: Prolonged High Fever with Altered Mental State
    has_confusion = any(k in sym_map for k in ["altered_mental_status", "confusion", "lethargy", "unconscious"])
    if has_fever and has_confusion:
        triggered.append("RULE_FEV_004_FEVER_WITH_CONFUSION")
        level = EscalationLevel.EMERGENCY
        explanations.append("Fever combined with altered mental status indicates urgent systemic or neurological emergency.")

    # 5. Rule: Severe Hypoglycemia / Hyperglycemia
    glucose = vitals.get("blood_glucose")
    if glucose:
        if glucose < 60:
            triggered.append("RULE_GLU_002_SEVERE_HYPOGLYCEMIA")
            level = EscalationLevel.EMERGENCY
            explanations.append(f"Blood glucose ({glucose} mg/dL) critically low (<60 mg/dL).")
        elif glucose >= 300:
            triggered.append("RULE_GLU_001_SEVERE_HYPERGLYCEMIA")
            level = EscalationLevel.EMERGENCY
            explanations.append(f"Blood glucose ({glucose} mg/dL) critically elevated (>=300 mg/dL).")

    # 6. Rule: Severe Anemia in Pregnancy
    is_pregnant = patient_context.get("is_pregnant", False)
    has_severe_pallor = "severe_pallor" in sym_map or ("pallor" in sym_map and sym_map["pallor"].get("severity") == "SEVERE")
    if is_pregnant and has_severe_pallor:
        triggered.append("RULE_OBS_001_SEVERE_ANEMIA_PREGNANCY")
        level = EscalationLevel.EMERGENCY
        explanations.append("Severe pallor observed during pregnancy indicates life-threatening obstetric anemia.")

    # 7. Rule: Hypertension Stage 2 (Sys >= 140 or Dia >= 90) - if not already EMERGENCY
    if level != EscalationLevel.EMERGENCY and ((sys_bp and sys_bp >= 140) or (dia_bp and dia_bp >= 90)):
        triggered.append("RULE_BP_001_HYPERTENSION_STAGE2")
        level = EscalationLevel.PRIORITY
        explanations.append(f"Blood pressure ({sys_bp}/{dia_bp} mmHg) indicates Stage 2 Hypertension.")

    # Synthesize Recommendations
    is_urgent = (level == EscalationLevel.EMERGENCY)
    if level == EscalationLevel.EMERGENCY:
        action = "Immediate transfer to nearest CHC or District Hospital with medical escort. Call 108 / PHC Ambulance."
    elif level == EscalationLevel.PRIORITY:
        action = "Schedule Medical Officer evaluation at PHC within 24-48 hours. Monitor symptoms closely."
    else:
        action = "Provide supportive counseling and schedule routine follow-up visit in 7 days."

    timestamp_int = int(datetime.now(timezone.utc).timestamp())
    decision_id = f"DEC-{timestamp_int}"

    return SafetyDecision(
        decision_id=decision_id,
        protocol_version=PROTOCOL_VERSION_V2_1,
        escalation_level=level,
        is_urgent=is_urgent,
        triggered_rules=triggered,
        clinical_explanation=" ".join(explanations) if explanations else "No acute red-flag rules triggered.",
        recommended_action=action,
        missing_required_inputs=missing_inputs
    )
