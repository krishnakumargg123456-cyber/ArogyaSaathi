import React, { useEffect, useState } from 'react';
import { LoginScreen, PinLockScreen } from './features/auth';
import {
  AshaDashboard,
  AnmDashboard,
  DoctorDashboard,
  PhcStaffDashboard,
  PhoDashboard
} from './features/dashboards';
import {
  PatientSearchScreen,
  PatientRegistrationWizard,
  PatientProfileScreen
} from './features/patients';
import { VoiceTriageScreen } from './features/triage';
import {
  ReferralManagementScreen,
  CreateReferralModal
} from './features/referrals';
import {
  AppointmentDirectoryScreen,
  SlotBookingModal
} from './features/appointments';
import { ChronicCareScreen } from './features/chronic';
import { TaskInboxScreen } from './features/tasks';
import { SyncCenterScreen } from './features/sync';
import { SettingsScreen } from './features/settings';
import { EncounterHistoryScreen } from './features/encounters';
import { ConsentManagerScreen } from './features/consent';
import { FacilityDirectoryScreen } from './features/directory';
import { NotificationCenterScreen } from './features/notifications';
import {
  clearMobileSession,
  getMobileSession,
  mobileApiFetch,
  saveMobileSession,
  type MobileSession
} from './core/api/client';

