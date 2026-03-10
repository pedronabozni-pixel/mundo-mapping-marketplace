import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { consumeActivationToken } from "@/lib/activation";
import { db } from "@/lib/db";

const bodySchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(8)
});

export async function POST(req: NextRequest) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const email = await consumeActivationToken(parsed.data.token);
  if (!email) {
    return NextResponse.json({ error: "invalid_or_expired_token" }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash, isBlocked: false }
  });

  return NextResponse.json({ ok: true });
}
