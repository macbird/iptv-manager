import React from 'react';
import { BookOpen, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { APP_NAME } from '@client-manager/shared';
import { Modal } from '../../../shared/ui/modals/Modal';
import { primaryButtonClass } from '../../../shared/ui/buttons/button-styles';
import { showToast } from '../../../shared/utils/toast';

const MP_DEVELOPERS_URL = 'https://www.mercadopago.com.br/developers/panel/app';

export type MercadoPagoHelpFocus = 'overview' | 'webhook';

interface MercadoPagoIntegrationHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl?: string | null;
  /** Scroll to webhook section when opened from "Como configurar?" link. */
  focus?: MercadoPagoHelpFocus;
}

function StepBadge({ number }: { number: number }): React.ReactElement {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-form-primary/10 text-xs font-bold text-form-primary">
      {number}
    </span>
  );
}

export const MercadoPagoIntegrationHelpModal: React.FC<MercadoPagoIntegrationHelpModalProps> = ({
  isOpen,
  onClose,
  webhookUrl,
  focus = 'overview',
}) => {
  const webhookSectionRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!isOpen || focus !== 'webhook') return;
    const timer = window.setTimeout(() => {
      webhookSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [isOpen, focus]);

  const copyWebhookUrl = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    showToast.success('URL do webhook copiada');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Como integrar o Mercado Pago"
      size="2xl"
      footer={
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className={primaryButtonClass}>
            Entendi, fechar
          </button>
        </div>
      }
    >
      <div className="space-y-6 text-sm text-slate-700">
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sky-950">
          Siga os passos abaixo para gerar <strong>PIX</strong> nas faturas do {APP_NAME} e receber
          a confirmação de pagamento automaticamente via webhook.
        </p>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-900">
            <BookOpen className="h-4 w-4 text-form-primary" aria-hidden />
            1. Crie ou selecione uma aplicação
          </h3>
          <div className="flex gap-3 pl-1">
            <StepBadge number={1} />
            <div className="space-y-2">
              <p>
                Acesse o{' '}
                <a
                  href={MP_DEVELOPERS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-form-primary hover:underline"
                >
                  Mercado Pago Developers
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>{' '}
                e abra <strong>Suas integrações</strong>.
              </p>
              <p className="text-xs text-slate-500">
                Se ainda não tiver app, clique em <strong>Criar aplicação</strong>. Use sempre as
                credenciais de <strong>Produção</strong> para cobrar PIX reais dos clientes.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            2. Copie o Access Token
          </h3>
          <div className="flex gap-3 pl-1">
            <StepBadge number={2} />
            <div className="space-y-2">
              <p>
                No menu da aplicação, abra <strong>Credenciais de produção</strong> e copie o{' '}
                <strong>Access Token</strong> (token longo que começa com{' '}
                <code className="rounded bg-slate-100 px-1 font-mono text-xs">APP_USR-</code>).
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
                <p className="font-semibold">Não use estes valores:</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  <li>
                    Token de <strong>teste</strong> (<code className="font-mono">TEST-...</code>) —
                    serve só para sandbox local; em produção gera PIX de teste, não cobrança real.
                  </li>
                  <li>
                    <strong> Public Key</strong> (UUID curto) — serve só para checkout no front-end.
                  </li>
                  <li>
                    Usuário de teste <code className="font-mono">TESTUSER...</code> — é o comprador
                    fictício, não a credencial da integração.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            3. Cole no {APP_NAME} e salve
          </h3>
          <div className="flex gap-3 pl-1">
            <StepBadge number={3} />
            <div className="space-y-2">
              <p>
                Volte em <strong>Configurações → Pagamentos</strong>, cole o Access Token no campo{' '}
                <strong>API Key / Access Token</strong> e clique em <strong>Salvar</strong> no fim da
                página.
              </p>
              <p className="text-xs text-slate-500">
                Depois de salvo, o token não é exibido por segurança — apenas o indicador de que está
                configurado.
              </p>
            </div>
          </div>
        </section>

        <section ref={webhookSectionRef} className="scroll-mt-4 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            4. Configure o webhook (PIX pago)
          </h3>
          <div className="flex gap-3 pl-1">
            <StepBadge number={4} />
            <div className="space-y-3">
              <p>
                O webhook avisa o {APP_NAME} quando um PIX é pago. No Mercado Pago, vá em{' '}
                <strong>Webhooks</strong> (ou <strong>Notificações → Webhooks</strong>) da mesma
                aplicação do token.
              </p>

              {webhookUrl ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600">
                    Cole esta URL no campo <strong>URL de produção</strong> do webhook:
                  </p>
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                    <code className="flex-1 break-all font-mono text-[11px] text-emerald-950">
                      {webhookUrl}
                    </code>
                    <button
                      type="button"
                      onClick={copyWebhookUrl}
                      className="shrink-0 rounded-md border border-emerald-200 bg-white p-2 text-emerald-700 hover:bg-emerald-100"
                      title="Copiar URL"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    A URL usa o <strong>ID da sua conta</strong>. Cadastre exatamente como aparece
                    acima.
                  </p>
                </div>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  URL do webhook indisponível no momento. Verifique se a API está com{' '}
                  <code className="font-mono">API_PUBLIC_BASE_URL</code> configurada e recarregue a
                  página.
                </p>
              )}

              <ol className="list-decimal space-y-1.5 pl-5 text-xs text-slate-600">
                <li>
                  Marque o evento <strong>Payments</strong> (pagamentos).
                </li>
                <li>Salve a configuração.</li>
                <li>
                  Copie a <strong>assinatura secreta</strong> gerada e cole no campo{' '}
                  <strong>Assinatura secreta (Webhook secret)</strong> aqui no {APP_NAME}.
                </li>
              </ol>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                <p className="flex items-start gap-2 font-medium text-slate-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  A assinatura secreta valida o header <code className="font-mono">x-signature</code>{' '}
                  e evita notificações falsas. Recomendado em produção.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            5. Teste a integração
          </h3>
          <div className="flex gap-3 pl-1">
            <StepBadge number={5} />
            <ol className="list-decimal space-y-1.5 pl-5 text-xs text-slate-600">
              <li>Crie ou abra uma fatura e gere o PIX.</li>
              <li>Pague o PIX com valor real (ou peça a um cliente para pagar um valor simbólico).</li>
              <li>
                Em alguns segundos a fatura deve mudar para <strong>paga</strong>. Confira também a
                aba de logs de webhook em Configurações, se algo falhar.
              </li>
            </ol>
          </div>
        </section>
      </div>
    </Modal>
  );
};
