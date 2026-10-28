import {
  type Answer,
  EXERCISE_LIMITS as L,
  EXERCISE_MESSAGES as XM,
  type FileRef,
  type LearnQuestion,
  optionLabel,
} from '@sat/shared';
import { type DragEvent, type KeyboardEvent, useState } from 'react';
import { Button, Dialog } from '../../components';
import { fileUrl } from '../steps/step-dom';
import './question-view.css';

export interface QuestionViewProps {
  q: LearnQuestion;
  /** "3" or "3.2" (AC-11.3). */
  n: string;
  answer: Answer | undefined;
  onAnswer: (a: Answer) => void;
  /** T21 and after submission: nothing can be changed (002 AC-16.5). */
  readOnly?: boolean;
}

/** AC-3.4: tap an image to zoom it, close it again; answers are kept. */
function Picture({ image, alt }: { image: FileRef | null; alt: string }) {
  const [open, setOpen] = useState(false);
  if (!image) return null;
  const src = fileUrl(image);
  return (
    <>
      <button
        type="button"
        className="qv-img"
        aria-label={`Phóng to ${alt}`}
        onClick={() => setOpen(true)}
      >
        <img src={src} alt={alt} />
      </button>
      {open && (
        <Dialog open title={alt} onClose={() => setOpen(false)}>
          <img className="qv-img__zoom" src={src} alt={alt} />
        </Dialog>
      )}
    </>
  );
}

function Stem({ q, n }: { q: LearnQuestion; n: string }) {
  return (
    <>
      {q.prompt.trim() && (
        <p className="qv-prompt" lang="zh-Hans">
          {q.prompt}
        </p>
      )}
      <Picture image={q.image} alt={`Hình của câu ${n}`} />
    </>
  );
}

/* ---------- REQ-4, REQ-5: native radios / checkboxes give tap, Tab, arrows and Space ---------- */

function Choices({
  q,
  n,
  answer,
  onAnswer,
  readOnly,
}: QuestionViewProps & { q: Extract<LearnQuestion, { options: unknown }> }) {
  const multi = q.type === 'mcq' && q.multi;
  const chosen = new Set(answer?.optionIds ?? []);
  const toggle = (id: string) => {
    if (!multi) return onAnswer({ ...answer, optionIds: [id] });
    const next = new Set(chosen);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onAnswer({ ...answer, optionIds: q.options.map((o) => o.id).filter((x) => next.has(x)) });
  };
  return (
    <fieldset className="qv-choices" disabled={readOnly}>
      <legend className="sr-only">Câu {n}</legend>
      {multi && <p className="qv-hint">{XM.chooseAll}</p>}
      {q.options.map((o, k) => (
        <label key={o.id} className={chosen.has(o.id) ? 'qv-choice qv-choice--on' : 'qv-choice'}>
          <input
            type={multi ? 'checkbox' : 'radio'}
            name={`qv-${q.id}`}
            checked={chosen.has(o.id)}
            onChange={() => toggle(o.id)}
          />
          <span className="qv-choice__label">{optionLabel(k)}</span>
          <span lang="zh-Hans" className="qv-choice__text">
            {o.text}
          </span>
          <Picture image={o.image} alt={`Hình phương án ${optionLabel(k)}`} />
        </label>
      ))}
    </fieldset>
  );
}

/* ---------- REQ-6: one input per blank, "Tiếp" / Tab moves to the next ---------- */

function Cloze({
  q,
  n,
  answer,
  onAnswer,
  readOnly,
}: QuestionViewProps & { q: Extract<LearnQuestion, { type: 'cloze' }> }) {
  const next = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const inputs = [...(e.currentTarget.closest('.qv-cloze')?.querySelectorAll('input') ?? [])];
    inputs[inputs.indexOf(e.currentTarget) + 1]?.focus();
  };
  return (
    <p className="qv-cloze" lang="zh-Hans">
      {q.segments.map((s, k) =>
        s.kind === 'text' ? (
          <span key={k}>{s.text}</span>
        ) : (
          <input
            key={s.id}
            className="input qv-blank"
            aria-label={`Câu ${n} · chỗ trống ${s.n}`}
            maxLength={L.blankAnswerMax}
            enterKeyHint="next"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            readOnly={readOnly}
            value={answer?.blanks?.[s.id] ?? ''}
            onKeyDown={next}
            onChange={(e) =>
              onAnswer({ ...answer, blanks: { ...answer?.blanks, [s.id]: e.target.value } })
            }
          />
        ),
      )}
    </p>
  );
}

