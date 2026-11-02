import React, { useEffect, useState } from 'react';
import { Card, Badge } from '../../design-system';
import { mobileApiFetch } from '../../core/api/client';

interface Facility {
  id: string;
  name: string;
  district: string;
  block: string;
}

export const FacilityDirectoryScreen: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    mobileApiFetch<Facility[]>('/facilities')
      .then((records) => {
        if (active) setFacilities(records);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Could not load facilities.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Health Facility Directory</h2>
        <p className="text-xs text-gray-500">Active facilities from the ArogyaSaathi directory</p>
      </div>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
      {loading && <p className="py-6 text-center text-sm text-gray-500">Loading facility directory…</p>}
      {!loading && !error && facilities.length === 0 && (
        <p className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          No active facilities are available.
        </p>
      )}

      <div className="space-y-3">
        {facilities.map((facility) => (
          <Card key={facility.id} variant="elevated" padding="md" className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{facility.name}</h3>
                <div className="text-xs text-gray-500 mt-1">📍 {facility.block}, {facility.district}</div>
              </div>
              <Badge variant="info" size="sm">Active</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
