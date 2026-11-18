import { useState } from "react";
import { Lock, Eye } from "lucide-react";
import Brand from "./Brand";

interface Props {
  onUnlock: () => void;
}

export default function AdminLogin({ onUnlock }: Props) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expected = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) ?? "admin123";

  const handleSubmit = () => {
    if (password === expected) {
      sessionStorage.setItem("admin_unlocked", "1");
      onUnlock();
    } else {
      setError("Senha incorreta.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm bg-white border border-line rounded-2xl p-8 shadow-sm">
        <div className="mb-6">
          <Brand />
        </div>
        <div className="mb-4 w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center">
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-xl font-semibold text-ink mb-1">Painel administrativo</h1>
        <p className="text-sm text-ink-mid mb-6">
          Digite a senha de administrador para continuar.
        </p>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Senha"
            className="w-full rounded-xl border border-line bg-canvas px-4 py-2.5 pr-10 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition"
          />
          <button
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink-mid"
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={!password}
          className="mt-6 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-40 transition"
        >
          Entrar
        </button>
        <a href="/" className="mt-4 block text-center text-xs text-ink-muted hover:text-ink-mid">
          Voltar ao formulário
        </a>
      </div>
    </div>
  );
}
