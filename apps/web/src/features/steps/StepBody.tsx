import {
  BLOCK_LABELS,
  BLOCK_TYPES,
  type Block,
  type BlockOf,
  type BlockType,
  type Card,
  type FieldProblem,
  type Item,
  STEP_LIMITS,
  STEP_MESSAGES as SM,
  type StepContent,
  emptyCard,
  fixWordsMessage,
  isFileBlock,
  newBlock,
  newBlockId,
  problemsUnder,
} from '@sat/shared';
import { useState } from 'react';
import { Button, Icon, StatusChip } from '../../components';
import type { IconName } from '../../components';
import { DeckDialog } from './DeckDialog';
import { Cell, RowTools } from './editor-parts';
import { useDragList } from './use-drag-list';
import { ExcelImport, TemplateLink } from './ExcelImport';
import { blockElementId, entryKey } from './step-dom';
import { FileBlockEditor } from './FileBlockEditor';
import { RichTextEditor } from './RichTextEditor';
import { move, problemText, replaceAt } from './step-content';
import { useStepEditorStore } from './step-editor-store';
import { DialogueEditor, GrammarEditor, VocabEditor } from './StructuredEditors';
import './steps.css';

const BLOCK_ICONS: Record<BlockType, IconName> = {
  text: 'text',
  vocab: 'list',
  grammar: 'book',
  dialogue: 'users',
  deck: 'cards',
  document: 'file',
  video: 'video',
  image: 'image',
  audio: 'audio',
};

/** AC-4.6: one card per word (Chữ Hán + Pinyin duplicates once), Loại từ not copied. */
function deckFromWords(words: BlockOf<'vocab'>['words'], stepTitle: string): BlockOf<'deck'> {
  const seen = new Set<string>();
  const cards: Card[] = [];
  for (const w of words) {
    const key = entryKey(w.hanzi, w.pinyin);
    if (seen.has(key)) continue;
    seen.add(key);
    cards.push({
      ...emptyCard(),
      front: w.hanzi,
      pinyin: w.pinyin,
      meaning: w.meaning,
      example: w.example,
    });
  }
  return {
    id: newBlockId(),
    type: 'deck',
    name: [...`Từ vựng – ${stepTitle.trim()}`].slice(0, STEP_LIMITS.deckNameMax).join(''),
    cards,
  };
}

