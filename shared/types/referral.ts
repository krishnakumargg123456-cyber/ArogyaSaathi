/**
 * ArogyaSaathi Referral Management Types
 * Closed Loop Primary-to-Secondary Care Lifecycle
 */

export type ReferralStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'ARRIVED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ReferralPacket {
  id: string;
  patient_id: string;
  source_facility_id?: string;
  destination_facility_id: string;
  reason: string;
  urgency: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  clinical_summary?: string;
  status: ReferralStatus;
  created_by: string;
  created_at: string;
  updated_at?: string;
}

