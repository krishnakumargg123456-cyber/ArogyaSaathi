import { FeatureItem, WorkflowStep, TargetMetric, RoleProfile, FAQItem } from '@/types';

export const FEATURE_MODULES: FeatureItem[] = [
  {
    id: 'FEAT-01',
    slug: 'patient-management',
    title: 'Patient Management',
    titleHi: 'मरीज प्रबंधन (Patient Management)',
    shortDesc: 'Register, search, and manage longitudinal rural patient health records with purpose-specific consent.',
    shortDescHi: 'सहमति-आधारित डिजिटल मरीज पंजीकरण, त्वरित खोज और संपूर्ण स्वास्थ्य इतिहास का सुरक्षित रिकॉर्ड।',
    fullDesc: 'Enables ASHA workers and PHC staff to register patients via an accessible 4-step wizard: Demographics -> Address -> Medical Baseline -> Consent. Includes duplicate detection algorithms and purpose-specific consent management adhering to India’s Digital Personal Data Protection (DPDP) principles.',
    fullDescHi: 'आशा कार्यकर्ताओं और प्राथमिक स्वास्थ्य केंद्र कर्मियों को 4-चरणीय विज़ार्ड के माध्यम से मरीज पंजीकृत करने की सुविधा देता है। इसमें संभावित डुप्लिकेट पहचान और सख्त सहमति प्रबंधन शामिल है।',
    category: 'Care Delivery',
    status: 'Phase 1 UI / Core Workflow P0',
    targetRoles: ['ASHA Worker', 'ANM / Nurse', 'PHC Staff'],
    keyCapabilities: [
      'Unique ArogyaID generation with demographic verification',
      'Village-scoped patient lookup and offline-ready search',
      'Purpose-bound consent capture with withdrawal logging',
      'Correction history and audit trail for every field update'
    ],
    safetyBoundaries: 'All patient data is strictly partitioned by village and health facility boundaries. Unauthorized cross-jurisdiction access is automatically blocked and audited.',
    iconName: 'Users'
  },
  {
    id: 'FEAT-02',
    slug: 'voice-triage',
    title: 'Voice Triage',
    titleHi: 'आवाज़-आधारित ट्राइएज (Voice Triage)',
    shortDesc: 'AI-assisted voice symptom capture in local dialects with clinician-approved deterministic safety checks.',
    shortDescHi: 'स्थानीय बोलियों में आवाज़ से लक्षण रिकॉर्डिंग, साथ में डॉक्टर-स्वीकृत सख्त सुरक्षा नियम।',
    fullDesc: 'Frontline health workers can speak naturally in Hindi or local dialects. The platform transcribes speech, extracts structured symptoms with duration and severity, and feeds them into a separate deterministic rule engine. Generative AI is strictly isolated from clinical escalation.',
    fullDescHi: 'स्वास्थ्य कार्यकर्ता अपनी बोली में बोलकर लक्षण दर्ज कर सकते हैं। सिस्टम आवाज़ को पाठ में बदलकर लक्षणों को अलग करता है और प्रमाणित सुरक्षा नियमों के आधार पर तुरंत अलर्ट जारी करता है।',
    category: 'Clinical Safety',
    status: 'Phase 1 UI / Core Workflow P0',
    targetRoles: ['ASHA Worker', 'ANM / Nurse', 'Doctor'],
    keyCapabilities: [
      'Hands-free multilingual voice recording with waveform visualization',
      'Editable live transcript review prior to clinical submission',
      'Structured extraction: symptom, duration (days), severity level',
      'Deterministic red-flag evaluation without generative AI hallucinations'
    ],
    safetyBoundaries: 'AI never makes autonomous diagnostic or drug prescription decisions. If speech service is unavailable, an immediate manual fallback form is enforced.',
    iconName: 'Mic'
  },
  {
    id: 'FEAT-03',
    slug: 'chronic-care',
    title: 'Chronic Care',
    titleHi: 'दीर्घकालिक रोग देखभाल (Chronic Care)',
    shortDesc: 'Track BP, blood glucose, and chronic NCD conditions with timely overdue follow-up queues.',
    shortDescHi: 'रक्तचाप और शुगर की नियमित निगरानी, समय पर जांच की याददाश्त और आपातकालीन अलर्ट।',
    fullDesc: 'Designed to tackle India’s growing rural burden of hypertension and diabetes. Frontline staff log BP and glucose readings, visualize historical trends against clinical thresholds, and manage scheduled community follow-ups.',
    fullDescHi: 'उच्च रक्तचाप और मधुमेह की नियमित जांच के लिए समर्पित मॉड्यूल। असामान्य रीडिंग पर तुरंत चिकित्सक को सूचित किया जाता है और आशा को फॉलो-अप सौंपा जाता है।',
    category: 'Care Delivery',
    status: 'Phase 1 UI / Core Workflow P0',
    targetRoles: ['ASHA Worker', 'ANM / Nurse', 'Doctor'],
    keyCapabilities: [
      'Plausible vitals validation (prevents impossible BP/sugar entries)',
      'Date-stamped visual trend charts for systolic/diastolic BP and glucose',
      'Automated queues for Due, Overdue, and Missed follow-ups',
      'Hypertensive crisis alert escalation (>180/120 mmHg) to nearest PHC'
    ],
    safetyBoundaries: 'All escalation thresholds are governed by standard Indian Council of Medical Research (ICMR) clinical guidelines. No automatic treatment alteration.',
    iconName: 'HeartPulse'
  },
  {
    id: 'FEAT-04',
    slug: 'referral-management',
    title: 'Referral Management',
    titleHi: 'रेफरल प्रबंधन (Referral Management)',
    shortDesc: 'Closed-loop referral tracking from frontline initiation to facility arrival and post-discharge follow-up.',
    shortDescHi: 'उपकेंद्र से बड़े अस्पताल तक मरीज के रेफरल, आगमन और उपचार के बाद फॉलो-अप की पूरी ट्रैकिंग।',
    fullDesc: 'Eliminates lost referrals by maintaining a digital chain of custody. Frontline workers create structured referral packets with red-flag history; receiving facilities acknowledge and schedule arrival; medical officers record clinical disposition.',
    fullDescHi: 'मरीज को उच्च स्वास्थ्य केंद्र भेजने पर डिजिटल रेफरल पर्ची तैयार होती है। अस्पताल आगमन की पुष्टि करता है और जांच के बाद आशा कार्यकर्ता को फॉलो-अप निर्देश मिलते हैं।',
    category: 'Care Delivery',
    status: 'Phase 1 UI / Core Workflow P0',
    targetRoles: ['ASHA Worker', 'Doctor', 'PHC Staff'],
    keyCapabilities: [
      'Structured referral packet generation with reason and urgency level',
      'Facility arrival acknowledgement and bed/clinic assignment',
      'Doctor disposition documentation (Admitted, Outpatient Care, Transferred)',
      'Automatic generation of post-discharge home visit tasks for ASHA'
    ],
    safetyBoundaries: 'Emergency referrals trigger priority notifications across both referring and receiving facilities simultaneously with guaranteed audit logging.',
    iconName: 'Send'
  },
  {
    id: 'FEAT-05',
    slug: 'health-radar',
    title: 'Health Radar',
    titleHi: 'हेल्थ रडार (Health Radar)',
    shortDesc: 'Real-time syndromic surveillance maps and privacy-preserving village-level early warning signals.',
    shortDescHi: 'गांव स्तर पर मौसमी बुखार और संक्रामक रोगों के फैलाव का रियल-टाइम मानचित्र और पूर्व चेतावनी।',
    fullDesc: 'Aggregates anonymized frontline symptom data into spatial cluster signals. Allows Block and District Public Health Officers to detect unusual fever, diarrheal, or respiratory spikes days before formal hospital reporting.',
    fullDescHi: 'आशा कार्यकर्ताओं द्वारा दर्ज किए गए लक्षणों के आधार पर गांव स्तर पर संक्रामक बीमारियों के संकुल (क्लस्टर) की पहचान करता है ताकि महामारी फैलने से पहले रोका जा सके।',
    category: 'Public Health',
    status: 'Planned P1',
    targetRoles: ['Public Health Officer', 'District Programme Manager'],
    keyCapabilities: [
      'Interactive risk heat-map with syndrome filters (Fever, Respiratory, Gastro)',
      'Baseline vs current week spike detection using statistical anomalies',
      'K-anonymity suppression to protect individual villager identities',
      'Human-reviewed candidate alerts (prevents false public panic)'
    ],
    safetyBoundaries: 'Health Radar generates candidate alerts for human epidemiologist investigation only; it never autonomously declares outbreaks or triggers quarantine measures.',
    iconName: 'MapPin'
  },
  {
    id: 'FEAT-06',
    slug: 'reports-analytics',
    title: 'Reports & Analytics',
    titleHi: 'रिपोर्ट्स और एनालिटिक्स (Reports & Analytics)',
    shortDesc: 'Data-driven operational metrics on workforce performance, referral completion, and data quality.',
    shortDescHi: 'स्वास्थ्य कार्यकर्ताओं का कार्यभार, रेफरल सफलता दर और स्वास्थ्य संकेतकों की विस्तृत रिपोर्ट।',
    fullDesc: 'Provides district health administrators and facility managers with verifiable operational metrics: encounter volumes, follow-up adherence rates, referral completion intervals, and missing-data audits.',
    fullDescHi: 'ज़िला और ब्लॉक स्तर के अधिकारियों के लिए पारदर्शी विश्लेषिकी, जिससे स्वास्थ्य सेवाओं की कमियों को समय रहते दूर किया जा सके।',
    category: 'Public Health',
    status: 'Planned P1',
    targetRoles: ['District Programme Manager', 'Public Health Officer', 'Admin'],
    keyCapabilities: [
      'Encounter volume and chronic disease coverage summaries',
      'Referral completion interval tracking (dispatch to doctor review)',
      'Data completeness and missing-vitals audit dashboards',
      'Permission-scoped CSV and PDF export with immutable logging'
    ],
    safetyBoundaries: 'All analytical outputs are computed from permitted database records. Exports strip direct patient identifiers unless explicitly authorized for legal audit.',
    iconName: 'BarChart3'
  },
  {
    id: 'FEAT-07',
    slug: 'notifications-tasks',
    title: 'Notifications & Tasks',
    titleHi: 'सूचनाएं और कार्य (Notifications & Tasks)',
    shortDesc: 'Stay updated with prioritized follow-up reminders, critical referral acknowledgements, and alerts.',
    shortDescHi: 'फॉलो-अप याददाश्त, आपातकालीन रेफरल अलर्ट और दैनिक कार्यों की प्राथमिकता-आधारित सूची।',
    fullDesc: 'A centralized operational inbox for healthcare workers. Categorizes notifications into Tasks, Clinical Alerts, and Administrative Messages with visual priority badges and audible cues for urgent cases.',
    fullDescHi: 'आशा और स्वास्थ्य कर्मियों के लिए दैनिक कार्यों की सूची। जरूरी कार्यों के लिए लाल अलर्ट और सामान्य जांच के लिए नीले संकेतक दिए गए हैं।',
    category: 'Care Delivery',
    status: 'Planned P1',
    targetRoles: ['ASHA Worker', 'ANM / Nurse', 'Doctor', 'PHC Staff'],
    keyCapabilities: [
      'Categorized inbox: All, Overdue Tasks, Clinical Alerts, Messages',
      'High-contrast visual priority indicators (not reliant on color alone)',
      'Direct one-tap action from notification to patient profile or referral card',
      'Escalation triggers for unacknowledged critical red-flag tasks'
    ],
    safetyBoundaries: 'Critical clinical tasks remain pinned and require explicit completion notes or supervisor sign-off before dismissal.',
    iconName: 'Bell'
  },
  {
    id: 'FEAT-08',
    slug: 'administration-governance',
    title: 'Administration & Governance',
    titleHi: 'प्रशासन एवं सुशासन (Administration & Governance)',
    shortDesc: 'Manage health facilities, role-based scopes, clinician protocols, and tamper-evident audit trails.',
    shortDescHi: 'उपयोगकर्ता भूमिकाएं, सुविधा प्रबंधन, क्लिनिकल प्रोटोकॉल संस्करण और सुरक्षा ऑडिट लॉग।',
    fullDesc: 'Gives authorized system administrators complete governance over the platform: onboarding health workers, configuring facility hierarchies, rolling out versioned clinical safety protocols, and auditing access logs.',
    fullDescHi: 'प्रशासकों के लिए उपयोगकर्ता प्रबंधन, प्राथमिक स्वास्थ्य केंद्र मैपिंग और क्लिनिकल प्रोटोकॉल की स्वीकृति की सुरक्षित व्यवस्था।',
    category: 'Governance & Access',
    status: 'Phase 1 UI / Core Workflow P0',
    targetRoles: ['System Administrator', 'Auditor / Evaluator'],
    keyCapabilities: [
      'Hierarchical facility directory (District -> Block -> PHC -> Sub-Centre)',
      'Spatial scope assignment (restricting worker access to assigned villages)',
      'Clinical protocol versioning with change tracking and rollback controls',
      'Tamper-evident audit log inspector for security and compliance reviews'
    ],
    safetyBoundaries: 'System administrators cannot modify clinical records or override triage decisions without clinical credentials and separate medical justification.',
    iconName: 'ShieldCheck'
  },
  {
    id: 'FEAT-09',
    slug: 'multi-language-support',
    title: 'Multi-language Support',
    titleHi: 'बहुभाषी सहायता (Multi-language Support)',
    shortDesc: 'Full interface and voice support in Hindi and regional Indian languages for grassroots usability.',
    shortDescHi: 'हिंदी और क्षेत्रीय भाषाओं में संपूर्ण इंटरफ़ेस एवं आवाज़ समर्थन, ताकि भाषा कोई बाधा न बने।',
    fullDesc: 'Engineered specifically for non-English-speaking frontline workers. Includes professionally reviewed Hindi terminology, regional phonetic dictionaries, and responsive typography that prevents Devanagari line-break glitches.',
    fullDescHi: 'ग्रामीण स्वास्थ्य कार्यकर्ताओं की सुविधा के लिए सरल और शुद्ध हिंदी शब्दावली में तैयार इंटरफ़ेस, जिसमें क्षेत्रीय बोलियों को समझने की विशेष क्षमता है।',
    category: 'Governance & Access',
    status: 'Phase 1 UI / Core Workflow P0',
    targetRoles: ['ASHA Worker', 'ANM / Nurse', 'Doctor', 'All Roles'],
    keyCapabilities: [
      'Instant English and Hindi interface toggle with persistent user preference',
      'Culturally grounded, plain-language clinical terms (avoiding confusing jargon)',
      'Devanagari-optimized typography with zero layout overflow on small screens',
      'Extensible architecture ready for Marathi, Bengali, Odia, and Gujarati'
    ],
    safetyBoundaries: 'Only professionally reviewed and clinically evaluated language packs are enabled in production to prevent misinterpretation of safety alerts.',
    iconName: 'Globe'
  }
];

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    step: 1,
    title: 'Register Patient',
    titleHi: '1. मरीज का पंजीकरण (Register Patient)',
    tagline: 'Digital Consent & Identification',
    taglineHi: 'डिजिटल सहमति एवं विशिष्ट पहचान',
    description: 'Frontline health worker looks up existing records or registers a new patient with explicit purpose-specific consent under DPDP guidelines.',
    descriptionHi: 'आशा कार्यकर्ता मरीज की डिजिटल सहमति लेकर बुनियादी जानकारी दर्ज करती हैं और सुरक्षित आरोग्य आईडी तैयार करती हैं।',
    actorRole: 'ASHA Worker / ANM',
    actorRoleHi: 'आशा कार्यकर्ता / एएनएम',
    safetyCheck: 'Duplicate detection & consent purpose validation',
    safetyCheckHi: 'डुप्लिकेट रिकॉर्ड जांच एवं सहमति पुष्टि',
    iconName: 'UserCheck'
  },
  {
    step: 2,
    title: 'Capture Information',
    titleHi: '2. लक्षण संकलन (Capture Information)',
    tagline: 'Voice or Structured Form Input',
    taglineHi: 'आवाज़ या संरचित फॉर्म द्वारा प्रविष्टि',
    description: 'Health worker records symptoms via conversational voice in local dialects or directly types structured vitals (temperature, BP, pulse).',
    descriptionHi: 'मरीज की बोली में बोलकर या फॉर्म भरकर लक्षण, अवधि और आवश्यक वाइटल्स (तापमान, रक्तचाप) दर्ज किए जाते हैं।',
    actorRole: 'ASHA Worker',
    actorRoleHi: 'आशा कार्यकर्ता',
    safetyCheck: 'Live transcript verification & missing vitals warning',
    safetyCheckHi: 'ट्रांसक्रिप्ट समीक्षा एवं छूटे हुए माप की चेतावनी',
    iconName: 'Mic'
  },
  {
    step: 3,
    title: 'Safety Check',
    titleHi: '3. सुरक्षा जांच (Safety Check)',
    tagline: 'Deterministic Red-Flag Evaluation',
    taglineHi: 'नियम-आधारित आपातकालीन जांच',
    description: 'Structured inputs are evaluated instantly against versioned clinician-approved deterministic protocols. Critical red-flags are highlighted.',
    descriptionHi: 'दर्ज किए गए लक्षणों की जांच डॉक्टर-स्वीकृत सख्त क्लिनिकल नियमों से होती है। गंभीर स्थिति होने पर तुरंत लाल चेतावनी मिलती है।',
    actorRole: 'Safety Engine + Health Worker',
    actorRoleHi: 'सुरक्षा नियम इंजन + कार्यकर्ता',
    safetyCheck: '100% deterministic rules (No LLM hallucinations)',
    safetyCheckHi: '100% प्रमाणित नियम (एआई का स्वतंत्र निर्णय नहीं)',
    iconName: 'ShieldAlert'
  },
  {
    step: 4,
    title: 'Take Action',
    titleHi: '4. त्वरित कार्रवाई (Take Action)',
    tagline: 'Closed-Loop Referral or Care Plan',
    taglineHi: 'रेफरल पर्ची या देखभाल योजना',
    description: 'For urgent symptoms, a structured referral is dispatched to the nearest PHC/hospital. For routine care, an evidence-based care plan is assigned.',
    descriptionHi: 'गंभीर स्थिति में तुरंत नजदीकी अस्पताल के लिए डिजिटल रेफरल बनता है, या सामान्य स्थिति में दवा और खानपान की सलाह दी जाती है।',
    actorRole: 'Doctor / Medical Officer',
    actorRoleHi: 'चिकित्सा अधिकारी / डॉक्टर',
    safetyCheck: 'Facility acknowledgement & doctor disposition review',
    safetyCheckHi: 'अस्पताल द्वारा पावती एवं डॉक्टर द्वारा समीक्षा',
    iconName: 'Send'
  },
  {
    step: 5,
    title: 'Track & Monitor',
    titleHi: '5. निगरानी एवं फॉलो-अप (Track & Monitor)',
    tagline: 'Continuous Community Care',
    taglineHi: 'निरंतर सामुदायिक निगरानी',
    description: 'Post-facility discharge, automatic home visit tasks are scheduled for the ASHA to verify recovery, medication adherence, and vitals.',
    descriptionHi: 'अस्पताल से लौटने के बाद आशा कार्यकर्ता के ऐप में फॉलो-अप कार्य स्वतः जुड़ जाता है, जिससे मरीज के पूर्ण स्वस्थ होने की पुष्टि होती है।',
    actorRole: 'ASHA Worker + Public Health Team',
    actorRoleHi: 'आशा कार्यकर्ता + स्वास्थ्य दल',
    safetyCheck: 'Overdue task escalation & signal aggregation',
    safetyCheckHi: 'लंबित कार्यों की निगरानी एवं स्वास्थ्य आंकड़े',
    iconName: 'Activity'
  }
];

