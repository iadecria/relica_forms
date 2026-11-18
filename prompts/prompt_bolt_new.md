# Prompt para colar no Bolt.new

Copie todo o conteúdo abaixo da linha divisória e cole no [bolt.new](https://bolt.new). Ele já inclui a arquitetura de telas bloqueadas por nível, o painel de liberação do Admin e todas as seções e perguntas exatas do roteiro da Relica/Humana.

---

Crie uma aplicação web em React + TypeScript + Tailwind CSS (com idioma da interface 100% em Português do Brasil) chamada **"Descoberta Humana — Caminho do lead e módulos da Relica"**.

Descrição principal do sistema:
"Formulário de descoberta para mapear como a Humana trabalha hoje, módulo a módulo, antes de configurar o sistema. Responda com detalhe: quanto mais real a resposta, melhor o sistema fica."

## 1. Visual e Regras de Interface
- Tema neutro corporativo: fundo claro (`#F8FAFC`), cartões brancos com bordas sutis (`#E2E8F0`), tipografia escura (`#0F172A`) e destaques em cinza-chumbo e azul escuro (`#1E293B` / `#334155`).
- **Não use emojis em nenhum lugar da interface** (nem em títulos, botões, alertas ou status). Use apenas ícones minimalistas (Lucide React) quando necessário.
- Layout limpo, focado em leitura e digitação confortável em desktop e celular.

## 2. Persistência e Banco de Dados
- Estruture a aplicação com suporte a **Supabase** (tabelas para `respondents`, `responses` e `settings`, usando Realtime ou polling para refletir liberações do Admin em tempo real para o respondente).
- Inclua também um fallback automático funcional em `localStorage` (modo local/demonstração) caso as variáveis de ambiente do Supabase ainda não estejam configuradas, para que eu consiga testar todo o fluxo imediatamente no preview do Bolt.new antes de conectar o Supabase.

## 3. Fluxo do Respondente (Telas em Níveis com Bloqueio Progressivo)
O respondente acessa a rota principal `/` e passa pelas telas em ordem rígida, **sem poder pular para o próximo nível**:

1. **Tela de Identificação (obrigatória antes de começar):**
   - Campos de texto curto (todos obrigatórios):
     - Nome
     - Cargo
     - WhatsApp
     - Empresa
   - Botão **"Iniciar descoberta"** salva o participante e abre o **Nível 0 (Caminho do lead)**.
   - Se o participante já tiver iniciado antes (identificado por código/link da sessão ou e-mail/WhatsApp), permita retomar exatamente de onde parou.

2. **Telas dos Módulos (12 níveis: Seção 0 até Seção 11):**
   - No topo, exiba uma **barra de progresso** com os 12 módulos mostrando claramente: Concluído, Atual, Aguardando liberação e Bloqueado.
   - Em cada tela, exiba exatamente o **Título da seção**, o **Texto de introdução** e todas as **Perguntas** em campos de texto longo (`textarea` expansível com salvamento automático de rascunho).
   - **Validação obrigatória:** todas as perguntas são obrigatórias, exceto quando indicado "(não obrigatória)". O botão **"Concluir módulo e avançar"** só habilita ou só permite enviar se todos os campos obrigatórios da tela atual estiverem preenchidos.
   - **Bloqueio de próximo nível pelo Admin:**
     - Quando o modo **"Liberação manual pelo Admin"** estiver ativado (padrão), ao concluir um módulo, as respostas são salvas e o participante vai para uma tela de espera: *"Módulo concluído e enviado. Aguardando liberação do administrador para acessar o próximo nível."*
     - Assim que o Admin liberar o próximo módulo no painel administrativo, a tela do respondente desbloqueia automaticamente (ou via botão "Verificar liberação") e permite seguir para o módulo seguinte.
     - O respondente pode visualizar (somente leitura ou editável até a liberação, conforme configuração) os módulos já concluídos, mas **nunca** pode abrir um nível ainda não liberado.

3. **Tela Final de Confirmação:**
   - Ao concluir o último módulo (**11. Relatórios executivos**), exiba a mensagem exata:
     `"Obrigado! Essas respostas vão direto para a configuração do sistema da Humana na Relica."`

## 4. Painel do Administrador (`/admin`)
Crie uma área administrativa acessível via rota `/admin` (com botão discreto no rodapé ou menu, protegida por senha configurável — ex.: variável de ambiente `VITE_ADMIN_PASSWORD` com padrão `admin123` no modo demo):

- **Lista de Respondentes / Sessões:**
  - Tabela ou cards com Nome, Empresa, Cargo, WhatsApp, Módulo atual, Status (`Em preenchimento`, `Aguardando liberação`, `Concluído`) e data da última atualização.
- **Controle de Liberação de Níveis:**
  - Chave global (e/ou por participante): **"Exigir liberação manual do Admin para cada módulo"** (ativada por padrão).
  - Botão de ação rápida **"Liberar próximo nível"** diretamente na linha do respondente que está aguardando.
  - Dentro dos detalhes do respondente, uma lista dos 12 módulos onde o Admin pode **liberar manualmente até qual nível** aquele respondente pode acessar (ou desbloquear todos de uma vez, se desejar).
- **Leitura e Exportação das Respostas:**
  - Visualização completa e organizada módulo a módulo das respostas de cada participante.
  - Botões para exportar as respostas de um participante (ou de todos) em **Markdown (.md)**, **CSV** ou **JSON**.

## 5. Conteúdo Exato das Seções e Perguntas
Use os títulos, textos de introdução e perguntas **exatamente como escritos abaixo**, sem resumir, alterar ou omitir nenhuma pergunta:

### Seção 0 — Caminho do lead
- **Título da seção:** Caminho do lead
- **Texto de introdução:** Antes de falar de cada módulo, descreva a rotina inteira: desde o lead chegando até a venda fechada.
- **Perguntas (texto longo):**
  1. Entrada e distribuição: quando um lead chega, como ele é cadastrado e dividido entre os operadores? Alguém distribui, ou cada operador já tem a própria carteira? (obrigatória)
  2. Acesso: o operador vê só os leads dele ou a carteira inteira? A gerência acompanha isso de algum jeito? (obrigatória)
  3. Atendimento: depois que o lead chega na mão do operador, qual é o primeiro passo? Ligação, WhatsApp, agendamento ou uma sequência de tentativas? (obrigatória)
  4. Acompanhamento: como controlam o retorno? O operador registra cada contato, marca o próximo retorno ou só atualiza a situação do cliente? (obrigatória)
  5. Proposta e negociação: quando há interesse, o que precisa ser levantado, como a proposta é feita e como a negociação é acompanhada? (obrigatória)
  6. Fechamento: quando a venda fecha, o que o operador registra, quais documentos entram e para quem isso é encaminhado? (obrigatória)
  7. Quem executa: se fizer mais sentido, quem da equipe vive essa rotina e pode explicar o passo a passo direto? (não obrigatória)

### Seção 1 — Inteligência de Mercado
- **Título da seção:** 1. Inteligência de Mercado
- **Texto de introdução:** Onde vale procurar, antes de abrir um CNPJ.
- **Perguntas (texto longo, todas obrigatórias):**
  1. Território: vocês olham o mercado por estado, cidade ou por uma praça que já conhecem? O que fica de fora de propósito?
  2. Segmento: quais CNAEs ou tipos de empresa costumam virar cliente? Tem segmento que parece grande e não fecha?
  3. Porte: a partir de quantas vidas ou de que faixa de funcionários a empresa entra na mira?
  4. Campanha: quando decidem atacar uma região, isso vira uma lista, uma meta do mês ou fica na cabeça de quem prospecta?
  5. Quem olha o mapa: operador, gestor ou só a direção? E quem pode dizer se aquele recorte faz sentido?

### Seção 2 — Prospecção por CNPJ
- **Título da seção:** 2. Prospecção por CNPJ
- **Texto de introdução:** Da empresa encontrada ao lead no CRM.
- **Perguntas (texto longo, todas obrigatórias):**
  1. Consulta: hoje vocês buscam por CNPJ, razão social, cidade ou já chegam com uma lista pronta?
  2. Filtro: o que realmente usam para separar a empresa boa da que não vale o crédito? Porte, cidade, situação cadastral, CNAE?
  3. Decisor: como o contato societário aparece hoje? Telefone, e-mail, WhatsApp, ou ainda é a recepção?
  4. Crédito: quem decide gastar crédito para revelar um contato? Existe um limite por operador?
  5. Envio ao funil: em que momento a empresa deixa de ser pesquisa e entra no CRM? Quem faz esse clique, e com qual prioridade?
  6. Quem prospecta: um time, o próprio operador ou alguém da gestão?

### Seção 3 — Operadores e distribuição
- **Título da seção:** 3. Operadores e distribuição
- **Texto de introdução:** Quem recebe o lead e com que carga.
- **Perguntas (texto longo, todas obrigatórias):**
  1. Carteira: cada operador já nasce com a própria praça ou os leads novos são distribuídos no dia?
  2. Critério: a divisão é por região, produto, rodízio ou por quem está com menos carga?
  3. Especialidade: tem operador que só faz saúde, outro que faz consórcio, ou todo mundo atende tudo?
  4. Limite: existe um número máximo de leads ativos por pessoa? O que acontece quando passa disso?
  5. Redistribuição: se alguém sai, adoece ou está cheio, quem passa o lead e o cliente avisa dessa troca?
  6. Quem enxerga a carga: o operador vê só a sua fila ou o gestor vê o equilíbrio do time inteiro?

### Seção 4 — Leads e funil CRM
- **Título da seção:** 4. Leads e funil CRM
- **Texto de introdução:** Como a oportunidade anda até virar venda.
- **Perguntas (texto longo, todas obrigatórias):**
  1. Etapas: o quadro da operação é Novo, Para contatar, Contatado, Interessado, Cotação, Negociação, Convertido e Perdido. O que vocês usam de verdade e o que chamam de outro nome?
  2. Registro: cada ligação, WhatsApp ou nota precisa ficar no histórico, ou o card só muda de coluna?
  3. Proposta: quando o cliente pede preço, a cotação fica no lead ou sai para planilha, portal da operadora ou WhatsApp?
  4. Parado: depois de quantos dias sem movimento o lead deveria chamar atenção? Quem olha isso?
  5. Perdido: quais motivos entram de verdade? Preço, já tem plano, sem contato, fora do perfil?
  6. Conversão: no dia do sim, o que o operador precisa preencher para o lead virar cliente na carteira?

### Seção 5 — Agenda comercial
- **Título da seção:** 5. Agenda comercial
- **Texto de introdução:** Ligação, reunião, proposta e retorno.
- **Perguntas (texto longo, todas obrigatórias):**
  1. Tipos: o que entra na agenda de verdade? Ligação, WhatsApp, reunião, envio de proposta ou só o próximo retorno?
  2. Vínculo: o compromisso fica preso ao lead ou ao cliente da carteira, ou é um lembrete solto?
  3. Atraso: se passou do horário, o operador vê sozinho ou a gestão precisa puxar a lista?
  4. Tentativas: quantas vezes vocês tentam antes de encerrar o contato? Isso muda entre ligação e mensagem?
  5. Meu dia: a primeira tela do operador deveria ser essa agenda, ou ele começa pelo funil?
  6. Quem marca: o próprio operador agenda o retorno na hora ou alguém da equipe faz isso por ele?

### Seção 6 — Painel e Meu Dia
- **Título da seção:** 6. Painel e Meu Dia
- **Texto de introdução:** O que cada papel vê ao abrir o sistema.
- **Perguntas (texto longo, todas obrigatórias):**
  1. Operador: ao abrir o dia, o que não pode faltar? Retornos de hoje, leads parados, meta do mês?
  2. Gestor: o que ele precisa ver sem entrar lead por lead? Fila do time, atraso, funil?
  3. Direção: um resumo de carteira e funil basta, ou ela também olha a fila do dia?
  4. Atalho: a partir dessa tela, qual é a próxima ação mais comum? Ligar, abrir o lead, ver a comissão?
  5. O que hoje substitui esse painel: WhatsApp, planilha ou a memória de quem cobra a equipe?

### Seção 7 — Carteira de clientes
- **Título da seção:** 7. Carteira de clientes
- **Texto de introdução:** Saúde, vida e seguros depois do fechamento.
- **Perguntas (texto longo, todas obrigatórias):**
  1. Ficha: no dia da venda, o que precisa existir no cliente? CNPJ, vidas, produto, vigência, operador, documentos?
  2. Produtos: saúde empresarial, odonto, vida e outros seguros ficam na mesma ficha ou cada um tem um controle?
  3. Renovação: com quantos dias de antecedência vocês começam a falar de vencimento? 60 dias faz sentido ou o prazo de vocês é outro?
  4. Pós-venda: inclusão de vida, exclusão e reclamação ficam com o mesmo operador ou passam para outra pessoa?
  5. Cross-sell: oferecer outro produto para o mesmo cliente nasce na carteira ou volta para o funil?
  6. Quem vê: o operador enxerga só os seus clientes ou a gestão vê a carteira inteira?

### Seção 8 — Módulo de consórcio
- **Título da seção:** 8. Módulo de consórcio
- **Texto de introdução:** Cotas, assembleias, lances e contemplação.
- **Perguntas (texto longo, todas obrigatórias):**
  1. Tipos: vocês trabalham cota de imóvel, automóvel, pesados ou outro? Quais administradoras entram de verdade?
  2. Entrada: o consórcio nasce no mesmo funil do plano ou já entra neste módulo?
  3. Grupo e cota: esses dados chegam por portal, planilha ou mensagem? Quem lança?
  4. Assembleia e lance: o operador registra lance e resultado, ou isso fica fora do sistema?
  5. Contemplação: quando contempla, o que muda na comissão e quem precisa ser avisado?
  6. Cancelamento: se a cota cai, a comissão já recebida volta? Quem acompanha isso depois da venda?

### Seção 9 — Financeiro e comissões
- **Título da seção:** 9. Financeiro e comissões
- **Texto de introdução:** Parcela recebida, a vencer, atraso e repasse.
- **Perguntas (texto longo, todas obrigatórias):**
  1. Entrada: a comissão cai direto da operadora ou passa por uma gestora? Em que momento do mês isso costuma acontecer?
  2. Parcelas: vocês separam recebido, a vencer e em atraso? Onde essa conta é feita hoje?
  3. Conciliação: o que precisa bater para dar a parcela como certa? Cliente, apólice, valor, competência?
  4. Repasse: o vendedor recebe percentual fixo, tabela por produto ou algo ligado a meta? Quem libera?
  5. Atraso e estorno: inadimplência, cancelamento ou erro de cadastro devolvem comissão? Como isso aparece para o operador?
  6. Quem vê o número: operador vê a própria comissão, ou só financeiro e direção?

### Seção 10 — Performance da equipe
- **Título da seção:** 10. Performance da equipe
- **Texto de introdução:** Conversão, atividade e meta de cada operador.
- **Perguntas (texto longo, todas obrigatórias):**
  1. Comparação: vocês olham conversão, volume no funil, ligações feitas ou venda fechada? O que pesa mais?
  2. Meta: a meta do mês é por vidas, por contrato, por comissão ou por atividade? Quem define?
  3. Ranking: existe uma leitura de quem está na frente e quem está atrás, ou isso só aparece na reunião?
  4. Gargalo: dá para ver em qual etapa do funil o time trava, ou isso é feeling do gestor?
  5. Justiça: operador novo e operador de carteira antiga entram na mesma conta?
  6. Quem acompanha: gestor olha toda semana, ou a direção só vê o fechamento do mês?

### Seção 11 — Relatórios executivos
- **Título da seção:** 11. Relatórios executivos
- **Texto de introdução:** O consolidado para a reunião de direção.
- **Perguntas (texto longo, todas obrigatórias):**
  1. Pauta: prospecção, vendas, carteira, consórcio e comissão entram na mesma reunião ou são conversas separadas?
  2. Período: a leitura é da semana, do mês ou da vigência? Tem corte por produto?
  3. Funil ponta a ponta: a direção quer ver da empresa pesquisada até a comissão recebida, ou cada número mora num lugar?
  4. Exportação: hoje isso vira planilha, PDF, WhatsApp ou a pessoa olha na tela?
  5. O que não pode faltar numa reunião e hoje só existe na cabeça de alguém?
  6. Quem monta: o financeiro, o gestor ou a própria direção puxa o número?
