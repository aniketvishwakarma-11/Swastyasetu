import path from 'path';
import dotenv from 'dotenv';

// Load .env before Prisma initializes
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { PrismaClient, UserRole, FacilityType, ReferralUrgency, ReferralStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seed() {
  console.log('[Seed] Starting database seeding for SwasthyaSetu...');

  // 1. Seed Facilities
  const phcKhed = await prisma.facility.upsert({
    where: { code: 'PHC-KHED' },
    update: {},
    create: {
      code: 'PHC-KHED',
      name: 'Primary Health Centre Khed',
      type: FacilityType.PHC,
      district: 'Pune',
      state: 'Maharashtra',
      phone: '+91 2135 222011',
    },
  });

  const distHosp = await prisma.facility.upsert({
    where: { code: 'DIST-HOSP' },
    update: {},
    create: {
      code: 'DIST-HOSP',
      name: 'Aundh District Hospital',
      type: FacilityType.DISTRICT_HOSPITAL,
      district: 'Pune',
      state: 'Maharashtra',
      phone: '+91 20 2728 0432',
    },
  });

  const nextClinic = await prisma.facility.upsert({
    where: { code: 'NEXT-CLINIC' },
    update: {},
    create: {
      code: 'NEXT-CLINIC',
      name: 'Sanjivani Community Clinic',
      type: FacilityType.PRIVATE_CLINIC,
      district: 'Pune',
      state: 'Maharashtra',
      phone: '+91 20 2553 1190',
    },
  });

  console.log('[Seed] Facilities seeded:', phcKhed.code, distHosp.code, nextClinic.code);

  // 2. Seed Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const phcUser = await prisma.user.upsert({
    where: { email: 'phc_doctor@swastyasetu.gov.in' },
    update: {},
    create: {
      name: 'Dr. Rajesh Sharma',
      email: 'phc_doctor@swastyasetu.gov.in',
      passwordHash,
      role: UserRole.PHC_USER,
      facilityId: phcKhed.id,
    },
  });

  const hospitalClinician = await prisma.user.upsert({
    where: { email: 'hospital_doctor@swastyasetu.gov.in' },
    update: {},
    create: {
      name: 'Dr. Priya Deshmukh',
      email: 'hospital_doctor@swastyasetu.gov.in',
      passwordHash,
      role: UserRole.CLINICIAN,
      facilityId: distHosp.id,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@swastyasetu.gov.in' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@swastyasetu.gov.in',
      passwordHash,
      role: UserRole.ADMIN,
    },
  });

  const coordinator = await prisma.user.upsert({
    where: { email: 'coordinator@swastyasetu.gov.in' },
    update: {
      role: UserRole.REFERRAL_COORDINATOR,
      facilityId: distHosp.id,
    },
    create: {
      name: 'Vikram Solanki',
      email: 'coordinator@swastyasetu.gov.in',
      passwordHash,
      role: UserRole.REFERRAL_COORDINATOR,
      facilityId: distHosp.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'triage_coordinator@swastyasetu.gov.in' },
    update: {
      role: UserRole.REFERRAL_COORDINATOR,
      facilityId: distHosp.id,
    },
    create: {
      name: 'Vikram Solanki',
      email: 'triage_coordinator@swastyasetu.gov.in',
      passwordHash,
      role: UserRole.REFERRAL_COORDINATOR,
      facilityId: distHosp.id,
    },
  });

  console.log('[Seed] Users seeded:', phcUser.email, hospitalClinician.email, coordinator.email, admin.email);

  // 3. Seed Candidate Patient at District Hospital (For Multi-Field Identity Matching)
  const candidatePatient = await prisma.patient.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Anand Kumar',
      age: 47,
      gender: 'Male',
      phone: '+91 98230 12345',
      village: 'Khed',
      address: 'Near Old Maruti Mandir, Khed, Pune',
    },
  });

  console.log('[Seed] Existing candidate patient seeded:', candidatePatient.name, `(${candidatePatient.village})`);

  // 4. Seed District Hospital & Clinic Capacity
  await prisma.facilityCapacity.upsert({
    where: { facilityId: distHosp.id },
    update: {
      icuTotal: 12,
      icuAvailable: 3,
      ventilatorTotal: 8,
      ventilatorAvailable: 2,
      oxygenTotal: 30,
      oxygenAvailable: 14,
      generalTotal: 100,
      generalAvailable: 26,
      lastUpdatedBy: hospitalClinician.id,
    },
    create: {
      facilityId: distHosp.id,
      icuTotal: 12,
      icuAvailable: 3,
      ventilatorTotal: 8,
      ventilatorAvailable: 2,
      oxygenTotal: 30,
      oxygenAvailable: 14,
      generalTotal: 100,
      generalAvailable: 26,
      lastUpdatedBy: hospitalClinician.id,
    },
  });

  await prisma.facilityCapacity.upsert({
    where: { facilityId: nextClinic.id },
    update: {
      icuTotal: 4,
      icuAvailable: 1,
      ventilatorTotal: 2,
      ventilatorAvailable: 1,
      oxygenTotal: 10,
      oxygenAvailable: 4,
      generalTotal: 30,
      generalAvailable: 8,
      lastUpdatedBy: hospitalClinician.id,
    },
    create: {
      facilityId: nextClinic.id,
      icuTotal: 4,
      icuAvailable: 1,
      ventilatorTotal: 2,
      ventilatorAvailable: 1,
      oxygenTotal: 10,
      oxygenAvailable: 4,
      generalTotal: 30,
      generalAvailable: 8,
      lastUpdatedBy: hospitalClinician.id,
    },
  });

  console.log('[Seed] Facility capacities seeded for:', distHosp.name, nextClinic.name);

  // 5. Seed Specialists for District Hospital & Clinic
  const specialists = [
    {
      facilityId: distHosp.id,
      specialty: 'Cardiology',
      specialistName: 'Dr. Anand Dighe',
      isOnDuty: true,
      contactPhone: '+91 98220 11223',
      shiftStart: '08:00',
      shiftEnd: '20:00',
      notes: 'Available for immediate STEMI triage and emergency angio consultation',
    },
    {
      facilityId: distHosp.id,
      specialty: 'Obstetrics & Gynaecology',
      specialistName: 'Dr. Sunita Kadam',
      isOnDuty: true,
      contactPhone: '+91 98220 33445',
      shiftStart: '09:00',
      shiftEnd: '21:00',
      notes: 'On duty for emergency LSCS and severe pre-eclampsia escalations',
    },
    {
      facilityId: distHosp.id,
      specialty: 'Trauma & General Surgery',
      specialistName: 'Dr. Rajesh Joshi',
      isOnDuty: true,
      contactPhone: '+91 98220 55667',
      shiftStart: '08:00',
      shiftEnd: '20:00',
      notes: 'Major trauma team lead - OT 2 on active standby',
    },
    {
      facilityId: distHosp.id,
      specialty: 'Pediatrics & NICU',
      specialistName: 'Dr. Meera Kulkarni',
      isOnDuty: false,
      contactPhone: '+91 98220 77889',
      shiftStart: '20:00',
      shiftEnd: '08:00',
      notes: 'Night shift roster',
    },
    {
      facilityId: nextClinic.id,
      specialty: 'Emergency Medicine',
      specialistName: 'Dr. Sameer Nair',
      isOnDuty: true,
      contactPhone: '+91 98220 99001',
      shiftStart: '08:00',
      shiftEnd: '18:00',
      notes: 'Day triage clinician',
    },
  ];

  for (const s of specialists) {
    const existing = await prisma.specialistRoster.findFirst({
      where: {
        facilityId: s.facilityId,
        specialty: s.specialty,
        specialistName: s.specialistName,
      },
    });

    if (existing) {
      await prisma.specialistRoster.update({
        where: { id: existing.id },
        data: s,
      });
    } else {
      await prisma.specialistRoster.create({
        data: s,
      });
    }
  }

  console.log('[Seed] Specialist rosters seeded');

  // 6. Seed an initial audit event
  await prisma.auditEvent.upsert({
    where: { eventId: 'EVT-INIT-001' },
    update: {},
    create: {
      eventId: 'EVT-INIT-001',
      actorId: admin.id,
      actorRole: 'ADMIN',
      facilityId: distHosp.id,
      eventType: 'SYSTEM_INITIALIZED',
      entityType: 'SYSTEM',
      entityId: 'SYSTEM-ROOT',
      metadata: { notes: 'SwasthyaSetu initial seed data loaded successfully' },
    },
  });

  console.log('[Seed] Database initialization complete!');
}

if (require.main === module) {
  seed()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error('[Seed Error]', e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
