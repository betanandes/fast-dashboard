export type StatusCadastro = "Ativo" | "Pendente" | "Inativo";

export interface LicencaTI {
  colaborador: string;
  departamento: string;
  codigoSap: string;
  appControl: string;
  perfil: "Profissional" | "Limitada";
  crm: boolean;
  logistica: boolean;
  financeiro: boolean;
  status: StatusCadastro;
}

export const LICENCAS: LicencaTI[] = [
  { colaborador: "Adriano Santana", departamento: "Auditoria", codigoSap: "AUD001", appControl: "DCS065", perfil: "Profissional", crm: true, logistica: true, financeiro: true, status: "Ativo" },
  { colaborador: "Andrey Lima", departamento: "Faturamento", codigoSap: "FAT005", appControl: "DCS076", perfil: "Limitada", crm: true, logistica: false, financeiro: true, status: "Ativo" },
  { colaborador: "Arthur Villarde", departamento: "Auditoria", codigoSap: "AUD011", appControl: "DCS086", perfil: "Profissional", crm: true, logistica: true, financeiro: false, status: "Ativo" },
  { colaborador: "Beatriz Carvalho", departamento: "Faturamento", codigoSap: "FAT019", appControl: "DCS079", perfil: "Limitada", crm: false, logistica: false, financeiro: true, status: "Pendente" },
  { colaborador: "Breno Gomes", departamento: "Financeiro", codigoSap: "FIN033", appControl: "DCS023", perfil: "Profissional", crm: true, logistica: false, financeiro: true, status: "Ativo" },
  { colaborador: "Bruna Lancelotti", departamento: "Suprimentos", codigoSap: "SUP004", appControl: "DCS057", perfil: "Limitada", crm: false, logistica: true, financeiro: false, status: "Ativo" },
  { colaborador: "Bruno Tamer", departamento: "Compras", codigoSap: "COMP015", appControl: "DCS046", perfil: "Limitada", crm: true, logistica: true, financeiro: false, status: "Ativo" },
  { colaborador: "Caio Araújo", departamento: "Auditoria", codigoSap: "AUD017", appControl: "DCS069", perfil: "Profissional", crm: true, logistica: true, financeiro: true, status: "Ativo" },
  { colaborador: "Clayton Silva", departamento: "Contábil", codigoSap: "CONT019", appControl: "DCS051", perfil: "Limitada", crm: false, logistica: false, financeiro: true, status: "Inativo" },
  { colaborador: "Denise Moura", departamento: "Vendas", codigoSap: "DIR005", appControl: "DCS058", perfil: "Profissional", crm: true, logistica: false, financeiro: true, status: "Ativo" },
  { colaborador: "Diego Laranjeira", departamento: "DP", codigoSap: "DP001", appControl: "DCS072", perfil: "Limitada", crm: false, logistica: false, financeiro: true, status: "Ativo" },
  { colaborador: "Elaine Dias", departamento: "Comercial", codigoSap: "COM097", appControl: "DCS033", perfil: "Profissional", crm: true, logistica: true, financeiro: false, status: "Ativo" },
  { colaborador: "Elmarques Dionisio", departamento: "Comercial", codigoSap: "COM370", appControl: "DCS018", perfil: "Profissional", crm: true, logistica: false, financeiro: false, status: "Pendente" },
  { colaborador: "Gabriel dos Anjos", departamento: "Compras", codigoSap: "COM443", appControl: "DCS044", perfil: "Limitada", crm: false, logistica: true, financeiro: true, status: "Ativo" },
  { colaborador: "Gleisly Santella", departamento: "Comercial", codigoSap: "COM366", appControl: "DCS032", perfil: "Profissional", crm: true, logistica: true, financeiro: false, status: "Ativo" },
];

export interface SoftwareTI {
  nome: string;
  aplicacao: string;
  acesso: string;
  valorMensal: number;
  valorAnual: number;
  satisfaz: "Sim" | "Em análise" | "Não";
  link: string;
  responsavel: string;
}

