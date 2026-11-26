import { HttpError } from './auth';
import { strictProd } from './env';

export type PayMode = 'toss' | 'mock' | 'disabled';
export const payMode = (): PayMode => (process.env.TOSS_SECRET_KEY ? 'toss' : strictProd() ? 'disabled' : 'mock');
export const tossClientKey = () => process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
const auth = () => 'Basic ' + Buffer.from(process.env.TOSS_SECRET_KEY + ':').toString('base64');
const mockPaid = new Set<string>();

export interface Confirmed { paymentKey: string; provider: string; raw: any }

/** 서버에서 승인. 금액은 반드시 서버 주문 금액으로 검증한다. */
export async function confirmPayment(p: { paymentKey: string; orderId: string; amount: number }): Promise<Confirmed> {
  const mode = payMode();
  if (mode === 'disabled') throw new HttpError(503, '결제가 아직 설정되지 않았습니다.');
  if (mode === 'mock') {
    if (!p.paymentKey.startsWith('mock_')) throw new HttpError(400, '테스트 결제 키가 아닙니다.');
    return { paymentKey: p.paymentKey, provider: 'mock', raw: { status: 'DONE', orderId: p.orderId, totalAmount: p.amount } };
  }
  const res = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST', headers: { Authorization: auth(), 'Content-Type': 'application/json', 'Idempotency-Key': p.orderId }, body: JSON.stringify(p), signal: AbortSignal.timeout(30000),
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok || j.status !== 'DONE') throw new HttpError(402, `결제 승인 실패: ${j.message ?? res.status}`);
  if (j.totalAmount !== p.amount) throw new HttpError(402, '결제 금액이 일치하지 않습니다.');
  return { paymentKey: j.paymentKey, provider: 'toss', raw: { status: j.status, method: j.method, approvedAt: j.approvedAt, totalAmount: j.totalAmount } };
}

export async function cancelPayment(paymentKey: string, reason: string, provider: string) {
  if (provider === 'mock') return { status: 'CANCELED' };
  const res = await fetch(`https://api.tosspayments.com/v1/payments/${encodeURIComponent(paymentKey)}/cancel`, {
    method: 'POST', headers: { Authorization: auth(), 'Content-Type': 'application/json' }, body: JSON.stringify({ cancelReason: reason }), signal: AbortSignal.timeout(30000),
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(502, `결제 취소 실패: ${j.message ?? res.status}`);
  return j;
}
void mockPaid;
