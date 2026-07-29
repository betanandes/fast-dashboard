import { useEffect, useRef, useState } from "react";
import { Keyboard, MousePointerClick, Music, Volume2, VolumeX, X } from "lucide-react";

type AudioConfig = { clique: boolean; cliqueOpcao: number; tecla: boolean; teclaOpcao: number; fundo: boolean; fundoOpcao: number };
const CHAVE = "fast-dashboard:audio";
const PADRAO: AudioConfig = { clique: false, cliqueOpcao: 1, tecla: false, teclaOpcao: 1, fundo: false, fundoOpcao: 1 };

function contexto() {
  const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  return AudioCtor ? new AudioCtor() : null;
}

function nota(ctx: AudioContext, frequencia: number, duracao: number, volume = 0.025, tipo: OscillatorType = "sine") {
  const osc = ctx.createOscillator(); const gain = ctx.createGain();
  osc.type = tipo; osc.frequency.value = frequencia;
  gain.gain.setValueAtTime(volume, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duracao);
  osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duracao);
}

export default function SoundSettings() {
  const [aberto, setAberto] = useState(false);
  const [config, setConfig] = useState<AudioConfig>(() => { try { return { ...PADRAO, ...JSON.parse(localStorage.getItem(CHAVE) ?? "{}") }; } catch { return PADRAO; } });
  const audio = useRef<AudioContext | null>(null);
  const intervalo = useRef<number | null>(null);
  const atual = useRef(config);
  const obterAudio = () => { audio.current ??= contexto(); if (audio.current?.state === "suspended") void audio.current.resume(); return audio.current; };
  const tocarClique = (opcao = atual.current.cliqueOpcao) => { const ctx = obterAudio(); if (!ctx) return; nota(ctx, [520, 720, 420][opcao - 1], [0.05, 0.08, 0.04][opcao - 1], 0.025, opcao === 3 ? "square" : "sine"); };
  const tocarTecla = (opcao = atual.current.teclaOpcao) => { const ctx = obterAudio(); if (!ctx) return; nota(ctx, [240, 340, 180][opcao - 1], 0.025, 0.012, opcao === 2 ? "triangle" : "sine"); };

  useEffect(() => { atual.current = config; }, [config]);
  useEffect(() => { localStorage.setItem(CHAVE, JSON.stringify(config)); }, [config]);
  // Os listeners são registrados uma única vez e leem a configuração pelo ref.
  useEffect(() => {
    const clique = (e: MouseEvent) => { if (atual.current.clique && (e.target as Element)?.closest("button,a,[role=button]")) tocarClique(); };
    const tecla = (e: KeyboardEvent) => { if (atual.current.tecla && !["Shift","Control","Alt","Meta"].includes(e.key)) tocarTecla(); };
    document.addEventListener("click", clique); document.addEventListener("keydown", tecla);
    return () => { document.removeEventListener("click", clique); document.removeEventListener("keydown", tecla); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (intervalo.current) window.clearInterval(intervalo.current);
    intervalo.current = null;
    if (!config.fundo) return;
    const escalas = [[196,247,294,247],[220,277,330,277],[174,220,262,220]][config.fundoOpcao - 1];
    let i = 0;
    const tocar = () => { const ctx = obterAudio(); if (ctx) nota(ctx, escalas[i++ % escalas.length], 2.8, 0.008, "sine"); };
    const iniciar = () => { tocar(); intervalo.current = window.setInterval(tocar, 2800); document.removeEventListener("click", iniciar); };
    document.addEventListener("click", iniciar, { once: true });
    return () => { document.removeEventListener("click", iniciar); if (intervalo.current) window.clearInterval(intervalo.current); };
  }, [config.fundo, config.fundoOpcao]);

  const linha = (tipo: "clique" | "tecla" | "fundo", Icon: typeof Music, nome: string) => {
    const ligado = config[tipo]; const campo = `${tipo}Opcao` as "cliqueOpcao" | "teclaOpcao" | "fundoOpcao";
    return <div className="rounded-xl border border-gray-100 p-3"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-medium text-gray-700"><Icon className="h-4 w-4 text-brand-500" />{nome}</span><button type="button" onClick={() => setConfig((c) => ({ ...c, [tipo]: !ligado }))} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${ligado ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{ligado ? "Ligado" : "Desligado"}</button></div><div className="mt-3 grid grid-cols-3 gap-1">{[1,2,3].map((n) => <button type="button" key={n} onClick={() => { setConfig((c) => ({ ...c, [campo]: n })); if (tipo === "clique") tocarClique(n); if (tipo === "tecla") tocarTecla(n); }} className={`rounded-lg border px-2 py-1.5 text-[10px] ${config[campo] === n ? "border-brand-300 bg-brand-50 text-brand-700" : "border-gray-100 text-gray-500"}`}>Opção {n}</button>)}</div></div>;
  };
  const algum = config.clique || config.tecla || config.fundo;
  return <><button type="button" onClick={() => setAberto(true)} className="fixed bottom-5 right-20 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-lg hover:text-brand-600" title="Configurações de som">{algum ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>{aberto && <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/30 p-4" onMouseDown={() => setAberto(false)}><section className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}><div className="flex items-center justify-between border-b border-gray-100 p-4"><div><h2 className="text-sm font-semibold text-gray-900">Sons do sistema</h2><p className="mt-1 text-xs text-gray-500">Preferências salvas neste navegador.</p></div><button onClick={() => setAberto(false)} className="p-2 text-gray-400"><X className="h-4 w-4" /></button></div><div className="space-y-3 p-4">{linha("clique", MousePointerClick, "Cliques")}{linha("tecla", Keyboard, "Teclado")}{linha("fundo", Music, "Som de fundo")}</div></section></div>}</>;
}