/** AC-10.1: the exercise sets linked to the step (read only; links are set on T09). */
function PracticeList({
  itemId,
  onOpenSet,
}: {
  itemId: string;
  onOpenSet: (setId: string) => void;
}) {
  const sets = useStepEditorStore((s) => s.info?.practice[itemId]);
  return (
    <section className="st-practice" aria-label="Bài tập luyện tập">
      <h4 className="st-practice__title">Bài tập luyện tập</h4>
      {!sets?.length ? (
        <p className="small muted">{SM.noPractice}</p>
      ) : (
        <ul className="st-practice__list">
          {sets.map((s) => (
            <li key={s.id} className="st-inline">
              <Icon name="pen" size={15} />
              <span className="grow">{s.title.trim() || 'Bộ bài tập chưa có tên'}</span>
              <StatusChip status={s.status} />
              <Button size="sm" variant="ghost" onClick={() => onOpenSet(s.id)}>
                Mở bộ bài tập
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export interface StepBodyProps {
  item: Item;
  title: string;
  content: StepContent;
  problems: readonly FieldProblem[];
  onChange: (content: StepContent) => void;
  onOpenSet: (setId: string) => void;
}

/** The content of one step on T07's Bài học tab: goal and blocks, all edited in place (REQ-3, REQ-4, REQ-11). */
export function StepBody({ item, title, content, problems, onChange, onOpenSet }: StepBodyProps) {
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState<{ block: string; text: string } | null>(null);
  const [deckOpen, setDeckOpen] = useState<string | null>(null);
  const cancel = useStepEditorStore((s) => s.cancel);
  const uploads = useStepEditorStore((s) => s.uploads);
  const blocks = content.blocks;
  const map = new Map(problems.map((p) => [p.path, p]));
  const setBlocks = (next: Block[]) => onChange({ ...content, blocks: next });
  const drag = useDragList((from, to) => setBlocks(move(blocks, from, to)));
  const full = blocks.length >= STEP_LIMITS.blocksPerStep;

  const add = (type: BlockType) => {
    setAdding(false);
    setBlocks([...blocks, newBlock(type)]);
  };

  const remove = (k: number) => {
    const b = blocks[k];
    if (!b) return;
    // Removing a block cancels its uploads (spec §8).
    for (const key of Object.keys(uploads)) if (key.startsWith(`${item.id}/${b.id}`)) cancel(key);
    setBlocks(blocks.filter((_, i) => i !== k));
  };

  const makeDeck = (k: number, b: BlockOf<'vocab'>) => {
    const bad = new Set(
      problemsUnder(problems, `blocks.${k}.words`).map((p) => p.path.split('.')[3]),
    ).size;
    const text = !b.words.length
      ? SM.deckNeedsWord
      : bad
        ? fixWordsMessage(bad)
        : full
          ? SM.maxBlocksDeck
          : null;
    if (text) {
      setNotice({ block: b.id, text });
      return;
    }
    setNotice(null);
    const next = [...blocks];
    next.splice(k + 1, 0, deckFromWords(b.words, title));
    setBlocks(next);
  };

  const editor = (b: Block, k: number) => {
    const path = `blocks.${k}`;
    const put = (nb: Block) => setBlocks(replaceAt(blocks, k, nb));
    switch (b.type) {
      case 'text':
        return (
          <RichTextEditor
            label={`Nội dung khối ${k + 1}`}
            value={b.html}
            max={STEP_LIMITS.textMax}
            error={problemText(map.get(`${path}.html`))}
            onChange={(html) => put({ ...b, html })}
          />
        );
      case 'vocab':
        return (
          <VocabEditor
            block={b}
            path={path}
            problems={map}
            onChange={put}
            actions={
              <>
                <Button size="sm" variant="ghost" onClick={() => makeDeck(k, b)}>
                  <Icon name="cards" size={15} />
                  Tạo bộ thẻ từ danh sách này
                </Button>
                <ExcelImport
                  existing={new Set(b.words.map((w) => entryKey(w.hanzi, w.pinyin)))}
                  current={b.words.length}
                  capacity={STEP_LIMITS.wordsPerBlock}
                  onAdd={(rows) =>
                    put({
                      ...b,
                      words: [
                        ...b.words,
                        ...rows.map((r) => ({
                          hanzi: r.hanzi,
                          pinyin: r.pinyin,
                          pos: r.pos as (typeof b.words)[number]['pos'],
                          meaning: r.meaning,
                          example: r.example,
                        })),
                      ],
                    })
                  }
                />
              </>
            }
          />
        );
      case 'grammar':
        return <GrammarEditor block={b} path={path} problems={map} onChange={put} />;
      case 'dialogue':
        return <DialogueEditor block={b} path={path} problems={map} onChange={put} />;
      case 'deck': {
        const bad = problemsUnder(problems, path).length;
        const uploading = Object.values(uploads).some(
          (u) => u.key.startsWith(`${item.id}/${b.id}/`) && u.phase !== 'failed',
        );
        return (
          <div className="st-inline">
            <Icon name="cards" size={18} />
            <span className="grow">
              {b.name.trim() || 'Bộ thẻ'} · <b>{b.cards.length} thẻ</b>
              {bad > 0 && <span className="st-over"> · {bad} trường chưa hợp lệ</span>}
              {uploading && <span className="muted"> · đang tải tệp</span>}
            </span>
            <TemplateLink />
            <Button size="sm" variant="outline" onClick={() => setDeckOpen(b.id)}>
              <Icon name="cards" size={15} />
              Soạn bộ thẻ
            </Button>
          </div>
        );
      }
      default:
        return isFileBlock(b) ? (
          <FileBlockEditor itemId={item.id} block={b} onChange={put} />
        ) : null;
    }
  };

  const openDeck = blocks.findIndex((b) => b.id === deckOpen);
  const deck = blocks[openDeck];

  return (
    <div className="st-body">
      <Cell
        visibleLabel
        label="Mục tiêu bước học"
        placeholder="Không bắt buộc · tối đa 300 ký tự"
        value={content.goal}
        maxLength={STEP_LIMITS.goalMax}
        onChange={(goal) => onChange({ ...content, goal })}
      />
      <ol className="st-blocks">
        {blocks.map((b, k) => (
          <li key={b.id} id={blockElementId(item.id, k)} className="st-block" {...drag.target(k)}>
            <div className="st-block__head">
              <Icon name={BLOCK_ICONS[b.type]} size={16} />
              <span className="small strong">
                Khối {k + 1} · {BLOCK_LABELS[b.type]}
              </span>
              <span className="grow" />
              <RowTools
                noun="khối"
                index={k}
                count={blocks.length}
                grip={drag.grip(k)}
                keepLast
                onMove={(to) => setBlocks(move(blocks, k, to))}
                onDelete={() => remove(k)}
              />
            </div>
            {editor(b, k)}
            {notice?.block === b.id && (
              <p className="field__error" role="alert">
                {notice.text}
              </p>
            )}
          </li>
        ))}
      </ol>
      <div className="st-add">
        <Button
          size="sm"
          variant="outline"
          aria-expanded={adding}
          onClick={() => {
            if (full) {
              setNotice({ block: '', text: SM.maxBlocks });
              setAdding(false);
              return;
            }
            setNotice(null);
            setAdding((v) => !v);
          }}
        >
          <Icon name="plus" size={15} />
          Thêm khối
        </Button>
        {notice?.block === '' && (
          <span className="field__error" role="alert">
            {notice.text}
          </span>
        )}
        {adding && (
          <div className="st-add__menu" role="group" aria-label="Chọn loại khối">
            {BLOCK_TYPES.map((t) => (
              <Button key={t} size="sm" variant="ghost" onClick={() => add(t)}>
                <Icon name={BLOCK_ICONS[t]} size={15} />
                {BLOCK_LABELS[t]}
              </Button>
            ))}
          </div>
        )}
      </div>
      {item.status !== 'archived' && <PracticeList itemId={item.id} onOpenSet={onOpenSet} />}
      {deck?.type === 'deck' && (
        <DeckDialog
          open
          itemId={item.id}
          stepTitle={title}
          deck={deck}
          path={`blocks.${openDeck}`}
          problems={map}
          onChange={(d) => setBlocks(replaceAt(blocks, openDeck, d))}
          onClose={() => setDeckOpen(null)}
        />
      )}
    </div>
  );
}
