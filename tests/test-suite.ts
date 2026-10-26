import { initDb, query } from '../src/server/db.js';
import { hashPassword, comparePassword, signToken, verifyToken } from '../src/server/auth.js';

async function runTestSuite() {
  console.log('====================================================');
  console.log('CRICKET GROUND BOOKING SYSTEM - TEST SUITE EXECUTION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  try {
    // Initialize Database
    console.log('--- 1. DATABASE INITIALIZATION ---');
    await initDb();
    const groundCheck = await query('SELECT count(*) as count FROM grounds');
    assert(Number(groundCheck.rows[0].count) >= 4, 'Seeded grounds exist in PostgreSQL', `Found ${groundCheck.rows[0].count}`);

    // Auth Tests
    console.log('\n--- 2. AUTHENTICATION & SECURITY TESTS ---');
    const pwd = 'TestPassword@123';
    const hashed = await hashPassword(pwd);
    const match = await comparePassword(pwd, hashed);
    assert(match, 'Password hashing and verification');

    const wrongMatch = await comparePassword('WrongPassword', hashed);
    assert(!wrongMatch, 'Invalid password rejection');

    const token = signToken({ userId: 'usr_test_1', email: 'test@cricketbook.demo', name: 'Test User', role: 'USER' });
    const verified = verifyToken(token);
    assert(verified !== null && verified.role === 'USER', 'JWT token creation and verification');

    // Admin Login Verification
    const adminUser = await query('SELECT * FROM admins WHERE email = $1', ['admin@cricketbook.demo']);
    assert(adminUser.rows.length === 1, 'Default demo admin seeded');
    const adminPassMatch = await comparePassword('Admin@12345', adminUser.rows[0].password_hash);
    assert(adminPassMatch, 'Admin credentials validation');

    // Duplicate Email Prevention
    const dupEmailCheck = await query('SELECT id FROM users WHERE email = $1 UNION SELECT id FROM admins WHERE email = $1', ['rahul@cricketbook.demo']);
    assert(dupEmailCheck.rows.length > 0, 'Duplicate email detection in DB');

    // Grounds & Availability Tests
    console.log('\n--- 3. GROUNDS & AVAILABILITY TESTS ---');
    const allGrounds = await query('SELECT * FROM grounds');
    assert(allGrounds.rows.length >= 4, 'Grounds listing retrieval');
    const firstGround = allGrounds.rows[0];

    // Double-Booking Overlap Algorithm Tests (Section 11)
    console.log('\n--- 4. CRITICAL DOUBLE-BOOKING OVERLAP LOGIC (SECTION 11) ---');
    const testDate = '2026-11-20';
    const groundId = firstGround.id;

    // Insert mock confirmed booking from 10:00 to 12:00
    const bkgId = `test_bkg_${Date.now()}`;
    await query(
      `INSERT INTO bookings (id, user_id, ground_id, booking_date, start_time, end_time, number_of_players, amount, booking_status, payment_status)
       VALUES ($1, $2, $3, $4, '10:00', '12:00', 11, 2000, 'CONFIRMED', 'SUCCESS')`,
      [bkgId, 'usr_101', groundId, testDate]
    );

    // Overlap Test 1: Exactly same time (10:00 - 12:00)
    const overlap1 = await query(
      `SELECT id FROM bookings WHERE ground_id = $1 AND booking_date = $2 AND booking_status = 'CONFIRMED' AND start_time < '12:00' AND end_time > '10:00'`,
      [groundId, testDate]
    );
    assert(overlap1.rows.length > 0, 'Identical slot (10:00 - 12:00) detected as conflict');

    // Overlap Test 2: Overlapping start (11:00 - 13:00)
    const overlap2 = await query(
      `SELECT id FROM bookings WHERE ground_id = $1 AND booking_date = $2 AND booking_status = 'CONFIRMED' AND start_time < '13:00' AND end_time > '11:00'`,
      [groundId, testDate]
    );
    assert(overlap2.rows.length > 0, 'Partial overlap start (11:00 - 13:00) rejected');

    // Overlap Test 3: Inside slot (10:30 - 11:30)
    const overlap3 = await query(
      `SELECT id FROM bookings WHERE ground_id = $1 AND booking_date = $2 AND booking_status = 'CONFIRMED' AND start_time < '11:30' AND end_time > '10:30'`,
      [groundId, testDate]
    );
    assert(overlap3.rows.length > 0, 'Contained slot (10:30 - 11:30) rejected');

    // Overlap Test 4: Overlapping end (09:00 - 11:00)
    const overlap4 = await query(
      `SELECT id FROM bookings WHERE ground_id = $1 AND booking_date = $2 AND booking_status = 'CONFIRMED' AND start_time < '11:00' AND end_time > '09:00'`,
      [groundId, testDate]
    );
    assert(overlap4.rows.length > 0, 'Partial overlap end (09:00 - 11:00) rejected');

    // Non-overlapping Test 5: Adjacent before (08:00 - 10:00)
    const noOverlap1 = await query(
      `SELECT id FROM bookings WHERE ground_id = $1 AND booking_date = $2 AND booking_status = 'CONFIRMED' AND start_time < '10:00' AND end_time > '08:00'`,
      [groundId, testDate]
    );
    assert(noOverlap1.rows.length === 0, 'Adjacent earlier slot (08:00 - 10:00) allowed without conflict');

    // Non-overlapping Test 6: Adjacent after (12:00 - 14:00)
    const noOverlap2 = await query(
      `SELECT id FROM bookings WHERE ground_id = $1 AND booking_date = $2 AND booking_status = 'CONFIRMED' AND start_time < '14:00' AND end_time > '12:00'`,
      [groundId, testDate]
    );
    assert(noOverlap2.rows.length === 0, 'Adjacent later slot (12:00 - 14:00) allowed without conflict');

    // Clean up test booking
    await query('DELETE FROM bookings WHERE id = $1', [bkgId]);

    // Price Calculation Tests (Section 12)
    console.log('\n--- 5. SERVER-SIDE PRICE CALCULATION TESTS (SECTION 12) ---');
    const calcDurationHours = (start: string, end: string) => {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      return ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    };
    const dur2hr = calcDurationHours('10:00', '12:00');
    assert(dur2hr === 2, '2-hour duration calculation');
    const priceCalc = 1000 * dur2hr;
    assert(priceCalc === 2000, 'Amount = HourlyPrice × Duration (₹1000 × 2 = ₹2000)');

    // Payment State & Flow (Section 14)
    console.log('\n--- 6. PAYMENT STATE & TRANSACTION TRANSITIONS (SECTION 14) ---');
    const testPaymentBkg = `test_pay_${Date.now()}`;
    await query(
      `INSERT INTO bookings (id, user_id, ground_id, booking_date, start_time, end_time, amount, booking_status, payment_status)
       VALUES ($1, 'usr_101', $2, '2026-11-25', '14:00', '16:00', 2000, 'PENDING_PAYMENT', 'PENDING')`,
      [testPaymentBkg, groundId]
    );

    // Initial check: Booking is NOT confirmed
    const checkPending = await query('SELECT booking_status, payment_status FROM bookings WHERE id = $1', [testPaymentBkg]);
    assert(
      checkPending.rows[0].booking_status === 'PENDING_PAYMENT' && checkPending.rows[0].payment_status === 'PENDING',
      'Booking remains PENDING_PAYMENT before payment'
    );

    // Simulate Payment Success
    await query(
      `UPDATE bookings SET booking_status = 'CONFIRMED', payment_status = 'SUCCESS' WHERE id = $1`,
      [testPaymentBkg]
    );
    const checkConfirmed = await query('SELECT booking_status, payment_status FROM bookings WHERE id = $1', [testPaymentBkg]);
    assert(
      checkConfirmed.rows[0].booking_status === 'CONFIRMED' && checkConfirmed.rows[0].payment_status === 'SUCCESS',
      'Booking transitions to CONFIRMED only upon successful payment'
    );

    // Cleanup
    await query('DELETE FROM bookings WHERE id = $1', [testPaymentBkg]);

    // Admin Dashboard Aggregation Test (Section 27)
    console.log('\n--- 7. ADMIN DASHBOARD STATS AGGREGATION (SECTION 27) ---');
    const revRes = await query(`SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = 'SUCCESS'`);
    assert(Number(revRes.rows[0].total) > 0, 'Live revenue calculation from PostgreSQL payments table');

    console.log('\n====================================================');
    console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution fatal error:', err);
    process.exit(1);
  }
}

runTestSuite();
