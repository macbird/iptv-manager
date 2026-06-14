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
    showToast.success('Endereço copiado');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Como conectar o Mercado Pago"
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
          Com o Mercado Pago conectado, o {APP_NAME} <strong>gera o PIX</strong> das faturas e{' '}
          <strong>marca como pago sozinho</strong> quando o cliente paga — você não precisa
          confirmar manualmente.
        </p>

        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-900">
            <BookOpen className="h-4 w-4 text-form-primary" aria-hidden />
            1. Entre no painel do Mercado Pago
          </h3>
          <div className="flex gap-3 pl-1">
            <StepBadge number={1} />
            <div className="space-y-2">
              <p>
                Abra o{' '}
                <a
                  href={MP_DEVELOPERS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-form-primary hover:underline"
                >
                  painel de integrações do Mercado Pago
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>{' '}
                (use a mesma conta em que você recebe os PIX).
              </p>
              <p className="text-xs text-slate-500">
                Se ainda não tiver um “aplicativo” criado, clique em{' '}
                <strong>Criar aplicação</strong>. Para cobrar clientes de verdade, use sempre as
                credenciais de <strong>Produção</strong> — não as de teste.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            2. Copie o código de acesso
          </h3>
          <div className="flex gap-3 pl-1">
            <StepBadge number={2} />
            <div className="space-y-2">
              <p>
                No menu da aplicação, abra <strong>Credenciais de produção</strong> e copie o código
                longo chamado <strong>Access Token</strong> (geralmente começa com{' '}
                <strong>APP_USR-</strong>).
              </p>
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-950">
                <p className="font-semibold">Não copie estes itens por engano:</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  <li>
                    Código de <strong>teste</strong> (começa com <strong>TEST-</strong>) — não gera
                    cobrança real.
                  </li>
                  <li>
                    <strong>Chave pública</strong> (Public Key) — é outro campo, mais curto; não
                    serve aqui.
                  </li>
                  <li>
                    Usuário de teste (<strong>TESTUSER...</strong>) — é só para simular compras, não
                    é a credencial da sua conta.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            3. Cole aqui no {APP_NAME} e salve
          </h3>
          <div className="flex gap-3 pl-1">
            <StepBadge number={3} />
            <div className="space-y-2">
              <p>
                Volte em <strong>Configurações → Pagamentos</strong>, cole o código no campo{' '}
                <strong>API Key / Access Token</strong> e clique em <strong>Salvar</strong> no fim da
                página.
              </p>
              <p className="text-xs text-slate-500">
                Por segurança, depois de salvar o código não aparece de novo — só um aviso de que
                está configurado.
              </p>
            </div>
          </div>
        </section>

        <section ref={webhookSectionRef} className="scroll-mt-4 space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            4. Avise o {APP_NAME} quando o PIX for pago
          </h3>
          <div className="flex gap-3 pl-1">
            <StepBadge number={4} />
            <div className="space-y-3">
              <p>
                Esse passo faz o pagamento aparecer automaticamente no {APP_NAME}. No Mercado Pago,
                na mesma aplicação do passo anterior, abra <strong>Webhooks</strong> (ou{' '}
                <strong>Notificações → Webhooks</strong>).
              </p>

              {webhookUrl ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600">
                    Copie o endereço abaixo e cole no campo <strong>URL de produção</strong> do
                    Mercado Pago:
                  </p>
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                    <code className="flex-1 break-all font-mono text-[11px] text-emerald-950">
                      {webhookUrl}
                    </code>
                    <button
                      type="button"
                      onClick={copyWebhookUrl}
                      className="shrink-0 rounded-md border border-emerald-200 bg-white p-2 text-emerald-700 hover:bg-emerald-100"
                      title="Copiar endereço"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Copie exatamente como está — letras, números e barras incluídos.
                  </p>
                </div>
              ) : (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  O endereço ainda não está disponível. Recarregue a página em alguns instantes. Se
                  continuar assim, fale com quem administra o sistema.
                </p>
              )}

              <ol className="list-decimal space-y-1.5 pl-5 text-xs text-slate-600">
                <li>
                  Marque o evento <strong>Pagamentos</strong> (ou <strong>Payments</strong>).
                </li>
                <li>Clique em salvar.</li>
                <li>
                  O Mercado Pago vai mostrar um <strong>código de segurança</strong> (assinatura
                  secreta). Copie e cole no campo <strong>Assinatura secreta (Webhook secret)</strong>{' '}
                  aqui no {APP_NAME}.
                </li>
              </ol>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
                <p className="flex items-start gap-2 font-medium text-slate-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  O código de segurança evita que alguém finja um pagamento. Vale a pena configurar
                  em produção.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">
            5. Faça um teste
          </h3>
          <div className="flex gap-3 pl-1">
            <StepBadge number={5} />
            <ol className="list-decimal space-y-1.5 pl-5 text-xs text-slate-600">
              <li>Crie uma fatura e gere o PIX.</li>
              <li>Pague um valor pequeno (pode ser você mesmo ou um cliente de confiança).</li>
              <li>
                Em poucos segundos a fatura deve aparecer como <strong>paga</strong>. Se não mudar,
                confira se salvou tudo e se copiou os códigos certos nos passos 2 e 4.
              </li>
            </ol>
          </div>
        </section>
      </div>
    </Modal>
  );
};
