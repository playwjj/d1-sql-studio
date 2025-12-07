import { Env, ApiKeyData } from './types';

// API Key cache configuration
interface CachedApiKey {
  valid: boolean;
  timestamp: number;
}

const apiKeyCache = new Map<string, CachedApiKey>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Note: Cache cleanup is not needed in Workers - instances restart periodically
// and stale entries are ignored during TTL check

// Generate a random API key
export function generateApiKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Store an API key in KV
export async function createApiKey(env: Env, name: string, description?: string): Promise<ApiKeyData> {
  if (!env.API_KEYS) {
    throw new Error('API_KEYS KV namespace not bound');
  }

  // Check if name already exists
  const existingKey = await env.API_KEYS.get(`name:${name}`);
  if (existingKey) {
    throw new Error('An API key with this name already exists');
  }

  const key = generateApiKey();
  const keyData: ApiKeyData = {
    key,
    name,
    description,
    createdAt: new Date().toISOString(),
  };

  // Store the key data with the key as the KV key
  await env.API_KEYS.put(`key:${key}`, JSON.stringify(keyData));

  // Store name to key mapping
  await env.API_KEYS.put(`name:${name}`, key);

  // Also maintain a list of all key names for listing purposes
  const keysList = await getAllKeysList(env);
  keysList.push(name);
  await env.API_KEYS.put('keys:list', JSON.stringify(keysList));

  // Clear cache for new key (precautionary)
  apiKeyCache.delete(key);

  return keyData;
}

// Validate an API key with caching (read-only, no KV writes)
export async function validateApiKey(env: Env, key: string): Promise<boolean> {
  if (!env.API_KEYS) {
    // Fallback to environment variable if KV not bound
    return key === (env.API_KEY || 'dev-api-key-change-in-production');
  }

  const now = Date.now();

  // Check cache first
  const cached = apiKeyCache.get(key);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    // Cache hit - return immediately
    return cached.valid;
  }

  // Cache miss - fetch from KV
  const keyData = await env.API_KEYS.get(`key:${key}`);

  // Cache the result (both positive and negative)
  const isValid = keyData !== null;
  apiKeyCache.set(key, {
    valid: isValid,
    timestamp: now,
  });

  return isValid;
}

// Get all API keys (without exposing full key values)
export async function listApiKeys(env: Env): Promise<Omit<ApiKeyData, 'key'>[]> {
  if (!env.API_KEYS) {
    throw new Error('API_KEYS KV namespace not bound');
  }

  const namesList = await getAllKeysList(env);
  const keys: Omit<ApiKeyData, 'key'>[] = [];

  for (const name of namesList) {
    const keyValue = await env.API_KEYS.get(`name:${name}`);
    if (keyValue) {
      const keyData = await env.API_KEYS.get(`key:${keyValue}`);
      if (keyData) {
        const data: ApiKeyData = JSON.parse(keyData);
        keys.push({
          name: data.name,
          description: data.description,
          createdAt: data.createdAt,
        });
      }
    }
  }

  return keys;
}

// Delete an API key by name
export async function deleteApiKey(env: Env, name: string): Promise<boolean> {
  if (!env.API_KEYS) {
    throw new Error('API_KEYS KV namespace not bound');
  }

  // Get the key value from the name
  const keyValue = await env.API_KEYS.get(`name:${name}`);
  if (!keyValue) {
    throw new Error('API key not found');
  }

  // Remove both the key and name mappings
  await env.API_KEYS.delete(`key:${keyValue}`);
  await env.API_KEYS.delete(`name:${name}`);

  // Update the list
  const keysList = await getAllKeysList(env);
  const updatedList = keysList.filter(k => k !== name);
  await env.API_KEYS.put('keys:list', JSON.stringify(updatedList));

  // Clear cache for deleted key
  apiKeyCache.delete(keyValue);

  return true;
}

// Check if any API keys exist
export async function hasAnyApiKeys(env: Env): Promise<boolean> {
  if (!env.API_KEYS) {
    return false;
  }

  const keysList = await getAllKeysList(env);
  return keysList.length > 0;
}

// Helper function to get the list of all keys
async function getAllKeysList(env: Env): Promise<string[]> {
  if (!env.API_KEYS) {
    return [];
  }

  const listData = await env.API_KEYS.get('keys:list');
  return listData ? JSON.parse(listData) : [];
}
