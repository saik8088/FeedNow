// Comprehensive Backend Integration Test Suite
const API_BASE = 'http://localhost:5000/api';

async function req(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  const res = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;

function assert(condition, name, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name}`, details);
    failed++;
  }
}

async function runTests() {
  console.log('--- Starting FeedNow Backend Tests ---');

  // 1. Health check
  const health = await req('/health');
  assert(health.status === 200 && health.data.success, 'Health Check');

  // Generate unique emails for test run
  const testId = Date.now();
  const donorEmail = `donor_${testId}@test.com`;
  const ngoEmail = `ngo_${testId}@test.com`;

  // 2. Donor Signup
  const donorSignup = await req('/auth/signup', 'POST', {
    name: 'Alice Donor',
    email: donorEmail,
    password: 'password123',
    role: 'donor',
    phone: '9876543210',
  });
  assert(donorSignup.status === 201 && donorSignup.data.token, 'Donor Signup', donorSignup.data);
  const donorToken = donorSignup.data.token;
  const donorId = donorSignup.data.user?._id;

  // 3. NGO Signup
  const ngoSignup = await req('/auth/signup', 'POST', {
    name: 'Care Food NGO',
    email: ngoEmail,
    password: 'password123',
    role: 'ngo',
    phone: '9876543211',
    organizationName: 'Care Food Relief Society',
  });
  assert(ngoSignup.status === 201 && ngoSignup.data.token, 'NGO Signup', ngoSignup.data);
  const ngoToken = ngoSignup.data.token;
  const ngoUserId = ngoSignup.data.user?._id;

  // 4. Duplicate Email Signup Check
  const dupSignup = await req('/auth/signup', 'POST', {
    name: 'Duplicate',
    email: donorEmail,
    password: 'password123',
    role: 'donor',
  });
  assert(dupSignup.status === 400 && !dupSignup.data.success, 'Prevent Duplicate Email', dupSignup.data);

  // 5. Donor Login
  const donorLogin = await req('/auth/login', 'POST', {
    email: donorEmail,
    password: 'password123',
  });
  assert(donorLogin.status === 200 && donorLogin.data.token, 'Donor Login', donorLogin.data);

  // 6. Wrong Password Login
  const wrongLogin = await req('/auth/login', 'POST', {
    email: donorEmail,
    password: 'wrongpassword',
  });
  assert(wrongLogin.status === 401 && !wrongLogin.data.success, 'Reject Wrong Password', wrongLogin.data);

  // 7. GET /api/auth/me
  const meRes = await req('/auth/me', 'GET', null, donorToken);
  assert(meRes.status === 200 && meRes.data.user.email === donorEmail && !meRes.data.user.password, 'GET /api/auth/me (safe user, no password)', meRes.data);

  // 8. Invalid JWT
  const invalidTokenRes = await req('/auth/me', 'GET', null, 'invalid.token.here');
  assert(invalidTokenRes.status === 401, 'Reject Invalid JWT', invalidTokenRes.data);

  // 9. Missing Token on Protected Route
  const missingTokenRes = await req('/auth/me', 'GET');
  assert(missingTokenRes.status === 401, 'Reject Missing JWT', missingTokenRes.data);

  // 10. Role Protection: Donor cannot update NGO profile
  const donorNgoProfileUpdate = await req('/ngos/profile', 'PUT', { city: 'Bengaluru' }, donorToken);
  assert(donorNgoProfileUpdate.status === 403, 'Role Protection: Donor blocked from NGO profile update', donorNgoProfileUpdate.data);

  // 11. Role Protection: NGO cannot create donation
  const ngoCreateDonation = await req('/donations', 'POST', {
    ngoId: ngoUserId,
    foodName: 'Test Food',
    foodType: 'Vegetarian',
    quantity: '10 meals',
    pickupDeadline: new Date(Date.now() + 86400000).toISOString(),
  }, ngoToken);
  assert(ngoCreateDonation.status === 403, 'Role Protection: NGO blocked from creating donation', ngoCreateDonation.data);

  // 12. NGO update own profile
  const ngoProfileUpdate = await req('/ngos/profile', 'PUT', {
    organizationName: 'Care Food Relief Society Updated',
    city: 'Bengaluru',
    address: '123 Koramangala 4th Block',
    latitude: 12.9352,
    longitude: 77.6245,
    foodTypes: ['Vegetarian', 'Vegan'],
    pickupAvailable: true,
    description: 'Providing food rescue in Koramangala area',
  }, ngoToken);
  assert(ngoProfileUpdate.status === 200 && ngoProfileUpdate.data.profile.city === 'Bengaluru', 'NGO Update Profile', ngoProfileUpdate.data);

  // 13. Donor view all NGOs
  const ngosList = await req('/ngos', 'GET', null, donorToken);
  assert(ngosList.status === 200 && Array.isArray(ngosList.data.ngos), 'List NGOs', ngosList.data);

  // 14. Donor search nearby NGOs
  const nearbyNgos = await req('/ngos/nearby?latitude=12.9350&longitude=77.6240&radius=10', 'GET', null, donorToken);
  assert(nearbyNgos.status === 200 && nearbyNgos.data.ngos.length > 0, 'Nearby NGOs Search with distance calc', nearbyNgos.data);

  // 15. View single NGO by ID
  const ngoById = await req(`/ngos/${ngoUserId}`, 'GET', null, donorToken);
  assert(ngoById.status === 200 && ngoById.data.profile, 'Get NGO By ID', ngoById.data);

  // 16. Donor creates food donation
  const createDonationRes = await req('/donations', 'POST', {
    ngoId: ngoUserId,
    foodName: 'Fresh Rice and Dal Packets',
    foodType: 'Vegetarian',
    quantity: '25 meals',
    pickupDeadline: new Date(Date.now() + 7200000).toISOString(),
    pickupAddress: '45 MG Road, Bengaluru',
    notes: 'Packed in food-grade containers, prepared at 2 PM',
  }, donorToken);
  assert(createDonationRes.status === 201 && createDonationRes.data.donation?._id, 'Donor Create Donation', createDonationRes.data);
  const donationId = createDonationRes.data.donation?._id;

  // 17. NGO gets notification about new donation
  const ngoNotifs = await req('/notifications', 'GET', null, ngoToken);
  assert(ngoNotifs.status === 200 && ngoNotifs.data.notifications.some(n => n.type === 'DONATION_CREATED'), 'NGO received DONATION_CREATED notification', ngoNotifs.data);

  // 18. NGO views received donations
  const receivedRes = await req('/donations/received', 'GET', null, ngoToken);
  assert(receivedRes.status === 200 && receivedRes.data.donations.some(d => d._id === donationId), 'NGO View Received Donations', receivedRes.data);

  // 19. NGO accepts donation
  const acceptRes = await req(`/donations/${donationId}/status`, 'PATCH', { status: 'ACCEPTED' }, ngoToken);
  assert(acceptRes.status === 200 && acceptRes.data.donation.status === 'ACCEPTED', 'NGO Accept Donation', acceptRes.data);

  // 20. Donor gets notification about accepted donation
  const donorNotifs = await req('/notifications', 'GET', null, donorToken);
  const acceptedNotif = donorNotifs.data.notifications?.find(n => n.type === 'DONATION_ACCEPTED');
  assert(acceptedNotif !== undefined, 'Donor received DONATION_ACCEPTED notification', donorNotifs.data);

  // 21. NGO coordinates donation
  const coordRes = await req(`/donations/${donationId}/status`, 'PATCH', { status: 'COORDINATED' }, ngoToken);
  assert(coordRes.status === 200 && coordRes.data.donation.status === 'COORDINATED', 'NGO Coordinate Donation', coordRes.data);

  // 22. NGO completes donation
  const completeRes = await req(`/donations/${donationId}/status`, 'PATCH', { status: 'COMPLETED' }, ngoToken);
  assert(completeRes.status === 200 && completeRes.data.donation.status === 'COMPLETED', 'NGO Complete Donation', completeRes.data);

  // 23. Invalid transition check (COMPLETED -> ACCEPTED)
  const invalidTransRes = await req(`/donations/${donationId}/status`, 'PATCH', { status: 'ACCEPTED' }, ngoToken);
  assert(invalidTransRes.status === 400 && !invalidTransRes.data.success, 'Reject Invalid Status Transition', invalidTransRes.data);

  // 24. Donor views own donations
  const myDonations = await req('/donations/my', 'GET', null, donorToken);
  assert(myDonations.status === 200 && myDonations.data.donations[0].status === 'COMPLETED', 'Donor GET /api/donations/my', myDonations.data);

  // 25. Donor Dashboard stats
  const donorDash = await req('/dashboard/donor', 'GET', null, donorToken);
  assert(donorDash.status === 200 && donorDash.data.stats.total >= 1 && donorDash.data.stats.completed >= 1, 'Donor Dashboard Stats', donorDash.data);

  // 26. NGO Dashboard stats
  const ngoDash = await req('/dashboard/ngo', 'GET', null, ngoToken);
  assert(ngoDash.status === 200 && ngoDash.data.stats.total >= 1 && ngoDash.data.stats.completed >= 1, 'NGO Dashboard Stats', ngoDash.data);

  // 27. Notification mark as read
  if (acceptedNotif) {
    const markReadRes = await req(`/notifications/${acceptedNotif._id}/read`, 'PATCH', {}, donorToken);
    assert(markReadRes.status === 200 && markReadRes.data.notification.read === true, 'Mark Notification as Read', markReadRes.data);
  }

  // 28. Notification mark all read
  const markAllRes = await req('/notifications/read-all', 'PATCH', {}, donorToken);
  assert(markAllRes.status === 200, 'Mark All Notifications Read', markAllRes.data);

  // 29. Nonexistent ID handling
  const nonExistentNgo = await req('/ngos/000000000000000000000000', 'GET', null, donorToken);
  assert(nonExistentNgo.status === 404, 'Handle Nonexistent ID (404)', nonExistentNgo.data);

  // 30. Invalid ObjectId handling
  const invalidIdRes = await req('/ngos/123-not-an-id', 'GET', null, donorToken);
  assert(invalidIdRes.status === 400, 'Handle Malformed ObjectId (400)', invalidIdRes.data);

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
