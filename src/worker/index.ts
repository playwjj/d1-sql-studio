import { Env } from './types';
import { authenticate, corsHeaders } from './auth';
import { Router } from './router';
import { getAssetFromKV } from '@cloudflare/kv-asset-handler';

// @ts-ignore
import manifestJSON from '__STATIC_CONTENT_MANIFEST';
const assetManifest = JSON.parse(manifestJSON);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle OPTIONS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    // Handle API routes
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

    // Serve static assets
    try {
      return await getAssetFromKV(
        {
          request,
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        {
          ASSET_NAMESPACE: env.__STATIC_CONTENT,
          ASSET_MANIFEST: assetManifest,
        }
      );
    } catch (e) {
      // If asset not found, return index.html for client-side routing
      if (e instanceof Error && e.message.includes('could not find')) {
        try {
          return await getAssetFromKV(
            {
              request: new Request(`${url.origin}/index.html`, request),
              waitUntil: ctx.waitUntil.bind(ctx),
            },
            {
              ASSET_NAMESPACE: env.__STATIC_CONTENT,
              ASSET_MANIFEST: assetManifest,
            }
          );
        } catch (e) {
          return new Response('Not Found', { status: 404 });
        }
      }
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
