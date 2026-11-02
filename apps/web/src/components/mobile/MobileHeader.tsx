import React from "react";

export function AndroidStatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-2 pb-1 text-xs font-semibold text-gray-700 bg-surface-light select-none">
      <span>9:41</span>
      <div className="flex items-center space-x-2">
        <span className="text-[10px] bg-gray-200 px-1 rounded font-mono">4G</span>
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L12 22l7.03-4.39C20.26 16.07 21 14.12 21 12c0-4.97-4.03-9-9-9z"/>
        </svg>
        <span className="text-[11px]">82%</span>
      </div>
    </div>
  );
}

export function SyncBadge({
  status,
  pendingCount = 0,
  lastSyncTime = "2 min ago",
  onSyncClick
}: {
  status: "synced" | "syncing" | "pending" | "offline" | "conflict";
  pendingCount?: number;
  lastSyncTime?: string;
  onSyncClick?: () => void;
}) {
  const getBadgeStyle = () => {
    switch (status) {
      case "synced":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "syncing":
        return "bg-blue-50 text-blue-700 border-blue-200 animate-pulse";
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "conflict":
        return "bg-red-50 text-red-700 border-red-200";
      case "offline":
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getLabel = () => {
    switch (status) {
      case "synced":
        return `Synced ${lastSyncTime}`;
      case "syncing":
        return "Syncing records...";
      case "pending":
        return `Saved locally (${pendingCount} pending)`;
      case "conflict":
        return "Sync conflict - review";
      case "offline":
      default:
        return "Offline Mode (Local)";
    }
  };

  return (
    <button
      onClick={onSyncClick}
      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border shadow-xs transition-colors ${getBadgeStyle()}`}
      title="Click to view Sync Centre"
    >
      <span className={`w-2 h-2 rounded-full ${status === 'synced' ? 'bg-emerald-500' : status === 'syncing' ? 'bg-blue-500' : status === 'pending' ? 'bg-amber-500' : 'bg-gray-400'}`} />
      <span>{getLabel()}</span>
    </button>
  );
}

