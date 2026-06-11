import { describe, expect, it } from 'vitest';
import { getApiErrorMessage, resolveApiErrorMessage } from './api-error-codes';

describe('resolveApiErrorMessage', () => {
  it('testResolveApiErrorMessage_whenMessagePresent_shouldReturnMessage', () => {
    expect(resolveApiErrorMessage({ message: 'Credencial inválida' })).toBe('Credencial inválida');
  });

  it('testResolveApiErrorMessage_whenCodeKnown_shouldReturnMappedFallback', () => {
    expect(resolveApiErrorMessage({ code: 'WHATSAPP_NOT_CONNECTED' })).toContain('não conectado');
  });
});

describe('getApiErrorMessage', () => {
  it('testGetApiErrorMessage_whenAxiosLikeError_shouldReadResponseBody', () => {
    const error = {
      response: { data: { message: 'Fatura já está paga', code: 'NOT_ALLOWED' } },
      message: 'Request failed with status code 400',
    };

    expect(getApiErrorMessage(error, 'Erro ao gerar PIX')).toBe('Fatura já está paga');
  });

  it('testGetApiErrorMessage_whenPlainError_shouldUseMessage', () => {
    expect(getApiErrorMessage(new Error('Falha de rede'), 'fallback')).toBe('Falha de rede');
  });

  it('testGetApiErrorMessage_whenAxiosGenericMessage_shouldUseFallback', () => {
    const error = {
      response: { data: {}, status: 400 },
      message: 'Request failed with status code 400',
    };
    expect(getApiErrorMessage(error, 'Erro ao gerar PIX')).toBe('Erro ao gerar PIX');
  });
});
