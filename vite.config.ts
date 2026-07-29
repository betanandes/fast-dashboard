import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { buscarCatalogosSults, buscarPessoaSultsRapida, buscarTodosChamados, criarChamado, ErroSults, validarSessaoSupabase, type SultsServerEnv } from './server/sultsTickets'

function lerJson(req: import('node:http').IncomingMessage) {
  return new Promise<Record<string, unknown>>((resolve, reject) => {
    let corpo = ''
    req.on('data', (parte) => { corpo += parte })
    req.on('end', () => { try { resolve(corpo ? JSON.parse(corpo) : {}) } catch (erro) { reject(erro) } })
    req.on('error', reject)
  })
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') as SultsServerEnv
  return {
    plugins: [
      react(),
      {
        name: 'sults-api-local',
        configureServer(server) {
          server.middlewares.use('/api/sults/person', async (req, res) => {
            res.setHeader('Content-Type', 'application/json')
            if (!(await validarSessaoSupabase(req.headers.authorization, env))) { res.statusCode = 401; res.end(JSON.stringify({ erro: 'Sessão inválida' })); return }
            try { const url = new URL(req.url ?? '/', 'http://localhost'); res.statusCode = 200; res.end(JSON.stringify(await buscarPessoaSultsRapida(env, url.searchParams.get('q') ?? ''))) }
            catch (erro) { res.statusCode = erro instanceof ErroSults && erro.status >= 400 && erro.status < 500 ? erro.status : 502; res.end(JSON.stringify({ erro: erro instanceof Error ? erro.message : String(erro) })) }
          })
          server.middlewares.use('/api/sults/catalogs', async (req, res) => {
            res.setHeader('Content-Type', 'application/json')
            if (!(await validarSessaoSupabase(req.headers.authorization, env))) { res.statusCode = 401; res.end(JSON.stringify({ erro: 'Sessão inválida' })); return }
            try { res.statusCode = 200; res.end(JSON.stringify(await buscarCatalogosSults(env))) }
            catch (erro) { res.statusCode = erro instanceof ErroSults && erro.status >= 400 && erro.status < 500 ? erro.status : 502; res.end(JSON.stringify({ erro: erro instanceof Error ? erro.message : String(erro) })) }
          })
          server.middlewares.use('/api/sults/create', async (req, res) => {
            res.setHeader('Content-Type', 'application/json')
            if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ erro: 'Método não permitido' })); return }
            if (!(await validarSessaoSupabase(req.headers.authorization, env))) { res.statusCode = 401; res.end(JSON.stringify({ erro: 'Sessão inválida' })); return }
            try {
              const resultado = await criarChamado(env, await lerJson(req))
              res.statusCode = 201; res.end(JSON.stringify(resultado))
            } catch (erro) {
              res.statusCode = erro instanceof ErroSults && erro.status >= 400 && erro.status < 500 ? erro.status : 502
              res.end(JSON.stringify({ erro: erro instanceof Error ? erro.message : String(erro) }))
            }
          })
          server.middlewares.use('/api/email/send', async (req, res) => {
            res.setHeader('Content-Type', 'application/json')
            if (req.method !== 'POST') { res.statusCode = 405; res.end(JSON.stringify({ erro: 'Método não permitido' })); return }
            if (!(await validarSessaoSupabase(req.headers.authorization, env))) { res.statusCode = 401; res.end(JSON.stringify({ erro: 'Sessão inválida' })); return }
            try {
              if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY não foi configurada no servidor.')
              const corpo = await lerJson(req)
              const resposta = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: env.RESEND_FROM_EMAIL ?? 'Fast TI <onboarding@resend.dev>', to: [corpo.para], subject: corpo.assunto, html: corpo.mensagem, attachments: corpo.anexos }) })
              if (!resposta.ok) throw new Error(`Resend retornou HTTP ${resposta.status}.`)
              res.statusCode = 200; res.end(JSON.stringify({ sucesso: true }))
            } catch (erro) {
              res.statusCode = 502; res.end(JSON.stringify({ erro: erro instanceof Error ? erro.message : String(erro) }))
            }
          })
          server.middlewares.use('/api/sults/tickets', async (req, res) => {
            res.setHeader('Content-Type', 'application/json')
            const auth = req.headers.authorization
            if (!(await validarSessaoSupabase(auth, env))) {
              res.statusCode = 401
              res.end(JSON.stringify({ erro: 'Sessão inválida' }))
              return
            }
            try {
              const url = new URL(req.url ?? '/', 'http://localhost')
              const resultado = await buscarTodosChamados(env, url.searchParams.get('refresh') === 'true', {
                abertoStart: url.searchParams.get('abertoStart') ?? undefined,
                abertoEnd: url.searchParams.get('abertoEnd') ?? undefined,
              })
              res.statusCode = 200
              res.end(JSON.stringify(resultado))
            } catch (erro) {
              res.statusCode = erro instanceof ErroSults && erro.status >= 400 && erro.status < 500 ? erro.status : 502
              res.end(JSON.stringify({ erro: erro instanceof Error ? erro.message : String(erro) }))
            }
          })
        },
      },
    ],
  }
})
