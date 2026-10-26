import {
  type BlockOf,
  type Card,
  type FieldProblem,
  type FileKind,
  type FileRef,
  STEP_LIMITS,
  STEP_MESSAGES as SM,
  convertPinyin,
  deckLine,
  emptyCard,
} from '@sat/shared';
import { Button, Dialog, Icon, IconButton } from '../../components';
import { AddRow, Cell, PinyinCell, RowTools } from './editor-parts';
import { useDragList } from './use-drag-list';
import { ExcelImport } from './ExcelImport';
import { UploadStatus } from './FileBlockEditor';
import { entryKey, fileUrl } from './step-dom';
import { useFileInput } from './use-file-input';
import { move, patchBlock, problemText, replaceAt } from './step-content';
import { chooseFile, useStepEditorStore } from './step-editor-store';
import { StorageMeter } from './StorageMeter';

type Deck = BlockOf<'deck'>;

/** The image or audio of one card: choose, upload state, preview, remove (AC-11.3). */
function CardFile({
  itemId,
  deckId,
  card,
  field,
}: {
  itemId: string;
  deckId: string;
  card: Card;
  field: 'image' | 'audio';
}) {
  const kind: FileKind = field === 'image' ? 'cardImage' : 'cardAudio';
  const key = `${itemId}/${deckId}/${card.id}/${field}`;
  const upload = useStepEditorStore((s) => s.uploads[key]);
  const put = (ref: FileRef | null) =>
    patchBlock(itemId, deckId, (b) =>
      b.type === 'deck'
        ? { ...b, cards: b.cards.map((c) => (c.id === card.id ? { ...c, [field]: ref } : c)) }
        : b,
    );
  const picker = useFileInput(kind, (file) => chooseFile(key, itemId, kind, file, put));
  const ref = card[field];
  const label = field === 'image' ? 'Hình ảnh' : 'Âm thanh';
  return (
    <div className="st-cardfile">
      {picker.element}
      {ref &&
        (field === 'image' ? (
          <img src={fileUrl(ref)} alt="" className="st-cardfile__img" />
        ) : (
          <audio src={fileUrl(ref)} controls preload="none" className="st-cardfile__audio" />
        ))}
      {upload ? (
        <UploadStatus upload={upload} onPickAnother={picker.open} />
      ) : (
        <span className="st-inline">
          <Button size="sm" variant="ghost" onClick={picker.open}>
            <Icon name={field === 'image' ? 'image' : 'audio'} size={15} />
            {ref ? `Thay ${label.toLowerCase()}` : label}
          </Button>
          {ref && (
            <IconButton
              size="sm"
              aria-label={`Gỡ ${label.toLowerCase()} của thẻ`}
              icon={<Icon name="close" size={14} />}
              onClick={() => put(null)}
            />
          )}
        </span>
      )}
    </div>
  );
}

/**
 * T08 "Soạn bộ thẻ": a dialog over T07 (AC-11.1). Edits go to the step's working copy; "Xong" only closes — the deck is
 * saved with the step (AC-11.6).
 */
export function DeckDialog({
  open,
  itemId,
  stepTitle,
  deck,
  path,
  problems,
  onChange,
  onClose,
}: {
  open: boolean;
  itemId: string;
  stepTitle: string;
  deck: Deck;
  /** `blocks.<k>` of the deck block. */
  path: string;
  problems: Map<string, FieldProblem>;
  onChange: (deck: Deck) => void;
  onClose: () => void;
}) {
  const cards = deck.cards;
  const set = (next: Card[]) => onChange({ ...deck, cards: next });
  const drag = useDragList((from, to) => set(move(cards, from, to)));
  const err = (p: string) => problemText(problems.get(p));
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="xl"
      title={`Bộ thẻ · ${stepTitle.trim() || 'Bước chưa có tên'}`}
      description={<StorageMeter />}
      footer={<Button onClick={onClose}>Xong</Button>}
    >
      <div className="st-deck" data-screen="T08">
        <Cell
          visibleLabel
          label="Tên bộ thẻ"
          value={deck.name}
          maxLength={STEP_LIMITS.deckNameMax}
          onChange={(name) => onChange({ ...deck, name })}
        />
        <p className="small muted">{deckLine(cards.length)}</p>
        <ExcelImport
          existing={new Set(cards.map((c) => entryKey(c.front, c.pinyin)))}
          current={cards.length}
          capacity={STEP_LIMITS.cardsPerDeck}
          onAdd={(rows) =>
            set([
              ...cards,
              ...rows.map((r) => ({
                ...emptyCard(),
                front: r.hanzi,
                pinyin: convertPinyin(r.pinyin),
                meaning: r.meaning,
                example: r.example,
              })),
            ])
          }
        />
        <ol className="st-cards">
          {cards.map((c, i) => {
            const p = `${path}.cards.${i}`;
            const put = (patch: Partial<Card>) => set(replaceAt(cards, i, { ...c, ...patch }));
            return (
              <li key={c.id} className="st-card" {...drag.target(i)}>
                <div className="st-card__head">
                  <span className="strong">Thẻ {i + 1}</span>
                  <span className="grow" />
                  <RowTools
                    noun="thẻ"
                    index={i}
                    count={cards.length}
                    grip={drag.grip(i)}
                    keepLast
                    onMove={(to) => set(move(cards, i, to))}
                    onDelete={() => set(cards.filter((_, k) => k !== i))}
                  />
                </div>
                <div className="st-card__fields">
                  <Cell
                    visibleLabel
                    label="Mặt trước (chữ Hán) *"
                    lang="zh"
                    value={c.front}
                    maxLength={STEP_LIMITS.hanziMax}
                    error={err(`${p}.front`)}
                    onChange={(front) => put({ front })}
                  />
                  <PinyinCell
                    visibleLabel
                    label="Pinyin"
                    value={c.pinyin}
                    maxLength={STEP_LIMITS.pinyinMax}
                    error={err(`${p}.pinyin`)}
                    onChange={(pinyin) => put({ pinyin })}
                  />
                  <Cell
                    visibleLabel
                    label="Nghĩa *"
                    value={c.meaning}
                    maxLength={STEP_LIMITS.meaningMax}
                    error={err(`${p}.meaning`)}
                    onChange={(meaning) => put({ meaning })}
                  />
                  <Cell
                    visibleLabel
                    label="Ví dụ"
                    value={c.example}
                    multiline
                    maxLength={STEP_LIMITS.exampleMax}
                    onChange={(example) => put({ example })}
                  />
                </div>
                <div className="st-card__files">
                  <CardFile itemId={itemId} deckId={deck.id} card={c} field="image" />
                  <CardFile itemId={itemId} deckId={deck.id} card={c} field="audio" />
                </div>
              </li>
            );
          })}
        </ol>
        <AddRow
          label="Thêm thẻ"
          full={cards.length >= STEP_LIMITS.cardsPerDeck}
          fullMessage={SM.maxCards}
          onAdd={() => set([...cards, emptyCard()])}
        />
      </div>
    </Dialog>
  );
}
