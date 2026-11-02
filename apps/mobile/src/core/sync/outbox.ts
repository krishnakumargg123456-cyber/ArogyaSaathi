/**
 * ArogyaSaathi Android Mobile Outbox & Offline Sync Manager
 * PRD Section 11 Compliance
 */

export interface OutboxRecord {
  op_id: string; // client UUID idempotency key
  entity: "referral" | "appointment" | "patient" | "encounter" | "consent" | "task";
  action: "create" | "update" | "transition";
  priority: "urgent" | "routine";
  client_time: string;
  payload: Record<string, any>;
  status: "pending" | "syncing" | "synced" | "rejected";
  error_message?: string;
  alternatives?: any[];
}

const STORAGE_KEY = "arogyasaathi_mobile_outbox";

export const outboxManager = {
  getItems(): OutboxRecord[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  enqueue(item: Omit<OutboxRecord, "status">): OutboxRecord {
    const records = this.getItems();
    const newRecord: OutboxRecord = {
      ...item,
      status: "pending"
    };
    records.push(newRecord);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
    return newRecord;
  },

  updateStatus(op_id: string, status: OutboxRecord["status"], error_message?: string, alternatives?: any[]) {
    const records = this.getItems();
    const idx = records.findIndex(r => r.op_id === op_id);
    if (idx !== -1) {
      records[idx].status = status;
      if (error_message) records[idx].error_message = error_message;
      if (alternatives) records[idx].alternatives = alternatives;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      }
    }
  },

  getPendingCount(): number {
    return this.getItems().filter(r => r.status === "pending").length;
  }
};

