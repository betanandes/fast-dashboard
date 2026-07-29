import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { buscarTodosChamados, ErroSults, validarSessaoSupabase, type SultsServerEnv } from './server/sultsTickets'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') as SultsServerEnv
  return {
    plugins: [
      react(),
      {
        name: 'sults-api-local',
        configureServer(server) {
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
