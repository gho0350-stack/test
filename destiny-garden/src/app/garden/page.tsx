'use client';
import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useGame } from '@/lib/client/store';
import { HUD } from '@/components/game/HUD';
import { PanelHost } from '@/components/panels/PanelHost';

const Garden3D = dynamic(() => import('@/components/game/Garden3D'), { ssr: false, loading: () => <div className="loading"><div className="spin" />정원을 여는 중…</div> });

export default function GardenPage() {
  const router = useRouter();
  const { state, loaded, load } = useGame();
  useEffect(() => { load(); (window as any).__dg = useGame; }, [load]); // E2E/디버그용 스토어 핸들
  useEffect(() => { if (loaded && (!state || !state.profile)) router.replace(state ? '/create' : '/'); }, [loaded, state, router]);
  if (!loaded || !state?.profile) return <div className="loading"><div className="spin" />정원으로 들어가는 중…</div>;
  return (
    <div className="game" data-testid="garden">
      <Garden3D />
      <HUD />
      <PanelHost />
    </div>
  );
}
