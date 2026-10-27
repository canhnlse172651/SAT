import {
  CURRICULUM_MESSAGES as M,
  type Item,
  type McqQuestion,
  QUESTION_KIND_LABELS,
  type SetContent,
  itemNotReadyReason,
  newMcq,
  questionKind,
  setContentSchema,
  stepProblems,
} from '@sat/shared';
import { type ReactNode, useEffect, useId, useRef } from 'react';
import { Button, Icon, IconButton, StatusChip, Textarea } from '../../components';
import { StepBody } from '../steps/StepBody';
import { problemText, stepOf } from '../steps/step-content';
import type { WorkingCopy } from './lesson-editor-store';

export interface ItemEditorProps {
  item: Item;
  /** The working copy (unsaved edits) or the saved item. */
  working: WorkingCopy;
  dirty: boolean;
  /** 1-based place in the section's order (archived items included) and the section size. */
  position: number;
  total: number;
  focusTitle: boolean;
  busy: boolean;
  onEdit: (copy: WorkingCopy) => void;
  onSave: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onMove: (direction: 'up' | 'down') => void;
  onAddAfter: () => void;
  onDelete: () => void;
  /** Steps (004): why save / publish are blocked right now (a file is uploading — AC-6.4). */
  blockedReason?: string | null;
  /** Steps (004): "Lưu nháp" stays enabled despite `blockedReason` (a file is processing — AC-6.5). */
  draftSaveAllowed?: boolean;
  /** Steps (004): conflict, failure, refusal or issue list of the last save (REQ-2, AC-7.2). */
  notice?: ReactNode;
  /** Steps (004): "Mở bộ bài tập" of a linked set (AC-10.1). */
  onOpenSet?: (setId: string) => void;
}

const LETTERS = 'ABCDEF';

const setOf = (c: unknown): SetContent => {
  const p = setContentSchema.safeParse(c);
  return p.success ? p.data : { instructions: '', stepId: null, questions: [] };
};

