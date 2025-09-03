/**
 * API Client Utility
 * Simple wrapper around fetch for consistent API calls
 */

interface ApiResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  json(): Promise<T>;
  text(): Promise<string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  private async request(
    url: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse> {
    const fullUrl = `${this.baseUrl}${url}`;
    
    const response = await fetch(fullUrl, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    });

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      json: () => response.json(),
      text: () => response.text(),
    };
  }

  async get(url: string): Promise<ApiResponse> {
    return this.request(url, { method: 'GET' });
  }

  async post(url: string, data?: Record<string, unknown>): Promise<ApiResponse> {
    return this.request(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(url: string, data?: Record<string, unknown>): Promise<ApiResponse> {
    return this.request(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(url: string): Promise<ApiResponse> {
    return this.request(url, { method: 'DELETE' });
  }

  async patch(url: string, data?: Record<string, unknown>): Promise<ApiResponse> {
    return this.request(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// Export default instance
export const apiClient = new ApiClient();
