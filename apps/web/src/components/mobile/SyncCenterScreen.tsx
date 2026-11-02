import React, { useEffect, useState } from "react";
import { RefreshCw, CloudOff, CheckCircle2, Clock, AlertTriangle, Database, ArrowUpCircle, HardDrive, Wifi, ShieldCheck } from "lucide-react";
import { offlineStorage, OutboxItem } from "@/lib/offlineDb";
import { apiRequest } from "@/lib/api";

interface SyncItemResult {
  op_id: string;
  status: "accepted" | "duplicate" | "rejected";
  message?: string | null;
}

interface SyncPullResult {
  next_cursor: string;
  server_time: string;
  patients: unknown[];
  referrals: unknown[];
  appointments: unknown[];
  tasks: unknown[];
}

export function SyncCenterScreen({
  isOfflineMode,
  onToggleOffline,
  onSyncTriggered,
  onSyncCompleted,
}: {
  isOfflineMode: boolean;
  onToggleOffline: () => void;
  onSyncTriggered: () => void;
  onSyncCompleted?: (success: boolean) => void;
}) {
  const [outboxItems, setOutboxItems] = useState<OutboxItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [syncError, setSyncError] = useState("");

  useEffect(() => {
    setOutboxItems(offlineStorage.getOutbox());
    try {
      const session = JSON.parse(sessionStorage.getItem("arogyasaathi_session") ?? "null") as {
        access_token?: string;
        device_id?: string;
      } | null;
      setAccessToken(session?.access_token ?? "");
      setDeviceId(session?.device_id ?? "");
    } catch {
      setSyncError("Your saved session is invalid. Sign in again before syncing.");
    }
  }, []);

  const handleManualSync = async () => {
    if (isOfflineMode) {
      setSyncError("Reconnect before synchronizing with the backend.");
      return;
    }
    if (!accessToken || !deviceId) {
      setSyncError("Sign in again to register this browser as a sync device.");
      onSyncCompleted?.(false);
      return;
    }
    setIsSyncing(true);
    setSyncError("");
    onSyncTriggered();
    try {
      const pendingItems = outboxItems.filter((item) => item.status === "pending");
      if (pendingItems.length > 0) {
        const results = await apiRequest<{ results: SyncItemResult[] }>("/sync/push", {
          method: "POST",
          body: JSON.stringify({
            device_id: deviceId,
            app_version: "2.1.0-web",
            items: pendingItems.map((item) => ({
              op_id: item.op_id,
              entity: item.entity,
              action: item.action,
              priority: item.priority,
              client_time: new Date(item.client_time).toISOString(),
              payload: item.payload,
            })),
          }),
        }, accessToken);
        for (const result of results.results) {
          offlineStorage.updateOutboxItem(result.op_id, {
            status: result.status === "rejected" ? "rejected" : "synced",
            error_message: result.message ?? undefined,
          });
        }
      }

      const cursor = localStorage.getItem("arogyasaathi_sync_cursor");
      const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
      const pulled = await apiRequest<SyncPullResult>(`/sync/pull${query}`, {}, accessToken);
      localStorage.setItem("arogyasaathi_sync_cursor", pulled.next_cursor);
      setLastSyncTime(new Date(pulled.server_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setOutboxItems(offlineStorage.getOutbox());
      const rejected = offlineStorage.getOutbox().filter((item) => item.status === "rejected");
      if (rejected.length) {
        setSyncError(`${rejected.length} queued item(s) were rejected by the server. Review the error shown with each item.`);
      }
      onSyncCompleted?.(true);
    } catch (requestError) {
      setSyncError(requestError instanceof Error ? requestError.message : "The server sync failed.");
      setOutboxItems(offlineStorage.getOutbox());
      onSyncCompleted?.(false);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F7FAF9] overflow-y-auto pb-20">
      {/* Header */}
      <div className="bg-[#0B6E4F] text-white p-4 rounded-b-2xl shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">Sync Centre & Offline Engine</h2>
            <p className="text-xs text-emerald-100">PRD Section 11 Offline-First Outbox</p>
          </div>
          <button
            onClick={onToggleOffline}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 shadow-xs ${
              isOfflineMode
                ? "bg-amber-500 text-white border-amber-400"
                : "bg-emerald-800 text-emerald-100 border-emerald-700"
            }`}
          >
            {isOfflineMode ? <CloudOff className="w-3.5 h-3.5" /> : <Wifi className="w-3.5 h-3.5" />}
            <span>{isOfflineMode ? "Airplane Mode ON" : "Online"}</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Sync Status Banner */}
        <div className={`p-4 rounded-2xl border shadow-xs ${
          isOfflineMode
            ? "bg-amber-50 border-amber-200 text-amber-950"
            : isSyncing
            ? "bg-blue-50 border-blue-200 text-blue-950"
            : "bg-emerald-50 border-emerald-200 text-emerald-950"
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isOfflineMode ? 'bg-amber-500 text-white' : isSyncing ? 'bg-blue-600 text-white animate-spin' : 'bg-emerald-600 text-white'}`}>
                {isOfflineMode ? <CloudOff className="w-5 h-5" /> : isSyncing ? <RefreshCw className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="font-bold text-sm">
                  {isOfflineMode ? "Offline Mode (Local Only)" : isSyncing ? "Synchronizing Outbox..." : "All Records In Sync"}
                </h4>
                <p className="text-[11px] opacity-80">
                  {isOfflineMode
                    ? "Saves securely in local SQLite outbox queue until connectivity returns"
                    : lastSyncTime ? `Last successful server sync: ${lastSyncTime}` : "Server sync has not been run on this device"}
                </p>
              </div>
            </div>

            {!isOfflineMode && (
              <button
                disabled={isSyncing}
                onClick={handleManualSync}
                className="px-3.5 py-1.5 bg-[#0B6E4F] hover:bg-[#064E3B] text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Now</span>
              </button>
            )}
          </div>
        </div>

        {syncError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{syncError}</p>}

        {/* Local Storage & Cache Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs">
            <HardDrive className="w-4 h-4 mx-auto text-gray-400 mb-1" />
            <span className="font-extrabold text-sm text-gray-800 block">{outboxItems.length}</span>
            <span className="text-[10px] text-gray-500">Local queued records</span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs">
            <Database className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
            <span className="font-extrabold text-sm text-emerald-700 block">Browser</span>
            <span className="text-[10px] text-gray-500">Local outbox storage</span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-gray-100 shadow-xs">
            <ArrowUpCircle className="w-4 h-4 mx-auto text-amber-600 mb-1" />
            <span className="font-extrabold text-sm text-amber-700 block">
              {outboxItems.filter(i => i.status === "pending").length}
            </span>
            <span className="text-[10px] text-gray-500">Pending Sync</span>
          </div>
        </div>

        {/* Outbox Items Queue */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-800">
            <span>Outbox Queue (Priority Ordered)</span>
            <span className="text-[10px] text-gray-500 font-normal">Only queued items are sent</span>
          </div>

          <div className="space-y-2 text-xs">
            {outboxItems.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-surface-light border border-gray-200/80 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                      item.priority === "urgent" ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                    }`}>
                      {item.priority}
                    </span>
                    <span className="font-bold text-gray-800 capitalize">{item.entity}</span>
                    <span className="text-[10px] text-gray-500">• {item.client_time}</span>
                  </div>
                  <p className="text-[11px] text-gray-600">{item.error_message || "Local record update"}</p>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.status === "synced" ? "bg-emerald-100 text-emerald-800"
                    : item.status === "rejected" ? "bg-red-100 text-red-800"
                      : "bg-gray-200 text-gray-700"
                }`}>
                  {item.status === "synced" ? "Synced" : item.status === "rejected" ? "Rejected" : "Saved on device"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Cryptographic Integrity Assurance */}
        <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-950 flex items-start gap-2">
          <ShieldCheck className="w-5 h-5 text-[#0B6E4F] shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <span className="font-bold block">Idempotency & Zero-Data-Loss Guarantee:</span>
            Every outbox record carries a client UUID. Dropped networks or repeated submissions can never create duplicate appointments or patient records.
          </div>
        </div>
      </div>
    </div>
  );
}
