'use client';
import { useEffect } from 'react';
import type { Pillar } from '@/lib/saju/engine';

export function Sheet({ title, sub, onClose, children, foot, tabs }: { title: string; sub?: string; onClose: () => void; children: React.ReactNode; foot?: React.ReactNode; tabs?: React.ReactNode }) {
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="overlay" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sheet" role="dialog" aria-label={title}>
        <div className="sheet-head"><h2>{title}{sub && <small>{sub}</small>}</h2><button className="x" onClick={onClose} aria-label="닫기">✕</button></div>
        {tabs}
        <div className="sheet-body">{children}</div>
        {foot}
      </div>
    </div>
  );
}
export function Tabs<T extends string>({ items, value, onChange }: { items: [T, string][]; value: T; onChange: (v: T) => void }) {
  return <div className="tabs">{items.map(([k, l]) => <button key={k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>{l}</button>)}</div>;
}
export const won = (n: number) => n.toLocaleString('ko-KR') + '원';

export function PillarCell({ label, p, day }: { label: string; p: Pillar | null; day?: boolean }) {
  if (!p) return <div className="pil"><div className="h">{label}</div><div className="g" style={{ opacity: 0.35 }}>?<small>시간 미상</small></div><div className="t">계산 안 함</div></div>;
  return (
    <div className={'pil' + (day ? ' day' : '')}>
      <div className="h">{label}</div>
      <div className="g"><span className={'el-' + p.stemElement}>{p.stemName}<small>{p.stemElement}</small></span></div>
      <div className="t">{p.tenGodStem ?? '일간(나)'}</div>
      <div className="g" style={{ marginTop: 4 }}><span className={'el-' + p.branchElement}>{p.branchName}<small>{p.branchElement}</small></span></div>
      <div className="t">{p.tenGodBranch}</div>
      <div className="t" style={{ opacity: 0.8 }}>{p.hidden.map((h) => h.stem).join('')}</div>
    </div>
  );
}
export const EL_COLOR: Record<string, string> = { 목: '#3fae63', 화: '#ee5b52', 토: '#d9a63a', 금: '#9aa0be', 수: '#3f78e0' };