/** Interim set fields: multiple-choice questions only (005 T010/T011 replace them with the full set editor). */
function SetFields({
  base,
  content,
  onChange,
}: {
  base: string;
  content: SetContent;
  onChange: (c: SetContent) => void;
}) {
  const setQ = (k: number, q: McqQuestion) =>
    onChange({ ...content, questions: content.questions.map((x, i) => (i === k ? q : x)) });
  return (
    <div className="cur-blocks">
      {content.questions.map((q, k) =>
        q.type !== 'mcq' ? (
          <p key={q.id} className="small muted">
            Câu {k + 1} · {QUESTION_KIND_LABELS[questionKind(q)]}
          </p>
        ) : (
          <fieldset key={q.id} className="cur-block">
            <legend className="small strong">Câu {k + 1} · Trắc nghiệm</legend>
            <div className="cur-block__head">
              <span className="grow" />
              {content.questions.length > 1 && (
                <IconButton
                  size="sm"
                  aria-label={`Xóa câu ${k + 1}`}
                  icon={<Icon name="trash" size={16} />}
                  onClick={() =>
                    onChange({ ...content, questions: content.questions.filter((_, i) => i !== k) })
                  }
                />
              )}
            </div>
            <Textarea
              label={`Nội dung câu ${k + 1}`}
              rows={2}
              value={q.prompt}
              onChange={(e) => setQ(k, { ...q, prompt: e.target.value })}
            />
            <div
              className="cur-options"
              role="radiogroup"
              aria-label={`Đáp án đúng của câu ${k + 1}`}
            >
              {q.options.map((opt, o) => (
                <div key={opt.id} className="cur-option">
                  <input
                    type="radio"
                    name={`${base}-q${k}-answer`}
                    aria-label={`Phương án ${LETTERS[o]} là đáp án đúng`}
                    checked={opt.correct}
                    onChange={() =>
                      setQ(k, {
                        ...q,
                        options: q.options.map((x, i) => ({ ...x, correct: i === o })),
                      })
                    }
                  />
                  <input
                    className="input"
                    aria-label={`Câu ${k + 1} · Phương án ${LETTERS[o]}`}
                    placeholder={`Phương án ${LETTERS[o]}`}
                    value={opt.text}
                    maxLength={200}
                    onChange={(e) =>
                      setQ(k, {
                        ...q,
                        options: q.options.map((x, i) =>
                          i === o ? { ...x, text: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </div>
              ))}
            </div>
          </fieldset>
        ),
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={content.questions.length >= 100}
        onClick={() => onChange({ ...content, questions: [...content.questions, newMcq()] })}
      >
        <Icon name="plus" size={15} />
        Thêm câu trắc nghiệm
      </Button>
    </div>
  );
}

/** One step / set in a T07 tab: the 002 action bar (save, publish, order, archive, add after, delete) + interim fields. */
export function ItemEditor(props: ItemEditorProps) {
  const { item, working, dirty, position, total, focusTitle, busy } = props;
  const title = useRef<HTMLInputElement>(null);
  const isStep = item.section === 'lesson';
  const noun = isStep ? 'Bước học' : 'Bộ bài tập';
  const incomplete = itemNotReadyReason(item.section, working.title, working.content);
  const hintId = useId();
  const content = isStep ? stepOf(working.content) : null;
  const problems = content ? stepProblems(working.title, content) : [];
  const titleError = problemText(problems.find((p) => p.path === 'title'));
  const blocked = props.blockedReason ?? null;
  const saveDisabled = busy || !!blocked;

  useEffect(() => {
    if (focusTitle) {
      title.current?.scrollIntoView({ block: 'center' });
      title.current?.focus();
    }
  }, [focusTitle]);

  return (
    <section
      className={item.status === 'archived' ? 'cur-item cur-item--archived' : 'cur-item'}
      aria-label={`${noun} ${position}`}
      data-item={item.id}
    >
      <div className="cur-item__bar">
        <span className="cur-item__ord">{position}</span>
        <StatusChip status={item.status} />
        {incomplete && <span className="chip chip--pending">Chưa hoàn chỉnh</span>}
        {item.ai && <span className="chip cur-ai-tag">AI tạo</span>}
        {dirty && <span className="chip chip--danger">Chưa lưu</span>}
        <span className="grow" />
        {item.status === 'draft' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={props.onSave}
              disabled={busy || (!!blocked && !props.draftSaveAllowed)}
              aria-describedby={blocked ? hintId : undefined}
            >
              Lưu nháp
            </Button>
            <Button
              size="sm"
              onClick={props.onPublish}
              disabled={saveDisabled}
              aria-describedby={blocked ? hintId : undefined}
            >
              <Icon name="check" size={15} />
              Xuất bản
            </Button>
          </>
        )}
        {item.status !== 'draft' && (
          <Button
            size="sm"
            variant={item.status === 'published' ? 'primary' : 'outline'}
            onClick={props.onSave}
            disabled={saveDisabled}
            aria-describedby={blocked ? hintId : undefined}
          >
            Lưu thay đổi
          </Button>
        )}
        {blocked && (
          <span id={hintId} className="field__hint">
            {blocked}
          </span>
        )}
      </div>
      <div className="cur-item__bar">
        <IconButton
          size="sm"
          aria-label="Lên trên"
          icon={<Icon name="up" size={16} />}
          disabled={position === 1 || busy}
          onClick={() => props.onMove('up')}
        />
        <IconButton
          size="sm"
          aria-label="Xuống dưới"
          icon={<Icon name="down" size={16} />}
          disabled={position === total || busy}
          onClick={() => props.onMove('down')}
        />
        {item.status === 'published' && (
          <Button
            size="sm"
            variant="ghost"
            aria-disabled={dirty || undefined}
            title={dirty ? M.saveBeforeArchive : undefined}
            aria-describedby={dirty ? `${item.id}-arch-hint` : undefined}
            onClick={() => !dirty && props.onArchive()}
            disabled={busy}
          >
            <Icon name="archive" size={15} />
            Lưu trữ
          </Button>
        )}
        {item.status === 'archived' && (
          <Button size="sm" variant="ghost" onClick={props.onRestore} disabled={busy}>
            <Icon name="refresh" size={15} />
            Khôi phục
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={props.onAddAfter} disabled={busy}>
          <Icon name="plus" size={15} />
          Thêm sau
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="cur-danger"
          onClick={props.onDelete}
          disabled={busy}
        >
          <Icon name="trash" size={15} />
          Xóa
        </Button>
        {dirty && item.status === 'published' && (
          <span id={`${item.id}-arch-hint`} className="field__hint">
            {M.saveBeforeArchive}
          </span>
        )}
      </div>
      {props.notice}
      <div className="field">
        <label className="field__label" htmlFor={`${item.id}-title`}>
          {isStep ? 'Tên bước học' : 'Tên'}
        </label>
        <input
          ref={title}
          id={`${item.id}-title`}
          className="input cur-item__title"
          value={working.title}
          maxLength={200}
          placeholder={isStep ? 'Tên bước học (bắt buộc, tối đa 100 ký tự)' : 'Tên bộ bài tập'}
          aria-invalid={titleError ? true : undefined}
          aria-describedby={titleError ? `${item.id}-title-err` : undefined}
          onChange={(e) => props.onEdit({ ...working, title: e.target.value })}
        />
        {titleError && (
          <p id={`${item.id}-title-err`} className="field__error">
            {titleError}
          </p>
        )}
      </div>
      {content ? (
        <StepBody
          item={item}
          title={working.title}
          content={content}
          problems={problems}
          onChange={(c) => props.onEdit({ ...working, content: c })}
          onOpenSet={(setId) => props.onOpenSet?.(setId)}
        />
      ) : (
        <SetFields
          base={item.id}
          content={setOf(working.content)}
          onChange={(content) => props.onEdit({ ...working, content })}
        />
      )}
    </section>
  );
}
