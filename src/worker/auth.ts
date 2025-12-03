import { Env } from './types';
import { validateApiKey } from './apikeys';

// Default API key for development - CHANGE THIS in production via environment variables
const DEFAULT_API_KEY = 'dev-api-key-change-in-production';

export async function authenticate(request: Request, env: Env): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '');

  // Try KV-based validation first
  if (env.API_KEYS) {
    return await validateApiKey(env, token);
  }

  // Fallback to environment variable
  const apiKey = env.API_KEY || DEFAULT_API_KEY;
  return token === apiKey;
}

export function getApiKey(env: Env): string {
  return env.API_KEY || DEFAULT_API_KEY;
}

export function corsHeaders(request?: Request) {
  const origin = request?.headers.get('Origin');
  const requestUrl = request ? new URL(request.url) : null;

  // 只允许同源请求（UI和API在同一域名）
  // 如果Origin和请求的host相同，或者没有Origin（同源请求通常不带Origin）
  const allowedOrigin = origin && requestUrl && origin === `${requestUrl.protocol}//${requestUrl.host}`
    ? origin
    : 'null'; // 'null'表示不允许跨域

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
