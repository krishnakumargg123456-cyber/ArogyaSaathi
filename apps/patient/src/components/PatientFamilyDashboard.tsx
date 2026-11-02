"use client";

import React, { useState } from "react";
import { Calendar, Clock, ShieldCheck, Phone } from "lucide-react";

export function PatientFamilyDashboard() {
  const [patientName] = useState("Ramesh Kumar");
  const [patientId] = useState("AS-0001245");
  const [activeTab, setActiveTab] = useState<"home" | "appointments" | "records" | "consent">("home");

  return (
    <div className="flex justify-center min-h-screen bg-gray-100 p-0 sm:p-4 font-sans">
      <div className="w-full max-w-md bg-[#F7FAF9] min-h-screen sm:min-h-[844px] flex flex-col shadow-2xl rounded-none sm:rounded-3xl overflow-hidden border border-gray-200">
        
        {/* Top Header */}
        <div className="bg-[#0B6E4F] text-white p-5 rounded-b-3xl shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-200">
                ArogyaSaathi Patient Portal
              </span>
              <h2 className="text-lg font-extrabold mt-0.5">Namaste, {patientName}</h2>
              <span className="text-xs text-emerald-100 font-mono">Patient ID: {patientId}</span>
            </div>
            <div className="w-12 h-12 rounded-full bg-white text-[#0B6E4F] flex items-center justify-center font-black text-base shadow-sm">
              RK
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-2 bg-emerald-800/80 rounded-xl text-[11px] border border-emerald-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Assigned ASHA: Sunita Devi (Rampur Village)</span>
          </div>
        </div>

        {/* Future-Ready Release 3 / P2 Notice Banner */}
        <div className="px-4 pt-3">
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-1.5 py-0.5 bg-blue-600 text-white rounded">P2 Preview</span>
              <span>Patient & Family Self-Service Module</span>
            </div>
            <span className="text-[10px] text-blue-700 font-semibold">PRD Section 5</span>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {activeTab === "home" && (
            <div className="space-y-4">
              {/* Next Appointment Card */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#0B6E4F]" />
                    Next OPD Visit
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    CONFIRMED
                  </span>
                </div>

                <div className="pt-1">
                  <h4 className="font-extrabold text-sm text-gray-900">Dr. Arjun Mehta (General Physician)</h4>
                  <p className="text-xs text-gray-600">PHC Sitapur • Today at 09:30 AM</p>
                  <p className="text-[11px] font-mono text-gray-500 mt-1">Booking Ref: AP-100234</p>
                </div>

                <div className="pt-2 border-t flex gap-2">
                  <button 
                    onClick={() => alert("Connecting to PHC Sitapur helpline: 05862-245100")}
                    className="flex-1 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center justify-center gap-1"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#0B6E4F]" />
                    <span>Call Facility</span>
                  </button>
                </div>
              </div>

              {/* Latest Health Measurements */}
              <div className="bg-white p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
                <span className="text-xs font-bold text-gray-800 block">Recent Health Vitals</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                    <span className="text-[10px] text-red-700 font-bold block">Blood Pressure</span>
                    <span className="text-lg font-black text-red-900 block mt-0.5">182/116</span>
                    <span className="text-[10px] text-red-800 font-medium">Critical Review Required</span>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 font-bold block">Temperature</span>
                    <span className="text-lg font-black text-emerald-900 block mt-0.5">98.6°F</span>
                    <span className="text-[10px] text-emerald-800 font-medium">Normal</span>
                  </div>
                </div>
              </div>

              {/* Follow-up Reminder */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs text-amber-950">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Hypertension Follow-up Due</span>
                    <span className="text-[11px] text-amber-900">ASHA Sunita Devi scheduled home checkup</span>
                  </div>
                </div>
              </div>

              {/* Consent & Data Protection */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-[#0B6E4F]" />
                  <div>
                    <span className="font-bold text-gray-900 block">DPDP Act Consent Status: ACTIVE</span>
                    <span className="text-[11px] text-gray-500">Your health records are only accessible to authorized healthcare staff</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Nav for Patient App */}
        <div className="bg-white border-t border-gray-200 h-14 flex items-center justify-around px-4 text-xs font-semibold">
          <button 
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center ${activeTab === 'home' ? 'text-[#0B6E4F] font-bold' : 'text-gray-400'}`}
          >
            <span>Home</span>
          </button>
          <button 
            onClick={() => alert("Appointments list view")}
            className="flex flex-col items-center text-gray-400 hover:text-[#0B6E4F]"
          >
            <span>Appointments</span>
          </button>
          <button 
            onClick={() => alert("Health Records & Prescriptions")}
            className="flex flex-col items-center text-gray-400 hover:text-[#0B6E4F]"
          >
            <span>My Records</span>
          </button>
          <button 
            onClick={() => alert("Consent preferences & data withdrawal")}
            className="flex flex-col items-center text-gray-400 hover:text-[#0B6E4F]"
          >
            <span>Privacy</span>
          </button>
        </div>
      </div>
    </div>
  );
}

