import React, { useState } from 'react';
import { Card, Button, Badge } from '../../design-system';

export const SyncCenterScreen: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('2 minutes ago');

  const [outboxItems, setOutboxItems] = useState([
    {
      id: 'OUT-01',
      type: 'URGENT_REFERRAL',
      title: 'Emergency Referral for Ramesh Kumar',
      priority: 'CRITICAL',
      status: 'QUEUED',
      timestamp: '10:45 AM'
    },
    {
      id: 'OUT-02',
      type: 'PATIENT_REGISTRATION',
      title: 'New Patient Rekha Devi',
      priority: 'HIGH',
      status: 'QUEUED',
      timestamp: '10:12 AM'
    },
    {
      id: 'OUT-03',
      type: 'ENCOUNTER_VITALS',
      title: 'Routine BP Screening (142/90)',
      priority: 'ROUTINE',
      status: 'QUEUED',
      timestamp: '09:30 AM'
    }
  ]);

  const handleSyncNow = () => {
    if (isOfflineMode) {
      alert('Cannot sync while in simulated Offline/Airplane Mode');
      return;
    }
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setOutboxItems([]);
      setLastSyncTime('Just now');
    }, 1500);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-gray-900">Offline Sync Center</h2>
        <p className="text-xs text-gray-500">Bi-directional SQLite outbox synchronization</p>
      </div>

      {/* Sync Status Banner */}
      <Card variant="elevated" padding="lg" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isOfflineMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
              }`}
            />
            <span className="font-bold text-gray-900 text-sm">
              {isOfflineMode ? 'Offline Mode Active' : 'Connected to Sitapur PHC Cloud'}
            </span>
          </div>
          <Badge variant={outboxItems.length > 0 ? 'warning' : 'success'} size="sm">
            {outboxItems.length} Pending
          </Badge>
        </div>

        <div className="text-xs text-gray-500 flex justify-between">
          <span>Last full sync: <strong>{lastSyncTime}</strong></span>
          <span>Encryption: <strong>AES-256 (Local DB)</strong></span>
        </div>

        <div className="pt-2 flex gap-2">
          <Button
            size="md"
            fullWidth
            onClick={handleSyncNow}
            isLoading={isSyncing}
            disabled={isOfflineMode || outboxItems.length === 0}
          >
            {isSyncing ? 'Synchronizing Outbox...' : 'Sync Now'}
          </Button>
          <Button
            size="md"
            variant="outline"
            onClick={() => setIsOfflineMode(!isOfflineMode)}
          >
            {isOfflineMode ? 'Go Online' : 'Simulate Offline'}
          </Button>
        </div>
      </Card>

      {/* Outbox Items List */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
          Local Outbox Queue ({outboxItems.length})
        </h3>

        {outboxItems.map((item) => (
          <Card key={item.id} variant="flat" padding="md" className="space-y-1.5 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900">{item.title}</span>
              <Badge
                variant={item.priority === 'CRITICAL' ? 'danger' : 'neutral'}
                size="sm"
              >
                {item.priority}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-400">
              <span>Type: {item.type}</span>
              <span>{item.timestamp}</span>
            </div>
          </Card>
        ))}

        {outboxItems.length === 0 && (
          <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm font-semibold text-emerald-700">✓ All Records Synchronized</p>
            <p className="text-xs text-gray-400 mt-1">Local database is in full sync with the server</p>
          </div>
        )}
      </div>
    </div>
  );
};

