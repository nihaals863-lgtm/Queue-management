const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

try {
  const err = fs.readFileSync(path.join(__dirname, 'server_error_5.log'), 'utf16le');
  console.log("=== SERVER ERROR 5 LOG ===");
  // console.log(err); // skip full print to avoid noise

  const target = '[DEBUG] authMiddleware received token:';
  const index = err.indexOf(target);

  if (index !== -1) {
    const substr = err.substring(index);
    // Split by single space or any whitespace
    const parts = substr.split(/\s+/);
    console.log("Parts near debug:", parts.slice(0, 6));

    const token = parts[4]; // 0: [DEBUG], 1: authMiddleware, 2: received, 3: token:, 4: eyJ...
    if (!token) {
        console.log("❌ Token undefined in parts index 4");
        return;
    }

    console.log("\n--- TOKEN DIAGNOSTICS ---");
    console.log("Token:", token.substring(0, 30) + "...");
    console.log("Length:", token.length);
    const tokenParts = token.split('.');
    console.log("Parts Count:", tokenParts.length);
    
    // Test verify locally
    try {
      const secret = "supersecret1234567890abcdef"; 
      jwt.verify(token, secret);
      console.log("✅ Local Verify PASSED with secret!");
    } catch (e) {
      console.error("❌ Local Verify FAILED:", e.message);
    }
  } else {
    console.log("\n--- No '[DEBUG] ...' trace found in error log ---");
  }

} catch (e) {
    console.log("Error reading log:", e.message);
}
