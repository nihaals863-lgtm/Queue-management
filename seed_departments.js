const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Department = require('./models/Department');
const Counter = require('./models/Counter');

dotenv.config();

const departments = [
  { name: 'Reception', prefix: 'R', status: 'Active' },
  { name: 'Triage', prefix: 'T', status: 'Active' },
  { name: 'Consultation', prefix: 'C', status: 'Active' }
];

const seedDepartments = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Clear existing departments and counters to avoid duplicates
    await Department.deleteMany({});
    await Counter.deleteMany({});

    for (const dept of departments) {
      const existing = await Department.findOne({ name: dept.name });
      if (!existing) {
        await Department.create(dept);
        console.log(`Created department: ${dept.name}`);
        
        // Initialize counter for this department prefix
        await Counter.findOneAndUpdate(
          { id: dept.prefix },
          { $setOnInsert: { seq: 100 } },
          { upsert: true, new: true }
        );
      } else {
        console.log(`Department already exists: ${dept.name}`);
      }
    }

    console.log('Seeding completed!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDepartments();
