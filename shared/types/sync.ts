/**
 * Offline Sync Types for Outbox Engine
 */

export type OutboxPriority = 'CRITICAL' | 'HIGH' | 'ROUTINE';

export type OutboxStatus = 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';

export interface OutboxItem {
  id: string;
  client_uuid: string;
  entity_type: 'PATIENT' | 'ENCOUNTER' | 'REFERRAL' | 'APPOINTMENT' | 'CONSENT';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  priority: OutboxPriority;
  payload: Record<string, any>;
  status: OutboxStatus;
  retry_count: number;
  created_at: string;
}

