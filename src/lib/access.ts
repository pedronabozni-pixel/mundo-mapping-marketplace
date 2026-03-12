import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export async function requireMemberSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/login");

  return session;
}

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== Role.ADMIN) {
    redirect("/login?error=admin");
  }

  return session;
}
