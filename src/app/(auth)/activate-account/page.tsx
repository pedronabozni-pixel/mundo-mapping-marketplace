import { ActivateAccountForm } from "@/components/activate-account-form";

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ActivateAccountPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      {token ? (
        <ActivateAccountForm token={token} />
      ) : (
        <section className="card w-full max-w-md space-y-2">
          <h1 className="text-2xl font-bold">Link inválido</h1>
          <p className="text-sm text-muted">Este link de ativação não é válido.</p>
          <a className="text-sm text-muted underline underline-offset-4" href="/login">
            Ir para login
          </a>
        </section>
      )}
    </main>
  );
}
