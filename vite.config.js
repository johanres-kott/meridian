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
          // Read request body for POST/PUT
          let body = null;
          if (req.method === 'POST' || req.method === 'PUT') {
            body = await new Promise((resolve, reject) => {
              let data = '';
              req.on('data', chunk => { data += chunk; });
              req.on('end', () => {
                try { resolve(JSON.parse(data)); } catch { resolve(data); }
              });
              req.on('error', reject);
            });
          }

          // Clear module cache for hot reload
          const mod = await import(`${fnPath}?t=${Date.now()}`);
          const handler = mod.default;

          const fakeReq = {
            method: req.method,
            url: req.url,
            headers: req.headers,
            query: Object.fromEntries(parsed.searchParams),
            body,
          };

          const fakeRes = {
            statusCode: 200,
            _headers: {},
            _headersSent: false,
            setHeader(k, v) { this._headers[k] = v; },
            status(code) { this.statusCode = code; return this; },
            json(data) {
              if (this._headersSent) return;
              this._headersSent = true;
              res.writeHead(this.statusCode, { 'Content-Type': 'application/json', ...this._headers });
              res.end(JSON.stringify(data));
            },
            end(data) {
              if (!this._headersSent) {
                this._headersSent = true;
                res.writeHead(this.statusCode, this._headers);
              }
              res.end(data);
            },
            write(data) {
              if (!this._headersSent) {
                this._headersSent = true;
                res.writeHead(this.statusCode, this._headers);
              }
              res.write(data);
            },
            get headersSent() { return this._headersSent; },
          };

          await handler(fakeReq, fakeRes);
        } catch (e) {
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: e.message }));
          }
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
