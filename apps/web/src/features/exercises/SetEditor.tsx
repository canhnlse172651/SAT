import {
  EXERCISE_LIMITS as L,
  EXERCISE_MESSAGES as XM,
  type ExerciseSetContent,
  type Question,
  QUESTION_KINDS,
  QUESTION_KIND_LABELS,
  formatNumber,
  newQuestion,
  problemsAt,
  questionKind,
  questionPoints,
  setPoints,
  setProblems,
} from '@sat/shared';
import { useMemo, useState } from 'react';
import { Button, Icon, IconButton, Textarea } from '../../components';
import { move, replaceAt } from '../steps/step-content';
import { useToastStore } from '../toast/toast-store';
import { QuestionEditor } from './QuestionEditors';
import { SetEditingContext, invalidAt } from './set-editing';
import './exercises.css';

export interface StepOption {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
}

const STEP_STATUS = { draft: 'Nháp', published: 'Đã xuất bản', archived: 'Lưu trữ' } as const;

export interface SetBodyProps {
  itemId: string;
  title: string;
  content: ExerciseSetContent;
  /** Steps of the Bài in section order (AC-1.3). */
  steps: readonly StepOption[];
  /** Paths of fields the GV has left (their rule messages show, AC-2.6); "*" shows every field. */
  touched: ReadonlySet<string>;
  onTouch: (path: string) => void;
  onChange: (content: ExerciseSetContent) => void;
  /** Structure locked by submissions (AC-18.1). */
  locked?: boolean;
}

/** T09: the body of one set — instructions, linked step, questions (REQ-1 … REQ-11). Edits stay unsaved (AC-12.9). */
export function SetBody({
  itemId,
  title,
  content,
  steps,
  touched,
  onTouch,
  onChange,
  locked = false,
}: SetBodyProps) {
  const push = useToastStore((s) => s.push);
  const [menu, setMenu] = useState(false);
  const [limitNote, setLimitNote] = useState(false);
  const problems = useMemo(() => setProblems(title, content), [title, content]);
  const invalid = useMemo(() => invalidAt(problems), [problems]);
  const editing = useMemo(
    () => ({
      error: (path: string) =>
        touched.has(path) || touched.has('*') ? invalid.get(path) : undefined,
      locked,
    }),
    [touched, invalid, locked],
  );
  const questions = content.questions;
  const setQuestions = (qs: Question[]) => onChange({ ...content, questions: qs });

  const add = (kind: (typeof QUESTION_KINDS)[number]) => {
    setMenu(false);
    if (questions.length >= L.questionsPerSet) {
      setLimitNote(true);
      return;
    }
    setQuestions([...questions, newQuestion(kind)]);
  };

  const remove = (i: number) => {
    // AC-2.2: the last question stays; no confirmation (nothing is saved until the set is).
    if (questions.length <= 1) {
      push(XM.lastQuestion, 'warn');
      return;
    }
    setQuestions(questions.filter((_, k) => k !== i));
  };

  return (
    <SetEditingContext.Provider value={editing}>
      <div
        className="ex-set"
        onBlur={(e) => {
          const path = (e.target as HTMLElement).dataset['path'];
          if (path) onTouch(path);
        }}
      >
        <div className="ex-grid">
          <Textarea
            label="Hướng dẫn (tùy chọn)"
            rows={2}
            maxLength={L.instructionsMax}
            value={content.instructions}
            onChange={(e) => onChange({ ...content, instructions: e.target.value })}
          />
          <div className="field">
            <label className="field__label" htmlFor={`${itemId}-step`}>
              Bước học liên kết
            </label>
            <select
              id={`${itemId}-step`}
              className="input"
              value={content.stepId ?? ''}
              onChange={(e) => onChange({ ...content, stepId: e.target.value || null })}
            >
              <option value="">Không liên kết</option>
              {steps.map((s) => (
                <option key={s.id} value={s.id}>
                  {(s.title.trim() || 'Bước chưa đặt tên') + ` (${STEP_STATUS[s.status]})`}
                </option>
              ))}
            </select>
            <p className="field__hint">Học viên thấy nút “Luyện tập: …” ở cuối bước học này.</p>
          </div>
        </div>

        <p className="ex-total" aria-live="polite">
          {questions.length} câu · Tổng điểm{' '}
          <strong>{formatNumber(setPoints(content), 1).replace(/,0$/, '')}</strong>
        </p>

        <ol className="ex-questions">
          {questions.map((q, i) => {
            const n = String(i + 1);
            const missing = problemsAt(problems, `questions.${i}`).filter(
              (p) => p.kind === 'incomplete',
            );
            return (
              <li key={q.id} className="ex-question" data-question={n}>
                <section aria-label={`Câu ${n}`}>
                  <div className="ex-question__bar">
                    <strong>
                      Câu {n} · {QUESTION_KIND_LABELS[questionKind(q)]}
                    </strong>
                    <span className="small muted">
                      {formatNumber(questionPoints(q), 1).replace(/,0$/, '')} điểm
                    </span>
                    {missing.length > 0 && (
                      <span className="chip chip--pending">Chưa hoàn chỉnh</span>
                    )}
                    {q.ai && <span className="chip cur-ai-tag">AI tạo</span>}
                    <span className="grow" />
                    <IconButton
                      size="sm"
                      aria-label="Lên trên"
                      icon={<Icon name="up" size={16} />}
                      disabled={locked || i === 0}
                      onClick={() => setQuestions(move(questions, i, i - 1))}
                    />
                    <IconButton
                      size="sm"
                      aria-label="Xuống dưới"
                      icon={<Icon name="down" size={16} />}
                      disabled={locked || i === questions.length - 1}
                      onClick={() => setQuestions(move(questions, i, i + 1))}
                    />
                    <Button size="sm" variant="ghost" disabled={locked} onClick={() => remove(i)}>
                      <Icon name="trash" size={15} />
                      Xóa câu
                    </Button>
                  </div>
                  {missing.length > 0 && (
                    <ul className="ex-missing" aria-label={`Câu ${n} chưa hoàn chỉnh`}>
                      {[...new Set(missing.map((p) => p.message))].map((m) => (
                        <li key={m}>{m}</li>
                      ))}
                    </ul>
                  )}
                  <QuestionEditor
                    q={q}
                    path={`questions.${i}`}
                    n={n}
                    onChange={(next) => setQuestions(replaceAt(questions, i, next as Question))}
                  />
                </section>
              </li>
            );
          })}
        </ol>

        <div className="ex-add">
          <Button
            variant="outline"
            aria-haspopup="menu"
            aria-expanded={menu}
            disabled={locked}
            onClick={() => setMenu((m) => !m)}
          >
            <Icon name="plus" size={18} />
            Thêm câu hỏi
          </Button>
          {menu && (
            <div className="ex-menu" role="menu" aria-label="Dạng câu hỏi">
              {QUESTION_KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  role="menuitem"
                  className="ex-menu__item"
                  onClick={() => add(k)}
                >
                  {QUESTION_KIND_LABELS[k]}
                </button>
              ))}
            </div>
          )}
          {limitNote && (
            <p className="field__error" role="alert">
              {XM.questionLimit}
            </p>
          )}
        </div>
      </div>
    </SetEditingContext.Provider>
  );
}
