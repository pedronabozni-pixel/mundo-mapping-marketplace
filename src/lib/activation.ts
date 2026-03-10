import crypto from "crypto";
import { db } from "@/lib/db";

const ACTIVATION_TTL_HOURS = 24;

function getBaseUrl() {
  const raw = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export async function createActivationToken(email: string) {
  await db.verificationToken.deleteMany({ where: { identifier: email } });

  const rawToken = crypto.randomBytes(32).toString("hex");
  const token = hashToken(rawToken);
  const expires = new Date(Date.now() + ACTIVATION_TTL_HOURS * 60 * 60 * 1000);

  await db.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires
    }
  });

  return rawToken;
}

export async function consumeActivationToken(rawToken: string) {
  const token = hashToken(rawToken);
  const row = await db.verificationToken.findUnique({ where: { token } });
  if (!row) return null;
  if (row.expires.getTime() < Date.now()) {
    await db.verificationToken.delete({ where: { token } });
    return null;
  }

  await db.verificationToken.delete({ where: { token } });
  return row.identifier;
}

export function buildActivationLink(rawToken: string) {
  return `${getBaseUrl()}/activate-account?token=${encodeURIComponent(rawToken)}`;
}

export async function sendActivationEmail(params: { email: string; name?: string | null; activationLink: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const to = params.email;
  const name = params.name?.trim() || "membro";
  const subject = "Ative seu acesso ao Decentralized Club";
  const text = `Olá, ${name}.\n\nSeu pagamento foi confirmado. Ative sua conta pelo link:\n${params.activationLink}\n\nEste link expira em ${ACTIVATION_TTL_HOURS} horas.`;
  const html = `<p>Olá, <strong>${name}</strong>.</p><p>Seu pagamento foi confirmado.</p><p>Ative sua conta clicando no link abaixo:</p><p><a href="${params.activationLink}">${params.activationLink}</a></p><p>Este link expira em ${ACTIVATION_TTL_HOURS} horas.</p>`;

  if (!apiKey || !from) {
    console.warn("[activation-email] RESEND_API_KEY/EMAIL_FROM não configurados. Link:", params.activationLink);
    return { sent: false, reason: "email_provider_not_configured" as const };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html
    })
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("[activation-email] falha ao enviar", response.status, body);
    return { sent: false, reason: "provider_error" as const };
  }

  return { sent: true as const };
}

export async function issueActivationForUser(email: string, name?: string | null) {
  const token = await createActivationToken(email);
  const activationLink = buildActivationLink(token);
  return sendActivationEmail({ email, name, activationLink });
}
