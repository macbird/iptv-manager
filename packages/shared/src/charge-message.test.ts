import { describe, expect, it } from 'vitest';
import {
  buildBillingChargeMessage,
  buildChargeMessagesFromTemplates,
  buildDefaultOverdueChargeMessages,
  DEFAULT_CHARGE_MESSAGE_TEMPLATES,
  parseOverdueChargeMessages,
  renderChargeMessageTemplate,
  resolveOverdueReminderTemplates,
  resolveOverdueReminderWindowDays,
  serializeOverdueChargeMessages,
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

describe('parseOverdueChargeMessages', () => {
  it('testParseOverdueChargeMessages_whenEmpty_shouldReturnDefaults', () => {
    const parsed = parseOverdueChargeMessages(null);
    expect(parsed.generic.templates.length).toBeGreaterThan(0);
    expect(parsed.windows.length).toBeGreaterThan(0);
    expect(parsed.windows.find((w) => w.daysAfterDue === 1)?.templates.length).toBeGreaterThan(0);
    expect(parsed.windows.find((w) => w.daysAfterDue === 7)?.templates.length).toBeGreaterThan(0);
  });

  it('testParseOverdueChargeMessages_whenCustomWindow_shouldOverrideDayTemplate', () => {
    const parsed = parseOverdueChargeMessages({
      subscriptionOverdueDay1: ['Custom D+1', '{{pix}}'],
    });

    expect(parsed.windows.find((w) => w.daysAfterDue === 1)?.templates[0]).toBe('Custom D+1');
  });

  it('testParseOverdueChargeMessages_whenWindowsArray_shouldUseWindows', () => {
    const parsed = parseOverdueChargeMessages({
      windows: [{ daysAfterDue: 20, templates: ['D+20 msg', '{{pix}}'] }],
    });

    expect(parsed.windows).toHaveLength(1);
    expect(parsed.windows[0].daysAfterDue).toBe(20);
    expect(parsed.windows[0].templates[0]).toBe('D+20 msg');
  });
});

describe('serializeOverdueChargeMessages', () => {
  it('testSerializeOverdueChargeMessages_shouldUseExpectedKeys', () => {
    const defaults = buildDefaultOverdueChargeMessages();
    const serialized = serializeOverdueChargeMessages(defaults);

    expect(serialized.subscriptionOverdue).toBeDefined();
    expect(serialized.subscriptionOverdueDay1).toBeDefined();
    expect(serialized.subscriptionOverdueDay7).toBeDefined();
    expect(serialized.subscriptionOverdueDay15).toBeDefined();
  });
});

describe('resolveOverdueReminderWindowDays', () => {
  it('testResolveOverdueReminderWindowDays_whenWindowsPresent_shouldPreferTemplates', () => {
    const days = resolveOverdueReminderWindowDays(
      { windows: [{ daysAfterDue: 20, templates: ['D+20'] }] },
      [1, 7, 15],
    );

    expect(days).toEqual([20]);
  });

  it('testResolveOverdueReminderWindowDays_whenNoWindows_shouldFallbackToAutomationDays', () => {
    const days = resolveOverdueReminderWindowDays(null, [15, 1, 7]);

    expect(days).toEqual([1, 7, 15]);
  });
});

describe('resolveOverdueReminderTemplates', () => {
  it('testResolveOverdueReminderTemplates_whenWindowTemplateExists_shouldPreferWindow', () => {
    const templates = resolveOverdueReminderTemplates({
      windowDaysAfterDue: 7,
      tenantOverdueTemplates: {
        subscriptionOverdueDay7: ['Window 7 only', '{{pix}}'],
        subscriptionOverdue: ['Generic', '{{pix}}'],
      },
    });

    expect(templates[0]).toBe('Window 7 only');
  });
});
