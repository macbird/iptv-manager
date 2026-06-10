import { describe, expect, it } from 'vitest';
import {
  buildBillingChargeMessage,
  buildChargeMessagesFromTemplates,
  DEFAULT_CHARGE_MESSAGE_TEMPLATES,
  renderChargeMessageTemplate,
} from './charge-message';

describe('renderChargeMessageTemplate', () => {
  it('replaces placeholders with invoice data', () => {
    const rendered = renderChargeMessageTemplate(
      'Olá, {{nome}}! Valor {{valor}} ciclo {{ciclo}}',
      {
        payerName: 'Maria Silva',
        tenantName: 'Toro TV',
        invoice: {
          pixCopyPaste: '000201PIX',
          amountCents: 4990,
          billingCycleKey: '2026-06',
          dueDate: '2026-06-15',
        },
      },
    );

    expect(rendered).toContain('Maria Silva');
    expect(rendered).toContain('R$');
    expect(rendered).toContain('2026-06');
  });

  it('returns only pix code when template is {{pix}}', () => {
    const rendered = renderChargeMessageTemplate('{{pix}}', {
      payerName: 'Maria',
      tenantName: 'Tenant',
      invoice: {
        pixCopyPaste: '000201PIX',
        amountCents: 1000,
        billingCycleKey: '2026-06',
        dueDate: '2026-06-15',
      },
    });

    expect(rendered).toBe('000201PIX');
  });
});

describe('buildChargeMessagesFromTemplates', () => {
  it('splits default templates into two messages', () => {
    const messages = buildChargeMessagesFromTemplates([...DEFAULT_CHARGE_MESSAGE_TEMPLATES], {
      payerName: 'João',
      tenantName: 'Empresa',
      invoice: {
        pixCopyPaste: '000201PIX',
        amountCents: 5000,
        billingCycleKey: '2026-06',
        dueDate: '2026-06-10',
      },
    });

    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain('João');
    expect(messages[0]).not.toContain('000201PIX');
    expect(messages[1]).toBe('000201PIX');
  });

  it('skips empty rendered templates', () => {
    const messages = buildChargeMessagesFromTemplates(['{{nome}}', '   ', '{{pix}}'], {
      payerName: 'Ana',
      tenantName: 'Empresa',
      invoice: {
        pixCopyPaste: 'ABC',
        amountCents: 100,
        billingCycleKey: '2026-06',
        dueDate: '2026-06-10',
      },
    });

    expect(messages).toEqual(['Ana', 'ABC']);
  });
});

describe('buildBillingChargeMessage', () => {
  it('joins default templates for legacy preview', () => {
    const message = buildBillingChargeMessage({
      payerName: 'Maria Silva',
      invoice: {
        pixCopyPaste: '000201PIX',
        amountCents: 4990,
        billingCycleKey: '2026-06',
        dueDate: new Date('2026-06-15T12:00:00.000Z'),
      },
    });

    expect(message).toContain('Maria Silva');
    expect(message).toContain('000201PIX');
    expect(message).not.toContain('PIX copia e cola');
  });
});
