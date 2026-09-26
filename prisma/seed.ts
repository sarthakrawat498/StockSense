import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "@prisma/client";

const directDatabaseUrl = process.env.DATABASE_URL_UNPOOLED;
const bootstrapPassword = process.env.BOOTSTRAP_MANAGER_PASSWORD;

if (!directDatabaseUrl) {
  throw new Error("DATABASE_URL_UNPOOLED is required to run the seed.");
}

if (!bootstrapPassword) {
  throw new Error("BOOTSTRAP_MANAGER_PASSWORD is required to run the seed.");
}

const password: string = bootstrapPassword;

// Seed and migration operations should use Neon's direct connection. The
// application can continue using the pooled DATABASE_URL at runtime.
process.env.DATABASE_URL = directDatabaseUrl;

const prisma = new PrismaClient();

async function main() {
  const passwordHash: string = (await bcrypt.hash(password, 12)) as string;

  const manager = await prisma.user.upsert({
    where: { email: "admin@admin.com" },
    update: {
      username: "admin",
      passwordHash,
      role: UserRole.MANAGER,
    },
    create: {
      username: "admin",
      email: "admin@admin.com",
      passwordHash,
      role: UserRole.MANAGER,
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
    },
  });

  console.log(
    `Bootstrap manager ready: ${manager.username} (${manager.email}) - ${manager.role}`,
  );
}

main()
  .catch((error) => {
    console.error("Bootstrap manager seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
