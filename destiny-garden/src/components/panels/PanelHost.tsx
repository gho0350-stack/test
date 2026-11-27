'use client';
import { useGame } from '@/lib/client/store';
import { NpcChat } from './Chat';
import { ChartBook, TarotPanel, PartnersView } from './Buildings';
import { SagePanel, SageList } from './Sages';
import { CardModal, UnlockModal } from './CardView';
import { Codex } from './Codex';
import { Quests, Shop, ReportView, Settings } from './Misc';

export function PanelHost() {
  const panel = useGame((s) => s.panel); const reveal = useGame((s) => s.reveal); const sageUnlock = useGame((s) => s.sageUnlock);
  return (
    <>
      {panel && (() => { switch (panel.type) {
        case 'building': return <TarotPanel />;
        case 'sage': return <SagePanel id={panel.id} />;
        case 'chat': return <NpcChat key={panel.id + (panel.partnerId ?? '') + (panel.cardKeys ?? []).join(',')} id={panel.id} partnerId={panel.partnerId} cardKeys={panel.cardKeys} />;
        case 'consult': return <SageList />;
        case 'chartbook': return <ChartBook />;
        case 'partners': return <PartnersView onClose={() => useGame.getState().open(null)} />;
        case 'tarot': return <TarotPanel />;
        case 'quests': return <Quests />;
        case 'codex': return <Codex focus={panel.focus} />;
        case 'shop': return <Shop focus={panel.focus} partnerId={panel.partnerId} />;
        case 'report': return <ReportView kind={panel.kind} partnerId={panel.partnerId} />;
        case 'settings': return <Settings />;
        default: return null;
      } })()}
      {reveal && <CardModal key={reveal.card.key} card={reveal.card} isNew={reveal.isNew} onClose={() => { useGame.setState({ reveal: null, sageUnlock: reveal.unlockedSage ?? null }); }} ask={() => { useGame.setState({ reveal: null, sageUnlock: reveal.unlockedSage ?? null }); const r = useGame.getState().state!.rooms.find((x) => x.sageUnlocked); if (reveal.unlockedSage || r) useGame.setState({ sageUnlock: null }); useGame.getState().open({ type: 'sage', id: (useGame.getState().state!.rooms.find((x) => x.id === useGame.getState().room)?.sageId) ?? 'sage' }); }} />}
      {sageUnlock && !reveal && <UnlockModal sageId={sageUnlock} onClose={() => useGame.setState({ sageUnlock: null })} />}
    </>
  );
}
