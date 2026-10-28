import {
  EXERCISE_LIMITS as L,
  EXERCISE_MESSAGES as XM,
  type McqQuestion,
  type Question,
  type SubQuestion,
  type VocabQuestion,
  type WriteQuestion,
  newOption,
  optionLabel,
} from '@sat/shared';
import { SegmentedControl } from '../../components';
import { replaceAt } from '../steps/step-content';
import { AddButton, PointsField, QField, RowButtons, Rows } from './editor-fields';
import { ImageField } from './ImageField';
import { useSetEditing } from './set-editing';
import { ClozeEditor, MatchEditor, OrderEditor, ReadingEditor } from './QuestionEditors2';

export interface EditorProps<Q> {
  q: Q;
  /** `questions.<i>` or `questions.<i>.subs.<m>` (problem paths). */
  path: string;
  /** "3" or "3.2". */
  n: string;
  onChange: (q: Q) => void;
}

/** AC-3.1: the stem — text and at most one image. */
export function StemText({
  q,
  path,
  n,
  onChange,
  label = 'Đề bài',
}: EditorProps<Question | SubQuestion> & { label?: string }) {
  return (
    <>
      <QField
        path={`${path}.prompt`}
        label={label}
        value={q.prompt}
        max={L.promptMax}
        multiline
        onChange={(prompt) => onChange({ ...q, prompt })}
      />
      <ImageField target={{ ownerId: q.id }} label={`đề câu ${n}`} image={q.image} />
    </>
  );
}

export function Explanation({ q, path, onChange }: EditorProps<Question | SubQuestion>) {
  return (
    <QField
      path={`${path}.explanation`}
      label="Giải thích (không bắt buộc)"
      value={q.explanation}
      max={L.explanationMax}
      multiline
      onChange={(explanation) => onChange({ ...q, explanation })}
    />
  );
}

/** AC-4.1, AC-5.1: options A–F with the correct mark(s); vocabulary options are text only. */
function Options<Q extends McqQuestion | VocabQuestion>({ q, path, n, onChange }: EditorProps<Q>) {
  const { locked } = useSetEditing();
  const multi = q.type === 'mcq' && q.multi;
  const zh = q.type === 'vocab' && q.variant === 'hanzi';
  const pinyin = q.type === 'vocab' && q.variant === 'pinyin';
  const setOptions = (options: Q['options']) => onChange({ ...q, options });
  return (
    <Rows label="Phương án (đánh dấu đáp án đúng)">
      {q.options.map((o, k) => {
        const label = optionLabel(k);
        return (
          <div key={o.id} className="ex-option">
            <input
              type={multi ? 'checkbox' : 'radio'}
              name={`${q.id}-correct`}
              aria-label={`Đáp án đúng ${label}`}
              checked={o.correct}
              onChange={() =>
                setOptions(
                  q.options.map((x, i) =>
                    multi
                      ? i === k
                        ? { ...x, correct: !x.correct }
                        : x
                      : { ...x, correct: i === k },
                  ),
                )
              }
            />
            <span className="ex-option__label" aria-hidden="true">
              {label}
            </span>
            <QField
              path={`${path}.options.${k}.text`}
              label={`Phương án ${label}`}
              visibleLabel={false}
              value={o.text}
              max={L.optionMax}
              zh={zh}
              pinyin={pinyin}
              onChange={(text) => setOptions(replaceAt(q.options, k, { ...o, text }))}
            />
            {q.type === 'mcq' && (
              <ImageField
                target={{ ownerId: q.id, optionId: o.id }}
                label={`phương án ${label} của câu ${n}`}
                image={o.image}
              />
            )}
            <RowButtons
              noun={`phương án ${label}`}
              index={k}
              count={q.options.length}
              min={L.optionsMin}
              minReason={XM.optionCount}
              onDelete={() => setOptions(q.options.filter((_, i) => i !== k))}
            />
          </div>
        );
      })}
      <AddButton
        label="Thêm phương án"
        disabled={locked}
        full={q.options.length >= L.optionsMax}
        fullReason={XM.optionCount}
        onClick={() => setOptions([...q.options, newOption()])}
      />
      <span className="sr-only">Câu {n}</span>
    </Rows>
  );
}

/** REQ-4: "Một đáp án đúng" (default) or "Nhiều đáp án đúng". */
export function McqEditor(props: EditorProps<McqQuestion>) {
  const { q, path, onChange } = props;
  const { locked } = useSetEditing();
  return (
    <>
      <StemText {...props} onChange={(x) => onChange(x as McqQuestion)} />
      {locked ? (
        <p className="small muted">{q.multi ? 'Nhiều đáp án đúng' : 'Một đáp án đúng'}</p>
      ) : (
        <SegmentedControl
          aria-label="Chế độ đáp án"
          value={q.multi ? 'multi' : 'one'}
          options={[
            { value: 'one', label: 'Một đáp án đúng' },
            { value: 'multi', label: 'Nhiều đáp án đúng' },
          ]}
          onChange={(v) => onChange({ ...q, multi: v === 'multi' })}
        />
      )}
      <Options {...props} />
      <PointsField
        path={`${path}.points`}
        value={q.points}
        onChange={(points) => onChange({ ...q, points })}
      />
    </>
  );
}

