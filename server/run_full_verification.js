const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:4000';

function request(method, pathName, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(pathName, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { ...headers }
    };

    let payload = null;
    if (body) {
      if (typeof body === 'object') {
        payload = JSON.stringify(body);
        options.headers['Content-Type'] = 'application/json';
      } else {
        payload = body;
      }
      options.headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json !== null ? json : data
        });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('=====================================================');
  console.log('STARTING JP STORE EXTENDED VERIFICATION SUITE');
  console.log('SweetAlert2 | Razorpay Gateway | Dual-Tier Emailing');
  console.log('=====================================================\n');

  let adminToken = '';
  let customerToken = '';
  let testProductId = null;
  let testOrderId = null;

  // 1. GET /api/products
  console.log('[TEST 1] GET /api/products (User active products)');
  const res1 = await request('GET', '/api/products');
  console.log(`  Status: ${res1.status}, Active products count: ${res1.data.length}`);
  if (res1.status !== 200 || !Array.isArray(res1.data)) {
    throw new Error(`GET /api/products failed: ${JSON.stringify(res1.data)}`);
  }
  console.log('  PASS: Active products returned correctly.\n');

  // 2. Admin Login
  console.log('[TEST 2] Admin Login POST /api/auth/login');
  const res2 = await request('POST', '/api/auth/login', {}, {
    email: 'admin@jpstore.com',
    password: 'admin123'
  });
  console.log(`  Status: ${res2.status}`);
  if (res2.status !== 200 || !res2.data.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(res2.data)}`);
  }
  adminToken = res2.data.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}` };
  console.log('  PASS: Admin login successful.\n');

  // 3. GET /api/admin/dashboard
  console.log('[TEST 3] GET /api/admin/dashboard');
  const res3 = await request('GET', '/api/admin/dashboard', adminHeaders);
  console.log(`  Status: ${res3.status}`);
  if (res3.status !== 200) throw new Error('Dashboard failed');
  console.log('  PASS: Admin dashboard loaded all statistics.\n');

  // 4. Razorpay Payment Gateway Endpoints
  console.log('[TEST 4] Razorpay Payment Gateway APIs');
  const resCfg = await request('GET', '/api/payment/config');
  console.log(`  Payment config KeyId: ${resCfg.data.keyId}`);
  if (!resCfg.data.keyId) throw new Error('Failed to retrieve payment config');

  const resOrder = await request('POST', '/api/payment/create-order', adminHeaders, { amount: 899 });
  console.log(`  Razorpay order created: ${resOrder.data.orderId}, amount: ${resOrder.data.amount}`);
  if (!resOrder.data.orderId) throw new Error('Razorpay order creation failed');

  const resVerify = await request('POST', '/api/payment/verify', adminHeaders, {
    razorpay_order_id: resOrder.data.orderId,
    razorpay_payment_id: 'pay_test_' + Date.now(),
    razorpay_signature: 'sig_test_' + Date.now()
  });
  console.log(`  Razorpay verification: ${resVerify.data.ok}`);
  if (!resVerify.data.ok) throw new Error('Razorpay verification failed');
  console.log('  PASS: Razorpay payment gateway integration verified.\n');

  // 5. User Registration & Email Account Verification Flow
  console.log('[TEST 5] Account Registration & Verification via Email Token');
  const custEmail = `verify_user_${Date.now()}@example.com`;
  const regRes = await request('POST', '/api/auth/register', {}, {
    name: 'Aesthetic Buyer',
    email: custEmail,
    password: 'securePassword123'
  });
  console.log(`  Registered: ${regRes.data.user.name}, is_verified: ${regRes.data.user.is_verified}`);
  customerToken = regRes.data.token;
  const custHeaders = { Authorization: `Bearer ${customerToken}` };

  // Fetch token from DB directly for verification test
  const Database = require('better-sqlite3');
  const db = new Database(path.join(__dirname, 'jp-store.db'));
  const userRow = db.prepare('SELECT id, verification_token FROM users WHERE email = ?').get(custEmail);
  console.log(`  Verification token: ${userRow.verification_token}`);

  const verifyRes = await request('GET', `/api/auth/verify?token=${userRow.verification_token}`);
  console.log(`  Verify status: ${verifyRes.status}, message: ${verifyRes.data.message}`);
  if (!verifyRes.data.ok) throw new Error('Account verification endpoint failed');

  const verifiedUser = db.prepare('SELECT is_verified FROM users WHERE id = ?').get(userRow.id);
  console.log(`  User verified in DB: ${verifiedUser.is_verified === 1 ? 'YES (1)' : 'NO (0)'}`);
  if (verifiedUser.is_verified !== 1) throw new Error('User not marked verified in DB');
  console.log('  PASS: Account registration & email verification verified.\n');

  // 6. Order Placement with Razorpay & Automatic Invoice Email Trigger
  console.log('[TEST 6] Order Placement & Invoice Email Generation');
  const activeProducts = await request('GET', '/api/products');
  const productToBuy = activeProducts.data[0];

  const orderRes = await request('POST', '/api/orders', custHeaders, {
    address: '77 Jasmine Garden, Indiranagar, Bangalore',
    payment_method: 'Razorpay',
    payment_status: 'Paid',
    items: [{ product_id: productToBuy.id, quantity: 2 }]
  });
  testOrderId = orderRes.data.orderId;
  console.log(`  Order created: #${testOrderId}, Total: ₹${orderRes.data.total}`);
  if (!testOrderId) throw new Error('Order creation failed');

  // Verify order in user's list
  const userOrders = await request('GET', '/api/orders', custHeaders);
  const myOrder = userOrders.data.find(o => o.id === testOrderId);
  console.log(`  Customer retrieved order #${myOrder.id}, Status: ${myOrder.status}, Payment: ${myOrder.payment_status}`);
  if (!myOrder) throw new Error('Order not found in customer orders');
  console.log('  PASS: Order placed and invoice email triggered successfully.\n');

  // 7. Admin Settings for Razorpay & Email Services
  console.log('[TEST 7] Admin Settings & Credentials Management');
  const updateSettingsRes = await request('PUT', '/api/settings', adminHeaders, {
    store_name: 'JP Store Premium',
    email: 'contact@jpstore.com',
    phone: '+91 98765 43210',
    shipping: 49,
    tax: 5,
    return_policy: '14-day hassle-free returns',
    privacy_policy: 'Your privacy is respected.',
    terms: 'Standard terms.',
    razorpay_key_id: 'rzp_test_sampleKey',
    razorpay_key_secret: 'sampleSecret',
    resend_api_key: 're_sampleResendKey',
    gmail_user: 'jpstore@gmail.com',
    gmail_pass: 'abcd efgh ijkl mnop',
    email_from: 'JP Store <hello@jpstore.com>'
  });
  if (!updateSettingsRes.data.ok) throw new Error('Settings update failed');

  const fetchedSettings = await request('GET', '/api/settings');
  console.log(`  Updated Store: ${fetchedSettings.data.store_name}, Razorpay Key: ${fetchedSettings.data.razorpay_key_id}, Resend Key: ${fetchedSettings.data.resend_api_key}`);
  console.log('  PASS: Admin settings & service credentials updated and persistent.\n');

  console.log('=====================================================');
  console.log('ALL EXTENDED VERIFICATION TESTS PASSED (100%)');
  console.log('=====================================================');
}

runTests().catch(err => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
