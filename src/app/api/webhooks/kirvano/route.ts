import { NextRequest, NextResponse } from "next/server";
import { processKirvanoWebhookRaw, verifyKirvanoSignature } from "@/lib/kirvano";

function firstHeader(req: NextRequest, names: string[]) {
  for (const name of names) {
    const value = req.headers.get(name);
    if (value && value.trim()) return value;
  }
  return null;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = firstHeader(req, [
    "x-kirvano-signature",
    "kirvano-signature",
    "x-signature",
    "x-webhook-signature"
  ]);
  const token = firstHeader(req, [
    "x-kirvano-token",
    "kirvano-token",
    "x-webhook-token",
    "x-token",
    "authorization"
  ]);

  if (!verifyKirvanoSignature(rawBody, signature, token)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    const result = await processKirvanoWebhookRaw(payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Kirvano webhook error", error);
    return NextResponse.json({ error: "processing_failed" }, { status: 500 });
  }
}
