import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
    // Check if manager already exists
    const existingManager = await prisma.user.findFirst({
        where: { role: "manager" }
    });

    if (existingManager) {
        console.log("✅ Manager already exists, skipping seed");
        return;
    }

    const hashedPassword = await bcrypt.hash("manager123", 10);

    const manager = await prisma.user.create({
        data: {
            fullName: "Admin Manager",
            email: "manager@company.com",
            username: "manager",
            password: hashedPassword,
            role: "manager",
        }
    });

    console.log("✅ Manager created:", manager.email);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });