import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { reseedDemoData } from './lib/seedData.js';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await reseedDemoData();

  console.log('\nSeed complete! Demo credentials:');
  console.log('  alex@demo.com / password123 (admin)');
  console.log('  jordan@demo.com / password123');
  console.log('  sam@demo.com / password123');
  console.log('  maya@demo.com / password123');

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
