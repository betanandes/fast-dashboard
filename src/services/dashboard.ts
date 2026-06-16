import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import {
  TrendingUp, AlertCircle, Clock, FileText, Search, RefreshCw
} from 'lucide-react'
import KPICard from '../components/ui/KPICard'
import Semaforo from '../components/ui/Semaforo'
import {
  buscarKPIs, buscarResumoPorMes, buscarPorCategoria,
  buscarTopFornecedores, buscarPagamentos, buscarMesesDisponiveis,
  type FiltrosPagamentos
} from '../services/dashboard'
import type { Pagamento } from '../types/database'

function fmtMoeda(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtMoedaCompleto(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtData(d: string | null) {
  if (!d) return '—'
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

function statusBadge(status: string) {
  if (status === 'vencido') return <span className="badge badge-danger">Vencido</span>
  if (status === 'pago') return <span className="badge badge-ok">Pago</span>
  return <span className="badge badge-info">A vencer</span>
}

const CORES = ['#2563eb','#64748b','#16a34a','#d97706','#7c3aed','#0891b2']

export default function DashboardPage() {
  const [kpis, setKpis] = useState<Awaited<ReturnType<typeof buscarKPIs>> | null>(null)
  const [porMes, setPorMes] = useState<Awaited<ReturnType<typeof buscarResumoPorMes>>>([])
  const [porCategoria, setPorCategoria] = useState<Awaited<ReturnType<typeof buscarPorCategoria>>>([])
  const [fornecedores, setFornecedores] = useState<Awaited<ReturnType<typeof buscarTopFornecedores>>>([])
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [meses, setMeses] = useState<string[]>([])
  const [filtros, setFiltros] = useState<FiltrosPagamentos>({})
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingTabela, setLoadingTabela] = useState(false)

  useEffect(() => {
    async function carregar() {
      setLoading(true)
      try {
        const [k, m, c, f, p, ms] = await Promise.all([
          buscarKPIs(), buscarResumoPorMes(), buscarPorCategoria(),
          buscarTopFornecedores(), buscarPagamentos(), buscarMesesDisponiveis(),
        ])
        setKpis(k); setPorMes(m); setPorCategoria(c)
        setFornecedores(f); setPagamentos(p as Pagamento[]); setMeses(ms as string[])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    carregar()
  }, [])

  useEffect(() => {
    async function filtrar() {
      setLoadingTabela(true)
      try {
        const p = await buscarPagamentos({ ...filtros, busca })
        setPagamentos(p as Pagamento[])
      } catch (e) { console.error(e) }
      finally { setLoadingTabela(false) }
    }
    const t = setTimeout(filtrar, 300)
    return () => clearTimeout(t)
  }, [filtros, busca])

  const emDia = kpis ? kpis.total_lancamentos - kpis.count_vencidos - kpis.count_proximos7 : 0

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex items-center gap-3 text-gray-500">
        <RefreshCw className="w-5 h-5 animate-spin" />
        <span className="text-sm">Carregando dados...</span>
      </div>
    </div>
  )

  return (
    <div className="p-8 space-y-6 max-w-7xl">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Visão geral</h1>
          <p className="text-sm text-gray-500 mt-0.5">Controle de pagamentos TI</p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar
        </button>
      </div>

      {kpis && kpis.count_vencidos > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-sm text-red-700">
            <strong>{kpis.count_vencidos} pagamento(s) em atraso</strong> — total de {fmtMoedaCompleto(kpis.total_vencido)}.
          </p>
        </div>
      )}
      {kpis && kpis.count_proximos7 > 0 && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-700">
            <strong>{kpis.count_proximos7} vencimento(s) nos próximos 7 dias</strong> — {fmtMoedaCompleto(kpis.total_proximos7)} a pagar.
          </p>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Total acumulado" value={fmtMoeda(kpis?.total_geral ?? 0)} sub={`${kpis?.total_lancamentos ?? 0} lançamentos`} icon={<TrendingUp className="w-5 h-5" />} />
        <KPICard label="Em atraso" value={fmtMoeda(kpis?.total_vencido ?? 0)} sub={`${kpis?.count_vencidos ?? 0} pagamento(s)`} icon={<AlertCircle className="w-5 h-5" />} variant={kpis && kpis.count_vencidos > 0 ? 'danger' : 'default'} />
        <KPICard label="Vence em 7 dias" value={fmtMoeda(kpis?.total_proximos7 ?? 0)} sub={`${kpis?.count_proximos7 ?? 0} pagamento(s)`} icon={<Clock className="w-5 h-5" />} variant={kpis && kpis.count_proximos7 > 0 ? 'warning' : 'default'} />
        <KPICard label="Total de lançamentos" value={String(kpis?.total_lancamentos ?? 0)} sub="registros importados" icon={<FileText className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 col-span-2">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Despesa por mês</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={porMes} barSize={28}>
              <XAxis dataKey="mes_referencia" tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => v?.substring(0,3) ?? ''} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} width={55} />
              <Tooltip formatter={(v) => [fmtMoedaCompleto(Number(v ?? 0)), 'Total']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="total_valor" fill="#2563eb" radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <Semaforo vencidos={kpis?.count_vencidos ?? 0} proximos7={kpis?.count_proximos7 ?? 0} emDia={emDia} valorVencido={kpis?.total_vencido ?? 0} valorProximos7={kpis?.total_proximos7 ?? 0} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Por categoria</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={porCategoria} dataKey="total" nameKey="categoria" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                {porCategoria.map((_, i) => <Cell key={i} fill={CORES[i % CORES.length]} />)}
              </Pie>
              <Legend formatter={(v: string) => v.substring(0,20)} wrapperStyle={{ fontSize: 10 }} />
              <Tooltip formatter={(v) => [fmtMoedaCompleto(Number(v ?? 0)), '']} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 col-span-2">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Top fornecedores</h3>
          <div className="space-y-3">
            {fornecedores.slice(0,6).map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-gray-400 w-4 shrink-0">{i+1}</span>
                <span className="text-sm text-gray-700 flex-1 truncate" title={f.fornecedor}>{f.fornecedor}</span>
                <div className="w-24 bg-gray-100 rounded-full h-1.5 shrink-0">
                  <div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${Math.min(Number(f.percentual ?? 0), 100)}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-900 w-16 text-right shrink-0">{fmtMoeda(Number(f.total_valor))}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-medium text-gray-900 flex-1">Pagamentos</h3>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Buscar fornecedor..." value={busca} onChange={e => setBusca(e.target.value)} className="input pl-8 w-48 text-xs py-1.5" />
          </div>
          <select className="input w-36 text-xs py-1.5" value={filtros.mes ?? 'todos'} onChange={e => setFiltros(f => ({ ...f, mes: e.target.value }))}>
            <option value="todos">Todos os meses</option>
            {meses.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <select className="input w-32 text-xs py-1.5" value={filtros.status ?? 'todos'} onChange={e => setFiltros(f => ({ ...f, status: e.target.value }))}>
            <option value="todos">Todos</option>
            <option value="vencido">Vencido</option>
            <option value="a_vencer">A vencer</option>
            <option value="pago">Pago</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          {loadingTabela ? (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" /> Filtrando...
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Vencimento</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Fornecedor</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Mês</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Categoria</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Valor</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Nenhum pagamento encontrado</td></tr>
                ) : pagamentos.map(p => (
                  <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-600 whitespace-nowrap">{fmtData(p.data_vencimento)}</td>
                    <td className="px-4 py-2.5 text-gray-900 max-w-[220px] truncate" title={p.fornecedor}>{p.fornecedor}</td>
                    <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap text-xs">{p.mes_referencia}</td>
                    <td className="px-4 py-2.5 text-gray-500 max-w-[160px] truncate text-xs">{p.categoria.replace(/^\d[\d.]+\s*-\s*/, '')}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">{fmtMoedaCompleto(p.valor)}</td>
                    <td className="px-4 py-2.5">{statusBadge(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {pagamentos.length === 200 && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 text-center">
            Mostrando os primeiros 200 registros — use os filtros para refinar
          </div>
        )}
      </div>
    </div>
  )
}