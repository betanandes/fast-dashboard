import { useEffect, useState, type FormEvent } from "react";
import { BellRing, CalendarDays, CheckCircle2, Clock3, Loader2, Mail, Power } from "lucide-react";
import {
  CONFIG_PLANTAO_PADRAO,
  carregarConfiguracaoPlantao,
  salvarConfiguracaoPlantao,
} from "../../services/plantao";

const DIAS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export default function PlantaoConfiguracoes() {
  const [config, setConfig] = useState(CONFIG_PLANTAO_PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ erro: boolean; texto: string } | null>(null);

  useEffect(() => {
    carregarConfiguracaoPlantao()
      .then(setConfig)
      .catch(() => setMensagem({ erro: true, texto: "Não foi possível carregar a configuração. Aplique o schema do Supabase." }))
      .finally(() => setCarregando(false));
  }, []);

  const salvar = async (event: FormEvent) => {
    event.preventDefault();
    if (!config.email_destino.trim()) {
      setMensagem({ erro: true, texto: "Informe o e-mail que receberá o aviso de plantão." });
      return;
    }
    setSalvando(true);
    setMensagem(null);
    try {
      await salvarConfiguracaoPlantao({
        email_destino: config.email_destino.trim(),
        dia_envio: config.dia_envio,
        hora_envio: config.hora_envio,
        ativo: config.ativo,
      });
      setMensagem({ erro: false, texto: "Automação de plantão configurada com sucesso." });
    } catch (erro) {
      setMensagem({ erro: true, texto: erro instanceof Error ? erro.message : "Erro ao salvar a automação." });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <form onSubmit={salvar} className="card overflow-hidden">
      <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50"><BellRing className="h-5 w-5 text-blue-600" /></div>
          <div><h2 className="font-semibold text-gray-900">Aviso de plantão</h2><p className="text-xs text-gray-500">Notificação semanal do colaborador escalado para sábado</p></div>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
          <input type="checkbox" checked={config.ativo} onChange={(event) => setConfig((atual) => ({ ...atual, ativo: event.target.checked }))} className="h-4 w-4 accent-brand-600" />
          {config.ativo ? "Ativa" : "Desativada"}
        </label>
      </div>
      <div className="p-6">
        {carregando ? <div className="flex items-center gap-2 py-6 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Carregando configuração...</div> : <>
          <div className="grid gap-4 md:grid-cols-[minmax(260px,1fr)_220px_160px]">
            <label><span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600"><Mail className="h-3.5 w-3.5" /> E-mail destinatário</span><input type="email" className="input" value={config.email_destino} onChange={(event) => setConfig((atual) => ({ ...atual, email_destino: event.target.value }))} placeholder="gestor.ti@empresa.com.br" /></label>
            <label><span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600"><CalendarDays className="h-3.5 w-3.5" /> Dia do envio</span><select className="input" value={config.dia_envio} onChange={(event) => setConfig((atual) => ({ ...atual, dia_envio: Number(event.target.value) }))}>{DIAS.map((dia, index) => <option key={dia} value={index}>{dia}</option>)}</select></label>
            <label><span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-600"><Clock3 className="h-3.5 w-3.5" /> Horário</span><input type="time" className="input" value={config.hora_envio.slice(0, 5)} onChange={(event) => setConfig((atual) => ({ ...atual, hora_envio: event.target.value }))} /></label>
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
            <p className="flex items-center gap-1.5 text-xs text-gray-400"><Power className="h-3.5 w-3.5" /> O envio considera o fuso de Brasília e ocorre uma vez por plantão.</p>
            <button type="submit" disabled={salvando} className="btn-primary flex items-center gap-2">{salvando && <Loader2 className="h-4 w-4 animate-spin" />} Salvar automação</button>
          </div>
        </>}
        {mensagem && <div className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-xs ${mensagem.erro ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {mensagem.texto}</div>}
      </div>
    </form>
  );
}
