import {
  type Block,
  type BlockOf,
  type CardMark,
  STEP_MESSAGES as SM,
  sanitizeRichText,
} from '@sat/shared';
import { useState } from 'react';
import { Button, HanziText, Icon, PinyinText, Switch } from '../../components';
import { DocumentViewer } from './DocumentViewer';
import { ImageLightbox } from './ImageLightbox';
import { MediaPlayer } from './MediaPlayer';
import { fileUrl } from './step-dom';
import { type DialoguePrefs, readDialoguePrefs, writeDialoguePrefs } from './viewer-prefs';
import { YouTubePlayer } from './YouTubePlayer';
import './viewer.css';

function RichText({ html }: { html: string }) {
  // Sanitised again before rendering (NFR-6), whatever the API returned.
  return (
    <div className="st-richtext" dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }} />
  );
}

function Caption({ text }: { text: string }) {
  return text.trim() ? <p className="sv-caption">{text}</p> : null;
}

/** AC-15.1: one entry per word, empty fields not shown. */
function VocabView({ block }: { block: BlockOf<'vocab'> }) {
  return (
    <section className="sv-card">
      <h3 className="sv-card__title">
        <Icon name="list" size={16} />
        Từ vựng · {block.words.length} từ
      </h3>
      <ul className="sv-vocab">
        {block.words.map((w, i) => (
          <li key={i} className="sv-vocab__row">
            <HanziText className="sv-vocab__han">{w.hanzi}</HanziText>
            <span className="sv-vocab__body">
              {(w.pinyin || w.pos) && (
                <span className="sv-vocab__meta">
                  {w.pinyin && <PinyinText>{w.pinyin}</PinyinText>}
                  {w.pos && <span className="chip">{w.pos}</span>}
                </span>
              )}
              {w.meaning && <span className="sv-vocab__meaning">{w.meaning}</span>}
              {w.example && (
                <span className="small muted" lang="zh-Hans">
                  {w.example}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** AC-15.2 */
function GrammarView({ block }: { block: BlockOf<'grammar'> }) {
  return (
    <section className="sv-card">
      <h3 className="sv-card__title">
        <Icon name="book" size={16} />
        {block.name}
      </h3>
      {block.structure.trim() && <div className="sv-struct">{block.structure}</div>}
      {block.explanation && <RichText html={block.explanation} />}
      {block.examples.map((e, i) => (
        <div key={i} className="sv-example">
          {e.sentence && <HanziText>{e.sentence}</HanziText>}
          {e.pinyin && <PinyinText className="sv-py">{e.pinyin}</PinyinText>}
          {e.meaning && <span className="small muted">{e.meaning}</span>}
        </div>
      ))}
    </section>
  );
}

/** AC-15.3, AC-15.4: lines with speaker, Hanzi, pinyin and translation; the switches act on every dialogue block. */
function DialogueView({
  block,
  prefs,
  onPrefs,
}: {
  block: BlockOf<'dialogue'>;
  prefs: DialoguePrefs;
  onPrefs: (p: DialoguePrefs) => void;
}) {
  return (
    <section className="sv-card">
      <div className="sv-switches">
        <Switch
          checked={prefs.pinyin}
          label="Pinyin"
          onChange={(pinyin) => onPrefs({ ...prefs, pinyin })}
        />
        <Switch
          checked={prefs.translation}
          label="Bản dịch"
          onChange={(translation) => onPrefs({ ...prefs, translation })}
        />
      </div>
      <h3 className="sv-card__title">
        <Icon name="users" size={16} />
        {block.kind === 'passage' ? 'Bài khóa' : 'Hội thoại'}
        {block.title.trim() ? ` · ${block.title}` : ''}
      </h3>
      {block.lines.map((l, i) => (
        <div key={i} className="sv-line">
          {block.kind === 'dialogue' && l.speaker.trim() && (
            <strong className="sv-line__who">{l.speaker}</strong>
          )}
          <div className="sv-line__body">
            <HanziText className="sv-line__han">{l.hanzi}</HanziText>
            {prefs.pinyin && l.pinyin && <PinyinText className="sv-py">{l.pinyin}</PinyinText>}
            {prefs.translation && l.translation && (
              <span className="small muted">{l.translation}</span>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

/** AC-16.1: the deck as a summary with its own known count and "Học flashcard". */
function DeckSummary({
  block,
  known,
  onOpen,
}: {
  block: BlockOf<'deck'>;
  known: number;
  onOpen: () => void;
}) {
  const n = block.cards.length;
  return (
    <section className="sv-card sv-deck">
      <div className="sv-deck__head">
        <span className="sv-deck__icon" aria-hidden="true">
          <Icon name="cards" size={22} />
        </span>
        <span>
          <span className="strong">{block.name.trim() || 'Bộ thẻ'}</span>
          <span className="small muted sv-block-text">
            {n} thẻ · Đã thuộc {known}/{n}
          </span>
        </span>
      </div>
      <Button block onClick={onOpen}>
        <Icon name="cards" size={18} />
        Học flashcard
      </Button>
    </section>
  );
}

export interface StepBlocksViewProps {
  blocks: Block[];
  /** The viewer's own marks (AC-16.1); empty in GV previews. */
  marks: Record<string, CardMark>;
  onOpenDeck: (deckId: string) => void;
  /** Reloads the step (fresh file links) after a block failed to load (AC-14.6). */
  onRetry?: () => void;
}

/** The blocks of a step exactly as the HV sees them on S03 (also T21 / T20 previews — AC-7.6). */
export function StepBlocksView({ blocks, marks, onOpenDeck, onRetry }: StepBlocksViewProps) {
  const [prefs, setPrefs] = useState<DialoguePrefs>(readDialoguePrefs);
  const [zoomed, setZoomed] = useState<BlockOf<'image'> | null>(null);
  const updatePrefs = (p: DialoguePrefs) => {
    setPrefs(p);
    writeDialoguePrefs(p);
  };

  const one = (b: Block) => {
    switch (b.type) {
      case 'text':
        return (
          <section className="sv-card sv-text">
            <RichText html={b.html} />
          </section>
        );
      case 'vocab':
        return <VocabView block={b} />;
      case 'grammar':
        return <GrammarView block={b} />;
      case 'dialogue':
        return <DialogueView block={b} prefs={prefs} onPrefs={updatePrefs} />;
      case 'deck':
        return (
          <DeckSummary
            block={b}
            known={b.cards.filter((c) => marks[c.id] === 'known').length}
            onOpen={() => onOpenDeck(b.id)}
          />
        );
      case 'video':
        return (
          <section className="sv-media">
            {b.youtube ? (
              <YouTubePlayer id={b.youtube} title={b.caption || 'Video'} />
            ) : b.file ? (
              <MediaPlayer
                kind="video"
                src={fileUrl(b.file)}
                label={b.caption || 'Video'}
                {...(onRetry ? { onRetry } : {})}
              />
            ) : null}
            <Caption text={b.caption} />
          </section>
        );
      case 'audio':
        return (
          <section className="sv-media">
            {b.file && (
              <MediaPlayer
                kind="audio"
                src={fileUrl(b.file)}
                label={b.caption || 'Âm thanh'}
                {...(onRetry ? { onRetry } : {})}
              />
            )}
            <Caption text={b.caption} />
          </section>
        );
      case 'image':
        return b.file ? (
          <figure className="sv-figure">
            <ImageBlock block={b} onZoom={() => setZoomed(b)} onRetry={onRetry} />
            <Caption text={b.caption} />
          </figure>
        ) : null;
      case 'document':
        return b.file ? (
          <section className="sv-media">
            <DocumentViewer file={b.file} title={b.caption} />
            <Caption text={b.caption} />
          </section>
        ) : null;
    }
  };

  return (
    <div className="sv-blocks">
      {blocks.map((b) => (
        <div key={b.id} className="sv-block">
          {one(b)}
        </div>
      ))}
      {zoomed?.file && (
        <ImageLightbox
          src={fileUrl(zoomed.file)}
          alt={zoomed.caption}
          caption={zoomed.caption}
          onClose={() => setZoomed(null)}
        />
      )}
    </div>
  );
}

/** An image that opens full screen when touched (AC-14.4), or its load error (AC-14.6). */
function ImageBlock({
  block,
  onZoom,
  onRetry,
}: {
  block: BlockOf<'image'>;
  onZoom: () => void;
  onRetry: (() => void) | undefined;
}) {
  const [failed, setFailed] = useState(false);
  if (!block.file) return null;
  if (failed) {
    return (
      <div className="st-blockerr" role="alert">
        <span>{SM.blockFailed}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setFailed(false);
            onRetry?.();
          }}
        >
          Thử lại
        </Button>
      </div>
    );
  }
  return (
    <button type="button" className="sv-image" aria-label="Xem ảnh toàn màn hình" onClick={onZoom}>
      <img src={fileUrl(block.file)} alt={block.caption} onError={() => setFailed(true)} />
    </button>
  );
}
