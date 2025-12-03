import { Env } from './types';
import { authenticate, corsHeaders } from './auth';
import { Router } from './router';
import { getAdminUI } from './ui';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    const url = new URL(request.url);

    if (url.pathname === '/' || url.pathname === '') {
      return new Response(getAdminUI(), {
        headers: {
          'Content-Type': 'text/html',
          ...corsHeaders(),
        },
      });
    }

    if (url.pathname.startsWith('/api/')) {
      if (!authenticate(request, env)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders(),
            },
          }
        );
      }

      try {
        const router = new Router(env);
        const response = await router.route(request);

        const newHeaders = new Headers(response.headers);
        Object.entries(corsHeaders()).forEach(([key, value]) => {
          newHeaders.set(key, value);
        });

        return new Response(response.body, {
          status: response.status,
          headers: newHeaders,
        });
      } catch (error: any) {
        if (error.message === 'DATABASE_NOT_BOUND') {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'DATABASE_NOT_BOUND',
              message: 'No D1 database is bound to this Worker. Please bind a database in Cloudflare Dashboard.'
            }),
            {
              status: 503,
              headers: {
                'Content-Type': 'application/json',
                ...corsHeaders(),
              },
            }
          );
        }
        throw error;
      }
    }

    return new Response('Not found', { status: 404 });
  },
};
