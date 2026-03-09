import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_CONFIG, ADMIN_COOKIE_NAME } from "@/lib/store-config";

export async function POST(request: Request) {
  const body = (await request.json()) as { password?: string };

  if (!body.password || body.password !== ADMIN_CONFIG.password) {
    return NextResponse.json({ message: "Senha inválida." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, ADMIN_CONFIG.sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8,
    path: "/"
  });

  return NextResponse.json({ ok: true });
}
