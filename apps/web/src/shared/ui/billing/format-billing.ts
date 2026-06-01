export function formatCents(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatPaymentMethod(method: string) {
  if (method === 'pix') return 'PIX';
  if (method === 'manual') return 'Manual';
  return method;
}