export const TARGET_METRICS: TargetMetric[] = [
  {
    value: '10,000+',
    label: 'Healthcare Workers',
    labelHi: 'स्वास्थ्य कार्यकर्ता (लक्ष्य)',
    subtext: 'Frontline ASHA & ANM deployment target',
    subtextHi: 'प्रारंभिक परियोजना हेतु लक्षित कार्यकर्ता'
  },
  {
    value: '2,500+',
    label: 'Health Facilities',
    labelHi: 'स्वास्थ्य केंद्र (लक्ष्य)',
    subtext: 'Connected Sub-Centres, PHCs & CHCs',
    subtextHi: 'जुड़े हुए उपकेंद्र, पीएचसी और सीएचसी'
  },
  {
    value: '15,000+',
    label: 'Villages Covered',
    labelHi: 'गाँव आच्छादित (लक्ष्य)',
    subtext: 'Rural revenue villages in target districts',
    subtextHi: 'लक्षित ज़िलों के ग्रामीण राजस्व गाँव'
  },
  {
    value: '1 Crore+',
    label: 'People (Target Impact)',
    labelHi: 'नागरिक लक्षित प्रभाव',
    subtext: 'Estimated rural population coverage',
    subtextHi: 'अनुमानित ग्रामीण जनसँख्या का दायरा'
  }
];

