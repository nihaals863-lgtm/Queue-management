const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenv.config();

async function run() {
  try {
    console.log("Connecting to MongoDB via Native Driver...");
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const users = [
      {
        name: 'Master Admin',
        email: 'admin@klinik.com',
        password: 'admin',
        role: 'admin'
      },
      {
        name: 'Unit Operator',
        email: 'operator1@klinik.com',
        password: '1234',
        role: 'operator',
        departmentId: '1'
      }

    ];

    for (const u of users) {
      await db.collection('users').deleteOne({ email: u.email });
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(u.password, salt);
      
      await db.collection('users').insertOne({
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Test User Created: ${u.email} / ${u.password} (${u.role})`);
    }

    setTimeout(() => process.exit(0), 1000);
  } catch (e) {

    console.error("Error creating user native:", e);
    process.exit(1);
  }
}

run();
