const API_URL = 'https://queue-management-production-c267.up.railway.app/api';

async function runTests() {
  console.log("=== STARTING AUTH VERIFICATION TESTS (FETCH NATIVE) ===");

  const uniqueId = Date.now();
  const testAdmin = {
    name: 'Admin Test',
    email: `admin_${uniqueId}@test.com`,
    password: 'password123',
    role: 'admin'
  };

  const testOperator = {
    name: 'Operator Test',
    email: `operator_${uniqueId}@test.com`,
    password: 'password123',
    role: 'operator'
  };

  try {
    // 1. Register Admin
    console.log("\n[1] Registering Admin...");
    const regAdminRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testAdmin)
    });
    const regAdminData = await regAdminRes.json();
    console.log("Response:", regAdminData.success ? "✅ Success" : "❌ Fail", regAdminData.message || "");

    // 2. Register Operator
    console.log("\n[2] Registering Operator...");
    const regOpRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testOperator)
    });
    const regOpData = await regOpRes.json();
    console.log("Response:", regOpData.success ? "✅ Success" : "❌ Fail", regOpData.message || "");

    // 3. Login Admin
    console.log("\n[3] Logging in Admin...");
    const loginAdminRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testAdmin.email, password: testAdmin.password })
    });
    const loginAdminData = await loginAdminRes.json();
    const adminToken = loginAdminData.data?.token;
    console.log("✅ Admin Token Issued:", adminToken ? adminToken.substring(0, 20) + "..." : "❌ Failed");
    console.log("[DEBUG CLIENT] adminToken typeof:", typeof adminToken);
    console.log("[DEBUG CLIENT] adminToken raw:", adminToken);


    // 4. Login Operator
    console.log("\n[4] Logging in Operator...");
    const loginOpRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testOperator.email, password: testOperator.password })
    });
    const loginOpData = await loginOpRes.json();
    const opToken = loginOpData.data?.token;
    console.log("✅ Operator Token Issued:", opToken ? opToken.substring(0, 20) + "..." : "❌ Failed");

    // 5. Test Protected Route (Operator hitting stats)
    console.log("\n[5] Operator hitting /api/stats...");
    const statsRes = await fetch(`${API_URL}/stats`, {
      headers: { Authorization: `Bearer ${opToken}` }
    });
    const statsData = await statsRes.json();
    console.log("Response Status:", statsRes.status);
    console.log("Response Body:", statsData);

    // 6. Test Authorized Access (Admin hitting Reset)
    console.log("\n[6] Admin hitting /api/tokens/reset...");
    const resetRes = await fetch(`${API_URL}/tokens/reset?confirm=true`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const resetData = await resetRes.json();
    console.log("Response Status:", resetRes.status);
    console.log("Response Body:", resetData);


    // 7. Test Forbidden Access (Operator hitting Reset)
    console.log("\n[7] Operator hitting /api/tokens/reset...");
    const resetOpRes = await fetch(`${API_URL}/tokens/reset?confirm=true`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${opToken}` }
    });
    console.log("Response Status:", resetOpRes.status);
    if (resetOpRes.status === 403) {
      console.log("✅ Blocked successfully with 403 Forbidden!");
    } else {
      console.log("❌ Unexpected status:", resetOpRes.status);
    }

  } catch (err) {
    console.error("\n❌ Unexpected Global Error Stack:", err.stack || err);
  }
}

runTests();