export const SOFTWARES: SoftwareTI[] = [
  { nome: "ClickSign", aplicacao: "Assinatura eletrônica de contratos", acesso: "app.clicksign.com", valorMensal: 250, valorAnual: 3000, satisfaz: "Sim", link: "https://app.clicksign.com", responsavel: "Jurídico" },
  { nome: "Convex", aplicacao: "E-mail corporativo", acesso: "Painel administrativo", valorMensal: 4600, valorAnual: 55200, satisfaz: "Sim", link: "https://convex.com.br", responsavel: "TI" },
  { nome: "Economapas Pro", aplicacao: "Plataforma de inteligência de mercado", acesso: "Login corporativo", valorMensal: 1750, valorAnual: 21000, satisfaz: "Sim", link: "https://app.economapas.com.br", responsavel: "Expansão" },
  { nome: "Focus", aplicacao: "Emissão de cupom fiscal", acesso: "Portal Focus NFe", valorMensal: 548, valorAnual: 6576, satisfaz: "Sim", link: "https://focusnfe.com.br", responsavel: "Fiscal" },
  { nome: "Fone Talk", aplicacao: "Atendimento 0800", acesso: "Painel Fone Talk", valorMensal: 99, valorAnual: 1188, satisfaz: "Em análise", link: "https://fonetalk.com.br", responsavel: "CSC" },
  { nome: "Fretebras", aplicacao: "Busca de contatos, manifesto e CTe", acesso: "Conta empresarial", valorMensal: 356, valorAnual: 4272, satisfaz: "Sim", link: "https://www.fretebras.com.br", responsavel: "Logística" },
  { nome: "Microsoft 365", aplicacao: "Produtividade e colaboração", acesso: "Admin Center", valorMensal: 6840, valorAnual: 82080, satisfaz: "Sim", link: "https://admin.microsoft.com", responsavel: "TI" },
  { nome: "Power BI Pro", aplicacao: "Indicadores e relatórios gerenciais", acesso: "Microsoft Fabric", valorMensal: 980, valorAnual: 11760, satisfaz: "Sim", link: "https://app.powerbi.com", responsavel: "BI" },
  { nome: "AnyDesk", aplicacao: "Suporte remoto às unidades", acesso: "Console de gestão", valorMensal: 420, valorAnual: 5040, satisfaz: "Em análise", link: "https://my.anydesk.com", responsavel: "TI" },
  { nome: "Trello Enterprise", aplicacao: "Gestão de projetos internos", acesso: "Atlassian Admin", valorMensal: 610, valorAnual: 7320, satisfaz: "Não", link: "https://trello.com", responsavel: "Projetos" },
];

export interface MaquinaTI {
  maquina: string;
  serie: string;
  modelo: string;
  unidade: string;
  contato: string;
  cnpj: string;
  cidade: string;
  ip: string;
  status: "Online" | "Atenção" | "Offline";
  observacao: string;
}

export const MAQUINAS: MaquinaTI[] = [
  { maquina: "MAQ 1 - Porto", serie: "XBIJ033474", modelo: "Epson WF C5890", unidade: "CSC", contato: "(21) 97228-7568", cnpj: "42.643.603/0001-51", cidade: "Rio de Janeiro/RJ", ip: "10.0.59.48", status: "Online", observacao: "Máquina trocada" },
  { maquina: "Mato Grosso do Sul", serie: "T597H100196", modelo: "Ricoh SP 4510 SF", unidade: "Renovação", contato: "(67) 99197-7755", cnpj: "41.917.296/0001-97", cidade: "Campo Grande/MS", ip: "—", status: "Atenção", observacao: "IP pendente" },
  { maquina: "Maxim - Curitiba", serie: "585Z3B10218", modelo: "Ricoh M 320F", unidade: "Maxim", contato: "(41) 99940-0943", cnpj: "40.595.111/0012-65", cidade: "Curitiba/PR", ip: "—", status: "Online", observacao: "Nova" },
  { maquina: "MAQ 9 - Nova Iguaçu", serie: "T597H700337", modelo: "Ricoh SP 4510 SF", unidade: "Iniciativa", contato: "(21) 99483-6501", cnpj: "41.286.396/0001-62", cidade: "Nova Iguaçu/RJ", ip: "—", status: "Online", observacao: "" },
  { maquina: "DCS - Japeri", serie: "585Z5914179", modelo: "Ricoh M 320F", unidade: "DCS", contato: "(21) 99513-1739", cnpj: "40.595.111/0008-89", cidade: "Japeri/RJ", ip: "—", status: "Online", observacao: "" },
  { maquina: "Fast Homes", serie: "T596H701933", modelo: "Ricoh SP 4510 SF", unidade: "Fast Homes", contato: "(21) 97238-2285", cnpj: "42.643.603/0001-51", cidade: "Rio de Janeiro/RJ", ip: "—", status: "Atenção", observacao: "Revisar toner" },
  { maquina: "MAQ 8 - Ramos", serie: "T597H100223", modelo: "Ricoh SP 4510 SF", unidade: "Diversidade", contato: "(21) 99204-6253", cnpj: "41.449.058/0001-02", cidade: "Rio de Janeiro/RJ", ip: "10.0.58.200", status: "Online", observacao: "Foi p/ Tigrão" },
  { maquina: "Juiz de Fora", serie: "T596H802750", modelo: "Ricoh SP 4510 SF", unidade: "Fronteira", contato: "(32) 99148-5345", cnpj: "45.821.911/0001-18", cidade: "Juiz de Fora/MG", ip: "—", status: "Offline", observacao: "Sem comunicação" },
  { maquina: "MAQ 6 - Realengo", serie: "T596H704077", modelo: "Ricoh SP 4510 SF", unidade: "Retribuição", contato: "(21) 97226-8394", cnpj: "41.332.868/0001-76", cidade: "Rio de Janeiro/RJ", ip: "—", status: "Online", observacao: "" },
  { maquina: "BonSucesso - DP", serie: "BRBS12J0RW", modelo: "HP Color LaserJet MFP 4303", unidade: "CSC", contato: "(21) 99149-1210", cnpj: "42.643.603/0001-51", cidade: "Rio de Janeiro/RJ", ip: "10.0.59.29", status: "Online", observacao: "PIN: 60329450" },
];

