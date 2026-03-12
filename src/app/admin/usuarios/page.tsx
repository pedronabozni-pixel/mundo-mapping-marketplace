import { revalidatePath } from "next/cache";
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

export default async function AdminUsersPage() {
  await requireAdminSession();

  const [users, plans] = await Promise.all([
    db.user.findMany({ include: { subscription: { include: { plan: true } } }, orderBy: { createdAt: "desc" } }),
    db.plan.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] })
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
        <a className="btn-secondary" href="/api/export/members.csv">
          Exportar CSV
        </a>
      </div>

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
