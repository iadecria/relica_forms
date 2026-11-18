import { Loader2, RefreshCw } from "lucide-react";

interface Props {
  onCheck: () => void | Promise<void>;
  nextTitle?: string | null;
}

export default function WaitingScreen({ onCheck, nextTitle }: Props) {
  return (
    <div className="bg-white border border-line rounded-2xl p-8 text-center">
      <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-ink mb-2">
        Módulo concluído e enviado
      </h2>
      <p className="text-sm text-ink-mid leading-relaxed max-w-md mx-auto mb-6">
        Módulo concluído e enviado. Aguardando liberação do administrador para acessar o
        próximo nível.
      </p>
      {nextTitle && (
        <p className="inline-block text-xs font-medium text-primary-text bg-primary-soft rounded-full px-4 py-1.5 mb-6">
          Próximo módulo: {nextTitle}
        </p>
      )}
      <button
        onClick={() => void onCheck()}
        className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-canvas transition"
      >
        <RefreshCw className="w-4 h-4" />
        Verificar liberação
      </button>
    </div>
  );
}
