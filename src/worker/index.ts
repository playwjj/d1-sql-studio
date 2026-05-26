import { Hono } from 'hono';
import type { Env } from './types';
import { authenticate, corsHeaders } from './auth';
import { Router } from './router';
import { safeJsonStringify } from './utils';

const app = new Hono<{ Bindings: Env }>();

// CORS preflight
app.options('*', (c) => new Response(null, { headers: corsHeaders(c.req.raw) }));

// Root redirect to dashboard
app.get('/', (c) => c.redirect('/dashboard', 302));

// Serve SPA index.html for /dashboard and all sub-paths (Vue history mode)
app.get('/dashboard', async (c) => {
  const { origin } = new URL(c.req.url);
  return c.env.ASSETS.fetch(new Request(`${origin}/`));
});
app.get('/dashboard/*', async (c) => {
  const { origin } = new URL(c.req.url);
  return c.env.ASSETS.fetch(new Request(`${origin}/`));
});

// Auth middleware for API routes
app.use('/api/*', async (c, next) => {
  const isKeysStatus = c.req.path === '/api/keys/status' && c.req.method === 'GET';
  const isFirstKey = c.req.path === '/api/keys' && c.req.method === 'POST';
  if (!isKeysStatus && !isFirstKey && !(await authenticate(c.req.raw, c.env))) {
    return new Response(
      safeJsonStringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders(c.req.raw) } }
    );
  }
  return next();
});

// API routes
app.all('/api/*', async (c) => {
  try {
    const router = new Router(c.env);
    const response = await router.route(c.req.raw);
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders(c.req.raw)).forEach(([k, v]) => headers.set(k, v));
    return new Response(response.body, { status: response.status, headers });
  } catch (error: any) {
    if (error.message === 'DATABASE_NOT_BOUND') {
      return new Response(
        safeJsonStringify({
          success: false,
          error: 'DATABASE_NOT_BOUND',
          message: 'No D1 database is bound to this Worker. Please bind a database in Cloudflare Dashboard.',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...corsHeaders(c.req.raw) } }
      );
    }
    throw error;
  }
});

// Static assets fallback
app.get('*', (c) => c.env.ASSETS.fetch(c.req.raw));

export default app;
