import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function localApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: 'local-api-solve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== '/api/solve') return next();

        process.env.GROQ_API_KEY = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
        process.env.GROQ_MODEL = env.GROQ_MODEL || process.env.GROQ_MODEL;
        process.env.GROQ_VISION_MODEL = env.GROQ_VISION_MODEL || process.env.GROQ_VISION_MODEL;
        process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
        process.env.GEMINI_MODEL = env.GEMINI_MODEL || process.env.GEMINI_MODEL;

        let raw = '';
        for await (const chunk of req) raw += chunk;

        let body: Record<string, unknown> = {};
        try {
          body = raw ? JSON.parse(raw) : {};
        } catch {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Invalid JSON request body.' }));
          return;
        }

        const vercelRes = {
          status(code: number) {
            res.statusCode = code;
            return vercelRes;
          },
          json(data: unknown) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          },
        };

        try {
          const mod = await server.ssrLoadModule('/api/solve.ts');
          await mod.default({ method: req.method, body }, vercelRes);
        } catch (err) {
          console.error('Local /api/solve error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Local API handler crashed.' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss(), localApiPlugin(env)],
  };
});