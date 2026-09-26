import { ApiResponse } from '@swastyasetu/shared';

const envApiUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const API_BASE = envApiUrl ? (envApiUrl.endsWith('/api') ? envApiUrl : `${envApiUrl}/api`) : '/api';

export function getApiAssetUrl(assetPath: string): string {
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath)) return assetPath;

  const apiOrigin = envApiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
  const normalizedPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  return apiOrigin ? `${apiOrigin}${normalizedPath}` : normalizedPath;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('swastyasetu_auth_token');

  const isMultipartRequest = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isMultipartRequest ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  };

  if (isMultipartRequest) {
    delete headers['Content-Type'];
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {
        error: {
          code: `HTTP_${response.status}`,
          message: text?.slice(0, 150) || `Request failed with status ${response.status}`,
        },
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || {
          code: `HTTP_${response.status}`,
          message: data.message || `Request failed with status ${response.status}`,
        },
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Unable to connect to backend service. Running in offline/fallback mode.',
      },
    };
  }
}