export const ROLE_PROFILES: RoleProfile[] = [
  {
    id: 'ROLE-ASHA',
    role: 'ASHA / Community Health Worker',
    roleHi: 'आशा / सामुदायिक स्वास्थ्य कार्यकर्ता',
    tagline: 'Frontline Community Care at the Doorstep',
    taglineHi: 'घर-घर जाकर स्वास्थ्य सेवा और प्राथमिक जांच',
    operationalSetting: 'Village households, community gatherings, rural homes',
    responsibilities: [
      'Register patients with verified digital consent',
      'Record symptoms via natural voice in local dialects',
      'Perform structured routine BP and glucose follow-up visits',
      'Initiate urgent referrals and guide families to health facilities'
    ],
    dataScope: 'Assigned village(s) and assigned household patient records only.',
    iconName: 'HeartHandshake'
  },
  {
    id: 'ROLE-ANM',
    role: 'ANM / Staff Nurse',
    roleHi: 'एएनएम / स्टाफ नर्स',
    tagline: 'Clinical Screening & Escalation Review',
    taglineHi: 'उपकेंद्र स्तर पर नैदानिक जांच एवं समीक्षा',
    operationalSetting: 'Sub-Centres, Health & Wellness Centres (HWCs)',
    responsibilities: [
      'Record accurate clinical vitals and maternal check-ups',
      'Review frontline escalations flagged by village ASHAs',
      'Administer immunizations and chronic disease screening clinics',
      'Coordinate patient transfer logistics with 108 ambulance teams'
    ],
    dataScope: 'Assigned sub-centre catchment area and village clusters.',
    iconName: 'Stethoscope'
  },
  {
    id: 'ROLE-DOC',
    role: 'Medical Officer / Doctor',
    roleHi: 'चिकित्सा अधिकारी / डॉक्टर',
    tagline: 'Clinical Disposition & Care Oversight',
    taglineHi: 'मरीज की जांच, उपचार योजना एवं रेफरल समीक्षा',
    operationalSetting: 'Primary Health Centres (PHC), Community Health Centres (CHC)',
    responsibilities: [
      'Review inbound structured referral packets and red-flag histories',
      'Document formal clinical dispositions (Admit, OPD, Transfer)',
      'Authorize evidence-based chronic care treatment plans',
      'Review and sign off on frontline protocol safety overrides'
    ],
    dataScope: 'Assigned PHC/CHC facility records and inbound referred patients.',
    iconName: 'UserPlus'
  },
  {
    id: 'ROLE-PHC',
    role: 'PHC / Facility Staff',
    roleHi: 'पीएचसी / अस्पताल प्रबंधन दल',
    tagline: 'Patient Arrival & Referral Logistics',
    taglineHi: 'अस्पताल में मरीज आगमन, बेड आवंटन एवं रिकॉर्ड',
    operationalSetting: 'PHC / CHC reception, registration counter, pharmacy',
    responsibilities: [
      'Acknowledge incoming digital referral alerts',
      'Record physical patient arrival and assign clinic tokens',
      'Maintain facility service availability and essential drug inventory',
      'Log completed visits and trigger discharge summary to ASHA'
    ],
    dataScope: 'Receiving facility operations and administrative queues.',
    iconName: 'Building2'
  },
  {
    id: 'ROLE-PHO',
    role: 'Public Health Officer',
    roleHi: 'लोक स्वास्थ्य अधिकारी',
    tagline: 'Epidemiological Surveillance & Early Alerts',
    taglineHi: 'संक्रामक रोग निगरानी एवं पूर्व चेतावनी प्रबंधन',
    operationalSetting: 'Block / District Health Office, Surveillance Unit',
    responsibilities: [
      'Monitor real-time syndromic heatmaps on Health Radar',
      'Investigate candidate cluster alerts (Fever, Diarrhea, Jaundice)',
      'Deploy rapid response teams to villages with statistical spikes',
      'Track data completeness and syndromic reporting consistency'
    ],
    dataScope: 'De-identified aggregate village and block surveillance data.',
    iconName: 'Compass'
  },
  {
    id: 'ROLE-ADM',
    role: 'Administrator & Auditor',
    roleHi: 'प्रशासक एवं सुरक्षा समीक्षक',
    tagline: 'System Governance, RBAC & Audit Trails',
    taglineHi: 'सिस्टम सुरक्षा, अधिकार प्रबंधन एवं ऑडिट लॉग',
    operationalSetting: 'District IT Headquarters, Governance Cell',
    responsibilities: [
      'Manage user accounts, roles, and geographic village scopes',
      'Deploy and roll back clinician-approved protocol versions',
      'Inspect immutable security, access, and export audit logs',
      'Monitor system uptime, sync failure rates, and background jobs'
    ],
    dataScope: 'Administrative operations, user scopes, and security logs.',
    iconName: 'Sliders'
  }
];

