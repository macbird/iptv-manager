import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import {
  API_ERROR_CODES,
  PaymentProviderDisabledError,
  type ApiErrorBody,
  resolveApiErrorMessage,
} from '@client-manager/shared';
import { EvolutionWhatsAppError } from '../../integrations/whatsapp/evolution/evolution-whatsapp.errors';
import { MetaWhatsAppError } from '../../integrations/whatsapp/meta/meta-whatsapp.errors';
import { PaymentProviderError } from '../../integrations/payment/payment-provider.errors';
import { InvoiceActionError } from '../../modules/billing/invoice-errors';

export interface MappedApiError {
  statusCode: number;
  body: ApiErrorBody;
}

/**
 * Maps known errors to a standard HTTP status and JSON body.
 */
export function mapErrorToApiResponse(error: unknown): MappedApiError {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return {
      statusCode: 400,
      body: {
        message: first?.message ?? 'Dados inválidos',
        code: API_ERROR_CODES.VALIDATION_ERROR,
        details: { issues: error.issues },
      },
    };
  }

  if (error instanceof InvoiceActionError) {
    const statusCode =
      error.code === 'NOT_FOUND' ? 404 : error.code === 'CONFLICT' ? 409 : 400;
    return {
      statusCode,
      body: { message: error.message, code: error.code },
    };
  }

  if (error instanceof PaymentProviderDisabledError) {
    return {
      statusCode: 400,
      body: {
        message: error.message,
        code: error.code,
        details: { provider: error.provider },
      },
    };
  }

  if (error instanceof PaymentProviderError) {
    const statusCode = error.statusCode ?? (error.code === API_ERROR_CODES.PAYMENT_PROVIDER_DISABLED ? 400 : 502);
    return {
      statusCode,
      body: {
        message: error.message,
        code: error.code,
        details: error.provider ? { provider: error.provider } : undefined,
      },
    };
  }

  if (error instanceof EvolutionWhatsAppError) {
    const code =
      error.code === 'NOT_CONFIGURED'
        ? API_ERROR_CODES.WHATSAPP_NOT_CONFIGURED
        : error.code === 'NOT_CONNECTED'
          ? API_ERROR_CODES.WHATSAPP_NOT_CONNECTED
          : API_ERROR_CODES.WHATSAPP_PROVIDER_ERROR;
    const statusCode =
      error.code === 'NOT_CONFIGURED' ? 503 : error.code === 'NOT_CONNECTED' ? 409 : 400;
    return {
      statusCode,
      body: { message: error.message, code },
    };
  }

  if (error instanceof MetaWhatsAppError) {
    return {
      statusCode: 502,
      body: {
        message: error.message,
        code: API_ERROR_CODES.WHATSAPP_PROVIDER_ERROR,
      },
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    return {
      statusCode: 409,
      body: {
        message: 'Registro duplicado. Verifique se o identificador ou e-mail já existe.',
        code: API_ERROR_CODES.CONFLICT,
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      message: resolveApiErrorMessage(
        { code: API_ERROR_CODES.INTERNAL_ERROR },
        'Erro interno. Tente novamente.',
      ),
      code: API_ERROR_CODES.INTERNAL_ERROR,
    },
  };
}
