import { createRequire } from 'module';
import dotenv from 'dotenv';

const require = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');

dotenv.config();

const prisma = new PrismaClient({
  log: ['query'], // Optional: log SQL queries
});

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected !! DB HOST: Neon');
  } catch (error) {
    console.error('PostgreSQL connection FAILED:', error);
    process.exit(1);
  }
};

export default connectDB;
export { prisma };