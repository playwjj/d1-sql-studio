import { Env } from './types';

// Default API key for development - CHANGE THIS in production via environment variables
const DEFAULT_API_KEY = 'dev-api-key-change-in-production';

export function authenticate(request: Request, env: Env): boolean {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return false;
  }

  const token = authHeader.replace('Bearer ', '');
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
