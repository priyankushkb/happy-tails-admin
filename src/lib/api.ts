import { ENV } from '@/lib/env';
import { getToken } from '@/lib/token';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: {
    code?: string;
    message?: string;
  };
};

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request timed out after ${ms}ms`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token =
    typeof window !== 'undefined' ? getToken() : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const url = `${ENV.API_URL}${path}`;

  const response = await withTimeout(
    fetch(url, {
      ...options,
      headers,
    }),
    10000
  );

  const rawText = await response.text();

  let json: ApiResponse<T> | null = null;

  try {
    json = JSON.parse(rawText) as ApiResponse<T>;
  } catch {
    throw new Error(
      `Expected JSON but received non-JSON response from ${url}. Response starts with: ${rawText.slice(0, 80)}`
    );
  }

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Request failed');
  }

  return json.data;
}