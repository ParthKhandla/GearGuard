require('dotenv').config();

let prisma;
try {
  const { PrismaClient } = require('@prisma/client');
  prisma = new PrismaClient({
    log: ['query'],
  });
} catch (error) {
  console.error('Failed to initialize Prisma:', error);
  throw error;
}

const connectDB = async () => {
  try {
    await prisma.$connect();
    console.log('PostgreSQL connected !! DB HOST: Neon');
  } catch (error) {
    console.error('PostgreSQL connection FAILED:', error);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.prisma = prisma;