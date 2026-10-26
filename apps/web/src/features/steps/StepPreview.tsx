import { type Item, STEP_MESSAGES as SM } from '@sat/shared';
import { useState } from 'react';
import { Button, Dialog, Icon } from '../../components';
import { Flashcards } from './Flashcards';
import { stepOf } from './step-content';
import { useStepEditorStore } from './step-editor-store';
import { StepBlocksView } from './StepBlocksView';

/**
 * AC-7.6: one step of the Bài học section as the HV sees it on S03, inside a GV preview (T21, T20): name, goal,
 * "Bước {x}/{y}", every block, working "Pinyin" / "Bản dịch" switches and flashcards whose marks are not saved; no edit
 * button nor "AI tạo"; "Luyện tập", "Trước", "Tiếp" disabled; a draft step carries the band above it.
 */
export function StepPreview({
  item,
  position,
  total,
}: {
  item: Item;
  position: number;
  total: number;
}) {
  const content = stepOf(item.content);
  const [deckId, setDeckId] = useState<string | null>(null);
  const linked = useStepEditorStore((s) => s.info?.practice[item.id]);
  const practice = (linked ?? []).filter((s) => s.status === 'published');
  const deck = content.blocks.find((b) => b.type === 'deck' && b.id === deckId);
  return (
    <div className="sv-preview-step">
      {item.status === 'draft' && <p className="sv-draft-band">{SM.draftBanner}</p>}
      <header>
        <p className="small muted">
          Bước {position}/{total}
        </p>
        <h2 className="sv-title">{item.title}</h2>
        {content.goal.trim() && <p className="small muted">Mục tiêu: {content.goal}</p>}
      </header>
      <StepBlocksView blocks={content.blocks} marks={{}} onOpenDeck={setDeckId} />
      {practice.map((s) => (
        <Button key={s.id} block variant="outline" disabled>
          <Icon name="pen" size={18} />
          Luyện tập: {s.title}
        </Button>
      ))}
      <nav className="sv-nav" aria-label="Chuyển bước học">
        <Button variant="outline" disabled>
          ‹ Trước
        </Button>
        <Button disabled>Tiếp ›</Button>
      </nav>
      {deck?.type === 'deck' && (
        <Dialog open size="md" title={deck.name.trim() || 'Bộ thẻ'} onClose={() => setDeckId(null)}>
          <Flashcards deck={deck} marks={{}} onMark={null} onBack={() => setDeckId(null)} />
        </Dialog>
      )}
    </div>
  );
}
