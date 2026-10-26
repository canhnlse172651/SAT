import { type BlockOf, type CardMark, allKnownMessage } from '@sat/shared';
import { useCallback, useEffect, useState } from 'react';
import { fileUrl } from './step-dom';
import {
  AudioButton,
  Button,
  HanziText,
  Icon,
  IconButton,
  PinyinText,
  Switch,
} from '../../components';

type Deck = BlockOf<'deck'>;

const MARK_LABEL: Record<CardMark | 'none', { text: string; chip: string }> = {
  known: { text: 'Đã thuộc', chip: 'chip chip--done' },
  unknown: { text: 'Chưa thuộc', chip: 'chip chip--pending' },
  none: { text: 'Chưa đánh dấu', chip: 'chip chip--todo' },
};

/** A new random order (Fisher–Yates) of card indexes. */
function shuffled(n: number): number[] {
  const out = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as number, out[i] as number];
  }
  return out;
}

/**
 * S04 (and its preview inside T21 / T20 — AC-7.6, where `onMark` is absent and nothing is saved): flip cards, play their
 * audio, mark "Đã thuộc" / "Chưa thuộc", shuffle, only unknown cards and the summary (REQ-16, REQ-17).
 */
export function Flashcards({
  deck,
  marks,
  onMark,
  onBack,
}: {
  deck: Deck;
  marks: Record<string, CardMark>;
  onMark: ((cardId: string, mark: CardMark) => void) | null;
  onBack: () => void;
}) {
  const cards = deck.cards;
  const [local, setLocal] = useState<Record<string, CardMark>>(marks);
  const [shuffle, setShuffle] = useState(false);
  const [onlyUnknown, setOnlyUnknown] = useState(false);
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [at, setAt] = useState(0);
  const [flipped, setFlipped] = useState(false);

  /** AC-17.1, AC-17.2: a new round from card 1 (GV order unless shuffled; only unmarked / unknown when asked). */
  const restart = useCallback(
    (opts: { shuffle: boolean; onlyUnknown: boolean }, current = local) => {
      const base = opts.shuffle ? shuffled(cards.length) : cards.map((_, i) => i);
      setOrder(
        opts.onlyUnknown ? base.filter((i) => current[cards[i]?.id ?? ''] !== 'known') : base,
      );
      setAt(0);
      setFlipped(false);
    },
    [cards, local],
  );

  const total = order.length;
  const done = at >= total;
  const card = done ? null : cards[order[at] ?? 0];
  const count = (m: CardMark | 'none') => cards.filter((c) => (local[c.id] ?? 'none') === m).length;

  const mark = (m: CardMark) => {
    if (!card) return;
    setLocal((l) => ({ ...l, [card.id]: m }));
    onMark?.(card.id, m);
    setAt((i) => i + 1);
    setFlipped(false);
  };
  const go = (d: number) => {
    setAt((i) => Math.max(0, Math.min(total, i + d)));
    setFlipped(false);
  };

  // NFR-7: Space flips, ←/→ move, 1 = Chưa thuộc, 2 = Đã thuộc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA'))
        return;
      if (done) return;
      if (e.key === ' ') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === '1') mark('unknown');
      else if (e.key === '2') mark('known');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const options = (
    <div className="fc-options">
      <Switch
        checked={shuffle}
        label="Trộn thẻ"
        onChange={(v) => {
          setShuffle(v);
          restart({ shuffle: v, onlyUnknown });
        }}
      />
      <Switch
        checked={onlyUnknown}
        label="Chỉ học thẻ chưa thuộc"
        onChange={(v) => {
          setOnlyUnknown(v);
          restart({ shuffle, onlyUnknown: v });
        }}
      />
    </div>
  );

  if (onlyUnknown && total === 0) {
    return (
      <section className="fc" aria-label={deck.name || 'Bộ thẻ'}>
        {options}
        <div className="fc-end">
          <h3>{allKnownMessage(cards.length)}</h3>
          <Button
            onClick={() => {
              setOnlyUnknown(false);
              restart({ shuffle, onlyUnknown: false });
            }}
          >
            Học lại tất cả
          </Button>
        </div>
      </section>
    );
  }

  if (done) {
    const m = count('unknown') + count('none');
    return (
      <section className="fc" aria-label={deck.name || 'Bộ thẻ'}>
        <div className="fc-end" role="status">
          <span className="fc-end__icon" aria-hidden="true">
            <Icon name="check" size={36} />
          </span>
          <h3>Tổng kết bộ thẻ</h3>
          <p>
            Đã thuộc <b className="num">{count('known')}</b> · Chưa thuộc{' '}
            <b className="num">{count('unknown')}</b> · Chưa đánh dấu{' '}
            <b className="num">{count('none')}</b>
          </p>
          <div className="fc-end__actions">
            {m > 0 && (
              <Button
                block
                onClick={() => {
                  setOnlyUnknown(true);
                  restart({ shuffle, onlyUnknown: true });
                }}
              >
                Học thẻ chưa thuộc ({m})
              </Button>
            )}
            <Button
              block
              variant="outline"
              onClick={() => {
                setOnlyUnknown(false);
                restart({ shuffle, onlyUnknown: false });
              }}
            >
              Học lại tất cả
            </Button>
            <Button block variant="ghost" onClick={onBack}>
              Quay lại bước học
            </Button>
          </div>
        </div>
      </section>
    );
  }

  if (!card) return null;
  const state = MARK_LABEL[local[card.id] ?? 'none'];
  return (
    <section className="fc" aria-label={deck.name || 'Bộ thẻ'}>
      <div className="fc-head">
        <span className="small">
          Thẻ{' '}
          <b className="num">
            {at + 1}/{total}
          </b>
        </span>
        <span className={state.chip}>{state.text}</span>
      </div>
      <div className="fc-progress" aria-hidden="true">
        <i style={{ width: `${Math.round((at / total) * 100)}%` }} />
      </div>
      {options}
      <button
        type="button"
        className={flipped ? 'fc-card fc-card--back' : 'fc-card'}
        aria-pressed={flipped}
        aria-label={
          flipped
            ? `Mặt sau: ${card.pinyin}, ${card.meaning}. Chạm để lật lại`
            : `Mặt trước: ${card.front}. Chạm để lật thẻ`
        }
        onClick={() => setFlipped((f) => !f)}
      >
        {flipped ? (
          <span className="fc-face">
            <HanziText size="xl">{card.front}</HanziText>
            {card.pinyin && <PinyinText className="fc-pinyin">{card.pinyin}</PinyinText>}
            <span className="fc-meaning">{card.meaning}</span>
            {card.example && (
              <span className="fc-example" lang="zh-Hans">
                {card.example}
              </span>
            )}
            {card.image && <img className="fc-image" src={fileUrl(card.image)} alt="" />}
          </span>
        ) : (
          <span className="fc-face">
            <HanziText size="hero" className="fc-front">
              {card.front}
            </HanziText>
            <span className="small muted">
              <Icon name="refresh" size={14} /> Chạm để lật thẻ
            </span>
          </span>
        )}
      </button>
      <div className="fc-nav">
        <IconButton
          aria-label="Thẻ trước"
          icon={<span aria-hidden="true">‹</span>}
          disabled={at === 0}
          onClick={() => go(-1)}
        />
        <Button variant="outline" onClick={() => setFlipped((f) => !f)}>
          <Icon name="refresh" size={18} />
          Lật thẻ
        </Button>
        {card.audio && <AudioButton src={fileUrl(card.audio)} label={`Phát âm ${card.front}`} />}
        <IconButton
          aria-label="Thẻ sau"
          icon={<span aria-hidden="true">›</span>}
          onClick={() => go(1)}
        />
      </div>
      <div className="fc-answer">
        <Button variant="outline" onClick={() => mark('unknown')}>
          Chưa thuộc
        </Button>
        <Button onClick={() => mark('known')}>
          <Icon name="check" size={18} />
          Đã thuộc
        </Button>
      </div>
    </section>
  );
}
