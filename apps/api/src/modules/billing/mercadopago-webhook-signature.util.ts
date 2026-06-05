import { createHmac, timingSafeEqual } from 'node:crypto';

export interface MercadoPagoSignatureInput {
  secret: string;
  xSignature: string | undefined;
  xRequestId: string | undefined;
  dataId: string | null;
  maxAgeSeconds?: number;
}

export interface MercadoPagoSignatureResult {
  valid: boolean;
  skipped: boolean;
  reason?: string;
  ts?: string;
}

function parseXSignature(header: string): { ts: string | null; v1: string | null } {
  let ts: string | null = null;
  let v1: string | null = null;

  for (const part of header.split(',')) {
    const [key, value] = part.split('=');
    if (!key || value === undefined) continue;
    const normalized = key.trim();
    if (normalized === 'ts') ts = value.trim();
    if (normalized === 'v1') v1 = value.trim();
  }

  return { ts, v1 };
}

function safeCompareHex(expected: string, received: string): boolean {
  try {
    const expectedBuf = Buffer.from(expected, 'hex');
    const receivedBuf = Buffer.from(received, 'hex');
    if (expectedBuf.length !== receivedBuf.length) return false;
    return timingSafeEqual(expectedBuf, receivedBuf);
  } catch {
    return false;
  }
}

/**
 * Verifies Mercado Pago webhook `x-signature` header (HMAC-SHA256).
 */
export function verifyMercadoPagoWebhookSignature(
  input: MercadoPagoSignatureInput,
): MercadoPagoSignatureResult {
  if (!input.secret) {
    return { valid: true, skipped: true, reason: 'secret_not_configured' };
  }

  if (!input.xSignature) {
    return { valid: false, skipped: false, reason: 'missing_x_signature' };
  }

  if (!input.xRequestId) {
    return { valid: false, skipped: false, reason: 'missing_x_request_id' };
  }

  if (!input.dataId) {
    return { valid: false, skipped: false, reason: 'missing_data_id' };
  }

  const { ts, v1 } = parseXSignature(input.xSignature);
  if (!ts || !v1) {
    return { valid: false, skipped: false, reason: 'invalid_x_signature_format' };
  }

  const maxAge = input.maxAgeSeconds ?? 300;
  const tsNumber = Number(ts);
  if (!Number.isFinite(tsNumber)) {
    return { valid: false, skipped: false, reason: 'invalid_timestamp' };
  }

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - tsNumber);
  if (ageSeconds > maxAge) {
    return { valid: false, skipped: false, reason: 'timestamp_expired', ts };
  }

  const manifest = `id:${input.dataId};request-id:${input.xRequestId};ts:${ts};`;
  const expected = createHmac('sha256', input.secret).update(manifest).digest('hex');
  const valid = safeCompareHex(expected, v1);

  return valid
    ? { valid: true, skipped: false, ts }
    : { valid: false, skipped: false, reason: 'signature_mismatch', ts };
}
