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

  // 3. Seed Candidate Patient at District Hospital (For Fuzzy Identity Demonstration)
  // When Ramesh Yadav (Age 47, Male, Village Khed) is referred, the system compares against Ramesh Kumar
  const candidatePatient = await prisma.patient.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'Ramesh Kumar',
      age: 47,
      gender: 'Male',
      phone: '+91 98230 12345',
      village: 'Khed',
      address: 'Near Old Maruti Mandir, Khed, Pune',
    },
  });

  console.log('[Seed] Existing candidate patient seeded:', candidatePatient.name, `(${candidatePatient.village})`);

  // 4. Seed an initial audit event
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
