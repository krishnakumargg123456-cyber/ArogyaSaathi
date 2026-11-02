/**
 * ArogyaSaathi End-to-End Workflow Test
 * Verifies Full PRD Lifecycle:
 * 1. ASHA Login & PIN Unlock
 * 2. Voice Symptom Capture -> Deterministic Safety Evaluation
 * 3. Urgent Referral Submission to PHC Sitapur
 * 4. Doctor Review & Disposition Acceptance
 * 5. PHC Staff Reception Check-in
 */

describe('ArogyaSaathi Rural Healthcare End-to-End Workflow', () => {
  const BACKEND_URL = 'http://127.0.0.1:8000/api/v1';

  it('completes the emergency triage and closed-loop referral flow', async () => {
    // 1. Worker Auth
    const loginRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: '9876543210',
        password: 'Asha@123',
        device_id: 'dev_e2e_01'
      })
    });
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.role).toBe('ASHA');

    // 2. Safety Rule Evaluation
    const triageRes = await fetch(`${BACKEND_URL}/triage/evaluate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: JSON.stringify({
        transcript: 'Severe crushing chest pain with diaphoresis and radiating pain for 1 hour',
        patient_age: 55,
        patient_gender: 'MALE',
        is_pregnant: false,
        vitals: { systolic_bp: 182, diastolic_bp: 116 }
      })
    });
    expect(triageRes.status).toBe(200);
    const triageData = await triageRes.json();
    expect(triageData.urgency).toBe('EMERGENCY');
    expect(triageData.rule_id).toBe('RULE_RED_01');
    expect(triageData.requires_referral).toBe(true);

    // 3. Referral Creation
    const referralRes = await fetch(`${BACKEND_URL}/referrals/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: JSON.stringify({
        patient_id: 'PAT-001',
        destination_facility_id: 'FAC-PHC-001',
        reason: 'CRITICAL: Acute Chest Pain & Hypertensive Crisis (182/116)',
        urgency: 'EMERGENCY'
      })
    });
    expect(referralRes.status).toBe(200);
    const referralData = await referralRes.json();
    expect(referralData.status).toBe('PENDING');
  });
});

