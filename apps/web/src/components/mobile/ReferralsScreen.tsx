import React, { useEffect, useState } from "react";
import { ArrowUpRight, Clock, CheckCircle2, AlertCircle, Phone, FileText, ChevronRight, X, User, MapPin, RefreshCw } from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";

export interface ReferralItem {
  id: string;
  code: string;
  patient_name: string;
  patient_id: string;
  facility_name: string;
  patient_age?: number | null;
  patient_gender?: string | null;
  referring_user_name?: string | null;
  urgency: "URGENT" | "ROUTINE";
  reason: string;
  status: "PENDING" | "ACCEPTED" | "SCHEDULED" | "ARRIVED" | "COMPLETED" | "REJECTED";
  created_time: string;
  rejection_reason?: string;
}

interface ReferralApiRecord {
  id: string;
  referral_code: string;
  patient_id: string;
  patient_name: string | null;
  patient_age: number | null;
  patient_gender: string | null;
  referring_user_name?: string | null;
  receiving_facility_name: string | null;
  urgency: "URGENT" | "ROUTINE";
  reason: string;
  status: ReferralItem["status"];
  rejection_reason: string | null;
  created_at: string;
}

interface ReferralDetails {
  facility?: { phone?: string | null };
  timeline: Array<{ from_status: string; to_status: string; notes: string | null; timestamp: string }>;
}

function mapReferral(record: ReferralApiRecord): ReferralItem {
  const person = record.patient_name ?? "Patient";
  const ageGender = [record.patient_age, record.patient_gender?.charAt(0)].filter(Boolean).join(" ");
  return {
    id: record.id,
    code: record.referral_code,
    patient_name: ageGender ? `${person} (${ageGender})` : person,
    patient_id: record.patient_id,
    patient_age: record.patient_age,
    patient_gender: record.patient_gender,
    referring_user_name: record.referring_user_name,
    facility_name: record.receiving_facility_name ?? "Receiving facility",
    urgency: record.urgency,
    reason: record.reason,
    status: record.status,
    created_time: new Date(record.created_at).toLocaleString(),
    rejection_reason: record.rejection_reason ?? undefined,
  };
}

