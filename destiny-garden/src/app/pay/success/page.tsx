'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/client/api';

/** 토스페이먼츠 successUrl: 서버에서 최종 승인 후에만 질문권/리포트가 지급된다. */
export default function PaySuccess() {
  const router = useRouter();
  const [msg, setMsg] = useState('결제를 확인하는 중이에요…'); const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    api('/api/shop/confirm', { body: { paymentKey: q.get('paymentKey'), orderId: q.get('orderId'), amount: Number(q.get('amount')) } })
      .then(() => { setOk(true); setMsg('결제가 완료되었어요!'); setTimeout(() => router.replace('/garden'), 1500); })
      .catch((e) => { setOk(false); setMsg(e.message); });
  }, [router]);
  return <main className="screen form-screen"><div className="form-wrap card" style={{ marginTop: 80, textAlign: 'center' }}><h1>{ok === null ? '확인 중' : ok ? '결제 완료 ✨' : '결제 확인 실패'}</h1><p>{msg}</p>{ok === false && <button className="btn" onClick={() => router.replace('/garden')}>정원으로 돌아가기</button>}</div></main>;
}
