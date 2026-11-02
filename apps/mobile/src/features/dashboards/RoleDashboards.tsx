import React from 'react';
import { Card, Badge, Button } from '../../design-system';

interface DashboardProps {
  onNavigate: (tab: string, extra?: any) => void;
}

// 1. ASHA Worker Dashboard (Sunita Devi)
export const AshaDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-[#0B6E4F] to-[#047857] text-white shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              SD
            </div>
            <div>
              <div className="text-[11px] opacity-80">Good Morning</div>
              <h2 className="text-base font-bold">Sunita Devi</h2>
            </div>
          </div>
          <Badge variant="success" size="sm" className="bg-white/20 text-white border-white/30">
            ASHA Worker
          </Badge>
        </div>
        <div className="text-xs opacity-90 flex items-center gap-1.5 pt-1 border-t border-white/10">
          <span>📍 Rampur Village | Sitapur Block</span>
          <span className="ml-auto font-mono text-[11px]">24°C Sunny</span>
        </div>
      </div>

      {/* Hero Priority Banner */}
      <div
        onClick={() => onNavigate('tasks')}
        className="p-3.5 bg-[#E6F4EF] border border-[#0B6E4F]/20 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-[#d8f0e8] transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0B6E4F] text-white flex items-center justify-center font-bold">
            ⚡
          </div>
          <div>
            <div className="text-xs font-bold text-[#064E3B]">Today's Priority</div>
            <div className="text-[11px] text-[#0B6E4F]">3 critical field tasks pending</div>
          </div>
        </div>
        <span className="text-xs font-bold text-[#0B6E4F]">View →</span>
      </div>

      {/* 4 Metric KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card
          variant="elevated"
          padding="sm"
          onClick={() => onNavigate('patients')}
          className="cursor-pointer hover:border-[#0B6E4F]/30"
        >
          <div className="text-xs text-gray-500 font-medium">Registered Patients</div>
          <div className="text-xl font-bold text-gray-900 mt-1">12</div>
          <div className="text-[10px] text-[#0B6E4F] mt-0.5">Village population coverage</div>
        </Card>

        <Card
          variant="elevated"
          padding="sm"
          onClick={() => onNavigate('tasks')}
          className="cursor-pointer hover:border-[#0B6E4F]/30"
        >
          <div className="text-xs text-gray-500 font-medium">Follow-up Visits</div>
          <div className="text-xl font-bold text-amber-600 mt-1">5</div>
          <div className="text-[10px] text-amber-700 mt-0.5">2 overdue this morning</div>
        </Card>

        <Card
          variant="elevated"
          padding="sm"
          onClick={() => onNavigate('referrals')}
          className="cursor-pointer hover:border-[#0B6E4F]/30"
        >
          <div className="text-xs text-gray-500 font-medium">Urgent Referrals</div>
          <div className="text-xl font-bold text-red-600 mt-1">2</div>
          <div className="text-[10px] text-red-700 mt-0.5">En-route to PHC</div>
        </Card>

        <Card
          variant="elevated"
          padding="sm"
          onClick={() => onNavigate('appointments')}
          className="cursor-pointer hover:border-[#0B6E4F]/30"
        >
          <div className="text-xs text-gray-500 font-medium">Appointments</div>
          <div className="text-xl font-bold text-blue-600 mt-1">1</div>
          <div className="text-[10px] text-blue-700 mt-0.5">Dr. Arjun Mehta (OPD)</div>
        </Card>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="primary"
          size="md"
          onClick={() => onNavigate('voice')}
          leftIcon={<span className="text-lg">🎙️</span>}
        >
          Voice Triage
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => onNavigate('patients', { action: 'new' })}
          leftIcon={<span className="text-lg">+</span>}
        >
          New Patient
        </Button>
      </div>

      {/* Today's Tasks List */}
      <Card variant="elevated" padding="md" className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Today's Field Tasks</h3>
          <button onClick={() => onNavigate('tasks')} className="text-xs font-semibold text-[#0B6E4F]">
            View All →
          </button>
        </div>

        <div className="space-y-2">
          <div className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-gray-900">Visit pregnant woman: Rekha Devi</div>
              <div className="text-[11px] text-gray-500 mt-0.5">ANC 32-week checkup • Due 09:30 AM</div>
            </div>
            <Badge variant="warning" size="sm">Due</Badge>
          </div>

          <div className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-gray-900">Follow-up: Ramesh Kumar</div>
              <div className="text-[11px] text-gray-500 mt-0.5">High BP medicine review • Due 11:00 AM</div>
            </div>
            <Badge variant="danger" size="sm">Overdue</Badge>
          </div>

          <div className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-start justify-between">
            <div>
              <div className="text-xs font-bold text-gray-900">Update village health data</div>
              <div className="text-[11px] text-gray-500 mt-0.5">Rampur East Hamlet • Due 04:00 PM</div>
            </div>
            <Badge variant="neutral" size="sm">Pending</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

// 2. ANM / Nurse Dashboard (Priya Sharma)
export const AnmDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-[#047857] to-[#065F46] text-white shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              PS
            </div>
            <div>
              <div className="text-[11px] opacity-80">Good Morning</div>
              <h2 className="text-base font-bold">Priya Sharma</h2>
            </div>
          </div>
          <Badge variant="success" size="sm" className="bg-white/20 text-white border-white/30">
            ANM / Nurse
          </Badge>
        </div>
        <div className="text-xs opacity-90 pt-1 border-t border-white/10">
          📍 PHC Centre | Sitapur Block • Sub-Centre Rampur
        </div>
      </div>

      {/* Priority Banner */}
      <div
        onClick={() => onNavigate('tasks')}
        className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
            🩺
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-950">Screening Today</div>
            <div className="text-[11px] text-emerald-800">5 patients lined up for clinical check</div>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-700">Open Queue →</span>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">Pregnant Women</div>
          <div className="text-xl font-bold text-purple-700 mt-1">8</div>
          <div className="text-[10px] text-gray-400 mt-0.5">High-risk tracking active</div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">Child-Health</div>
          <div className="text-xl font-bold text-blue-700 mt-1">6</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Immunization schedule</div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">Vitals Check</div>
          <div className="text-xl font-bold text-emerald-700 mt-1">4</div>
          <div className="text-[10px] text-gray-400 mt-0.5">NCD screening queue</div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">Referrals</div>
          <div className="text-xl font-bold text-amber-700 mt-1">3</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Sent to PHC Doctor</div>
        </Card>
      </div>

      {/* Today's Screening List */}
      <Card variant="elevated" padding="md" className="space-y-3">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Today's Screening List</h3>
        <div className="space-y-2">
          <div className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-gray-900">Rekha Devi</span>
              <div className="text-[11px] text-gray-500">ANC Checkup • 09:30 AM</div>
            </div>
            <Button size="sm">Screen</Button>
          </div>
          <div className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-gray-900">Aman Kumar</span>
              <div className="text-[11px] text-gray-500">Growth Monitoring • 11:00 AM</div>
            </div>
            <Button size="sm">Screen</Button>
          </div>
          <div className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-gray-900">Savitri Singh</span>
              <div className="text-[11px] text-gray-500">BP & Sugar • 02:00 PM</div>
            </div>
            <Button size="sm">Screen</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// 3. Doctor Dashboard (Dr. Arjun Mehta)
export const DoctorDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-4">
      {/* Banner */}
      <div className="rounded-2xl p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm">
              AM
            </div>
            <div>
              <div className="text-[11px] opacity-80">Good Morning</div>
              <h2 className="text-base font-bold">Dr. Arjun Mehta</h2>
            </div>
          </div>
          <Badge variant="info" size="sm" className="bg-white/20 text-white border-white/30">
            Medical Officer
          </Badge>
        </div>
        <div className="text-xs opacity-90 pt-1 border-t border-white/10">
          📍 PHC Sitapur • Department: General Medicine
        </div>
      </div>

      {/* Priority Banner */}
      <div
        onClick={() => onNavigate('appointments')}
        className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-700 text-white flex items-center justify-center font-bold">
            📋
          </div>
          <div>
            <div className="text-xs font-bold text-blue-950">Today's Appointments</div>
            <div className="text-[11px] text-blue-800">8 patients scheduled in OPD queue</div>
          </div>
        </div>
        <span className="text-xs font-bold text-blue-700">Open Queue →</span>
      </div>

      {/* 4 Doctor Metrics */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card
          variant="elevated"
          padding="sm"
          onClick={() => onNavigate('referrals')}
          className="cursor-pointer"
        >
          <div className="text-xs text-gray-500 font-medium">Urgent Referrals</div>
          <div className="text-xl font-bold text-red-600 mt-1">2</div>
          <div className="text-[10px] text-red-700 mt-0.5">Require clinical disposition</div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">My Patients</div>
          <div className="text-xl font-bold text-gray-900 mt-1">12</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Assigned to my facility</div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">Pending Reviews</div>
          <div className="text-xl font-bold text-amber-600 mt-1">5</div>
          <div className="text-[10px] text-amber-700 mt-0.5">Triage notes waiting</div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">Completed Today</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">3</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Discharged with Rx</div>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card variant="elevated" padding="md" className="space-y-3">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Upcoming Consultations</h3>
        <div className="space-y-2">
          <div className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-gray-900">Rohit Kumar</span>
              <div className="text-[11px] text-gray-500">09:30 AM • Follow-up</div>
            </div>
            <Button size="sm">Consult</Button>
          </div>
          <div className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-gray-900">Sita Devi</span>
              <div className="text-[11px] text-gray-500">10:15 AM • Consultation</div>
            </div>
            <Button size="sm">Consult</Button>
          </div>
          <div className="p-2.5 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-gray-900">Mohan Lal</span>
              <div className="text-[11px] text-gray-500">11:00 AM • New Patient</div>
            </div>
            <Button size="sm">Consult</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

// 4. PHC Staff Dashboard (Rahul Singh)
export const PhcStaffDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 bg-gradient-to-r from-teal-800 to-teal-950 text-white shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] opacity-80">Facility Desk</div>
            <h2 className="text-base font-bold">Rahul Singh</h2>
          </div>
          <Badge variant="neutral" size="sm" className="bg-white/20 text-white border-white/30">
            PHC Staff
          </Badge>
        </div>
        <div className="text-xs opacity-90 pt-1 border-t border-white/10">
          📍 Sitapur PHC • Facility Staff
        </div>
      </div>

      <div
        onClick={() => onNavigate('referrals')}
        className="p-3.5 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold">
            🚪
          </div>
          <div>
            <div className="text-xs font-bold text-teal-950">Today's Arrivals</div>
            <div className="text-[11px] text-teal-800">6 patients expected at reception</div>
          </div>
        </div>
        <span className="text-xs font-bold text-teal-700">Check-In →</span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">Pending Referrals</div>
          <div className="text-xl font-bold text-amber-600 mt-1">4</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Need acknowledgement</div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">Appointments</div>
          <div className="text-xl font-bold text-teal-700 mt-1">3</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Today's confirmed slots</div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">No-Shows</div>
          <div className="text-xl font-bold text-red-600 mt-1">1</div>
          <div className="text-[10px] text-red-700 mt-0.5">Task reassigned to ASHA</div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">Facility Tasks</div>
          <div className="text-xl font-bold text-gray-900 mt-1">5</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Drug stock check</div>
        </Card>
      </div>
    </div>
  );
};

