/**
 * Seed script — creates 3 manager accounts.
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 * Or add to package.json: "prisma": { "seed": "ts-node ..." }
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const MANAGERS = [
  {
    username: "admin",
    email: "admin@stocksense.com",
    password: "Admin@2026",
    firstName: "Admin",
    lastName: "StockSense",
  },
  {
    username: "alex_manager",
    email: "alex@stocksense.com",
    password: "Manager@123",
    firstName: "Alex",
    lastName: "Carter",
  },
  {
    username: "jamie_mgr",
    email: "jamie@stocksense.com",
    password: "Manager@456",
    firstName: "Jamie",
    lastName: "Wilson",
  },
];

async function main() {
  console.log("Seeding managers...\n");

  for (const m of MANAGERS) {
    const passwordHash = await bcrypt.hash(m.password, 12);
    await prisma.user.upsert({
      where: { email: m.email },
      update: { role: "MANAGER", firstName: m.firstName, lastName: m.lastName, passwordHash },
      create: {
        username: m.username,
        email: m.email,
        passwordHash,
        firstName: m.firstName,
        lastName: m.lastName,
        role: "MANAGER",
      },
    });
    console.log(`✓ ${m.firstName} ${m.lastName} | @${m.username} | ${m.email} | pwd: ${m.password}`);
  }

  console.log("\nDone.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
