import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { requireAdminSession } from "@/lib/access";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

async function toggleBlock(formData: FormData) {
  "use server";
  await requireAdminSession();

  const userId = String(formData.get("userId") ?? "");
  const block = String(formData.get("block") ?? "false") === "true";

  if (!userId) return;

  await db.user.update({ where: { id: userId }, data: { isBlocked: block } });
  revalidatePath("/admin/usuarios");
}

async function changePlan(formData: FormData) {
  "use server";
  await requireAdminSession();

  const userId = String(formData.get("userId") ?? "");
  const planId = String(formData.get("planId") ?? "");

  if (!userId || !planId) return;

  const plan = await db.plan.findUnique({ where: { id: planId }, select: { id: true } });
  if (!plan) return;

  await db.$transaction(async (tx) => {
    await tx.subscription.upsert({
      where: { userId },
      update: {
        planId,
        status: "ACTIVE",
        renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
        canceledAt: null
      },
      create: {
        userId,
        planId,
        status: "ACTIVE",
        renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      }
    });

    await tx.user.update({
      where: { id: userId },
      data: { isBlocked: false }
    });
  });

  revalidatePath("/admin/usuarios");
}

async function createManualLogin(formData: FormData) {
  "use server";
  await requireAdminSession();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const planId = String(formData.get("planId") ?? "").trim();

  if (!name || !email || !password) {
    redirect("/admin/usuarios?error=manual-required");
  }

  const existingUser = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existingUser) {
    redirect("/admin/usuarios?error=manual-exists");
  }

  let selectedPlanId: string | null = null;
  if (planId) {
    const plan = await db.plan.findUnique({ where: { id: planId }, select: { id: true } });
    if (!plan) {
      redirect("/admin/usuarios?error=manual-plan");
    }
    selectedPlanId = plan.id;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        isBlocked: false
      },
      select: { id: true }
    });

    if (selectedPlanId) {
      await tx.subscription.create({
        data: {
          userId: user.id,
          planId: selectedPlanId,
          status: "ACTIVE",
          renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
        }
      });
    }
  });

  revalidatePath("/admin/usuarios");
  redirect("/admin/usuarios?created=manual");
}

function getFeedbackMessage(searchParams?: Record<string, string | string[] | undefined>) {
  const created = searchParams?.created;
  const error = searchParams?.error;

  if (created === "manual") {
    return {
      tone: "success" as const,
      message: "Login manual criado com sucesso."
    };
  }

  if (error === "manual-required") {
    return {
      tone: "error" as const,
      message: "Preencha nome, email e senha para criar o login."
    };
  }

  if (error === "manual-exists") {
    return {
      tone: "error" as const,
      message: "Já existe um usuário com esse email."
    };
  }

  if (error === "manual-plan") {
    return {
      tone: "error" as const,
      message: "O plano selecionado não foi encontrado."
    };
  }

  return null;
}

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminSession();

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [users, plans] = await Promise.all([
    db.user.findMany({ include: { subscription: { include: { plan: true } } }, orderBy: { createdAt: "desc" } }),
    db.plan.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] })
  ]);
  const feedback = getFeedbackMessage(resolvedSearchParams);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
        <a className="btn-secondary" href="/api/export/members.csv">
          Exportar CSV
        </a>
      </div>

      {feedback ? (
        <p
          className={
            feedback.tone === "success"
              ? "rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200"
              : "rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
          }
        >
          {feedback.message}
        </p>
      ) : null}

      <section className="card space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Criar login manual</h2>
          <p className="text-sm text-muted">
            Use esta área para liberar acesso sem gateway. Você pode criar o login e, se quiser, já vincular um plano.
          </p>
        </div>

        <form action={createManualLogin} className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm" htmlFor="manual-name">
              Nome
            </label>
            <input className="input" id="manual-name" name="name" placeholder="Nome do membro" required type="text" />
          </div>

          <div className="space-y-1">
            <label className="text-sm" htmlFor="manual-email">
              Email
            </label>
            <input className="input" id="manual-email" name="email" placeholder="email@dominio.com" required type="email" />
          </div>

          <div className="space-y-1">
            <label className="text-sm" htmlFor="manual-password">
              Senha
            </label>
            <input className="input" id="manual-password" name="password" placeholder="Crie uma senha" required type="text" />
          </div>

          <div className="space-y-1">
            <label className="text-sm" htmlFor="manual-plan">
              Plano inicial
            </label>
            <select className="input" defaultValue="" id="manual-plan" name="planId">
              <option value="">Sem plano / acesso livre</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} {plan.isActive ? "" : "(inativo)"}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <button className="btn" type="submit">
              Criar login
            </button>
          </div>
        </form>
      </section>

      <div className="space-y-3">
        {users.map((user) => (
          <article className="card space-y-2" key={user.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">{user.name ?? "Sem nome"}</h2>
                <p className="text-sm text-muted">{user.email}</p>
              </div>
              <p className="text-xs text-muted">Criado em {formatDate(user.createdAt)}</p>
            </div>

            <p className="text-sm">
              Plano: <b>{user.subscription?.plan.name ?? "-"}</b> • Status Kirvano: <b>{user.subscription?.status ?? "-"}</b>
            </p>

            <div className="flex flex-wrap gap-2">
              <form action={toggleBlock}>
                <input name="userId" type="hidden" value={user.id} />
                <input name="block" type="hidden" value={String(!user.isBlocked)} />
                <button className="btn-secondary" type="submit">
                  {user.isBlocked ? "Desbloquear" : "Bloquear"}
                </button>
              </form>

              <form action={changePlan} className="flex gap-2">
                <input name="userId" type="hidden" value={user.id} />
                <select className="input" defaultValue={user.subscription?.planId ?? ""} name="planId">
                  <option value="" disabled>
                    Selecione plano
                  </option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} {plan.isActive ? "" : "(inativo)"}
                    </option>
                  ))}
                </select>
                <button className="btn-secondary" type="submit">
                  Alterar plano
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
