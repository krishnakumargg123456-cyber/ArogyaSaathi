export type Language = 'en' | 'hi';

export type FeatureStatus = 'Phase 1 UI / Core Workflow P0' | 'Planned P1' | 'Planned P2';

export interface FeatureItem {
  id: string;
  slug: string;
  title: string;
  titleHi: string;
  shortDesc: string;
  shortDescHi: string;
  fullDesc: string;
  fullDescHi: string;
  category: 'Care Delivery' | 'Clinical Safety' | 'Public Health' | 'Governance & Access';
  status: FeatureStatus;
  targetRoles: string[];
  keyCapabilities: string[];
  safetyBoundaries: string;
  iconName: string;
}

export interface WorkflowStep {
  step: number;
  title: string;
  titleHi: string;
  tagline: string;
  taglineHi: string;
  description: string;
  descriptionHi: string;
  actorRole: string;
  actorRoleHi: string;
  safetyCheck: string;
  safetyCheckHi: string;
  iconName: string;
}

export interface TargetMetric {
  value: string;
  label: string;
  labelHi: string;
  subtext: string;
  subtextHi: string;
}

export interface RoleProfile {
  id: string;
  role: string;
  roleHi: string;
  tagline: string;
  taglineHi: string;
  operationalSetting: string;
  responsibilities: string[];
  dataScope: string;
  iconName: string;
}

export interface FAQItem {
  id: string;
  category: 'General' | 'Clinical Safety' | 'Data Privacy' | 'Pilot Deployment';
  question: string;
  questionHi: string;
  answer: string;
  answerHi: string;
}