/* ---------- REQ-8: tap A then B; tap a matched item to undo; drag A onto B ---------- */

const without = (pairs: Record<string, string>, key: string) =>
  Object.fromEntries(Object.entries(pairs).filter(([k]) => k !== key));

function Match({
  q,
  answer,
  onAnswer,
  readOnly,
}: QuestionViewProps & { q: Extract<LearnQuestion, { type: 'match' }> }) {
  const [picked, setPicked] = useState<string | null>(null);
  const pairs = answer?.pairs ?? {};
  const number = new Map<string, number>();
  q.a.forEach((a, k) => {
    const b = pairs[a.id];
    if (b) {
      number.set(a.id, k + 1);
      number.set(b, k + 1);
    }
  });
  const set = (next: Record<string, string>) => onAnswer({ ...answer, pairs: next });
  const link = (aId: string, bId: string) => {
    // AC-8.5: a Cột B item already used moves to the new pair.
    const next = Object.fromEntries(Object.entries(pairs).filter(([, b]) => b !== bId));
    set({ ...next, [aId]: bId });
    setPicked(null);
  };
  const tapA = (id: string) => {
    if (readOnly) return;
    if (pairs[id]) {
      set(without(pairs, id));
      setPicked(null);
    } else setPicked(picked === id ? null : id);
  };
  const tapB = (id: string) => {
    if (readOnly) return;
    if (picked) return link(picked, id);
    const owner = Object.keys(pairs).find((a) => pairs[a] === id);
    if (owner) {
      set(without(pairs, owner));
    }
  };
  const item = (side: 'a' | 'b', id: string, text: string) => {
    const no = number.get(id);
    return (
      <button
        key={id}
        type="button"
        className={`qv-item${no ? ' qv-item--on' : ''}${picked === id ? ' qv-item--picked' : ''}`}
        aria-pressed={side === 'a' ? picked === id : undefined}
        aria-label={`${text}${no ? ` · cặp ${no}` : ''}`}
        disabled={readOnly}
        draggable={side === 'a' && !readOnly}
        onDragStart={(e: DragEvent) => e.dataTransfer.setData('text/plain', id)}
        onDragOver={side === 'b' ? (e: DragEvent) => e.preventDefault() : undefined}
        onDrop={
          side === 'b'
            ? (e: DragEvent) => link(e.dataTransfer.getData('text/plain'), id)
            : undefined
        }
        onClick={() => (side === 'a' ? tapA(id) : tapB(id))}
      >
        {no && <span className="qv-item__no">{no}</span>}
        <span lang="zh-Hans">{text}</span>
      </button>
    );
  };
  return (
    <div className="qv-match">
      <div className="qv-col" role="group" aria-label={q.headA}>
        <span className="qv-col__head">{q.headA}</span>
        {q.a.map((a) => item('a', a.id, a.text))}
      </div>
      <div className="qv-col" role="group" aria-label={q.headB}>
        <span className="qv-col__head">{q.headB}</span>
        {q.b.map((b) => item('b', b.id, b.text))}
      </div>
    </div>
  );
}

/* ---------- REQ-9: tap a bank tile to append it, tap a placed tile to return it; drag works too ---------- */

