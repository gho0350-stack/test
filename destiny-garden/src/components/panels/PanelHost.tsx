'use client';
import { useEffect } from 'react';
import { useGame } from '@/lib/client/store';
import { NpcChat } from './Chat';
import { ChartBook, TarotPanel } from './Buildings';
import { Room, SageHall, NpcTalk } from './Rooms';
import { Codex } from './Codex';
import { Quests, Bag, Shop, ReportView, Settings, Notifications } from './Misc';

export function PanelHost() {
  const panel = useGame((s) => s.panel);
  // 건물 방문 퀘스트(있다면) 처리
  const buildingId = panel?.type === 'building' ? panel.id : null;
  useEffect(() => { if (buildingId) useGame.getState().fire(`visit:${buildingId}`); }, [buildingId]);
  if (!panel) return null;
  switch (panel.type) {
    case 'building': return panel.id === 'sagehouse' ? <SageHall /> : panel.id === 'tarot' ? <TarotPanel /> : <Room key={panel.id} id={panel.id} />;
    case 'npc': return <NpcTalk id={panel.id} />;
    case 'chat': return <NpcChat key={panel.id + (panel.partnerId ?? '') + (panel.cardKeys ?? []).join(',')} id={panel.id} partnerId={panel.partnerId} cardKeys={panel.cardKeys} />;
    case 'consult': return <SageHall />;
    case 'chartbook': return <ChartBook />;
    case 'tarot': return <TarotPanel />;
    case 'quests': return <Quests />;
    case 'bag': return <Bag />;
    case 'codex': return <Codex focus={panel.focus} />;
    case 'shop': return <Shop focus={panel.focus} partnerId={panel.partnerId} />;
    case 'report': return <ReportView kind={panel.kind} partnerId={panel.partnerId} />;
    case 'settings': return <Settings />;
    case 'notifications': return <Notifications />;
  }
}
