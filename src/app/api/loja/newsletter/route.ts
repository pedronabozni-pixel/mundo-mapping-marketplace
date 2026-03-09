import { NextResponse } from "next/server";
import { z } from "zod";
import { saveNewsletterLead } from "@/lib/store-data";

const schema = z.object({
  email: z.string().email("Digite um e-mail válido.")
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 400 });
  }

  await saveNewsletterLead(parsed.data.email);
  return NextResponse.json({ message: "Cadastro realizado com sucesso." });
}
