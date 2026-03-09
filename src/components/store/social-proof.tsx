const testimonials = [
  {
    name: "Rafael M.",
    text: "Comprei o H12 Ultra SE e chegou rápido. Acabamento premium mesmo.",
    stars: 5
  },
  {
    name: "Carla P.",
    text: "A loja passa muita confiança. Atendimento claro e compra simples.",
    stars: 5
  },
  {
    name: "Diego S.",
    text: "Produtos com qualidade acima da média para a faixa de preço.",
    stars: 5
  }
];

export function SocialProof() {
  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Prova social</p>
        <h2 className="mt-2 font-serif text-3xl text-zinc-100">Clientes satisfeitos em todo Brasil</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {testimonials.map((item) => (
          <article className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4" key={item.name}>
            <p className="text-amber-300">{"★".repeat(item.stars)}</p>
            <p className="mt-2 text-sm text-zinc-300">"{item.text}"</p>
            <p className="mt-3 text-sm font-semibold text-zinc-100">{item.name}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
