import {
  type BlockOf,
  type FieldProblem,
  STEP_LIMITS,
  STEP_MESSAGES as SM,
  WORD_CLASSES,
  emptyExample,
  emptyLine,
  emptyWord,
} from '@sat/shared';
import type { ReactNode } from 'react';
import { SegmentedControl } from '../../components';
import { AddRow, Cell, PinyinCell, RowTools } from './editor-parts';
import { useDragList } from './use-drag-list';
import { RichTextEditor } from './RichTextEditor';
import { move, problemText, replaceAt } from './step-content';

interface EditorProps<T extends 'vocab' | 'grammar' | 'dialogue'> {
  block: BlockOf<T>;
  /** `blocks.<k>` — prefix of this block's field problems. */
  path: string;
  problems: Map<string, FieldProblem>;
  onChange: (block: BlockOf<T>) => void;
}

const err = (problems: Map<string, FieldProblem>, path: string) => problemText(problems.get(path));

/** AC-4.1: up to 100 words of Chữ Hán, Pinyin, Loại từ, Nghĩa, Ví dụ. */
export function VocabEditor({
  block,
  path,
  problems,
  onChange,
  actions,
}: EditorProps<'vocab'> & { actions: ReactNode }) {
  const words = block.words;
  const set = (next: typeof words) => onChange({ ...block, words: next });
  const drag = useDragList((from, to) => set(move(words, from, to)));
  return (
    <div className="st-rows">
      <div className="st-row st-row--head st-vocab" aria-hidden="true">
        <span>#</span>
        <span>Chữ Hán *</span>
        <span>Pinyin</span>
        <span>Loại từ</span>
        <span>Nghĩa *</span>
        <span>Ví dụ</span>
        <span />
      </div>
      {words.map((w, i) => {
        const p = `${path}.words.${i}`;
        const put = (patch: Partial<typeof w>) => set(replaceAt(words, i, { ...w, ...patch }));
        return (
          <div key={i} className="st-row st-vocab" {...drag.target(i)}>
            <span className="num muted small">{i + 1}</span>
            <Cell
              label={`Chữ Hán của từ ${i + 1}`}
              lang="zh"
              value={w.hanzi}
              maxLength={STEP_LIMITS.hanziMax}
              error={err(problems, `${p}.hanzi`)}
              onChange={(hanzi) => put({ hanzi })}
            />
            <PinyinCell
              label={`Pinyin của từ ${i + 1}`}
              value={w.pinyin}
              maxLength={STEP_LIMITS.pinyinMax}
              error={err(problems, `${p}.pinyin`)}
              onChange={(pinyin) => put({ pinyin })}
            />
            <select
              className="input"
              aria-label={`Loại từ của từ ${i + 1}`}
              value={w.pos}
              onChange={(e) => put({ pos: e.target.value as typeof w.pos })}
            >
              <option value="">—</option>
              {WORD_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <Cell
              label={`Nghĩa của từ ${i + 1}`}
              value={w.meaning}
              maxLength={STEP_LIMITS.meaningMax}
              error={err(problems, `${p}.meaning`)}
              onChange={(meaning) => put({ meaning })}
            />
            <Cell
              label={`Ví dụ của từ ${i + 1}`}
              value={w.example}
              multiline
              maxLength={STEP_LIMITS.exampleMax}
              onChange={(example) => put({ example })}
            />
            <RowTools
              noun="từ"
              index={i}
              count={words.length}
              grip={drag.grip(i)}
              onMove={(to) => set(move(words, i, to))}
              onDelete={() => set(words.filter((_, k) => k !== i))}
            />
          </div>
        );
      })}
      <div className="st-block__foot">
        <AddRow
          label="Thêm từ"
          full={words.length >= STEP_LIMITS.wordsPerBlock}
          fullMessage={SM.maxWords}
          onAdd={() => set([...words, emptyWord()])}
        />
        {actions}
        <span className="small muted">
          {words.length}/{STEP_LIMITS.wordsPerBlock} từ
        </span>
      </div>
    </div>
  );
}

/** AC-4.2: name, structure, explanation (rich text) and up to 20 examples. */
export function GrammarEditor({ block, path, problems, onChange }: EditorProps<'grammar'>) {
  const examples = block.examples;
  const set = (next: typeof examples) => onChange({ ...block, examples: next });
  const drag = useDragList((from, to) => set(move(examples, from, to)));
  return (
    <div className="st-rows">
      <div className="st-grid-2">
        <Cell
          visibleLabel
          label="Tên mẫu câu *"
          placeholder="Ví dụ: Câu hỏi với 吗"
          value={block.name}
          maxLength={STEP_LIMITS.grammarNameMax}
          error={err(problems, `${path}.name`)}
          onChange={(name) => onChange({ ...block, name })}
        />
        <Cell
          visibleLabel
          label="Cấu trúc"
          placeholder="Ví dụ: Chủ ngữ + Động từ + Tân ngữ + 吗？"
          value={block.structure}
          maxLength={STEP_LIMITS.structureMax}
          onChange={(structure) => onChange({ ...block, structure })}
        />
      </div>
      <RichTextEditor
        label="Giải thích"
        value={block.explanation}
        max={STEP_LIMITS.explanationMax}
        minRows={2}
        error={err(problems, `${path}.explanation`)}
        onChange={(explanation) => onChange({ ...block, explanation })}
      />
      <p className="field__label">
        Ví dụ ({examples.length}/{STEP_LIMITS.examplesPerPoint})
      </p>
      {examples.map((e, i) => {
        const put = (patch: Partial<typeof e>) => set(replaceAt(examples, i, { ...e, ...patch }));
        return (
          <div key={i} className="st-row st-example" {...drag.target(i)}>
            <span className="num muted small">{i + 1}</span>
            <Cell
              label={`Câu ví dụ ${i + 1}`}
              lang="zh"
              value={e.sentence}
              maxLength={STEP_LIMITS.sentenceMax}
              onChange={(sentence) => put({ sentence })}
            />
            <PinyinCell
              label={`Pinyin ví dụ ${i + 1}`}
              value={e.pinyin}
              maxLength={STEP_LIMITS.examplePinyinMax}
              error={err(problems, `${path}.examples.${i}.pinyin`)}
              onChange={(pinyin) => put({ pinyin })}
            />
            <Cell
              label={`Nghĩa ví dụ ${i + 1}`}
              value={e.meaning}
              maxLength={STEP_LIMITS.exampleMeaningMax}
              onChange={(meaning) => put({ meaning })}
            />
            <RowTools
              noun="ví dụ"
              index={i}
              count={examples.length}
              grip={drag.grip(i)}
              onMove={(to) => set(move(examples, i, to))}
              onDelete={() => set(examples.filter((_, k) => k !== i))}
            />
          </div>
        );
      })}
      <AddRow
        label="Thêm ví dụ"
        full={examples.length >= STEP_LIMITS.examplesPerPoint}
        fullMessage={SM.maxExamples}
        onAdd={() => set([...examples, emptyExample()])}
      />
    </div>
  );
}

/** AC-4.3: "Hội thoại" (with speakers) or "Bài khóa", a title and up to 100 lines. */
export function DialogueEditor({ block, path, problems, onChange }: EditorProps<'dialogue'>) {
  const lines = block.lines;
  const set = (next: typeof lines) => onChange({ ...block, lines: next });
  const drag = useDragList((from, to) => set(move(lines, from, to)));
  const conv = block.kind === 'dialogue';
  return (
    <div className="st-rows">
      <div className="st-inline">
        <SegmentedControl
          aria-label="Loại khối"
          options={[
            { value: 'dialogue', label: 'Hội thoại' },
            { value: 'passage', label: 'Bài khóa' },
          ]}
          value={block.kind}
          onChange={(kind) => onChange({ ...block, kind })}
        />
        <Cell
          label="Tiêu đề"
          placeholder="Tiêu đề (không bắt buộc)"
          value={block.title}
          maxLength={STEP_LIMITS.dialogueTitleMax}
          onChange={(title) => onChange({ ...block, title })}
        />
      </div>
      {lines.map((l, i) => {
        const p = `${path}.lines.${i}`;
        const put = (patch: Partial<typeof l>) => set(replaceAt(lines, i, { ...l, ...patch }));
        return (
          <div
            key={i}
            className={conv ? 'st-row st-line' : 'st-row st-line st-line--passage'}
            {...drag.target(i)}
          >
            <span className="num muted small">{i + 1}</span>
            {conv && (
              <Cell
                label={`Người nói lời ${i + 1}`}
                placeholder="Người nói"
                value={l.speaker}
                maxLength={STEP_LIMITS.speakerMax}
                onChange={(speaker) => put({ speaker })}
              />
            )}
            <Cell
              label={`Chữ Hán lời ${i + 1}`}
              lang="zh"
              value={l.hanzi}
              maxLength={STEP_LIMITS.lineHanziMax}
              error={err(problems, `${p}.hanzi`)}
              onChange={(hanzi) => put({ hanzi })}
            />
            <PinyinCell
              label={`Pinyin lời ${i + 1}`}
              value={l.pinyin}
              maxLength={STEP_LIMITS.linePinyinMax}
              error={err(problems, `${p}.pinyin`)}
              onChange={(pinyin) => put({ pinyin })}
            />
            <Cell
              label={`Bản dịch lời ${i + 1}`}
              value={l.translation}
              maxLength={STEP_LIMITS.translationMax}
              onChange={(translation) => put({ translation })}
            />
            <RowTools
              noun="dòng"
              index={i}
              count={lines.length}
              grip={drag.grip(i)}
              onMove={(to) => set(move(lines, i, to))}
              onDelete={() => set(lines.filter((_, k) => k !== i))}
            />
          </div>
        );
      })}
      <AddRow
        label="Thêm dòng"
        full={lines.length >= STEP_LIMITS.linesPerBlock}
        fullMessage={SM.maxLines}
        onAdd={() => set([...lines, emptyLine()])}
      />
    </div>
  );
}