/** REQ-5: the word fields of each variant, then the text-only options. */
export function VocabEditor(props: EditorProps<VocabQuestion>) {
  const { q, path, onChange } = props;
  const word = (
    <QField
      path={`${path}.word`}
      label="Từ (chữ Hán)"
      value={q.word}
      max={L.wordMax}
      zh
      onChange={(w) => onChange({ ...q, word: w })}
    />
  );
  const wordPinyin = (
    <QField
      path={`${path}.wordPinyin`}
      label="Pinyin của từ"
      value={q.wordPinyin}
      max={L.wordPinyinMax}
      pinyin
      onChange={(wordPinyin_) => onChange({ ...q, wordPinyin: wordPinyin_ })}
    />
  );
  const meaning = (
    <QField
      path={`${path}.meaning`}
      label="Nghĩa"
      value={q.meaning}
      max={L.meaningMax}
      onChange={(m) => onChange({ ...q, meaning: m })}
    />
  );
  return (
    <>
      <StemText {...props} label="Lời nhắc" onChange={(x) => onChange(x as VocabQuestion)} />
      <div className="ex-grid">
        {q.variant === 'meaning' && (
          <>
            {word}
            {wordPinyin}
          </>
        )}
        {q.variant === 'hanzi' && (
          <>
            {wordPinyin}
            {meaning}
          </>
        )}
        {q.variant === 'pinyin' && (
          <>
            {word}
            {meaning}
          </>
        )}
      </div>
      <Options {...props} />
      <PointsField
        path={`${path}.points`}
        value={q.points}
        onChange={(points) => onChange({ ...q, points })}
      />
    </>
  );
}

/** REQ-10: "Pinyin đề", "Nghĩa gợi ý", 1–5 accepted Hanzi answers. */
export function WriteEditor(props: EditorProps<WriteQuestion>) {
  const { q, path, onChange } = props;
  return (
    <>
      <StemText {...props} onChange={(x) => onChange(x as WriteQuestion)} />
      <div className="ex-grid">
        <QField
          path={`${path}.pinyin`}
          label="Pinyin đề"
          value={q.pinyin}
          max={L.writePinyinMax}
          pinyin
          onChange={(pinyin) => onChange({ ...q, pinyin })}
        />
        <QField
          path={`${path}.hint`}
          label="Nghĩa gợi ý (tùy chọn)"
          value={q.hint}
          max={L.hintMax}
          onChange={(hint) => onChange({ ...q, hint })}
        />
      </div>
      <Rows label="Đáp án được chấp nhận">
        {q.answers.map((a, k) => (
          <div key={k} className="ex-option">
            <QField
              path={`${path}.answers.${k}`}
              label={`Đáp án ${k + 1}`}
              visibleLabel={false}
              value={a}
              max={L.writeAnswerMax}
              zh
              onChange={(v) => onChange({ ...q, answers: replaceAt(q.answers, k, v) })}
            />
            <RowButtons
              noun={`đáp án ${k + 1}`}
              index={k}
              count={q.answers.length}
              min={1}
              onDelete={() => onChange({ ...q, answers: q.answers.filter((_, i) => i !== k) })}
            />
          </div>
        ))}
        <AddButton
          label="Thêm đáp án"
          disabled={q.answers.length >= L.writeAnswersMax}
          onClick={() => onChange({ ...q, answers: [...q.answers, ''] })}
        />
      </Rows>
      <PointsField
        path={`${path}.points`}
        value={q.points}
        onChange={(points) => onChange({ ...q, points })}
      />
    </>
  );
}

/** The editor of one question (or sub-question) by kind, stem and explanation included. */
export function QuestionEditor(props: EditorProps<Question | SubQuestion>) {
  const { q, onChange } = props;
  const body = (() => {
    switch (q.type) {
      case 'mcq':
        return <McqEditor {...props} q={q} onChange={onChange} />;
      case 'vocab':
        return <VocabEditor {...props} q={q} onChange={onChange} />;
      case 'cloze':
        return <ClozeEditor {...props} q={q} onChange={onChange} />;
      case 'match':
        return <MatchEditor {...props} q={q} onChange={onChange} />;
      case 'order':
        return <OrderEditor {...props} q={q} onChange={onChange} />;
      case 'write':
        return <WriteEditor {...props} q={q} onChange={onChange} />;
      case 'reading':
        return <ReadingEditor {...props} q={q} onChange={onChange} />;
    }
  })();
  return (
    <>
      {body}
      <Explanation {...props} />
    </>
  );
}
