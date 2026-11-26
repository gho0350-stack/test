'use client';
import { useEffect } from 'react';
import { useGame } from '@/lib/client/store';
import { BUILDINGS } from '@/lib/game/world';
import { NpcChat, ConsultList } from './Chat';
import { Library, Temple, Pavilion, TarotPanel } from './Buildings';
import { Quests, Bag, Codex, Shop, ReportView, Settings, Notifications } from './Misc';

export function PanelHost() {
  const panel = useGame((s) => s.panel);
  const buildingId = panel?.type === 'building' ? panel.id : null;
  useEffect(() => { if (buildingId) { const ev = BUILDINGS.find((b) => b.id === buildingId)?.quest_event; if (ev) useGame.getState().fire(ev); } }, [buildingId]);
  if (!panel) return null;
  switch (panel.type) {
    case 'building': return panel.id === 'library' ? <Library /> : panel.id === 'temple' ? <Temple /> : panel.id === 'pavilion' ? <Pavilion /> : <TarotPanel />;
    case 'npc': return <NpcChat key={panel.id + (panel.partnerId ?? '')} id={panel.id} partnerId={panel.partnerId} />;
    case 'consult': return <ConsultList />;
    case 'tarot': return <TarotPanel />;
    case 'quests': return <Quests />;
    case 'bag': return <Bag />;
    case 'codex': return <Codex />;
    case 'shop': return <Shop focus={panel.focus} partnerId={panel.partnerId} />;
    case 'report': return <ReportView kind={panel.kind} partnerId={panel.partnerId} />;
    case 'settings': return <Settings />;
    case 'notifications': return <Notifications />;
  }
}