export function ReferralsScreen({
  role = "ASHA"
}: {
  role?: string;
}) {
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [accessToken, setAccessToken] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [selectedRef, setSelectedRef] = useState<ReferralItem | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<ReferralDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [rejectionModal, setRejectionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    try {
      const session = JSON.parse(sessionStorage.getItem("arogyasaathi_session") ?? "null") as { access_token?: string; role?: string } | null;
      if (!session?.access_token || !session.role) {
        setError("Sign in with an authorized health-worker account to view referrals.");
        setLoading(false);
        return;
      }
      setAccessToken(session.access_token);
    } catch {
      setError("Your saved sign-in session is invalid. Sign in again to continue.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    setLoading(true);
    setError("");
    apiRequest<ReferralApiRecord[]>("/referrals?limit=100", {}, accessToken)
      .then(records => {
        if (active) setReferrals(records.map(mapReferral));
      })
      .catch(requestError => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load referrals from the server.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [accessToken]);

  const filtered = referrals.filter(r => {
    if (activeFilter === "ALL") return true;
    return r.status === activeFilter;
  });

  const handleSelectReferral = async (referral: ReferralItem) => {
    setSelectedRef(referral);
    setSelectedDetails(null);
    setDetailsLoading(true);
    setError("");
    try {
      const details = await apiRequest<ReferralDetails>(`/referrals/${referral.id}`, {}, accessToken);
      setSelectedDetails(details);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load referral details.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: ReferralItem["status"], reason?: string) => {
    if (!selectedRef) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest(`/referrals/${selectedRef.id}/transition`, {
        method: "PATCH",
        body: JSON.stringify({
          target_status: newStatus,
          rejection_reason: reason,
          notes: reason,
        }),
      }, accessToken);
      const records = await apiRequest<ReferralApiRecord[]>("/referrals?limit=100", {}, accessToken);
      const updatedReferrals = records.map(mapReferral);
      setReferrals(updatedReferrals);
      const updatedSelected = updatedReferrals.find(referral => referral.id === selectedRef.id);
      if (updatedSelected) {
        setSelectedRef(updatedSelected);
        await handleSelectReferral(updatedSelected);
      }
      setRejectionModal(false);
      setRejectionReason("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not update referral status.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F7FAF9] overflow-y-auto pb-20">
      {/* Header bar */}
      <div className="bg-[#0B6E4F] text-white p-4 rounded-b-2xl shadow-md">
        <h2 className="text-lg font-bold">Referral Management</h2>
        <p className="text-xs text-emerald-100">Live referrals from the care coordination server</p>
      </div>

      <div className="p-4 space-y-3">
        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {error}
            {!accessToken && <Link href="/worker-login" className="ml-1 font-bold underline">Sign in</Link>}
          </div>
        )}
        {loading && <div className="flex items-center justify-center gap-2 rounded-xl bg-white p-4 text-xs text-gray-500"><RefreshCw className="h-4 w-4 animate-spin" />Loading referrals…</div>}
        {/* Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {["ALL", "PENDING", "ACCEPTED", "SCHEDULED", "ARRIVED", "COMPLETED"].map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-full font-medium transition-colors whitespace-nowrap ${
                activeFilter === f
                  ? "bg-[#0B6E4F] text-white shadow-xs"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* List of Referrals */}
        <div className="space-y-2.5">
          {filtered.map(r => (
            <div
              key={r.id}
              onClick={() => void handleSelectReferral(r)}
              className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 hover:border-emerald-200 cursor-pointer transition-all active:scale-[0.99]"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                  {r.code}
                </span>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.urgency === "URGENT"
                      ? "bg-red-100 text-red-700 border border-red-200"
                      : "bg-blue-50 text-blue-700 border border-blue-200"
                  }`}>
                    {r.urgency}
                  </span>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    r.status === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : r.status === "ACCEPTED"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {r.status}
                  </span>
                </div>
              </div>

              <h4 className="font-bold text-gray-900 text-sm mb-1">{r.patient_name}</h4>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2">
                {r.reason}
              </p>

              <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                <span className="flex items-center gap-1 font-medium text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  {r.facility_name}
                </span>
                <span>{r.created_time}</span>
              </div>
            </div>
          ))}
          {!loading && accessToken && filtered.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center text-xs text-gray-500">
              No referrals in this server record set.
            </p>
          )}
        </div>
      </div>

      {/* REFERRAL DETAIL & CLOSED-LOOP TIMELINE MODAL */}
      {selectedRef && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#0B6E4F] text-white rounded-t-3xl">
              <div>
                <span className="text-[10px] font-mono bg-emerald-800/80 px-2 py-0.5 rounded text-emerald-200">
                  {selectedRef.code}
                </span>
                <h3 className="font-bold text-base mt-1">{selectedRef.patient_name}</h3>
              </div>
              <button onClick={() => setSelectedRef(null)} className="p-1 text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs">
            {detailsLoading && <p className="flex items-center gap-2 text-gray-500"><RefreshCw className="h-4 w-4 animate-spin" />Loading referral timeline…</p>}
            {selectedRef.rejection_reason && <p className="rounded-lg bg-red-50 p-3 text-red-800">Rejection reason: {selectedRef.rejection_reason}</p>}
              {/* Urgency & Destination banner */}
              <div className="p-3 bg-surface-light rounded-2xl border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 block">Receiving Facility:</span>
                  <span className="font-bold text-sm text-gray-800">{selectedRef.facility_name}</span>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                  selectedRef.urgency === "URGENT" ? "bg-red-600 text-white" : "bg-blue-600 text-white"
                }`}>
                  {selectedRef.urgency}
                </span>
              </div>

              {/* Clinical Referral Reason */}
              <div className="p-3 bg-white rounded-2xl border border-gray-200">
                <span className="font-bold text-gray-800 block mb-1">Clinical Reason & History:</span>
                <p className="text-gray-700 leading-relaxed">{selectedRef.reason}</p>
              </div>

              {/* Closed-Loop Timeline Steps */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3">
                <span className="font-bold text-gray-800 block text-xs mb-2">Closed-Loop Referral Timeline</span>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                  {/* Step 1: Created */}
                  <div className="relative">
                    <span className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-[#0B6E4F] border-2 border-white shadow-xs" />
                    <span className="font-bold text-gray-800 block">1. Created by Community Worker</span>
                    <span className="text-[10px] text-gray-500">{selectedRef.referring_user_name ?? "Health worker"} • {selectedRef.created_time}</span>
                  </div>

                  {selectedDetails?.timeline.map((event, index) => (
                    <div className="relative" key={`${event.to_status}-${event.timestamp}`}>
                      <span className="absolute -left-6 top-0.5 h-4 w-4 rounded-full border-2 border-white bg-[#0B6E4F] shadow-xs" />
                      <span className="block font-bold text-gray-800">{index + 2}. {event.to_status}</span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(event.timestamp).toLocaleString()}{event.notes ? ` · ${event.notes}` : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role Action Controls */}
              <div className="space-y-2 pt-2 border-t">
                {["DOCTOR", "PHC_STAFF"].includes(role) && selectedRef.status === "PENDING" && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={saving}
                      onClick={() => void handleUpdateStatus("ACCEPTED")}
                      className="py-2.5 bg-[#0B6E4F] hover:bg-[#064E3B] text-white rounded-xl font-bold text-xs"
                    >
                      Accept referral
                    </button>
                    <button
                      onClick={() => setRejectionModal(true)}
                      disabled={saving}
                      className="py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-xl font-bold text-xs"
                    >
                      Reject Referral
                    </button>
                  </div>
                )}

                {role === "PHC_STAFF" && selectedRef.status === "ACCEPTED" && (
                  <button
                    disabled={saving}
                    onClick={() => void handleUpdateStatus("ARRIVED")}
                    className="w-full py-2.5 bg-[#0B6E4F] hover:bg-[#064E3B] text-white rounded-xl font-bold text-xs"
                  >
                    Record Patient Arrival (Check-in)
                  </button>
                )}

                {role === "DOCTOR" && selectedRef.status === "ARRIVED" && (
                  <button disabled={saving} onClick={() => void handleUpdateStatus("COMPLETED")} className="w-full rounded-xl bg-[#0B6E4F] py-2.5 text-xs font-bold text-white disabled:opacity-60">
                    Complete consultation
                  </button>
                )}
                {selectedDetails?.facility?.phone && (
                  <a href={`tel:${selectedDetails.facility.phone}`} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-surface-light py-2 text-xs font-semibold text-gray-700">
                    <Phone className="h-3.5 w-3.5 text-[#0B6E4F]" />
                    Call {selectedRef.facility_name}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectionModal && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-4 space-y-3 shadow-2xl">
            <h4 className="font-bold text-gray-900 text-sm">Reject Referral (Reason Required)</h4>
            <p className="text-xs text-gray-500">PRD APP-REF-03 requires mandatory reason for rejection:</p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="e.g. Patient referred to higher centre directly due to bed shortage"
              className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:ring-1 focus:ring-red-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setRejectionModal(false)}
                className="flex-1 py-2 border rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                disabled={!rejectionReason.trim() || saving}
                onClick={() => void handleUpdateStatus("REJECTED", rejectionReason)}
                className="flex-1 py-2 bg-red-600 disabled:bg-gray-300 text-white rounded-xl text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
