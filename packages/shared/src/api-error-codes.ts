/**
 * Standard API error response body.
 */
export interface ApiErrorBody {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

/** Machine-readable error codes returned by the API. */
export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  NOT_ALLOWED: 'NOT_ALLOWED',
  CONFLICT: 'CONFLICT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  PAYMENT_PROVIDER_DISABLED: 'PAYMENT_PROVIDER_DISABLED',
  PAYMENT_CREDENTIALS_MISSING: 'PAYMENT_CREDENTIALS_MISSING',
  PAYMENT_PROVIDER_ERROR: 'PAYMENT_PROVIDER_ERROR',
  WHATSAPP_NOT_CONFIGURED: 'WHATSAPP_NOT_CONFIGURED',
  WHATSAPP_NOT_CONNECTED: 'WHATSAPP_NOT_CONNECTED',
  WHATSAPP_PROVIDER_ERROR: 'WHATSAPP_PROVIDER_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

const FALLBACK_MESSAGES: Partial<Record<ApiErrorCode, string>> = {
  [API_ERROR_CODES.PAYMENT_PROVIDER_DISABLED]:
    'Este provedor de pagamento não está disponível. Use Mercado Pago.',
  [API_ERROR_CODES.PAYMENT_CREDENTIALS_MISSING]:
    'Credencial do Mercado Pago não configurada. Configure em Configurações.',
  [API_ERROR_CODES.WHATSAPP_NOT_CONFIGURED]:
    'WhatsApp não configurado. Verifique as variáveis e credenciais em Configurações.',
  [API_ERROR_CODES.WHATSAPP_NOT_CONNECTED]:
    'WhatsApp não conectado. Escaneie o QR ou use o código de pareamento em Configurações.',
  [API_ERROR_CODES.INTERNAL_ERROR]: 'Erro interno. Tente novamente.',
};

/**
 * Resolves a user-facing message from an API error payload or code.
 */
export function resolveApiErrorMessage(
  payload: unknown,
  fallback = 'Erro inesperado',
): string {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === 'string' && record.error.trim()) {
      return record.error;
    }
    if (typeof record.code === 'string') {
      const mapped = FALLBACK_MESSAGES[record.code as ApiErrorCode];
      if (mapped) return mapped;
    }
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Extracts a user-facing message from an unknown error (e.g. Axios or fetch).
 */
export function getApiErrorMessage(error: unknown, fallback = 'Erro inesperado'): string {
  if (isRecord(error) && isRecord(error.response)) {
    const fromBody = resolveApiErrorMessage(error.response.data, '');
    if (fromBody) return fromBody;
  }

  if (error instanceof Error) {
    if (error.message && error.message !== 'Network Error') {
      return error.message;
    }
  }

  return fallback;
}

/**
 * Extracts API error code from an unknown error when present.
 */
export function getApiErrorCode(error: unknown): string | undefined {
  if (!isRecord(error) || !isRecord(error.response)) {
    return undefined;
  }
  const data = error.response.data;
  if (!isRecord(data) || typeof data.code !== 'string') {
    return undefined;
  }
  return data.code;
}
