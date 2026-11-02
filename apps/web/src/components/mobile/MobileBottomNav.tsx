import React from "react";
import { Home, Users, ArrowUpRight, MoreHorizontal, Mic } from "lucide-react";

export type MobileTab = "home" | "patients" | "voice" | "referrals" | "more";

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  role: string;
}

export function MobileBottomNav({ activeTab, onTabChange, role }: MobileBottomNavProps) {
  return (
    <div className="relative bg-[#064E3B] text-white select-none border-t border-[#0F5B47] shadow-2xl">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Tab 1: Home */}
        <button
          onClick={() => onTabChange("home")}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
            activeTab === "home" ? "text-white font-semibold" : "text-emerald-200/70 hover:text-white"
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === "home" ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          <span className="text-[11px] mt-1">Home</span>
          {activeTab === "home" && <div className="w-4 h-0.5 bg-white rounded-full mt-0.5" />}
        </button>

        {/* Tab 2: Patients */}
        <button
          onClick={() => onTabChange("patients")}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
            activeTab === "patients" ? "text-white font-semibold" : "text-emerald-200/70 hover:text-white"
          }`}
        >
          <Users className={`w-5 h-5 ${activeTab === "patients" ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          <span className="text-[11px] mt-1">Patients</span>
          {activeTab === "patients" && <div className="w-4 h-0.5 bg-white rounded-full mt-0.5" />}
        </button>

        {/* Tab 3: Voice (Center Elevated Action with Glowing Ring) */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={() => onTabChange("voice")}
            aria-label="Voice Triage"
            className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-[#0F5B47] to-[#1F7E63] text-white shadow-lg border-2 border-emerald-300/40 hover:scale-105 active:scale-95 transition-all"
          >
            {/* Outer Pulse Ring */}
            <span className="absolute inset-0 rounded-full bg-emerald-400 opacity-25 group-hover:animate-ping" />
            <Mic className="w-7 h-7 text-white stroke-[2.2]" />
          </button>
        </div>

        {/* Tab 4: Referrals */}
        <button
          onClick={() => onTabChange("referrals")}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
            activeTab === "referrals" ? "text-white font-semibold" : "text-emerald-200/70 hover:text-white"
          }`}
        >
          <ArrowUpRight className={`w-5 h-5 ${activeTab === "referrals" ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          <span className="text-[11px] mt-1">Referrals</span>
          {activeTab === "referrals" && <div className="w-4 h-0.5 bg-white rounded-full mt-0.5" />}
        </button>

        {/* Tab 5: More */}
        <button
          onClick={() => onTabChange("more")}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-colors ${
            activeTab === "more" ? "text-white font-semibold" : "text-emerald-200/70 hover:text-white"
          }`}
        >
          <MoreHorizontal className={`w-5 h-5 ${activeTab === "more" ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
          <span className="text-[11px] mt-1">More</span>
          {activeTab === "more" && <div className="w-4 h-0.5 bg-white rounded-full mt-0.5" />}
        </button>
      </div>
    </div>
  );
}

