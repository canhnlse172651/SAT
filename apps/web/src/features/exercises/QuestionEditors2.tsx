import {
  type ClozeQuestion,
  EXERCISE_LIMITS as L,
  EXERCISE_MESSAGES as XM,
  type MatchQuestion,
  type OrderQuestion,
  type ReadingQuestion,
  type SubQuestion,
  blankToken,
  clozeBlanks,
  joinTiles,
  newBlockId,
  newCloze,
  newMcq,
  newPair,
  newTile,
  tilesByIds,
  tilesFromSentence,
  unmarkBlank,
} from '@sat/shared';
import { useState } from 'react';
import { Button, Icon, Textarea } from '../../components';
import { move, replaceAt } from '../steps/step-content';
import { AddButton, PointsField, QField, RowButtons, Rows } from './editor-fields';
import { type EditorProps, QuestionEditor, StemText } from './QuestionEditors';
import { useSetEditing } from './set-editing';

/* ---------- REQ-6 cloze: the passage shows blanks as [[1]], [[2]] … ---------- */

const TOKEN = /\[\[([A-Za-z0-9_#-]{1,40})\]\]/g;

/** Raw passage (`[[<blank id>]]`) → what the GV edits (`[[n]]`). */
function toDisplay(q: ClozeQuestion): string {
  const order = clozeBlanks(q).map((b) => b.id);
  return q.text.replace(TOKEN, (m, id: string) => {
    const n = order.indexOf(id);
    return n < 0 ? m : `[[${n + 1}]]`;
  });
}

/** Edited passage → raw passage; unknown "[[x]]" stay text (single brackets), removed blanks drop out. */
function fromDisplay(q: ClozeQuestion, display: string, added?: string): ClozeQuestion {
  const order = clozeBlanks(q).map((b) => b.id);
  const text = display.replace(TOKEN, (_m, key: string) => {
    if (key === '#new' && added) return blankToken(added);
    const id = order[Number(key) - 1];
    return /^\d+$/.test(key) && id ? blankToken(id) : `[${key}]`;
  });
  return { ...q, text };
}

const keepPresent = (q: ClozeQuestion): ClozeQuestion => ({
  ...q,
  blanks: q.blanks.filter((b) => q.text.includes(blankToken(b.id))),
});

export function ClozeEditor(props: EditorProps<ClozeQuestion>) {
  const { q, path, onChange } = props;
  const { locked, error } = useSetEditing();
  const display = toDisplay(q);
  const blanks = clozeBlanks(q);

  /** AC-6.1: the selected part becomes a numbered blank whose first accepted answer is that part. */
  const mark = () => {
    const el = document.querySelector<HTMLTextAreaElement>(
      `textarea[data-path="${CSS.escape(`${path}.text`)}"]`,
    );
    if (!el) return;
    const [s, e] = [el.selectionStart, el.selectionEnd];
    const picked = display.slice(s, e).trim();
    if (!picked || picked.includes('[[') || picked.includes(']]')) return;
    const id = newBlockId();
    const next = fromDisplay(q, display.slice(0, s) + '[[#new]]' + display.slice(e), id);
    onChange({
      ...next,
      blanks: [...q.blanks, { id, answers: [picked.slice(0, L.blankAnswerMax)], points: 1 }],
    });
  };

  return (
    <>
      <StemText {...props} onChange={(x) => onChange(x as ClozeQuestion)} />
      <Textarea
        label="Đoạn văn"
        hint="Chọn một đoạn trong đoạn văn rồi bấm “Đánh dấu chỗ trống”; [[1]], [[2]]… là các chỗ trống."
        rows={4}
        lang="zh-Hans"
        value={display}
        data-path={`${path}.text`}
        error={error(`${path}.text`)}
        onChange={(e) => onChange(keepPresent(fromDisplay(q, e.target.value)))}
      />
      <span>
        <Button size="sm" variant="outline" onClick={mark} disabled={locked}>
          <Icon name="edit" size={15} />
          Đánh dấu chỗ trống
        </Button>
      </span>
      {blanks.map((b, k) => {
        const i = q.blanks.indexOf(b);
        const setBlank = (next: typeof b) =>
          onChange({ ...q, blanks: replaceAt(q.blanks, i, next) });
        return (
          <fieldset key={b.id} className="ex-sub">
            <legend className="small strong">Chỗ trống {k + 1}</legend>
            <Rows label="Đáp án được chấp nhận">
              {b.answers.map((a, j) => (
                <div key={j} className="ex-option">
                  <QField
                    path={`${path}.blanks.${i}.answers.${j}`}
                    label={`Chỗ trống ${k + 1} · đáp án ${j + 1}`}
                    visibleLabel={false}
                    value={a}
                    max={L.blankAnswerMax}
                    onChange={(v) => setBlank({ ...b, answers: replaceAt(b.answers, j, v) })}
                  />
                  <RowButtons
                    noun={`đáp án ${j + 1} của chỗ trống ${k + 1}`}
                    index={j}
                    count={b.answers.length}
                    min={1}
                    onDelete={() =>
                      setBlank({ ...b, answers: b.answers.filter((_, x) => x !== j) })
                    }
                  />
                </div>
              ))}
              <AddButton
                label="Thêm đáp án"
                disabled={b.answers.length >= L.blankAnswersMax}
                onClick={() => setBlank({ ...b, answers: [...b.answers, ''] })}
              />
            </Rows>
            <div className="ex-inline">
              <PointsField
                path={`${path}.blanks.${i}.points`}
                label={`Điểm chỗ trống ${k + 1}`}
                value={b.points}
                onChange={(points) => setBlank({ ...b, points })}
              />
              <Button
                size="sm"
                variant="ghost"
                disabled={locked}
                onClick={() => onChange(unmarkBlank(q, b.id))}
              >
                Bỏ chỗ trống {k + 1}
              </Button>
            </div>
          </fieldset>
        );
      })}
    </>
  );
}

/* ---------- REQ-8 matching ---------- */

export function MatchEditor(props: EditorProps<MatchQuestion>) {
  const { q, path, onChange } = props;
  const { locked } = useSetEditing();
  const n = q.pairs.length;

  /** AC-8.3: the Cột B item of pair k changes place with the next Cột B item (next pair, then the distractors). */
  const swap = (k: number) => {
    const pairs = [...q.pairs];
    const distractors = [...q.distractors];
    const a = pairs[k];
    if (!a) return;
    const next = pairs[k + 1];
    if (next) {
      pairs[k] = { ...a, b: next.b, bId: next.bId };
      pairs[k + 1] = { ...next, b: a.b, bId: a.bId };
    } else {
      const d = distractors[0];
      if (!d) return;
      pairs[k] = { ...a, b: d.text, bId: d.id };
      distractors[0] = { id: a.bId, text: a.b };
    }
    onChange({ ...q, pairs, distractors });
  };

  return (
    <>
      <StemText {...props} onChange={(x) => onChange(x as MatchQuestion)} />
      <div className="ex-grid">
        <QField
          path={`${path}.headA`}
          label="Tiêu đề Cột A"
          value={q.headA}
          max={L.headMax}
          onChange={(headA) => onChange({ ...q, headA })}
        />
        <QField
          path={`${path}.headB`}
          label="Tiêu đề Cột B"
          value={q.headB}
          max={L.headMax}
          onChange={(headB) => onChange({ ...q, headB })}
        />
      </div>
      <Rows label="Các cặp">
        {q.pairs.map((p, k) => (
          <div key={p.id} className="ex-pair">
            <span className="ex-option__label">{k + 1}</span>
            <QField
              path={`${path}.pairs.${k}.a`}
              label={`Cặp ${k + 1} · Cột A`}
              visibleLabel={false}
              value={p.a}
              max={L.matchItemMax}
              onChange={(a) => onChange({ ...q, pairs: replaceAt(q.pairs, k, { ...p, a }) })}
            />
            <QField
              path={`${path}.pairs.${k}.b`}
              label={`Cặp ${k + 1} · Cột B`}
              visibleLabel={false}
              value={p.b}
              max={L.matchItemMax}
              onChange={(b) => onChange({ ...q, pairs: replaceAt(q.pairs, k, { ...p, b }) })}
            />
            <PointsField
              path={`${path}.pairs.${k}.points`}
              label={`Điểm cặp ${k + 1}`}
              value={p.points}
              onChange={(points) =>
                onChange({ ...q, pairs: replaceAt(q.pairs, k, { ...p, points }) })
              }
            />
            <Button
              size="sm"
              variant="ghost"
              aria-label={`Hoán đổi mục Cột B của cặp ${k + 1}`}
              title="Hoán đổi mục Cột B với mục kế tiếp"
              disabled={k === n - 1 && !q.distractors.length}
              onClick={() => swap(k)}
            >
              Hoán đổi
            </Button>
            <RowButtons
              noun={`cặp ${k + 1}`}
              index={k}
              count={n}
              min={L.pairsMin}
              minReason={XM.pairCount}
              onDelete={() => onChange({ ...q, pairs: q.pairs.filter((_, i) => i !== k) })}
            />
          </div>
        ))}
        <AddButton
          label="Thêm cặp"
          disabled={locked}
          full={n >= L.pairsMax}
          fullReason={XM.pairCount}
          onClick={() => onChange({ ...q, pairs: [...q.pairs, newPair()] })}
        />
      </Rows>
      <Rows label="Mục nhiễu (chỉ ở Cột B, tùy chọn)">
        {q.distractors.map((d, k) => (
          <div key={d.id} className="ex-option">
            <QField
              path={`${path}.distractors.${k}.text`}
              label={`Mục nhiễu ${k + 1}`}
              visibleLabel={false}
              value={d.text}
              max={L.matchItemMax}
              onChange={(text) =>
                onChange({ ...q, distractors: replaceAt(q.distractors, k, { ...d, text }) })
              }
            />
            <RowButtons
              noun={`mục nhiễu ${k + 1}`}
              index={k}
              count={q.distractors.length}
              min={0}
              onDelete={() =>
                onChange({ ...q, distractors: q.distractors.filter((_, i) => i !== k) })
              }
            />
          </div>
        ))}
        <AddButton
          label="Thêm mục nhiễu"
          disabled={locked || q.distractors.length >= L.distractorsMax}
          onClick={() =>
            onChange({ ...q, distractors: [...q.distractors, { id: newBlockId(), text: '' }] })
          }
        />
      </Rows>
    </>
  );
}

/* ---------- REQ-9 sentence ordering ---------- */

/** Accepted orders follow the tiles: removed tiles drop out, new tiles are appended. */
const syncAlternatives = (q: OrderQuestion): OrderQuestion => {
  const ids = q.tiles.map((t) => t.id);
  return {
    ...q,
    alternatives: q.alternatives.map((alt) => {
      const kept = alt.filter((id) => ids.includes(id));
      return [...kept, ...ids.filter((id) => !kept.includes(id))];
    }),
  };
};

export function OrderEditor(props: EditorProps<OrderQuestion>) {
  const { q, path, onChange } = props;
  const { locked } = useSetEditing();
  const [sentence, setSentence] = useState('');
  const setTiles = (tiles: OrderQuestion['tiles']) => onChange(syncAlternatives({ ...q, tiles }));
  return (
    <>
      <StemText {...props} onChange={(x) => onChange(x as OrderQuestion)} />
      {!locked && (
        <div className="ex-inline">
          <QField
            path={`${path}.sentence`}
            label="Câu đúng, các mảnh ngăn cách bởi “/”"
            placeholder="我/是/越南/人"
            value={sentence}
            max={400}
            zh
            onChange={setSentence}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={!sentence.trim()}
            onClick={() => {
              setTiles(tilesFromSentence(sentence));
              setSentence('');
            }}
          >
            Tạo mảnh
          </Button>
        </div>
      )}
      <Rows label={`Mảnh theo thứ tự câu đúng: ${joinTiles(q.tiles) || '—'}`}>
        {q.tiles.map((t, k) => (
          <div key={t.id} className="ex-option">
            <span className="ex-option__label">{k + 1}</span>
            <QField
              path={`${path}.tiles.${k}.text`}
              label={`Mảnh ${k + 1}`}
              visibleLabel={false}
              value={t.text}
              max={100}
              zh
              onChange={(text) => setTiles(replaceAt(q.tiles, k, { ...t, text }))}
            />
            <RowButtons
              noun={`mảnh ${k + 1}`}
              index={k}
              count={q.tiles.length}
              min={L.tilesMin}
              onMove={(to) => setTiles(move(q.tiles, k, to))}
              onDelete={() => setTiles(q.tiles.filter((_, i) => i !== k))}
            />
          </div>
        ))}
        <AddButton
          label="Thêm mảnh"
          disabled={locked || q.tiles.length >= L.tilesMax}
          onClick={() => setTiles([...q.tiles, newTile('')])}
        />
      </Rows>
      <Rows label="Thứ tự khác được chấp nhận (tùy chọn)">
        {q.alternatives.map((alt, a) => {
          const tiles = tilesByIds(q, alt);
          const setAlt = (ids: string[]) =>
            onChange({ ...q, alternatives: replaceAt(q.alternatives, a, ids) });
          return (
            <fieldset key={a} className="ex-sub" data-path={`${path}.alternatives.${a}`}>
              <legend className="small strong">
                Thứ tự chấp nhận {a + 1}: {joinTiles(tiles)}
              </legend>
              {tiles.map((t, k) => (
                <div key={t.id} className="ex-option">
                  <span className="ex-option__label">{k + 1}</span>
                  <span lang="zh-Hans" className="grow">
                    {t.text || '—'}
                  </span>
                  <RowButtons
                    noun={`mảnh ${k + 1} của thứ tự ${a + 1}`}
                    index={k}
                    count={tiles.length}
                    min={0}
                    onMove={(to) => setAlt(move(alt, k, to))}
                  />
                </div>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  onChange({ ...q, alternatives: q.alternatives.filter((_, i) => i !== a) })
                }
              >
                Xóa thứ tự {a + 1}
              </Button>
            </fieldset>
          );
        })}
        <AddButton
          label="Thêm thứ tự khác"
          disabled={q.alternatives.length >= L.alternativesMax || q.tiles.length < 2}
          onClick={() =>
            onChange({
              ...q,
              alternatives: [...q.alternatives, [...q.tiles].reverse().map((t) => t.id)],
            })
          }
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

/* ---------- REQ-11 reading ---------- */

export function ReadingEditor(props: EditorProps<ReadingQuestion>) {
  const { q, path, n, onChange } = props;
  const { locked } = useSetEditing();
  const setSubs = (subs: SubQuestion[]) => onChange({ ...q, subs });
  return (
    <>
      <StemText {...props} onChange={(x) => onChange(x as ReadingQuestion)} />
      <QField
        path={`${path}.passage`}
        label="Đoạn đọc"
        value={q.passage}
        max={L.passageMax}
        multiline
        zh
        onChange={(passage) => onChange({ ...q, passage })}
      />
      <QField
        path={`${path}.passagePinyin`}
        label="Phiên âm pinyin của đoạn đọc (tùy chọn)"
        value={q.passagePinyin}
        max={L.passagePinyinMax}
        multiline
        onChange={(passagePinyin) => onChange({ ...q, passagePinyin })}
      />
      {q.subs.map((s, m) => (
        <fieldset key={s.id} className="ex-sub">
          <legend className="small strong">
            Câu {n}.{m + 1} · {s.type === 'mcq' ? 'Trắc nghiệm' : 'Điền chỗ trống'}
          </legend>
          <RowButtons
            noun={`câu hỏi con ${n}.${m + 1}`}
            index={m}
            count={q.subs.length}
            min={1}
            onMove={(to) => setSubs(move(q.subs, m, to))}
            onDelete={() => setSubs(q.subs.filter((_, i) => i !== m))}
          />
          <QuestionEditor
            q={s}
            path={`${path}.subs.${m}`}
            n={`${n}.${m + 1}`}
            onChange={(x) => setSubs(replaceAt(q.subs, m, x as SubQuestion))}
          />
        </fieldset>
      ))}
      <span className="ex-inline">
        <AddButton
          label="Thêm câu hỏi con trắc nghiệm"
          disabled={locked || q.subs.length >= L.subsMax}
          onClick={() => setSubs([...q.subs, newMcq()])}
        />
        <AddButton
          label="Thêm câu hỏi con điền chỗ trống"
          disabled={locked || q.subs.length >= L.subsMax}
          onClick={() => setSubs([...q.subs, newCloze()])}
        />
      </span>
    </>
  );
}
