const dotenv = require('dotenv');
const connectDB = require('./config/db');
const User = require('./models/User');
const { protect } = require('./middleware/authMiddleware');
const jwt = require('jsonwebtoken');

// Load env
dotenv.config();

// Connect DB
connectDB();

async function runTest() {
  console.log("=== ISOLATED AUTH MIDDLEWARE TEST ===");

  try {
    // 1. Find or create a user
    const uniqueId = Date.now();
    const testEmail = `admin_iso_${uniqueId}@test.com`;
    console.log("Creating test user with:", testEmail);
    let user = await User.create({ 
      name: 'Admin Test', 
      email: testEmail, 
      password: 'password123', 
      role: 'admin' 
    });

    console.log("User found/created ID:", user._id);

    // 2. Generate token (simulating authController)
    // Using user._id directly
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    console.log("Generated Token:", token.substring(0, 20) + "...");

    const mockReq = { 
       headers: { 
         authorization: `Bearer ${token}` 
       } 
    };

    const mockRes = {
      status: function(code) {
        return {
          json: function(data) {
             console.log(`❌ Response error ${code}:`, data);
          }
        };
      }
    };

    const mockNext = () => {
      console.log("✅ next() was called successfully! Token validated.");
    };

    console.log("\nTriggering protect middleware...");
    await protect(mockReq, mockRes, mockNext);

  } catch (err) {
    console.error("❌ Isolated Test Crash:", err.stack || err);
  } finally {
     // Wait briefly then exit process
     setTimeout(() => {
         console.log("\nTesting finished.");
         process.exit(0);
     }, 2000);
  }
}

runTest();