function Order({
  q,
  n,
  answer,
  onAnswer,
  readOnly,
}: QuestionViewProps & { q: Extract<LearnQuestion, { type: 'order' }> }) {
  const placed = (answer?.tiles ?? []).filter((id) => q.tiles.some((t) => t.id === id));
  const bank = q.tiles.filter((t) => !placed.includes(t.id));
  const text = (id: string) => q.tiles.find((t) => t.id === id)?.text ?? '';
  const set = (tiles: string[]) => onAnswer({ ...answer, tiles });
  const dropAt = (at: number) => (e: DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    const rest = placed.filter((x) => x !== id);
    set([...rest.slice(0, at), id, ...rest.slice(at)]);
  };
  const tile = (id: string, onLine: boolean, k: number) => (
    <button
      key={id}
      type="button"
      className="qv-tile"
      lang="zh-Hans"
      disabled={readOnly}
      draggable={!readOnly}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', id)}
      onDragOver={onLine ? (e) => e.preventDefault() : undefined}
      onDrop={onLine ? dropAt(k) : undefined}
      onClick={() => set(onLine ? placed.filter((x) => x !== id) : [...placed, id])}
    >
      {text(id)}
    </button>
  );
  return (
    <div className="qv-order">
      <div
        className="qv-line"
        role="group"
        aria-label={`Câu ${n} · dòng trả lời`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={dropAt(placed.length)}
      >
        {placed.length ? (
          placed.map((id, k) => tile(id, true, k))
        ) : (
          <span className="qv-hint">Chạm mảnh để xếp câu</span>
        )}
      </div>
      <div
        className="qv-bank"
        role="group"
        aria-label={`Câu ${n} · ngân hàng mảnh`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => set(placed.filter((x) => x !== e.dataTransfer.getData('text/plain')))}
      >
        {bank.map((t, k) => tile(t.id, false, k))}
      </div>
      {placed.length > 0 && !readOnly && (
        <Button size="sm" variant="ghost" onClick={() => set([])}>
          Xếp lại từ đầu
        </Button>
      )}
    </div>
  );
}

/* ---------- REQ-10 ---------- */

function Write({
  q,
  n,
  answer,
  onAnswer,
  readOnly,
}: QuestionViewProps & { q: Extract<LearnQuestion, { type: 'write' }> }) {
  return (
    <div className="qv-write">
      <p className="qv-pinyin">{q.pinyin}</p>
      {q.hint && <p className="qv-hint">Nghĩa: {q.hint}</p>}
      <input
        className="input qv-write__input"
        lang="zh-Hans"
        aria-label={`Câu ${n} · chữ Hán`}
        maxLength={L.writeAnswerMax}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        spellCheck={false}
        readOnly={readOnly}
        value={answer?.text ?? ''}
        onChange={(e) => onAnswer({ ...answer, text: e.target.value })}
      />
      <p className="qv-hint">{XM.writeHelp}</p>
    </div>
  );
}

/* ---------- REQ-11: the passage stays open while answering; pinyin hidden by default ---------- */

function Reading({
  q,
  n,
  answer,
  onAnswer,
  readOnly,
}: QuestionViewProps & { q: Extract<LearnQuestion, { type: 'reading' }> }) {
  const [pinyin, setPinyin] = useState(false);
  return (
    <div className="qv-reading">
      <div className="qv-passage" lang="zh-Hans">
        {q.passage}
        {pinyin && <p className="qv-pinyin">{q.passagePinyin}</p>}
      </div>
      {q.passagePinyin.trim() && (
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={pinyin}
          onClick={() => setPinyin((p) => !p)}
        >
          {pinyin ? 'Ẩn pinyin' : 'Hiện pinyin'}
        </Button>
      )}
      <ol className="qv-subs">
        {q.subs.map((s, m) => (
          <li key={s.id}>
            <QuestionView
              q={s}
              n={`${n}.${m + 1}`}
              answer={answer?.subs?.[s.id]}
              readOnly={readOnly}
              onAnswer={(a) => onAnswer({ ...answer, subs: { ...answer?.subs, [s.id]: a } })}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

/** One question as the HV answers it (S05; read-only on T21). Never shows a key or an explanation (AC-16.5). */
export function QuestionView(props: QuestionViewProps) {
  const { q } = props;
  return (
    <section className="qv" aria-label={`Câu ${props.n}`}>
      <h3 className="qv-title">Câu {props.n}</h3>
      <Stem q={q} n={props.n} />
      {q.type === 'vocab' && (
        <div className="qv-word">
          {q.word && (
            <span className="qv-word__han" lang="zh-Hans">
              {q.word}
            </span>
          )}
          {q.wordPinyin && <span className="qv-pinyin">{q.wordPinyin}</span>}
          {q.meaning && <span>{q.meaning}</span>}
        </div>
      )}
      {(q.type === 'mcq' || q.type === 'vocab') && <Choices {...props} q={q} />}
      {q.type === 'cloze' && <Cloze {...props} q={q} />}
      {q.type === 'match' && <Match {...props} q={q} />}
      {q.type === 'order' && <Order {...props} q={q} />}
      {q.type === 'write' && <Write {...props} q={q} />}
      {q.type === 'reading' && <Reading {...props} q={q} />}
    </section>
  );
}
