// Comprehensive End-to-End Simulation Test for Phase 9
const API_BASE = 'http://localhost:5000/api';

async function api(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function check(cond, title, meta = '') {
  if (cond) {
    console.log(`  ✓ ${title}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${title}`, meta);
    failed++;
  }
}

async function runE2ETest() {
  console.log('\n==================================================');
  console.log('PHASE 9 — FULL END-TO-END FLOW TESTING');
  console.log('==================================================\n');

  const ts = Date.now();
  const donorEmail = `e2e_donor_${ts}@example.com`;
  const ngoEmail = `e2e_ngo_${ts}@example.com`;

  console.log('Step 1: Create NGO Account');
  const ngoReg = await api('/auth/signup', 'POST', {
    name: 'Brotherhood Shelter Rep',
    organizationName: 'Brotherhood Food Relief',
    email: ngoEmail,
    password: 'password123',
    role: 'ngo',
    phone: '9988776655',
    address: '4th Block, Koramangala, Bengaluru',
  });
  check(ngoReg.status === 201 && ngoReg.data.token, 'NGO signup successful');
  const ngoToken = ngoReg.data.token;
  const ngoUserId = ngoReg.data.user._id;

  console.log('Step 2: Update NGO Profile');
  const ngoProf = await api('/ngos/profile', 'PUT', {
    organizationName: 'Brotherhood Food Relief',
    description: 'Providing daily meals to street shelters.',
    city: 'Bengaluru',
    address: '4th Block, Koramangala, Bengaluru',
    latitude: 12.9340,
    longitude: 77.6230,
    foodTypes: ['Vegetarian', 'Vegan'],
    pickupAvailable: true,
  }, ngoToken);
  check(ngoProf.status === 200 && ngoProf.data.profile.pickupAvailable === true, 'NGO profile updated');

  console.log('Step 3: Create Donor Account');
  const donorReg = await api('/auth/signup', 'POST', {
    name: 'Rajesh Donor',
    email: donorEmail,
    password: 'password123',
    role: 'donor',
    phone: '9123456789',
  });
  check(donorReg.status === 201 && donorReg.data.token, 'Donor signup successful');
  const donorToken = donorReg.data.token;
  const donorUserId = donorReg.data.user._id;

  console.log('Step 4: Donor Login Verification');
  const donorLogin = await api('/auth/login', 'POST', {
    email: donorEmail,
    password: 'password123',
  });
  check(donorLogin.status === 200 && donorLogin.data.user.role === 'donor', 'Donor login successful');

  console.log('Step 5: Donor Dashboard Check (Initial)');
  const donorDashInitial = await api('/dashboard/donor', 'GET', null, donorToken);
  check(donorDashInitial.status === 200 && donorDashInitial.data.stats.total === 0, 'Donor dashboard initial stats: 0 total');

  console.log('Step 6: Donor Searches Nearby NGOs');
  const nearbyNgos = await api('/ngos/nearby?latitude=12.9350&longitude=77.6240&radius=10', 'GET', null, donorToken);
  const foundNgo = nearbyNgos.data.ngos?.find(n => n.organizationName === 'Brotherhood Food Relief');
  check(nearbyNgos.status === 200 && foundNgo !== undefined, 'Donor finds registered NGO in nearby search');

  console.log('Step 7: Donor Views NGO Profile');
  const viewNgo = await api(`/ngos/${ngoUserId}`, 'GET', null, donorToken);
  check(viewNgo.status === 200 && viewNgo.data.profile.organizationName === 'Brotherhood Food Relief', 'Donor views NGO profile by ID');

  console.log('Step 8: Donor Creates Food Donation');
  const donationRes = await api('/donations', 'POST', {
    ngoId: ngoUserId,
    foodName: 'Paneer Butter Masala & Rotis',
    foodType: 'Vegetarian',
    quantity: '40 Meals',
    pickupDeadline: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
    pickupAddress: 'Prestige Tech Park, Bengaluru',
    notes: 'Hot packed in aluminum containers.',
  }, donorToken);
  check(donationRes.status === 201 && donationRes.data.donation.status === 'PENDING', 'Donation created with PENDING status');
  const donationId = donationRes.data.donation._id;

  console.log('Step 9: NGO Checks Incoming Donation Requests');
  const ngoReceived = await api('/donations/received', 'GET', null, ngoToken);
  const targetReq = ngoReceived.data.donations?.find(d => d._id === donationId);
  check(ngoReceived.status === 200 && targetReq !== undefined, 'NGO sees incoming donation');

  console.log('Step 10: NGO Checks Notifications for DONATION_CREATED');
  const ngoNotifs = await api('/notifications', 'GET', null, ngoToken);
  const notifCreated = ngoNotifs.data.notifications?.find(n => n.donationId === donationId && n.type === 'DONATION_CREATED');
  check(notifCreated !== undefined, 'NGO received DONATION_CREATED notification');

  console.log('Step 11: NGO Accepts Donation');
  const acceptRes = await api(`/donations/${donationId}/status`, 'PATCH', { status: 'ACCEPTED' }, ngoToken);
  check(acceptRes.status === 200 && acceptRes.data.donation.status === 'ACCEPTED', 'Donation status transitioned to ACCEPTED');

  console.log('Step 12: Donor Checks Notification for DONATION_ACCEPTED');
  const donorNotifs = await api('/notifications', 'GET', null, donorToken);
  const notifAccepted = donorNotifs.data.notifications?.find(n => n.donationId === donationId && n.type === 'DONATION_ACCEPTED');
  check(notifAccepted !== undefined, 'Donor received DONATION_ACCEPTED notification');

  console.log('Step 13: NGO Coordinates Pickup');
  const coordRes = await api(`/donations/${donationId}/status`, 'PATCH', { status: 'COORDINATED' }, ngoToken);
  check(coordRes.status === 200 && coordRes.data.donation.status === 'COORDINATED', 'Donation status transitioned to COORDINATED');

  console.log('Step 14: NGO Completes Donation');
  const completeRes = await api(`/donations/${donationId}/status`, 'PATCH', { status: 'COMPLETED' }, ngoToken);
  check(completeRes.status === 200 && completeRes.data.donation.status === 'COMPLETED', 'Donation status transitioned to COMPLETED');

  console.log('Step 15: Verify Final Donation Status and Ownership');
  const finalDonation = await api(`/donations/${donationId}`, 'GET', null, donorToken);
  check(finalDonation.status === 200 && finalDonation.data.donation.status === 'COMPLETED', 'Final donation status is COMPLETED');

  console.log('Step 16: Verify Donor Dashboard Updated Stats');
  const donorDashFinal = await api('/dashboard/donor', 'GET', null, donorToken);
  check(
    donorDashFinal.status === 200 &&
    donorDashFinal.data.stats.total >= 1 &&
    donorDashFinal.data.stats.completed >= 1,
    'Donor dashboard reflects completed donation'
  );

  console.log('Step 17: Verify NGO Dashboard Updated Stats');
  const ngoDashFinal = await api('/dashboard/ngo', 'GET', null, ngoToken);
  check(
    ngoDashFinal.status === 200 &&
    ngoDashFinal.data.stats.total >= 1 &&
    ngoDashFinal.data.stats.completed >= 1,
    'NGO dashboard reflects completed donation'
  );

  console.log('Step 18: Security & Negative Checks');

  // 18a. Invalid login
  const badLogin = await api('/auth/login', 'POST', { email: donorEmail, password: 'wrong' });
  check(badLogin.status === 401, 'Negative Test: Invalid password rejected (401)');

  // 18b. Duplicate signup
  const dupSignup = await api('/auth/signup', 'POST', { name: 'Dup', email: donorEmail, password: 'password123', role: 'donor' });
  check(dupSignup.status === 400, 'Negative Test: Duplicate email rejected (400)');

  // 18c. Missing required fields on signup
  const missingFields = await api('/auth/signup', 'POST', { email: 'bad@bad.com' });
  check(missingFields.status === 400, 'Negative Test: Missing fields rejected (400)');

  // 18d. Invalid JWT token
  const badToken = await api('/auth/me', 'GET', null, 'malformed.jwt.token');
  check(badToken.status === 401, 'Negative Test: Malformed JWT rejected (401)');

  // 18e. Role authorization: Donor calling NGO-only endpoint
  const donorTryNgo = await api('/dashboard/ngo', 'GET', null, donorToken);
  check(donorTryNgo.status === 403, 'Negative Test: Donor denied access to NGO endpoint (403)');

  // 18f. Role authorization: NGO calling Donor-only endpoint
  const ngoTryDonor = await api('/dashboard/donor', 'GET', null, ngoToken);
  check(ngoTryDonor.status === 403, 'Negative Test: NGO denied access to Donor endpoint (403)');

  // 18g. Invalid donation status transition: COMPLETED -> ACCEPTED
  const invalidTransition = await api(`/donations/${donationId}/status`, 'PATCH', { status: 'ACCEPTED' }, ngoToken);
  check(invalidTransition.status === 400, 'Negative Test: Invalid status transition COMPLETED -> ACCEPTED rejected (400)');

  // 18h. Nonexistent NGO
  const nonExistentNgo = await api('/ngos/000000000000000000000000', 'GET', null, donorToken);
  check(nonExistentNgo.status === 404, 'Negative Test: Nonexistent NGO handled with 404');

  // 18i. Nonexistent Donation
  const nonExistentDonation = await api('/donations/000000000000000000000000', 'GET', null, donorToken);
  check(nonExistentDonation.status === 404, 'Negative Test: Nonexistent Donation handled with 404');

  // 18j. Unauthorized Donation Access: Another user tries to view this donation
  const otherUserSignup = await api('/auth/signup', 'POST', {
    name: 'Intruder',
    email: `intruder_${ts}@example.com`,
    password: 'password123',
    role: 'donor',
  });
  const intruderToken = otherUserSignup.data.token;
  const intruderView = await api(`/donations/${donationId}`, 'GET', null, intruderToken);
  check(intruderView.status === 403, 'Negative Test: Unrelated user denied access to private donation (403)');

  console.log('\n==================================================');
  console.log(`END-TO-END RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================\n');

  if (failed > 0) process.exit(1);
}

runE2ETest().catch(e => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
