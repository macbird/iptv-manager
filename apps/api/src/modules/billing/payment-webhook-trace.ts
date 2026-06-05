export interface WebhookRequestSummary {
  httpMethod: string;
  hasBody: boolean;
  queryKeys: string[];
  headerKeys: string[];
  xRequestId: string | null;
  hasXSignature: boolean;
}

/**
 * Collects step-by-step diagnostics for webhook troubleshooting.
 */
export class PaymentWebhookTrace {
  private readonly steps: string[] = [];

  add(step: string): void {
    this.steps.push(step);
  }

  getSteps(): string[] {
    return [...this.steps];
  }

  toDetail(extra?: Record<string, unknown>): Record<string, unknown> {
    return {
      steps: this.steps,
      ...extra,
    };
  }
}

/**
 * Builds a safe request summary without leaking secrets.
 */
export function buildWebhookRequestSummary(input: {
  httpMethod: string;
  body: unknown;
  query: Record<string, unknown>;
  headers: Record<string, string | string[] | undefined>;
}): WebhookRequestSummary {
  const normalizedHeaders = Object.keys(input.headers).map((key) => key.toLowerCase());
  const xRequestId = input.headers['x-request-id'];
  const xSignature = input.headers['x-signature'];

  return {
    httpMethod: input.httpMethod,
    hasBody: input.body !== null && input.body !== undefined,
    queryKeys: Object.keys(input.query),
    headerKeys: normalizedHeaders,
    xRequestId: typeof xRequestId === 'string' ? xRequestId : null,
    hasXSignature: typeof xSignature === 'string' && xSignature.length > 0,
  };
}
