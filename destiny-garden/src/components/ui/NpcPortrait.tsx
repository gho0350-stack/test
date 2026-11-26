'use client';
export function NpcPortrait({ id, size = 64 }: { id: string; size?: number }) {
  const cfg: Record<string, { bg: string; robe: string; hair: string; extra: React.ReactNode }> = {
    sage: { bg: '#5b2fa8', robe: '#4b2f8a', hair: '#f4f1ea', extra: <><path d="M32 54 Q50 96 68 54 Q50 70 32 54Z" fill="#f7f4ee" /><rect x="30" y="14" width="40" height="12" rx="5" fill="#4b2f8a" /><circle cx="50" cy="12" r="5" fill="#f5c451" /></> },
    merchant: { bg: '#8a5a1f', robe: '#e8c46a', hair: '#3a2a20', extra: <><ellipse cx="50" cy="24" rx="26" ry="6" fill="#6b3a12" /><rect x="36" y="10" width="28" height="14" rx="6" fill="#8a5a1f" /><circle cx="78" cy="84" r="9" fill="#ffd86b" stroke="#c99a22" strokeWidth="2" /></> },
    guardian: { bg: '#c0568a', robe: '#f3a6c7', hair: '#3a2018', extra: <><circle cx="50" cy="12" r="11" fill="#3a2018" /><circle cx="60" cy="14" r="4" fill="#ffc2de" /></> },
    guide: { bg: '#2e6f8e', robe: '#2e6f8e', hair: '#3a2a20', extra: <><path d="M14 70 Q50 -6 86 70 L86 40 Q50 -30 14 40Z" fill="#2e6f8e" /><circle cx="84" cy="30" r="7" fill="#baf0ff" /></> },
  };
  const c = cfg[id] ?? cfg.sage;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ borderRadius: '50%', border: '3px solid #f5c451', background: c.bg, flex: 'none' }} aria-hidden>
      <path d="M12 100 Q50 62 88 100Z" fill={c.robe} />
      <circle cx="50" cy="48" r="26" fill="#f6d6bb" />
      <path d="M24 44 Q50 8 76 44 Q50 28 24 44Z" fill={c.hair} />
      <circle cx="40" cy="48" r="3" fill="#2a1a1a" /><circle cx="60" cy="48" r="3" fill="#2a1a1a" />
      <circle cx="33" cy="56" r="4" fill="#ff9aa8" opacity=".6" /><circle cx="67" cy="56" r="4" fill="#ff9aa8" opacity=".6" />
      <path d="M44 60 Q50 65 56 60" stroke="#c9605a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {c.extra}
    </svg>
  );
}
