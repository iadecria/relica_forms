# Descoberta Humana — Relica

Formulário de descoberta para mapear como a **Humana** trabalha hoje, módulo a módulo, antes de configurar o sistema na Relica.

## Como o respondente preenche

1. Acesse a URL pública da aplicação (`/`).
2. Digite a **senha de acesso** do formulário (definida no admin) e clique em **"Iniciar descoberta"**.
3. Complete os módulos em ordem.
   - Cada módulo só libera o próximo. Por padrão, ao concluir, o respondente fica em
     **"Aguardando liberação do administrador"** até o Admin liberar o próximo nível.
   - Todas as perguntas são obrigatórias, exceto as marcadas "(não obrigatória)".
   - As respostas são salvas automaticamente (rascunho) enquanto digita.
4. Ao voltar ao site, a sessão é retomada automaticamente.
5. Ao final aparece a confirmação: *"Obrigado! Essas respostas vão direto para a configuração do sistema da Humana na Relica."*

## Criar um novo formulário (importando perguntas da IA)

Em `/admin` → **Formulários** → **Novo formulário**:

1. Informe **Empresa** e **Senha de acesso**.
2. Cole no campo de importação o roteiro gerado pela IA. Aceita:
   - **JSON** — `{ "company": "...", "password": "...", "sections": [ { "title": "...", "intro": "...", "questions": ["...", "..."] } ] }` (ou só o array `sections`, ou `modules`/`perguntas`);
   - **Markdown** — `#`/`##` viram módulos, `>` vira introdução, linhas numeradas, `-`/`*` ou `###` viram perguntas;
   - **Texto puro** — uma pergunta por linha.
3. Clique em **Importar** para pré-visualizar e depois **Salvar formulário**.

O respondente entra apenas com a senha daquele formulário. O admin filtra os respondentes por formulário e exporta as respostas.

## Como o Admin libera e exporta

1. Acesse `/admin` (há um link discreto no rodapé do formulário).
2. Login com a senha configurada em `VITE_ADMIN_PASSWORD` (padrão `admin123` no modo demo).
3. Na lista de respondentes:
   - **"Liberar próximo nível"** desbloqueia o módulo seguinte de quem está aguardando.
   - Em **"Detalhes"**, é possível **liberar até um módulo específico** ou **liberar todos**.
   - Chaves globais: "Exigir liberação manual" e "Permitir edição após liberação".
4. **Exportar respostas** no botão "Exportar" (por respondente ou "Exportar todos"):
   - **Markdown (.md)** — ideal para colar numa IA e pedir a leitura/configuração.
   - **CSV (.csv)** — planilha.
   - **JSON (.json)** — estrutura completa.

### Fluxo para a IA

O formato **Markdown** já organiza título da seção, texto de introdução e cada pergunta com a resposta embaixo. Baixe o `.md` de um respondente (ou "Exportar todos" em `.md`) e cole direto no seu agente de IA como contexto para configurar o sistema. Exemplo de cabeçalho gerado:

```md
# Descoberta Humana — Fulano
- Empresa: ...
- Cargo: ...
## Caminho do lead
_Antes de falar de cada módulo..._
**1. Entrada e distribuição: ...**
resposta...
```

## Armazenamento

- **Supabase** (tabelas `respondents`, `responses`, `settings`) — usado quando as variáveis
  `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão configuradas. Migração em
  `supabase/migrations/`.
- **localStorage** (modo demo) — fallback automático quando as variáveis não existem.

## Rodar localmente

```bash
npm install
npm run dev
```

## Deploy na Vercel (subdomínio)

O `vercel.json` já está configurado (SPA rewrite). Para subir com subdomínio no domínio `relica.com.br`:

1. Adicione o domínio `relica.com.br` na Vercel (Project → Settings → Domains).
2. No registro DNS do provedor, crie um registro **CNAME** apontando para `cname.vercel-dns.com`, por exemplo:
   - `descoberta.relica.com.br` → `cname.vercel-dns.com`
3. Na Vercel, atribua esse subdomínio ao projeto.
4. Configure as variáveis de ambiente (Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PASSWORD` (opcional)
5. Deploy (push para o repositório conectado, ou `vercel --prod`).

O domínio principal `relica.com.br` já estando na Vercel, o subdomínio `descoberta.relica.com.br` (ou o nome que preferir) pode ser adicionado normalmente na mesma conta.