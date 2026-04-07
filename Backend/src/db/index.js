require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

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

module.exports = connectDB;
module.exports.prisma = prisma;