/**
 * Utility to manage client-side storage of the user's Google AI Studio API key
 * and provide appropriate headers to server-side AI proxy routes.
 */

const STORAGE_KEY = 'atlas_gemini_api_key';

export type ApiKeyFormat = 'latest-aq' | 'classic-aiza' | 'custom' | 'none';

export interface KeyFormatInfo {
  format: ApiKeyFormat;
  label: string;
  badge: string;
  isLatest: boolean;
  isValidSyntax: boolean;
  hint: string;
}

/**
 * Strips whitespace, quotes, and newlines from user input key
 */
export function cleanApiKey(rawKey?: string): string {
  if (!rawKey) return '';
  return rawKey.trim().replace(/^["']|["']$/g, '').trim();
}

/**
 * Detects whether key is the latest Google AI Studio format (AQ.Ab...),
 * classic Google API format (AIzaSy...), or other custom key.
 */
export function detectApiKeyFormat(key?: string): KeyFormatInfo {
  const clean = cleanApiKey(key);
  if (!clean) {
    return {
      format: 'none',
      label: 'No Key Configured',
      badge: 'Unset',
      isLatest: false,
      isValidSyntax: false,
      hint: 'Supports newest Google AI Studio key format (AQ.Ab...) and classic format (AIzaSy...)',
    };
  }

  if (clean.startsWith('AQ.') || clean.startsWith('AQ')) {
    return {
      format: 'latest-aq',
      label: 'Latest Google AI Studio Key',
      badge: 'AQ.Ab... Format',
      isLatest: true,
      isValidSyntax: clean.length >= 15,
      hint: 'Verified format: New Google AI Studio / GCP API Key specification (AQ.Ab...)',
    };
  }

  if (clean.startsWith('AIza')) {
    return {
      format: 'classic-aiza',
      label: 'Classic Google API Key',
      badge: 'AIzaSy... Format',
      isLatest: false,
      isValidSyntax: clean.length >= 25,
      hint: 'Verified format: Classic Google Cloud API Key specification (AIzaSy...)',
    };
  }

  return {
    format: 'custom',
    label: 'Custom / Proxy Key',
    badge: 'Custom Format',
    isLatest: false,
    isValidSyntax: clean.length >= 8,
    hint: 'Custom API key format detected',
  };
}

/**
 * Generates safe masked representation (e.g. AQ.Ab••••89ef or AIza••••x912)
 */
export function maskApiKey(key?: string): string {
  const clean = cleanApiKey(key);
  if (!clean) return '';
  if (clean.length <= 8) return '••••••••';
  const prefix = clean.startsWith('AQ.') ? 'AQ.Ab' : clean.startsWith('AIza') ? 'AIza' : clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `${prefix}••••${suffix}`;
}

export function getStoredGeminiApiKey(): string {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? cleanApiKey(raw) : '';
  } catch {
    return '';
  }
}

export function setStoredGeminiApiKey(key: string): void {
  try {
    const clean = cleanApiKey(key);
    if (!clean) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, clean);
    }
  } catch {}
}

export function getAiHeaders(customKey?: string): Record<string, string> {
  const raw = customKey !== undefined ? customKey : getStoredGeminiApiKey();
  const key = cleanApiKey(raw);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (key && key.length > 0) {
    headers['x-gemini-api-key'] = key;
  }
  return headers;
}