export interface ProvedorTI {
  loja: string;
  cidade: string;
  uf: string;
  provedorPrincipal: string;
  provedorBackup: string;
  velocidade: string;
  tecnologia: "Fibra" | "Rádio" | "Cabo";
  status: "Operacional" | "Instável" | "Indisponível";
  telefoneSuporte: string;
  vencimentoContrato: string;
}

export const PROVEDORES: ProvedorTI[] = [
  { loja: "Porto / Sala 803", cidade: "Rio de Janeiro", uf: "RJ", provedorPrincipal: "Vivo Fibra", provedorBackup: "Claro", velocidade: "600 Mbps", tecnologia: "Fibra", status: "Operacional", telefoneSuporte: "0800 770 9800", vencimentoContrato: "15/12/2026" },
  { loja: "Mato Grosso do Sul", cidade: "Campo Grande", uf: "MS", provedorPrincipal: "Algar Telecom", provedorBackup: "Starlink", velocidade: "500 Mbps", tecnologia: "Fibra", status: "Operacional", telefoneSuporte: "0800 942 1212", vencimentoContrato: "03/03/2027" },
  { loja: "Maxim - Curitiba", cidade: "Curitiba", uf: "PR", provedorPrincipal: "Ligga", provedorBackup: "Vivo", velocidade: "700 Mbps", tecnologia: "Fibra", status: "Operacional", telefoneSuporte: "0800 414 1810", vencimentoContrato: "20/09/2026" },
  { loja: "Nova Iguaçu", cidade: "Nova Iguaçu", uf: "RJ", provedorPrincipal: "Oi Fibra", provedorBackup: "Claro", velocidade: "500 Mbps", tecnologia: "Fibra", status: "Instável", telefoneSuporte: "0800 031 0800", vencimentoContrato: "10/11/2026" },
  { loja: "DCS - Japeri", cidade: "Japeri", uf: "RJ", provedorPrincipal: "Sumicity", provedorBackup: "—", velocidade: "400 Mbps", tecnologia: "Fibra", status: "Operacional", telefoneSuporte: "103 53", vencimentoContrato: "28/02/2027" },
  { loja: "Fast Homes", cidade: "Rio de Janeiro", uf: "RJ", provedorPrincipal: "Claro Empresas", provedorBackup: "TIM Live", velocidade: "600 Mbps", tecnologia: "Cabo", status: "Operacional", telefoneSuporte: "106 21", vencimentoContrato: "05/08/2026" },
  { loja: "Juiz de Fora", cidade: "Juiz de Fora", uf: "MG", provedorPrincipal: "Blink", provedorBackup: "Starlink", velocidade: "350 Mbps", tecnologia: "Fibra", status: "Indisponível", telefoneSuporte: "0800 040 1515", vencimentoContrato: "17/01/2027" },
  { loja: "Realengo", cidade: "Rio de Janeiro", uf: "RJ", provedorPrincipal: "Vivo Fibra", provedorBackup: "Claro", velocidade: "500 Mbps", tecnologia: "Fibra", status: "Operacional", telefoneSuporte: "0800 770 9800", vencimentoContrato: "30/06/2027" },
];
