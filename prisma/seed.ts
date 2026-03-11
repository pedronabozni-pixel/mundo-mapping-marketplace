import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [starter, pro] = await Promise.all([
    prisma.plan.upsert({
      where: { kirvanoProductId: "kirvano_starter" },
      update: {},
      create: {
        name: "Starter",
        priceCents: 9900,
        kirvanoProductId: "kirvano_starter",
        permissionsJson: {
          dailyUpdates: true,
          analyses: ["MACRO", "TECNICA"],
          videosModules: ["base"]
        }
      }
    }),
    prisma.plan.upsert({
      where: { kirvanoProductId: "kirvano_pro" },
      update: {},
      create: {
        name: "Pro",
        priceCents: 19900,
        kirvanoProductId: "kirvano_pro",
        permissionsJson: {
          dailyUpdates: true,
          analyses: ["MACRO", "TECNICA", "NARRATIVAS", "INSTITUCIONAL", "EUA"],
          videosModules: ["base", "advanced", "institutional"]
        }
      }
    })
  ]);

  const passwordHash = await bcrypt.hash("Admin@12345", 10);
  const memberPasswordHash = await bcrypt.hash("User@12345", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@decentralized.club" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@decentralized.club",
      passwordHash,
      role: Role.ADMIN
    }
  });

  const member = await prisma.user.upsert({
    where: { email: "membro@decentralized.club" },
    update: {
      name: "Membro Teste",
      passwordHash: memberPasswordHash,
      role: Role.USER,
      isBlocked: false
    },
    create: {
      name: "Membro Teste",
      email: "membro@decentralized.club",
      passwordHash: memberPasswordHash,
      role: Role.USER,
      isBlocked: false
    }
  });

  await prisma.subscription.upsert({
    where: { userId: admin.id },
    update: { planId: pro.id, status: "ACTIVE" },
    create: {
      userId: admin.id,
      planId: pro.id,
      status: "ACTIVE",
      kirvanoTransactionId: "seed_admin_tx",
      renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    }
  });

  await prisma.subscription.upsert({
    where: { userId: member.id },
    update: {
      planId: starter.id,
      status: "ACTIVE",
      renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      canceledAt: null
    },
    create: {
      userId: member.id,
      planId: starter.id,
      status: "ACTIVE",
      kirvanoTransactionId: "seed_member_tx",
      renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
    }
  });

  console.log("Seed finalizado (usuarios, planos e assinaturas base).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
