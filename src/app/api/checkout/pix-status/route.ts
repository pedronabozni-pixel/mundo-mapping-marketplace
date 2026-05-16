// MODO SIMULADO — a confirmação PIX acontece client-side após 5s.
// Esta rota será usada pelo Asaas webhook/polling quando a integração real for ativada.
// TODO: Asaas — substituir o corpo pelo polling real do getPaymentStatus.
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  return NextResponse.json({ paid: false, status: "PENDING", mode: "simulado" });
}
