import { Env } from './types';
import { authenticate, corsHeaders } from './auth';
import { Router } from './router';
import { safeJsonStringify } from './utils';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders(request) });
    }

    if (url.pathname.startsWith('/api/')) {
      const isKeysStatusCheck = url.pathname === '/api/keys/status' && request.method === 'GET';
      const isFirstKeyCreation = url.pathname === '/api/keys' && request.method === 'POST';

      if (!isKeysStatusCheck && !isFirstKeyCreation) {
        if (!(await authenticate(request, env))) {
          return new Response(
            safeJsonStringify({ success: false, error: 'Unauthorized' }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
            }
          );
        }
      }

      try {
        const router = new Router(env);
        const response = await router.route(request);
        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders(request)).forEach(([key, value]) => newHeaders.set(key, value));
        return new Response(response.body, { status: response.status, headers: newHeaders });
      } catch (error: any) {
        if (error.message === 'DATABASE_NOT_BOUND') {
          return new Response(
            safeJsonStringify({
              success: false,
              error: 'DATABASE_NOT_BOUND',
              message: 'No D1 database is bound to this Worker. Please bind a database in Cloudflare Dashboard.',
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json', ...corsHeaders(request) },
            }
          );
        }
        throw error;
      }
    }

    if (url.pathname === '/') {
      return Response.redirect(`${url.origin}/dashboard`, 302);
    }

    // Serve index.html for all /dashboard paths (Vue history mode)
    if (url.pathname === '/dashboard' || url.pathname.startsWith('/dashboard/')) {
      return env.ASSETS.fetch(new Request(`${url.origin}/`, request));
    }

    return env.ASSETS.fetch(request);
  },
};
