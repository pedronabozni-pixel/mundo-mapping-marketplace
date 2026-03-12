import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const NEW_ADMIN_EMAIL = "Admin@decentralized.club.com.br";
  const OLD_ADMIN_EMAIL = "admin@decentralized.club";
  const NEW_ADMIN_PASSWORD = "D3centr@al1iz3d@873829131894";
  const NEW_MEMBER_EMAIL = "pedronabozni@gmail.com";
  const NEW_MEMBER_PASSWORD = "Pedro@12345";

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

  const adminPasswordHash = await bcrypt.hash(NEW_ADMIN_PASSWORD, 10);
  const memberPasswordHash = await bcrypt.hash(NEW_MEMBER_PASSWORD, 10);

  const oldAdmin = await prisma.user.findUnique({ where: { email: OLD_ADMIN_EMAIL } });
  const currentAdmin = await prisma.user.findUnique({ where: { email: NEW_ADMIN_EMAIL } });

  let admin;
  if (oldAdmin && (!currentAdmin || currentAdmin.id === oldAdmin.id)) {
    admin = await prisma.user.update({
      where: { id: oldAdmin.id },
      data: {
        name: "Admin",
        email: NEW_ADMIN_EMAIL,
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
        isBlocked: false
      }
    });
  } else {
    admin = await prisma.user.upsert({
      where: { email: NEW_ADMIN_EMAIL },
      update: {
        name: "Admin",
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
        isBlocked: false
      },
      create: {
        name: "Admin",
        email: NEW_ADMIN_EMAIL,
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
        isBlocked: false
      }
    });
  }

  if (oldAdmin && admin.id !== oldAdmin.id) {
    await prisma.user.update({
      where: { id: oldAdmin.id },
      data: { role: Role.USER, isBlocked: true }
    });
  }

  const member = await prisma.user.upsert({
    where: { email: NEW_MEMBER_EMAIL },
    update: {
      name: "Pedro Nabozni",
      passwordHash: memberPasswordHash,
      role: Role.USER,
      isBlocked: false
    },
    create: {
      name: "Pedro Nabozni",
      email: NEW_MEMBER_EMAIL,
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