export const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'FAQ-01',
    category: 'Clinical Safety',
    question: 'Does ArogyaSaathi use AI to diagnose medical conditions or prescribe drugs?',
    questionHi: 'क्या आरोग्यसाथी बीमारी का निदान करने या दवा लिखने के लिए एआई का उपयोग करता है?',
    answer: 'No. ArogyaSaathi strictly prohibits autonomous clinical diagnosis or drug prescription. Generative AI is confined to speech-to-text transcription and structured data extraction. All clinical red-flag escalations are governed strictly by clinician-approved, versioned, deterministic rule engines. Final medical decisions always remain with qualified doctors.',
    answerHi: 'नहीं। आरोग्यसाथी किसी भी मरीज की बीमारी का स्वतंत्र रूप से निदान या दवा नहीं लिखता। एआई का उपयोग केवल आवाज को पाठ में बदलने और लक्षण संकलन तक सीमित है। सभी आपातकालीन चेतावनियां डॉक्टर द्वारा स्वीकृत नियमों पर आधारित होती हैं और अंतिम निर्णय हमेशा डॉक्टर का होता है।'
  },
  {
    id: 'FAQ-02',
    category: 'General',
    question: 'How does ArogyaSaathi work in remote rural areas with poor internet connectivity?',
    questionHi: 'कमजोर या बिना इंटरनेट वाले सुदूर ग्रामीण इलाकों में यह ऐप कैसे काम करता है?',
    answer: 'ArogyaSaathi is designed mobile-first for rural bandwidth realities. Frontline forms are lightweight and optimized for 2G/3G connections. Voice triage incorporates local recording buffers, and if the network fails, an instant structured manual fallback allows the ASHA to proceed without interruption.',
    answerHi: 'आरोग्यसाथी को 2G/3G नेटवर्क की वास्तविकताओं को ध्यान में रखकर बनाया गया है। ऐप का आकार बहुत हल्का है। नेटवर्क न होने पर भी कार्यकर्ता तुरंत साधारण फॉर्म भरकर बिना रुकावट काम जारी रख सकते हैं।'
  },
  {
    id: 'FAQ-03',
    category: 'Data Privacy',
    question: 'How is patient privacy protected under Indian data protection laws?',
    questionHi: 'भारतीय डेटा सुरक्षा कानूनों (DPDP Act) के तहत मरीज की गोपनीयता कैसे सुरक्षित है?',
    answer: 'ArogyaSaathi incorporates Privacy by Design aligned with the Digital Personal Data Protection (DPDP) Act. Patient records require purpose-specific digital consent. Access is strictly partitioned by role and geographic village jurisdiction. Furthermore, public health surveillance on Health Radar utilizes k-anonymized aggregate data to prevent re-identification.',
    answerHi: 'आरोग्यसाथी में डेटा गोपनीयता का पूर्ण ध्यान रखा गया है। मरीज की अनुमति के बिना डेटा साझा नहीं किया जाता। आशा कार्यकर्ता केवल अपने गांव के मरीजों का विवरण देख सकती हैं, और स्वास्थ्य निगरानी के लिए केवल सामूहिक सांख्यिकी का उपयोग होता है।'
  },
  {
    id: 'FAQ-04',
    category: 'Pilot Deployment',
    question: 'How can our District Health Society or NGO apply to participate in pilot trials?',
    questionHi: 'हमारा ज़िला स्वास्थ्य विभाग या एनजीओ पायलट परीक्षण में कैसे शामिल हो सकता है?',
    answer: 'Institutional health bodies can submit a formal inquiry via our Request Access portal. Following security, privacy, and clinical governance vetting, eligible districts are provided with controlled onboarding, staff training modules, and supervised non-clinical dry runs.',
    answerHi: 'ज़िला स्वास्थ्य समितियां या पंजीकृत संस्थाएं हमारे "पहुंच अनुरोध" (Request Access) पेज के माध्यम से आवेदन कर सकती हैं। क्लिनिकल और प्रशासनिक समीक्षा के बाद अधिकृत कर्मियों को सुरक्षित लॉगिन और प्रशिक्षण दिया जाता है।'
  },
  {
    id: 'FAQ-05',
    category: 'Clinical Safety',
    question: 'What happens if an ASHA worker records contradictory or incomplete symptoms?',
    questionHi: 'यदि कोई कार्यकर्ता अधूरे या परस्पर विरोधी लक्षण दर्ज करे तो क्या होता है?',
    answer: 'The platform’s deterministic safety engine checks for mandatory clinical safety inputs (such as body temperature during reported fever, or gestational age in pregnant women). If essential safety inputs are missing, the system blocks automatic clearance and prompts the worker to capture the required vital or routes the case to human review.',
    answerHi: 'सिस्टम तुरंत आवश्यक जानकारी की कमी की पहचान करता है (जैसे बुखार में तापमान न होना)। जब तक जरूरी जानकारी दर्ज नहीं होती, सिस्टम सुरक्षा चेतावनी देता है और कार्यकर्ता को सही कदम उठाने का निर्देश देता है।'
  }
];