// 5. Public Health Officer Dashboard (Dr. Neha Verma)
export const PhoDashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-4 bg-gradient-to-r from-purple-900 to-slate-900 text-white shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] opacity-80">Surveillance & Epidemiology</div>
            <h2 className="text-base font-bold">Dr. Neha Verma</h2>
          </div>
          <Badge variant="neutral" size="sm" className="bg-white/20 text-white border-white/30">
            Public Health Officer
          </Badge>
        </div>
        <div className="text-xs opacity-90 pt-1 border-t border-white/10">
          📍 District Health Office • Sitapur District
        </div>
      </div>

      <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
            📡
          </div>
          <div>
            <div className="text-xs font-bold text-purple-950">Health Radar Surveillance</div>
            <div className="text-[11px] text-purple-800">2 candidate outbreak clusters require review</div>
          </div>
        </div>
        <Badge variant="danger" size="sm">Review</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">Total Villages</div>
          <div className="text-xl font-bold text-gray-900 mt-1">48</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Across 4 blocks</div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">Health Alerts</div>
          <div className="text-xl font-bold text-red-600 mt-1">2</div>
          <div className="text-[10px] text-red-700 mt-0.5">Syndromic thresholds hit</div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">Data Quality</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">Good</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">96.4% sync completeness</div>
        </Card>
        <Card variant="elevated" padding="sm">
          <div className="text-xs text-gray-500 font-medium">Block Reports</div>
          <div className="text-xl font-bold text-blue-600 mt-1">6</div>
          <div className="text-[10px] text-gray-400 mt-0.5">Monthly indicators ready</div>
        </Card>
      </div>

      {/* Recent Surveillance Alerts */}
      <Card variant="elevated" padding="md" className="space-y-3">
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Candidate Health Alerts</h3>
        <div className="space-y-2">
          <div className="p-2.5 rounded-xl border border-red-200 bg-red-50/40 flex items-start justify-between text-xs">
            <div>
              <span className="font-bold text-gray-900">Fever Cases Cluster</span>
              <div className="text-[11px] text-gray-600">Sitapur Block • 12 cases • Under Review</div>
            </div>
            <Badge variant="danger" size="sm">Investigating</Badge>
          </div>
          <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/40 flex items-start justify-between text-xs">
            <div>
              <span className="font-bold text-gray-900">Diarrhoea Cluster (Candidate)</span>
              <div className="text-[11px] text-gray-600">Rampur Village • 11 Oct • New Signal</div>
            </div>
            <Badge variant="warning" size="sm">New</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

