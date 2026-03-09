import { StoreAdminLoginForm } from "@/components/admin/store-admin-login-form";

export default function AltStoreAdminLoginPage() {
  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-8 text-zinc-100">
      <div className="mx-auto max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
        <h1 className="mb-2 font-serif text-3xl text-zinc-100">Painel da Loja</h1>
        <p className="mb-6 text-sm text-zinc-300">Acesso protegido por senha para edição dos produtos.</p>
        <StoreAdminLoginForm nextPath="/admin-loja" />
      </div>
    </div>
  );
}
