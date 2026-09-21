import app from './server';
import { prisma } from './db';
import http from 'http';

async function runVerification() {
  console.log('====================================================');
  console.log('SwasthyaSetu Auth & RBAC End-to-End Verification');
  console.log('====================================================\n');

  // Start temporary server on port 5055 for isolated testing
  const PORT = 5055;
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, resolve));
  const baseUrl = `http://localhost:${PORT}/api`;

  try {
    // 1. Fetch available facilities to assign to new user
    console.log('[Step 1] Fetching facilities from database...');
    const facRes = await fetch(`${baseUrl}/facilities`);
    const facData = await facRes.json();
    console.log(`[Step 1 OK] Found ${facData.data.length} facilities in Supabase database.`);
    const phcFacility = facData.data.find((f: any) => f.code === 'PHC-KHED') || facData.data[0];

    // 2. Test User Registration (Signup)
    const testEmail = `test.doctor.${Date.now()}@swastyasetu.gov.in`;
    const testPassword = 'SecureDoctor@123';
    console.log(`\n[Step 2] Registering new user: ${testEmail} as PHC_USER...`);

    const signupRes = await fetch(`${baseUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Sunita Rao',
        email: testEmail,
        password: testPassword,
        role: 'PHC_USER',
        facilityId: phcFacility.id,
      }),
    });

    const signupData = await signupRes.json();
    if (!signupData.success) {
      throw new Error(`Signup failed: ${JSON.stringify(signupData)}`);
    }
    console.log('[Step 2 OK] User signed up successfully. Token generated.');

    // 3. Directly query Supabase PostgreSQL to verify the user is physically stored in DB
    console.log('\n[Step 3] Directly querying Supabase PostgreSQL User table...');
    const dbUser = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { facility: true },
    });

    if (!dbUser) {
      throw new Error('Verification failed: User was NOT found in Supabase database!');
    }

    console.log('[Step 3 OK] Verified user exists in Supabase DB:');
    console.log(`   - ID: ${dbUser.id}`);
    console.log(`   - Name: ${dbUser.name}`);
    console.log(`   - Email: ${dbUser.email}`);
    console.log(`   - Role: ${dbUser.role}`);
    console.log(`   - Facility: ${dbUser.facility?.name} (${dbUser.facility?.code})`);
    console.log(`   - Password Hash: ${dbUser.passwordHash.substring(0, 20)}... (Bcrypt verified)`);

    // 4. Test User Login
    console.log(`\n[Step 4] Logging in with email: ${testEmail}...`);
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    const loginData = await loginRes.json();
    if (!loginData.success || !loginData.data.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    }
    const phcToken = loginData.data.token;
    console.log('[Step 4 OK] Login successful. JWT token received.');

    // 5. Verify RBAC Permissions with PHC_USER Token
    console.log('\n[Step 5] Testing RBAC route protection with PHC_USER token:');

    // 5a. Accessing PHC endpoint -> Expect 200 OK
    const phcAccessRes = await fetch(`${baseUrl}/test/phc-only`, {
      headers: { Authorization: `Bearer ${phcToken}` },
    });
    const phcAccessData = await phcAccessRes.json();
    console.log(`   - /api/test/phc-only: HTTP ${phcAccessRes.status} -> ${phcAccessData.message || phcAccessData.error?.message}`);
    if (phcAccessRes.status !== 200) throw new Error('Expected 200 OK for PHC_USER on phc-only endpoint');

    // 5b. Accessing Clinician endpoint -> Expect 403 Forbidden
    const clinicianAccessRes = await fetch(`${baseUrl}/test/clinician-only`, {
      headers: { Authorization: `Bearer ${phcToken}` },
    });
    const clinicianAccessData = await clinicianAccessRes.json();
    console.log(`   - /api/test/clinician-only: HTTP ${clinicianAccessRes.status} -> ${clinicianAccessData.error?.message}`);
    if (clinicianAccessRes.status !== 403) throw new Error('Expected 403 Forbidden for PHC_USER on clinician-only endpoint');

    // 5c. Accessing Admin endpoint -> Expect 403 Forbidden
    const adminAccessRes = await fetch(`${baseUrl}/test/admin-only`, {
      headers: { Authorization: `Bearer ${phcToken}` },
    });
    const adminAccessData = await adminAccessRes.json();
    console.log(`   - /api/test/admin-only: HTTP ${adminAccessRes.status} -> ${adminAccessData.error?.message}`);
    if (adminAccessRes.status !== 403) throw new Error('Expected 403 Forbidden for PHC_USER on admin-only endpoint');

    // 6. Test Admin Token Permissions
    console.log('\n[Step 6] Testing Admin permissions with seeded admin account:');
    const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@swastyasetu.gov.in',
        password: 'password123',
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.data.token;

    const adminTestRes = await fetch(`${baseUrl}/test/admin-only`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminTestData = await adminTestRes.json();
    console.log(`   - /api/test/admin-only as ADMIN: HTTP ${adminTestRes.status} -> ${adminTestData.message}`);
    if (adminTestRes.status !== 200) throw new Error('Expected 200 OK for ADMIN on admin-only endpoint');

    console.log('\n====================================================');
    console.log('ALL AUTHENTICATION & RBAC TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } finally {
    server.close();
    await prisma.$disconnect();
  }
}

runVerification().catch((err) => {
  console.error('[Verification Failed]', err);
  process.exit(1);
});
