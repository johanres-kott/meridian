import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { URL } from 'url'
import path from 'path'

function vercelApiPlugin() {
  return {
    name: 'vercel-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();

        const parsed = new URL(req.url, 'http://localhost');
        const fnName = parsed.pathname.replace('/api/', '').replace(/\/$/, '');
        const fnPath = path.resolve('api', `${fnName}.js`);

        try {
          // Clear module cache for hot reload
          const mod = await import(`${fnPath}?t=${Date.now()}`);
          const handler = mod.default;

          const fakeReq = {
            method: req.method,
            url: req.url,
            headers: req.headers,
            query: Object.fromEntries(parsed.searchParams),
          };
          const fakeRes = {
            statusCode: 200,
            _headers: {},
            setHeader(k, v) { this._headers[k] = v; },
            status(code) { this.statusCode = code; return this; },
            json(data) {
              res.writeHead(this.statusCode, { 'Content-Type': 'application/json', ...this._headers });
              res.end(JSON.stringify(data));
            },
          };

          await handler(fakeReq, fakeRes);
        } catch (e) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vercelApiPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [],
  },
})
