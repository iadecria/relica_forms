import { CheckCircle2 } from "lucide-react";

export default function FinalScreen() {
  return (
    <div className="bg-white border border-line rounded-2xl p-8 text-center">
      <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center">
        <CheckCircle2 className="w-5 h-5 text-success" />
      </div>
      <h2 className="text-xl font-semibold text-ink mb-2">Descoberta concluída</h2>
      <p className="text-sm text-ink-mid leading-relaxed max-w-md mx-auto">
        Obrigado! Essas respostas vão direto para a configuração do sistema da Humana na
        Relica.
      </p>
    </div>
  );
}
