import { requireMemberSession } from "@/lib/access";

const CALCULATOR_URL = "https://decentralizedclubcalculator.lovable.app";

export default async function CalculatorPage() {
  await requireMemberSession();

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Calculadora</h1>
            <p className="text-sm text-muted">
              Ferramenta de apoio para simulações de investimento dentro da área de membros.
            </p>
          </div>
          <a
            className="btn w-full text-center sm:w-auto"
            href={CALCULATOR_URL}
            rel="noreferrer"
            target="_blank"
          >
            Abrir em nova aba
          </a>
        </div>
      </div>

      <section className="card">
        <div className="h-[72vh] min-h-[620px] overflow-hidden rounded-xl border border-border bg-black/20">
          <iframe
            allow="clipboard-read; clipboard-write"
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            src={CALCULATOR_URL}
            title="Calculadora de investimentos Decentralized Club"
          />
        </div>
      </section>
    </div>
  );
}