export const MobileApp: React.FC = () => {
  const [session, setSession] = useState<MobileSession | null>(() => getMobileSession());
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const savedSession = getMobileSession();
    return savedSession
      ? { id: savedSession.user_id, name: savedSession.full_name, role: savedSession.role }
      : null;
  });
  const [isLocked, setIsLocked] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'patients' | 'voice' | 'referrals' | 'appointments' | 'more'>('home');
  const [subView, setSubView] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Active selections
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<any | null>(null);
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);

  const [patients, setPatients] = useState<any[]>([]);

  const [referrals, setReferrals] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    if (!session) return;
    let active = true;
    setApiError(null);

    void Promise.all([
      mobileApiFetch<any[]>('/patients?limit=100').then((records) => {
        if (active) {
          setPatients(records.map((record) => ({
            ...record,
            full_name: record.name,
            village_name: record.village_name ?? 'Unassigned',
            is_high_risk: false
          })));
        }
      }),
      mobileApiFetch<any[]>('/referrals').then((records) => {
        if (active) {
          setReferrals(records.map((record) => ({
            ...record,
            facility_name: record.receiving_facility_name ?? 'Facility not specified'
          })));
        }
      }),
      mobileApiFetch<any[]>('/doctors').then((records) => {
        if (active) {
          setDoctors(records.map((record) => ({
            ...record,
            name: record.full_name,
            department: record.department_name,
            facility_name: record.facility_name,
            available_today: record.is_active,
            next_available_slot: `${record.opd_days} · ${record.opd_timings}`
          })));
        }
      })
    ]).catch((error) => {
      if (active) setApiError(error instanceof Error ? error.message : 'Could not load live data.');
    });

    return () => {
      active = false;
    };
  }, [session]);

  if (!currentUser) {
    return (
      <LoginScreen
        onSuccess={(userData) => {
          saveMobileSession(userData);
          setSession(userData);
          setCurrentUser({ id: userData.user_id, name: userData.full_name, role: userData.role });
        }}
        onFirstLogin={(userId) => alert('First login password change required')}
      />
    );
  }

  if (isLocked) {
    return (
      <PinLockScreen
        userName={currentUser.name}
        role={currentUser.role}
        onUnlock={() => setIsLocked(false)}
        onSwitchUser={() => {
          clearMobileSession();
          setSession(null);
          setCurrentUser(null);
        }}
      />
    );
  }

  // Navigation router
  const renderContent = () => {
    // Subviews
    if (subView === 'patient_wizard') {
      return (
        <PatientRegistrationWizard
          onCancel={() => setSubView(null)}
          onSuccess={(newP) => {
            setPatients([newP, ...patients]);
            setSelectedPatient(newP);
            setSubView('patient_profile');
          }}
        />
      );
    }

    if (subView === 'patient_profile' && selectedPatient) {
      return (
        <PatientProfileScreen
          patient={selectedPatient}
          onBack={() => {
            setSelectedPatient(null);
            setSubView(null);
          }}
          onStartTriage={(p) => {
            setSelectedPatient(p);
            setActiveTab('voice');
            setSubView(null);
          }}
          onBookAppointment={(p) => {
            setSelectedPatient(p);
            setActiveTab('appointments');
            setSubView(null);
          }}
          onCreateReferral={(p) => {
            setSelectedPatient(p);
            setIsReferralModalOpen(true);
          }}
        />
      );
    }

    if (subView === 'chronic') return <ChronicCareScreen />;
    if (subView === 'tasks') return <TaskInboxScreen />;
    if (subView === 'sync') return <SyncCenterScreen />;
    if (subView === 'settings') {
      return (
        <SettingsScreen user={currentUser} onLogout={() => {
          clearMobileSession();
          setSession(null);
          setCurrentUser(null);
        }} />
      );
    }
    if (subView === 'encounters') return <EncounterHistoryScreen />;
    if (subView === 'consent') return <ConsentManagerScreen />;
    if (subView === 'directory') return <FacilityDirectoryScreen />;
    if (subView === 'notifications') return <NotificationCenterScreen />;

    // Main Tab Views
    switch (activeTab) {
      case 'home':
        switch (currentUser.role) {
          case 'ASHA':
            return <AshaDashboard onNavigate={(t, ex) => {
              if (t === 'tasks') setSubView('tasks');
              else if (t === 'patients') {
                if (ex?.action === 'new') setSubView('patient_wizard');
                else setActiveTab('patients');
              }
              else if (t === 'voice') setActiveTab('voice');
              else if (t === 'referrals') setActiveTab('referrals');
              else if (t === 'appointments') setActiveTab('appointments');
            }} />;
          case 'ANM':
            return <AnmDashboard onNavigate={(t) => setSubView(t)} />;
          case 'DOCTOR':
            return <DoctorDashboard onNavigate={(t) => {
              if (t === 'referrals') setActiveTab('referrals');
              else setActiveTab('appointments');
            }} />;
          case 'PHC_STAFF':
            return <PhcStaffDashboard onNavigate={() => setActiveTab('referrals')} />;
          case 'PUBLIC_HEALTH_OFFICER':
            return <PhoDashboard onNavigate={() => setSubView('tasks')} />;
          default:
            return <AshaDashboard onNavigate={() => {}} />;
        }

      case 'patients':
        return (
          <PatientSearchScreen
            patients={patients}
            onSelectPatient={(p) => {
              setSelectedPatient(p);
              setSubView('patient_profile');
            }}
            onNewRegistration={() => setSubView('patient_wizard')}
          />
        );

      case 'voice':
        return (
          <VoiceTriageScreen
            patient={selectedPatient}
            onReferralCreate={(decision) => {
              setIsReferralModalOpen(true);
            }}
            onBack={() => {
              setActiveTab('home');
              setSelectedPatient(null);
            }}
          />
        );

      case 'referrals':
        return (
          <ReferralManagementScreen
            referrals={referrals}
            userRole={currentUser.role}
            onCreateReferral={() => setIsReferralModalOpen(true)}
            onUpdateStatus={async (id, status) => {
              setApiError(null);
              try {
                await mobileApiFetch(`/referrals/${encodeURIComponent(id)}/transition`, {
                  method: 'PATCH',
                  body: JSON.stringify({ target_status: status })
                });
                setReferrals((records) => records.map((referral) => (
                  referral.id === id ? { ...referral, status } : referral
                )));
              } catch (error) {
                setApiError(error instanceof Error ? error.message : 'Referral status update failed.');
              }
            }}
          />
        );

      case 'more':
        return (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-gray-900">Application Modules & Tools</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setSubView('sync')}
                className="p-3 bg-white rounded-xl border border-gray-200 text-left hover:border-[#0B6E4F] transition shadow-xs"
              >
                <div className="text-lg">🔄</div>
                <div className="font-bold text-gray-800 mt-1">Sync Center</div>
                <div className="text-gray-500 text-[11px]">Outbox & SQLite status</div>
              </button>

              <button
                onClick={() => setSubView('chronic')}
                className="p-3 bg-white rounded-xl border border-gray-200 text-left hover:border-[#0B6E4F] transition shadow-xs"
              >
                <div className="text-lg">🩺</div>
                <div className="font-bold text-gray-800 mt-1">Chronic Care</div>
                <div className="text-gray-500 text-[11px]">NCD & HTN register</div>
              </button>

              <button
                onClick={() => setSubView('tasks')}
                className="p-3 bg-white rounded-xl border border-gray-200 text-left hover:border-[#0B6E4F] transition shadow-xs"
              >
                <div className="text-lg">📝</div>
                <div className="font-bold text-gray-800 mt-1">Task Inbox</div>
                <div className="text-gray-500 text-[11px]">Today's field list</div>
              </button>

              <button
                onClick={() => setSubView('encounters')}
                className="p-3 bg-white rounded-xl border border-gray-200 text-left hover:border-[#0B6E4F] transition shadow-xs"
              >
                <div className="text-lg">📋</div>
                <div className="font-bold text-gray-800 mt-1">Encounters</div>
                <div className="text-gray-500 text-[11px]">Clinical history log</div>
              </button>

              <button
                onClick={() => setSubView('consent')}
                className="p-3 bg-white rounded-xl border border-gray-200 text-left hover:border-[#0B6E4F] transition shadow-xs"
              >
                <div className="text-lg">🔒</div>
                <div className="font-bold text-gray-800 mt-1">Consent Manager</div>
                <div className="text-gray-500 text-[11px]">ABDM patient consents</div>
              </button>

              <button
                onClick={() => setSubView('directory')}
                className="p-3 bg-white rounded-xl border border-gray-200 text-left hover:border-[#0B6E4F] transition shadow-xs"
              >
                <div className="text-lg">🏥</div>
                <div className="font-bold text-gray-800 mt-1">Facility Directory</div>
                <div className="text-gray-500 text-[11px]">PHC, CHC & DH Contacts</div>
              </button>

              <button
                onClick={() => setSubView('settings')}
                className="p-3 bg-white rounded-xl border border-gray-200 text-left hover:border-[#0B6E4F] transition shadow-xs col-span-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚙️</span>
                  <div>
                    <div className="font-bold text-gray-800">Settings & Device Security</div>
                    <div className="text-gray-500 text-[11px]">Language, Biometrics, PIN & Logout</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        );

      case 'appointments':
        return (
          <AppointmentDirectoryScreen
            doctors={doctors}
            onBookSlot={(doc) => setSelectedDoctorForBooking(doc)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center text-gray-900 antialiased font-sans">
      {/* Mobile Shell Frame */}
      <div className="w-full max-w-md bg-white min-h-screen shadow-xl flex flex-col relative pb-20 border-x border-gray-200">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0B6E4F] to-[#047857] flex items-center justify-center text-white font-bold text-xs shadow-xs">
              AS
            </div>
            <div>
              <div className="text-xs font-bold text-gray-900 leading-none">ArogyaSaathi</div>
              <div className="text-[10px] text-gray-500 mt-0.5">Health for Every Home</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Quick Role Switcher (Field Tester) */}
            <select
              value={currentUser.role}
              onChange={(e) => {
                const r = e.target.value;
                if (r === 'ASHA') setCurrentUser({ name: 'Sunita Devi', role: 'ASHA', identifier: 'ASHA-001', facility: 'PHC Sitapur' });
                else if (r === 'ANM') setCurrentUser({ name: 'Priya Sharma', role: 'ANM', identifier: 'ANM-001', facility: 'PHC Sitapur' });
                else if (r === 'DOCTOR') setCurrentUser({ name: 'Dr. Arjun Mehta', role: 'DOCTOR', identifier: 'DOC-001', facility: 'PHC Sitapur' });
                else if (r === 'PHC_STAFF') setCurrentUser({ name: 'Rahul Singh', role: 'PHC_STAFF', identifier: 'STAFF-001', facility: 'PHC Sitapur' });
                else if (r === 'PUBLIC_HEALTH_OFFICER') setCurrentUser({ name: 'Dr. Neha Verma', role: 'PUBLIC_HEALTH_OFFICER', identifier: 'PHO-001', facility: 'District Office' });
                setActiveTab('home');
                setSubView(null);
              }}
              className="text-[11px] font-semibold bg-gray-100 text-gray-700 rounded-lg px-2 py-1 border-0 focus:ring-1 focus:ring-[#0B6E4F]"
            >
              <option value="ASHA">ASHA</option>
              <option value="ANM">ANM</option>
              <option value="DOCTOR">Doctor</option>
              <option value="PHC_STAFF">PHC Staff</option>
              <option value="PUBLIC_HEALTH_OFFICER">PHO</option>
            </select>

            {/* Lock Device Button */}
            <button
              onClick={() => setIsLocked(true)}
              title="Lock Screen"
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 text-xs"
            >
              🔒
            </button>

            {/* Notification Bell */}
            <button
              onClick={() => setSubView('notifications')}
              className="relative p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 text-xs"
            >
              🔔
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>
        </header>

        {/* Main Body */}
        <main className="flex-1 p-4 overflow-y-auto">
          {apiError && (
            <div role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
              {apiError}
            </div>
          )}
          {renderContent()}
        </main>

        {/* Modals */}
        {isReferralModalOpen && (
          <CreateReferralModal
            patient={selectedPatient}
            patients={patients}
            onClose={() => setIsReferralModalOpen(false)}
            onSubmit={(newRef) => {
              setReferrals((records) => [{
                ...newRef,
                facility_name: newRef.receiving_facility_name ?? 'Facility not specified'
              }, ...records]);
              setIsReferralModalOpen(false);
              setActiveTab('referrals');
              setSubView(null);
            }}
          />
        )}

        {selectedDoctorForBooking && (
          <SlotBookingModal
            doctor={selectedDoctorForBooking}
            patient={selectedPatient}
            patients={patients}
            onClose={() => setSelectedDoctorForBooking(null)}
            onSuccess={(booking) => {
              alert(`Appointment ${booking.booking_ref} created with status: ${booking.status}`);
              setSelectedDoctorForBooking(null);
            }}
          />
        )}

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 backdrop-blur border-t border-gray-200 z-40 px-3 py-1 flex items-center justify-around">
          <button
            onClick={() => { setActiveTab('home'); setSubView(null); }}
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
              activeTab === 'home' && !subView ? 'text-[#0B6E4F]' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <span className="text-lg">🏠</span>
            <span>Home</span>
          </button>

          <button
            onClick={() => { setActiveTab('patients'); setSubView(null); }}
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
              activeTab === 'patients' && !subView ? 'text-[#0B6E4F]' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <span className="text-lg">👥</span>
            <span>Patients</span>
          </button>

          {/* Elevated Central Voice Button */}
          <div className="-mt-5">
            <button
              onClick={() => { setActiveTab('voice'); setSubView(null); }}
              className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#0B6E4F] to-[#047857] text-white flex flex-col items-center justify-center shadow-lg shadow-[#0B6E4F]/30 hover:scale-105 active:scale-95 transition"
            >
              <span className="text-xl">🎙️</span>
            </button>
          </div>

          <button
            onClick={() => { setActiveTab('appointments'); setSubView(null); }}
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
              activeTab === 'appointments' && !subView ? 'text-[#0B6E4F]' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <span className="text-lg">🗓️</span>
            <span>OPD</span>
          </button>

          <button
            onClick={() => { setActiveTab('referrals'); setSubView(null); }}
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
              activeTab === 'referrals' && !subView ? 'text-[#0B6E4F]' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <span className="text-lg">↗️</span>
            <span>Referrals</span>
          </button>

          <button
            onClick={() => { setActiveTab('more'); setSubView(null); }}
            className={`flex flex-col items-center py-1 px-2 text-[10px] font-semibold transition ${
              activeTab === 'more' || subView ? 'text-[#0B6E4F]' : 'text-gray-400 hover:text-gray-700'
            }`}
          >
            <span className="text-lg">⋯</span>
            <span>More</span>
          </button>
        </nav>
      </div>
    </div>
  );
};

export default MobileApp;
