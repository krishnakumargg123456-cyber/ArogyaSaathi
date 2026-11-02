import React, { useState } from 'react';
import { Card, Button, Badge } from '../../design-system';
import { mobileApiFetch } from '../../core/api/client';

interface Referral {
  id: string;
  referral_code?: string;
  patient_id: string;
  patient_name: string;
  facility_name: string;
  reason: string;
  urgency: 'URGENT' | 'ROUTINE';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ARRIVED' | 'COMPLETED';
  created_at: string;
}

interface ReferralManagementScreenProps {
  referrals: Referral[];
  userRole: string;
  onCreateReferral: () => void;
  onUpdateStatus?: (referralId: string, newStatus: string) => void | Promise<void>;
}

interface ReferralDetails {
  id: string;
  referral_code: string;
  urgency: string;
  reason: string;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  patient: { id: string; internal_id: string; name: string };
  facility: { id: string; name: string; type: string };
  timeline: { from_status: string | null; to_status: string; notes: string | null; timestamp: string }[];
}

export const ReferralManagementScreen: React.FC<ReferralManagementScreenProps> = ({
  referrals,
  userRole,
  onCreateReferral,
  onUpdateStatus
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'COMPLETED'>('ALL');
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [referralDetails, setReferralDetails] = useState<ReferralDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const openTimeline = async (referral: Referral) => {
    setSelectedReferral(referral);
    setReferralDetails(null);
    setLoadingDetails(true);
    setDetailError(null);
    try {
      const details = await mobileApiFetch<ReferralDetails>(`/referrals/${encodeURIComponent(referral.id)}`);
      setReferralDetails(details);
    } catch (requestError) {
      setDetailError(requestError instanceof Error ? requestError.message : 'Could not load referral history.');
    } finally {
      setLoadingDetails(false);
    }
  };

  const filtered = referrals.filter((r) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'PENDING') return r.status === 'PENDING';
    if (activeTab === 'ACCEPTED') return r.status === 'ACCEPTED' || r.status === 'ARRIVED';
    if (activeTab === 'COMPLETED') return r.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Referral Tracker</h2>
          <p className="text-xs text-gray-500">Closed-loop primary-to-secondary care</p>
        </div>
        <Button size="sm" onClick={onCreateReferral} leftIcon={<span>+</span>}>
          New Referral
        </Button>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-gray-100 rounded-xl text-xs font-semibold">
        {(['ALL', 'PENDING', 'ACCEPTED', 'COMPLETED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-1.5 rounded-lg transition ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Referrals List */}
      <div className="space-y-3">
        {filtered.map((ref) => (
          <Card
            key={ref.id}
            variant="elevated"
            padding="md"
            className="space-y-2.5 hover:border-[#0B6E4F]/30 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 text-sm">{ref.patient_name}</h3>
                  <Badge variant={ref.urgency === 'URGENT' ? 'danger' : 'neutral'} size="sm" dot>
                    {ref.urgency}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  Destination: <strong>{ref.facility_name}</strong>
                </div>
              </div>

              <Badge
                variant={
                  ref.status === 'PENDING'
                    ? 'warning'
                    : ref.status === 'ACCEPTED' || ref.status === 'ARRIVED'
                    ? 'info'
                    : 'success'
                }
                size="sm"
              >
                {ref.status}
              </Badge>
            </div>

            <div className="p-2 bg-gray-50 rounded-xl text-xs text-gray-700">
              <span className="font-medium text-gray-500">Reason: </span>
              {ref.reason}
            </div>

            {/* Doctor/PHC Action Buttons depending on logged in role */}
            <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
              <span className="text-[11px] text-gray-400">{ref.created_at}</span>
              
              <div className="flex gap-1.5">
                {userRole === 'DOCTOR' && ref.status === 'PENDING' && onUpdateStatus && (
                  <>
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onUpdateStatus(ref.id, 'ACCEPTED')}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus(ref.id, 'REJECTED')}
                    >
                      Reject
                    </Button>
                  </>
                )}

                {userRole === 'PHC_STAFF' && ref.status === 'ACCEPTED' && onUpdateStatus && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => onUpdateStatus(ref.id, 'ARRIVED')}
                  >
                    Mark Arrived
                  </Button>
                )}

                <button
                onClick={() => void openTimeline(ref)}
                  className="text-xs font-semibold text-[#0B6E4F] hover:underline px-2 py-1"
                >
                  Timeline →
                </button>
              </div>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="p-8 text-center text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-sm font-medium">No referrals in this category</p>
          </div>
        )}
      </div>

      {/* Closed Loop Timeline Modal */}
      {selectedReferral && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card variant="elevated" padding="lg" className="max-w-md w-full space-y-4 bg-white">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-900 text-base">Referral Lifecycle Timeline</h3>
              <button
                onClick={() => {
                  setSelectedReferral(null);
                  setReferralDetails(null);
                  setDetailError(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            {loadingDetails && <p className="text-sm text-gray-500">Loading referral history…</p>}
            {detailError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{detailError}</p>}
            {referralDetails && (
              <>
                <div className="rounded-xl bg-gray-50 p-3 text-xs text-gray-700">
                  <div><strong>{referralDetails.referral_code}</strong> · {referralDetails.patient.name} ({referralDetails.patient.internal_id})</div>
                  <div className="mt-1">Destination: {referralDetails.facility.name} · Current status: {referralDetails.status}</div>
                  {referralDetails.rejection_reason && <div className="mt-1 text-red-700">Rejection reason: {referralDetails.rejection_reason}</div>}
                </div>
                <div className="space-y-3 text-xs text-gray-700">
                  {referralDetails.timeline.map((event, index) => (
                    <div key={`${event.to_status}-${event.timestamp}-${index}`} className="flex items-start gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">{index + 1}</span>
                      <div>
                        <div className="font-bold text-gray-900">{event.from_status ?? 'CREATED'} → {event.to_status}</div>
                        <div className="text-gray-500">{event.timestamp}</div>
                        {event.notes && <div className="mt-1 text-gray-600">{event.notes}</div>}
                      </div>
                    </div>
                  ))}
                  {!referralDetails.timeline.length && <p className="text-gray-500">No workflow events are recorded yet.</p>}
                </div>
              </>
            )}

            <Button fullWidth onClick={() => {
              setSelectedReferral(null);
              setReferralDetails(null);
              setDetailError(null);
            }}>
              Close Timeline
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
