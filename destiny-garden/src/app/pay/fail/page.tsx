'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client/api';

export default function PayFail() {
  const router = useRouter();
  useEffect(() => { const q = new URLSearchParams(location.search); const id = q.get('orderId'); if (id) api('/api/shop/fail', { body: { orderId: id } }).catch(() => {}); }, []);
  const q = typeof window !== 'undefined' ? new URLSearchParams(location.search) : null;
  return <main className="screen form-screen"><div className="form-wrap card" style={{ marginTop: 80, textAlign: 'center' }}><h1>결제가 취소되었어요</h1><p className="muted">{q?.get('message') ?? '결제가 완료되지 않았어요. 금액은 청구되지 않았습니다.'}</p><button className="btn" onClick={() => router.replace('/garden')}>정원으로 돌아가기</button></div></main>;
}
