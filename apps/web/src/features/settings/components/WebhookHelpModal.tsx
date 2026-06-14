import React from 'react';
import { X, ExternalLink, CheckCircle2, Copy } from 'lucide-react';
import { showToast } from '../../../shared/utils/toast';
import { primaryButtonClass } from '../../../shared/ui/buttons/button-styles';

interface WebhookHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  webhookUrl: string;
}

export const WebhookHelpModal: React.FC<WebhookHelpModalProps> = ({ isOpen, onClose, webhookUrl }) => {
  if (!isOpen) return null;

  const copyUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    showToast.success('URL copiada com sucesso!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span className="bg-form-primary text-white p-1 rounded-md">
              <ExternalLink size={18} />
            </span>
            Configurar Webhook Mercado Pago
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <section>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3">1. URL de Notificação</h3>
            <p className="text-sm text-slate-600 mb-3">
              Copie a URL abaixo. Ela é o endereço que o Mercado Pago chamará toda vez que um PIX for pago.
            </p>
            <div className="flex items-center gap-2 bg-slate-100 p-3 rounded-lg border border-slate-200">
              <code className="flex-1 text-xs font-mono text-form-primary break-all select-all">
                {webhookUrl}
              </code>
              <button 
                onClick={copyUrl}
                className="p-2 bg-white rounded-md border border-slate-200 text-slate-600 hover:text-form-primary hover:border-form-primary/30 shadow-sm transition-all"
                title="Copiar URL"
              >
                <Copy size={16} />
              </button>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-1">2. No Painel do Mercado Pago</h3>
            <div className="space-y-3">
              {[
                {
                  step: 'Acesse o portal de desenvolvedores',
                  desc: 'Vá em "Suas integrações" e selecione sua aplicação.',
                  link: 'https://www.mercadopago.com.br/developers/panel/app'
                },
                {
                  step: 'Vá em Webhooks',
                  desc: 'No menu lateral, clique em "Notificações" > "Webhooks".'
                },
                {
                  step: 'Configure a URL de Produção',
                  desc: 'Cole a URL copiada acima no campo "URL de produção".'
                },
                {
                  step: 'Ative os Eventos',
                  desc: 'Marque a opção "Pagamentos" (payments) e clique em Salvar.'
                }
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-form-primary/10 text-form-primary rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800">
                      {item.step}
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center ml-1 text-form-primary hover:underline">
                          <ExternalLink size={12} className="ml-0.5" />
                        </a>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} />
              Assinatura Secreta (Opcional, mas recomendado)
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Após salvar, o Mercado Pago exibirá uma <strong>"Assinatura secreta"</strong>. Copie-a e cole no campo 
              "Token do webhook" aqui no painel. Isso garante que as notificações são realmente do Mercado Pago.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className={primaryButtonClass}
          >
            Entendi, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
