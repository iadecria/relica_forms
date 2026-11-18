import { MessageCircle } from "lucide-react";
import Brand from "./Brand";

const CNPJ = "69.701.163/0001-06";
const WHATSAPP_DISPLAY = "(12) 9 9169-4314";
const WHATSAPP_LINK = "5512991694314";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <div className="max-w-form mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <Brand compact />
            <p className="text-xs text-ink-muted">
              CNPJ {CNPJ}
            </p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_LINK}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-mid hover:text-primary transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-success" />
            {WHATSAPP_DISPLAY}
          </a>
          <p className="text-xs text-ink-muted">
            Todos os direitos reservados{" "}
            <a
              href="https://decria.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-ink-soft hover:text-primary transition-colors"
            >
              decria.com.br
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}