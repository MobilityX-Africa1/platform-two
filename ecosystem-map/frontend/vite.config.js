import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// This config file lives in frontend/, but the project root (.env,
// backend/api/*.js) is one level up — resolve both from the config file's
// own location rather than process.cwd(), so `vite` behaves the same
// whether it's invoked from the repo root or from inside frontend/.
const frontendDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(frontendDir, '..')

// Runs the real backend/api/*.js handlers inside Vite's own dev server, so
// local dev doesn't require `vercel dev` (and its account login) — the same
// handler files are what Vercel deploys as serverless functions in
// production.
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => { data += chunk })
    req.on('end', () => {
      if (!data) return resolve(undefined)
      try {
        resolve(JSON.parse(data))
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

function vercelApiPlugin(env, routes) {
  return {
    name: 'vercel-api-dev-middleware',
    configureServer(server) {
      for (const [routePath, envVars, modulePath] of routes) {
        // Vite bundles this config file into node_modules/.vite-temp/ before
        // running it, so a dynamic import() with a *variable* specifier
        // resolves relative to that temp location, not the project root —
        // resolve to an absolute file:// URL from repoRoot to sidestep that.
        const moduleUrl = pathToFileURL(path.resolve(repoRoot, modulePath)).href
        server.middlewares.use(routePath, async (req, res) => {
          for (const key of envVars) {
            if (!process.env[key]) process.env[key] = env[key]
          }

          const { default: handler } = await import(moduleUrl)
          const url = new URL(req.url, 'http://localhost')
          req.query = Object.fromEntries(url.searchParams)
          if (req.method === 'POST') {
            try {
              req.body = await readJsonBody(req)
            } catch {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Invalid JSON body' }))
              return
            }
          }
          res.status = (code) => {
            res.statusCode = code
            return res
          }
          res.json = (body) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(body))
          }

          try {
            await handler(req, res)
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: e.message }))
          }
        })
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '')
  return {
    root: frontendDir,
    build: {
      outDir: path.resolve(repoRoot, 'dist'),
      emptyOutDir: true,
    },
    plugins: [
      react(),
      vercelApiPlugin(env, [
        ['/api/notion', ['NOTION_TOKEN'], 'backend/api/notion.js'],
        ['/api/chat', ['NOTION_TOKEN', 'GEMINI_API_KEY'], 'backend/api/chat.js'],
      ]),
    ],
  }
})
