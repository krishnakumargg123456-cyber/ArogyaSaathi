"""
ArogyaSaathi Synthetic Data Seeder
Populates realistic, clinician-reviewed synthetic test records matching PRD and UI mockups.
"""
from datetime import datetime, timezone, timedelta, date
from app.db.session import SessionLocal
from app.models.entities import (
    Facility, Village, Department, User, UserScope, Device,
    DoctorProfile, DoctorSlot, Patient, Consent, Encounter,
    Observation, Referral, ReferralEvent, Appointment, AppointmentEvent,
    FollowUpTask, Notification, CandidateAlert, AuditEvent
)
from app.core.security import get_password_hash
from app.services.audit_service import log_audit_event

def seed_database():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(User).filter(User.mobile == "9876543210").first():
            print("Database already seeded with base accounts.")
            return

        print("Seeding database with realistic synthetic rural healthcare data...")

        # 1. Facilities
        phc_sitapur = Facility(
            name="PHC Sitapur",
            type="PHC",
            district="Sitapur",
            block="Sitapur",
            address="Near Post Office, Main Road, Sitapur",
            phone="05862-245100",
            is_active=True
        )
        chc_naugawan = Facility(
            name="CHC Naugawan",
            type="CHC",
            district="Sitapur",
            block="Naugawan",
            address="Highway Junction, Naugawan",
            phone="05862-245200",
            is_active=True
        )
        dh_sitapur = Facility(
            name="District Hospital Sitapur",
            type="DH",
            district="Sitapur",
            block="Sitapur",
            address="Civil Lines, Sitapur",
            phone="05862-245300",
            is_active=True
        )
        db.add_all([phc_sitapur, chc_naugawan, dh_sitapur])
        db.flush()

        # 2. Villages
        v_rampur = Village(name="Rampur", block="Sitapur", district="Sitapur", population=1850, assigned_facility_id=phc_sitapur.id)
        v_sitapur = Village(name="Sitapur Village", block="Sitapur", district="Sitapur", population=2200, assigned_facility_id=phc_sitapur.id)
        v_naugawan = Village(name="Naugawan", block="Naugawan", district="Sitapur", population=3100, assigned_facility_id=chc_naugawan.id)
        v_barikha = Village(name="Barikha", block="Sitapur", district="Sitapur", population=1200, assigned_facility_id=phc_sitapur.id)
        db.add_all([v_rampur, v_sitapur, v_naugawan, v_barikha])
        db.flush()

        # 3. Departments
        dept_gm = Department(name="General Medicine", code="GM", description="Primary adult outpatient & acute care")
        dept_mch = Department(name="Maternal & Child Health", code="MCH", description="Antenatal, postnatal & immunization")
        dept_ped = Department(name="Paediatrics", code="PED", description="Child health & growth monitoring")
        dept_ncd = Department(name="Non-Communicable Diseases", code="NCD", description="Hypertension, diabetes & chronic care")
        db.add_all([dept_gm, dept_mch, dept_ped, dept_ncd])
        db.flush()

        # 4. Users (All with PIN '1234')
        hashed_pin_1234 = get_password_hash("1234")

        # 4.1 ASHA: Sunita Devi
        asha_user = User(
            employee_id="ASHA-101",
            mobile="9876543210",
            full_name="Sunita Devi",
            role="ASHA",
            hashed_password=get_password_hash("Asha@123"),
            hashed_pin=hashed_pin_1234,
            is_active=True,
            first_login_done=True
        )
        db.add(asha_user)
        db.flush()
        db.add(UserScope(user_id=asha_user.id, district="Sitapur", block="Sitapur", village="Rampur", facility_id=phc_sitapur.id))
        db.add(Device(device_id="dev_asha_01", user_id=asha_user.id, device_model="Samsung Galaxy M04 (Android 12)"))

        # 4.2 ANM: Priya Sharma
        anm_user = User(
            employee_id="ANM-102",
            mobile="9876543211",
            full_name="Priya Sharma",
            role="ANM",
            hashed_password=get_password_hash("Anm@123"),
            hashed_pin=hashed_pin_1234,
            is_active=True,
            first_login_done=True
        )
        db.add(anm_user)
        db.flush()
        db.add(UserScope(user_id=anm_user.id, district="Sitapur", block="Sitapur", village="Rampur", facility_id=phc_sitapur.id))
        db.add(Device(device_id="dev_anm_01", user_id=anm_user.id, device_model="Redmi 10A (Android 11)"))

        # 4.3 Doctor: Dr. Arjun Mehta
        doc_user = User(
            employee_id="DOC-101",
            mobile="9876543212",
            full_name="Dr. Arjun Mehta",
            role="DOCTOR",
            hashed_password=get_password_hash("Doc@123"),
            hashed_pin=hashed_pin_1234,
            is_active=True,
            first_login_done=True
        )
        db.add(doc_user)
        db.flush()
        db.add(UserScope(user_id=doc_user.id, district="Sitapur", block="Sitapur", facility_id=phc_sitapur.id))
        db.add(Device(device_id="dev_doc_01", user_id=doc_user.id, device_model="Pixel 7a"))

        doc_profile = DoctorProfile(
            user_id=doc_user.id,
            facility_id=phc_sitapur.id,
            department_id=dept_gm.id,
            specialization="General Physician",
            qualification="MBBS, MD (Family Medicine)",
            experience_years=8,
            opd_days="Mon,Tue,Wed,Thu,Fri,Sat",
            opd_timings="09:00 AM - 02:00 PM",
            is_active=True
        )
        db.add(doc_profile)
        db.flush()

        # 4.4 PHC Staff: Rahul Singh
        staff_user = User(
            employee_id="PHC-201",
            mobile="9876543213",
            full_name="Rahul Singh",
            role="PHC_STAFF",
            hashed_password=get_password_hash("Phc@123"),
            hashed_pin=hashed_pin_1234,
            is_active=True,
            first_login_done=True
        )
        db.add(staff_user)
        db.flush()
        db.add(UserScope(user_id=staff_user.id, district="Sitapur", block="Sitapur", facility_id=phc_sitapur.id))

        # 4.5 Public Health Officer: Dr. Neha Verma
        pho_user = User(
            employee_id="PHO-301",
            mobile="9876543214",
            full_name="Dr. Neha Verma",
            role="PUBLIC_HEALTH_OFFICER",
            hashed_password=get_password_hash("Pho@123"),
            hashed_pin=hashed_pin_1234,
            is_active=True,
            first_login_done=True
        )
        db.add(pho_user)
        db.flush()
        db.add(UserScope(user_id=pho_user.id, district="Sitapur"))

        # 4.6 System Admin: Vikram Malhotra
        admin_user = User(
            employee_id="ADM-001",
            mobile="9876543215",
            full_name="Vikram Malhotra",
            role="ADMIN",
            hashed_password=get_password_hash("Admin@123"),
            hashed_pin=hashed_pin_1234,
            is_active=True,
            first_login_done=True
        )
        db.add(admin_user)
        db.flush()

        # 5. Doctor Slots for Dr. Arjun Mehta (Today and Next 7 Days)
        today = date.today()
        created_slots = []
        times = [
            ("09:00 AM", "09:15 AM"), ("09:15 AM", "09:30 AM"), ("09:30 AM", "09:45 AM"),
            ("09:45 AM", "10:00 AM"), ("10:00 AM", "10:15 AM"), ("10:15 AM", "10:30 AM"),
            ("10:30 AM", "10:45 AM"), ("11:00 AM", "11:15 AM"), ("11:30 AM", "11:45 AM"),
            ("12:00 PM", "12:15 PM"), ("12:30 PM", "12:45 PM"), ("01:00 PM", "01:15 PM")
        ]
        for day_offset in range(8):
            slot_d = (today + timedelta(days=day_offset)).isoformat()
            for st, et in times:
                s = DoctorSlot(
                    doctor_id=doc_profile.id,
                    slot_date=slot_d,
                    start_time=st,
                    end_time=et,
                    status="AVAILABLE"
                )
                db.add(s)
                created_slots.append(s)
        db.flush()

        # 6. Patients
        p_ramesh = Patient(
            internal_id="AS-0001245",
            name="Ramesh Kumar",
            age=58,
            gender="Male",
            phone="9876500001",
            village_id=v_rampur.id,
            address="House 42, Near Primary School, Rampur",
            emergency_contact="Suresh Kumar (Son) - 9876500099",
            chronic_conditions="Hypertension",
            created_by_id=asha_user.id
        )
        p_sita = Patient(
            internal_id="AS-0001246",
            name="Sita Devi",
            age=45,
            gender="Female",
            phone="9876500002",
            village_id=v_rampur.id,
            address="House 18, Rampur",
            chronic_conditions="Diabetes",
            created_by_id=asha_user.id
        )
        p_rekha = Patient(
            internal_id="AS-0001247",
            name="Rekha Devi",
            age=24,
            gender="Female",
            phone="9876500003",
            village_id=v_rampur.id,
            address="House 9, Rampur",
            chronic_conditions="Antenatal Care (ANC)",
            created_by_id=anm_user.id
        )
        p_aman = Patient(
            internal_id="AS-0001248",
            name="Aman Kumar",
            age=4,
            gender="Male",
            phone="9876500004",
            village_id=v_rampur.id,
            address="House 27, Rampur",
            chronic_conditions="Child Health Monitoring",
            created_by_id=anm_user.id
        )
        p_savitri = Patient(
            internal_id="AS-0001249",
            name="Savitri Singh",
            age=52,
            gender="Female",
            phone="9876500005",
            village_id=v_barikha.id,
            address="House 11, Barikha",
            chronic_conditions="Hypertension,Diabetes",
            created_by_id=anm_user.id
        )
        p_mohan = Patient(
            internal_id="AS-0001250",
            name="Mohan Lal",
            age=62,
            gender="Male",
            phone="9876500006",
            village_id=v_rampur.id,
            address="House 55, Rampur",
            chronic_conditions="General OPD",
            created_by_id=asha_user.id
        )
        db.add_all([p_ramesh, p_sita, p_rekha, p_aman, p_savitri, p_mohan])
        db.flush()

        # 7. Consents
        for p in [p_ramesh, p_sita, p_rekha, p_aman, p_savitri, p_mohan]:
            db.add(Consent(
                patient_id=p.id,
                purpose="GENERAL_HEALTHCARE_COORDINATION",
                scope="FACILITY_AND_WORKER_ACCESS",
                text_version="v2.1",
                language="hi",
                status="ACTIVE",
                capture_method="TICK_ACK",
                captured_by_id=asha_user.id
            ))
        db.flush()

        # 8. Encounters & Vitals
        # Ramesh Kumar BP trend
        enc_ramesh = Encounter(
            client_uuid="enc_ramesh_uuid_001",
            patient_id=p_ramesh.id,
            actor_id=asha_user.id,
            facility_id=phc_sitapur.id,
            source="VOICE",
            status="COMPLETED"
        )
        db.add(enc_ramesh)
        db.flush()
        db.add(Observation(
            encounter_id=enc_ramesh.id,
            patient_id=p_ramesh.id,
            observation_type="BP",
            systolic_bp=182,
            diastolic_bp=116,
            recorded_by_id=asha_user.id,
            recorded_at=datetime.now(timezone.utc)
        ))

        # 9. Urgent Referral for Ramesh Kumar
        ref_ramesh = Referral(
            referral_code="REF-2210",
            patient_id=p_ramesh.id,
            encounter_id=enc_ramesh.id,
            referring_user_id=asha_user.id,
            receiving_facility_id=phc_sitapur.id,
            urgency="URGENT",
            reason="BP 182/116 mmHg with severe headache and dizziness (Triggered: RULE_BP_002_HYPERTENSIVE_CRISIS)",
            status="ACCEPTED"
        )
        db.add(ref_ramesh)
        db.flush()
        db.add(ReferralEvent(
            referral_id=ref_ramesh.id,
            from_status="NONE",
            to_status="PENDING",
            actor_id=asha_user.id,
            notes="Voice triage safety check red-flag triggered"
        ))
        db.add(ReferralEvent(
            referral_id=ref_ramesh.id,
            from_status="PENDING",
            to_status="ACCEPTED",
            actor_id=staff_user.id,
            notes="PHC Sitapur staff acknowledged arrival priority"
        ))

        # 10. Appointments
        today_str = today.isoformat()
        slot_1 = next((s for s in created_slots if s.slot_date == today_str and s.start_time == "09:30 AM"), created_slots[0])
        slot_2 = next((s for s in created_slots if s.slot_date == today_str and s.start_time == "10:15 AM"), created_slots[1])
        slot_3 = next((s for s in created_slots if s.slot_date == today_str and s.start_time == "11:00 AM"), created_slots[2])

        slot_1.status = "BOOKED"
        slot_2.status = "BOOKED"
        slot_3.status = "BOOKED"

        app_1 = Appointment(
            booking_ref="AP-100234",
            client_uuid="uuid_app_1",
            patient_id=p_ramesh.id,
            doctor_id=doc_profile.id,
            facility_id=phc_sitapur.id,
            slot_id=slot_1.id,
            referral_id=ref_ramesh.id,
            reason_code="Urgent Referral Visit",
            status="CONFIRMED",
            booked_by_id=asha_user.id
        )
        app_2 = Appointment(
            booking_ref="AP-100235",
            client_uuid="uuid_app_2",
            patient_id=p_sita.id,
            doctor_id=doc_profile.id,
            facility_id=phc_sitapur.id,
            slot_id=slot_2.id,
            reason_code="Diabetes Review",
            status="CONFIRMED",
            booked_by_id=asha_user.id
        )
        app_3 = Appointment(
            booking_ref="AP-100236",
            client_uuid="uuid_app_3",
            patient_id=p_mohan.id,
            doctor_id=doc_profile.id,
            facility_id=phc_sitapur.id,
            slot_id=slot_3.id,
            reason_code="General OPD",
            status="CONFIRMED",
            booked_by_id=staff_user.id
        )
        db.add_all([app_1, app_2, app_3])
        db.flush()

        # 11. Follow-Up Tasks
        db.add(FollowUpTask(
            patient_id=p_ramesh.id,
            assigned_user_id=asha_user.id,
            task_type="HYPERTENSION",
            due_date=datetime.now(timezone.utc) - timedelta(days=1),
            status="OVERDUE",
            priority="URGENT",
            notes="Follow-up: Ramesh Kumar BP check (OVERDUE)"
        ))
        db.add(FollowUpTask(
            patient_id=p_sita.id,
            assigned_user_id=asha_user.id,
            task_type="DIABETES",
            due_date=datetime.now(timezone.utc),
            status="PENDING",
            priority="ROUTINE",
            notes="Sugar review - due today"
        ))
        db.add(FollowUpTask(
            patient_id=p_rekha.id,
            assigned_user_id=anm_user.id,
            task_type="ANC_VISIT",
            due_date=datetime.now(timezone.utc),
            status="PENDING",
            priority="ROUTINE",
            notes="Visit pregnant woman: Rekha Devi ANC checkup"
        ))

        # 12. Health Radar Candidate Alerts
        db.add(CandidateAlert(
            alert_code="ALT-FEV-101",
            title="Fever cases increase (14 cases detected in last 48h)",
            disease_category="FEVER",
            district="Sitapur",
            block="Sitapur",
            village_id=v_rampur.id,
            severity="HIGH",
            status="UNDER_REVIEW",
            case_count=14,
            data_quality="Good",
            review_notes="Investigating cluster with CHC Medical Officer"
        ))
        db.add(CandidateAlert(
            alert_code="ALT-DIA-102",
            title="Diarrhoea cluster candidate (6 cases near water pump)",
            disease_category="DIARRHOEA",
            district="Sitapur",
            block="Sitapur",
            village_id=v_rampur.id,
            severity="MEDIUM",
            status="NEW",
            case_count=6,
            data_quality="Moderate"
        ))
        db.add(CandidateAlert(
            alert_code="ALT-NUT-103",
            title="Malnutrition risk flagged in Barikha (4 underweight toddlers)",
            disease_category="MALNUTRITION",
            district="Sitapur",
            block="Sitapur",
            village_id=v_barikha.id,
            severity="LOW",
            status="ACKNOWLEDGED",
            case_count=4,
            data_quality="Good"
        ))

        # 13. Notifications
        db.add(Notification(
            user_id=asha_user.id,
            title="Urgent Referral Accepted",
            message="PHC Sitapur has acknowledged your urgent referral for today's clinic.",
            category="REFERRAL",
            priority="URGENT"
        ))
        db.add(Notification(
            user_id=asha_user.id,
            title="Appointment Confirmed",
            message="Appointment AP-100234 is confirmed for 09:30 AM.",
            category="APPOINTMENT",
            priority="ROUTINE"
        ))
        db.add(Notification(
            user_id=doc_user.id,
            title="New Urgent Referral Received",
            message="An urgent referral has arrived in your clinic queue.",
            category="REFERRAL",
            priority="URGENT"
        ))

        db.commit()
        print("Database seeded successfully with all roles, patients, appointments, slots and alerts!")

    except Exception as e:
        db.rollback()
        print(f"Error during database seed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
