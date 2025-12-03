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

export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
