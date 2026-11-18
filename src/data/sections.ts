export interface Question {
  id: string;
  text: string;
  optional?: boolean;
}

export interface Section {
  id: number;
  title: string;
  intro: string;
  questions: Question[];
}

const q = (id: string, text: string, optional = false): Question => ({
  id,
  text,
  optional,
});

export const SECTIONS: Section[] = [
  {
    id: 0,
    title: "Caminho do lead",
    intro:
      "Antes de falar de cada módulo, descreva a rotina inteira: desde o lead chegando até a venda fechada.",
    questions: [
      q("q1", "Entrada e distribuição: quando um lead chega, como ele é cadastrado e dividido entre os operadores? Alguém distribui, ou cada operador já tem a própria carteira?"),
      q("q2", "Acesso: o operador vê só os leads dele ou a carteira inteira? A gerência acompanha isso de algum jeito?"),
      q("q3", "Atendimento: depois que o lead chega na mão do operador, qual é o primeiro passo? Ligação, WhatsApp, agendamento ou uma sequência de tentativas?"),
      q("q4", "Acompanhamento: como controlam o retorno? O operador registra cada contato, marca o próximo retorno ou só atualiza a situação do cliente?"),
      q("q5", "Proposta e negociação: quando há interesse, o que precisa ser levantado, como a proposta é feita e como a negociação é acompanhada?"),
      q("q6", "Fechamento: quando a venda fecha, o que o operador registra, quais documentos entram e para quem isso é encaminhado?"),
      q("q7", "Quem executa: se fizer mais sentido, quem da equipe vive essa rotina e pode explicar o passo a passo direto?", true),
    ],
  },
  {
    id: 1,
    title: "1. Inteligência de Mercado",
    intro: "Onde vale procurar, antes de abrir um CNPJ.",
    questions: [
      q("q1", "Território: vocês olham o mercado por estado, cidade ou por uma praça que já conhecem? O que fica de fora de propósito?"),
      q("q2", "Segmento: quais CNAEs ou tipos de empresa costumam virar cliente? Tem segmento que parece grande e não fecha?"),
      q("q3", "Porte: a partir de quantas vidas ou de que faixa de funcionários a empresa entra na mira?"),
      q("q4", "Campanha: quando decidem atacar uma região, isso vira uma lista, uma meta do mês ou fica na cabeça de quem prospecta?"),
      q("q5", "Quem olha o mapa: operador, gestor ou só a direção? E quem pode dizer se aquele recorte faz sentido?"),
    ],
  },
  {
    id: 2,
    title: "2. Prospecção por CNPJ",
    intro: "Da empresa encontrada ao lead no CRM.",
    questions: [
      q("q1", "Consulta: hoje vocês buscam por CNPJ, razão social, cidade ou já chegam com uma lista pronta?"),
      q("q2", "Filtro: o que realmente usam para separar a empresa boa da que não vale o crédito? Porte, cidade, situação cadastral, CNAE?"),
      q("q3", "Decisor: como o contato societário aparece hoje? Telefone, e-mail, WhatsApp, ou ainda é a recepção?"),
      q("q4", "Crédito: quem decide gastar crédito para revelar um contato? Existe um limite por operador?"),
      q("q5", "Envio ao funil: em que momento a empresa deixa de ser pesquisa e entra no CRM? Quem faz esse clique, e com qual prioridade?"),
      q("q6", "Quem prospecta: um time, o próprio operador ou alguém da gestão?"),
    ],
  },
  {
    id: 3,
    title: "3. Operadores e distribuição",
    intro: "Quem recebe o lead e com que carga.",
    questions: [
      q("q1", "Carteira: cada operador já nasce com a própria praça ou os leads novos são distribuídos no dia?"),
      q("q2", "Critério: a divisão é por região, produto, rodízio ou por quem está com menos carga?"),
      q("q3", "Especialidade: tem operador que só faz saúde, outro que faz consórcio, ou todo mundo atende tudo?"),
      q("q4", "Limite: existe um número máximo de leads ativos por pessoa? O que acontece quando passa disso?"),
      q("q5", "Redistribuição: se alguém sai, adoece ou está cheio, quem passa o lead e o cliente avisa dessa troca?"),
      q("q6", "Quem enxerga a carga: o operador vê só a sua fila ou o gestor vê o equilíbrio do time inteiro?"),
    ],
  },
  {
    id: 4,
    title: "4. Leads e funil CRM",
    intro: "Como a oportunidade anda até virar venda.",
    questions: [
      q("q1", "Etapas: o quadro da operação é Novo, Para contatar, Contatado, Interessado, Cotação, Negociação, Convertido e Perdido. O que vocês usam de verdade e o que chamam de outro nome?"),
      q("q2", "Registro: cada ligação, WhatsApp ou nota precisa ficar no histórico, ou o card só muda de coluna?"),
      q("q3", "Proposta: quando o cliente pede preço, a cotação fica no lead ou sai para planilha, portal da operadora ou WhatsApp?"),
      q("q4", "Parado: depois de quantos dias sem movimento o lead deveria chamar atenção? Quem olha isso?"),
      q("q5", "Perdido: quais motivos entram de verdade? Preço, já tem plano, sem contato, fora do perfil?"),
      q("q6", "Conversão: no dia do sim, o que o operador precisa preencher para o lead virar cliente na carteira?"),
    ],
  },
  {
    id: 5,
    title: "5. Agenda comercial",
    intro: "Ligação, reunião, proposta e retorno.",
    questions: [
      q("q1", "Tipos: o que entra na agenda de verdade? Ligação, WhatsApp, reunião, envio de proposta ou só o próximo retorno?"),
      q("q2", "Vínculo: o compromisso fica preso ao lead ou ao cliente da carteira, ou é um lembrete solto?"),
      q("q3", "Atraso: se passou do horário, o operador vê sozinho ou a gestão precisa puxar a lista?"),
      q("q4", "Tentativas: quantas vezes vocês tentam antes de encerrar o contato? Isso muda entre ligação e mensagem?"),
      q("q5", "Meu dia: a primeira tela do operador deveria ser essa agenda, ou ele começa pelo funil?"),
      q("q6", "Quem marca: o próprio operador agenda o retorno na hora ou alguém da equipe faz isso por ele?"),
    ],
  },
  {
    id: 6,
    title: "6. Painel e Meu Dia",
    intro: "O que cada papel vê ao abrir o sistema.",
    questions: [
      q("q1", "Operador: ao abrir o dia, o que não pode faltar? Retornos de hoje, leads parados, meta do mês?"),
      q("q2", "Gestor: o que ele precisa ver sem entrar lead por lead? Fila do time, atraso, funil?"),
      q("q3", "Direção: um resumo de carteira e funil basta, ou ela também olha a fila do dia?"),
      q("q4", "Atalho: a partir dessa tela, qual é a próxima ação mais comum? Ligar, abrir o lead, ver a comissão?"),
      q("q5", "O que hoje substitui esse painel: WhatsApp, planilha ou a memória de quem cobra a equipe?"),
    ],
  },
  {
    id: 7,
    title: "7. Carteira de clientes",
    intro: "Saúde, vida e seguros depois do fechamento.",
    questions: [
      q("q1", "Ficha: no dia da venda, o que precisa existir no cliente? CNPJ, vidas, produto, vigência, operador, documentos?"),
      q("q2", "Produtos: saúde empresarial, odonto, vida e outros seguros ficam na mesma ficha ou cada um tem um controle?"),
      q("q3", "Renovação: com quantos dias de antecedência vocês começam a falar de vencimento? 60 dias faz sentido ou o prazo de vocês é outro?"),
      q("q4", "Pós-venda: inclusão de vida, exclusão e reclamação ficam com o mesmo operador ou passam para outra pessoa?"),
      q("q5", "Cross-sell: oferecer outro produto para o mesmo cliente nasce na carteira ou volta para o funil?"),
      q("q6", "Quem vê: o operador enxerga só os seus clientes ou a gestão vê a carteira inteira?"),
    ],
  },
  {
    id: 8,
    title: "8. Módulo de consórcio",
    intro: "Cotas, assembleias, lances e contemplação.",
    questions: [
      q("q1", "Tipos: vocês trabalham cota de imóvel, automóvel, pesados ou outro? Quais administradoras entram de verdade?"),
      q("q2", "Entrada: o consórcio nasce no mesmo funil do plano ou já entra neste módulo?"),
      q("q3", "Grupo e cota: esses dados chegam por portal, planilha ou mensagem? Quem lança?"),
      q("q4", "Assembleia e lance: o operador registra lance e resultado, ou isso fica fora do sistema?"),
      q("q5", "Contemplação: quando contempla, o que muda na comissão e quem precisa ser avisado?"),
      q("q6", "Cancelamento: se a cota cai, a comissão já recebida volta? Quem acompanha isso depois da venda?"),
    ],
  },
  {
    id: 9,
    title: "9. Financeiro e comissões",
    intro: "Parcela recebida, a vencer, atraso e repasse.",
    questions: [
      q("q1", "Entrada: a comissão cai direto da operadora ou passa por uma gestora? Em que momento do mês isso costuma acontecer?"),
      q("q2", "Parcelas: vocês separam recebido, a vencer e em atraso? Onde essa conta é feita hoje?"),
      q("q3", "Conciliação: o que precisa bater para dar a parcela como certa? Cliente, apólice, valor, competência?"),
      q("q4", "Repasse: o vendedor recebe percentual fixo, tabela por produto ou algo ligado a meta? Quem libera?"),
      q("q5", "Atraso e estorno: inadimplência, cancelamento ou erro de cadastro devolvem comissão? Como isso aparece para o operador?"),
      q("q6", "Quem vê o número: operador vê a própria comissão, ou só financeiro e direção?"),
    ],
  },
  {
    id: 10,
    title: "10. Performance da equipe",
    intro: "Conversão, atividade e meta de cada operador.",
    questions: [
      q("q1", "Comparação: vocês olham conversão, volume no funil, ligações feitas ou venda fechada? O que pesa mais?"),
      q("q2", "Meta: a meta do mês é por vidas, por contrato, por comissão ou por atividade? Quem define?"),
      q("q3", "Ranking: existe uma leitura de quem está na frente e quem está atrás, ou isso só aparece na reunião?"),
      q("q4", "Gargalo: dá para ver em qual etapa do funil o time trava, ou isso é feeling do gestor?"),
      q("q5", "Justiça: operador novo e operador de carteira antiga entram na mesma conta?"),
      q("q6", "Quem acompanha: gestor olha toda semana, ou a direção só vê o fechamento do mês?"),
    ],
  },
  {
    id: 11,
    title: "11. Relatórios executivos",
    intro: "O consolidado para a reunião de direção.",
    questions: [
      q("q1", "Pauta: prospecção, vendas, carteira, consórcio e comissão entram na mesma reunião ou são conversas separadas?"),
      q("q2", "Período: a leitura é da semana, do mês ou da vigência? Tem corte por produto?"),
      q("q3", "Funil ponta a ponta: a direção quer ver da empresa pesquisada até a comissão recebida, ou cada número mora num lugar?"),
      q("q4", "Exportação: hoje isso vira planilha, PDF, WhatsApp ou a pessoa olha na tela?"),
      q("q5", "O que não pode faltar numa reunião e hoje só existe na cabeça de alguém?"),
      q("q6", "Quem monta: o financeiro, o gestor ou a própria direção puxa o número?"),
    ],
  },
];

export const TOTAL_SECTIONS = SECTIONS.length;

export const DEFAULT_SECTIONS: Section[] = JSON.parse(JSON.stringify(SECTIONS));

export const FINAL_MESSAGE =
  "Obrigado! Essas respostas vão direto para a configuração do sistema da HL Humana na Relica.";

export const WAITING_MESSAGE =
  "Módulo concluído e enviado. Aguardando liberação do administrador para acessar o próximo nível.";
