import {
  CURRICULUM_MESSAGES as M,
  type Item,
  type McqQuestion,
  type SetContent,
  type StepContent,
  itemNotReadyReason,
  newBlock,
  richTextPlain,
  setContentSchema,
  stepContentSchema,
  textToHtml,
} from '@sat/shared';
import { useEffect, useRef } from 'react';
import { Button, Icon, IconButton, StatusChip, Textarea } from '../../components';
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
}

const LETTERS = 'ABCDEF';

const stepOf = (c: unknown): StepContent => {
  const p = stepContentSchema.safeParse(c);
  return p.success ? p.data : { goal: '', blocks: [] };
};
const setOf = (c: unknown): SetContent => {
  const p = setContentSchema.safeParse(c);
  return p.success ? p.data : { questions: [] };
};

/** Interim content of a step: text blocks (004 replaces it with the full block editor). */
function StepFields({
  base,
  content,
  onChange,
}: {
  base: string;
  content: StepContent;
  onChange: (c: StepContent) => void;
}) {
  const set = (blocks: StepContent['blocks']) => onChange({ ...content, blocks });
  return (
    <div className="cur-blocks">
      {content.blocks.map((b, k) => (
        <div key={`${base}-b${k}`} className="cur-block">
          <div className="cur-block__head">
            <Icon name="text" size={16} />
            <span className="small strong">Khối {k + 1} · Văn bản</span>
            <span className="grow" />
            {content.blocks.length > 1 && (
              <IconButton
                size="sm"
                aria-label={`Xóa khối ${k + 1}`}
                icon={<Icon name="trash" size={16} />}
                onClick={() => set(content.blocks.filter((_, i) => i !== k))}
              />
            )}
          </div>
          <Textarea
            label={`Nội dung khối ${k + 1}`}
            rows={3}
            value={b.type === 'text' ? richTextPlain(b.html) : ''}
            onChange={(e) =>
              set(
                content.blocks.map((x, i) =>
                  i === k ? { id: x.id, type: 'text', html: textToHtml(e.target.value) } : x,
                ),
              )
            }
          />
        </div>
      ))}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => set([...content.blocks, newBlock('text')])}
        disabled={content.blocks.length >= 50}
      >
        <Icon name="plus" size={15} />
        Thêm khối Văn bản
      </Button>
    </div>
  );
}

/** Interim content of a set: multiple-choice questions (005 replaces it with the six question types). */
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
    onChange({ questions: content.questions.map((x, i) => (i === k ? q : x)) });
  return (
    <div className="cur-blocks">
      {content.questions.map((q, k) => (
        <fieldset key={`${base}-q${k}`} className="cur-block">
          <legend className="small strong">Câu {k + 1} · Trắc nghiệm</legend>
          <div className="cur-block__head">
            <span className="grow" />
            {content.questions.length > 1 && (
              <IconButton
                size="sm"
                aria-label={`Xóa câu ${k + 1}`}
                icon={<Icon name="trash" size={16} />}
                onClick={() => onChange({ questions: content.questions.filter((_, i) => i !== k) })}
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
              <div key={o} className="cur-option">
                <input
                  type="radio"
                  name={`${base}-q${k}-answer`}
                  aria-label={`Phương án ${LETTERS[o]} là đáp án đúng`}
                  checked={q.answer === o}
                  onChange={() => setQ(k, { ...q, answer: o })}
                />
                <input
                  className="input"
                  aria-label={`Câu ${k + 1} · Phương án ${LETTERS[o]}`}
                  placeholder={`Phương án ${LETTERS[o]}`}
                  value={opt}
                  maxLength={500}
                  onChange={(e) =>
                    setQ(k, {
                      ...q,
                      options: q.options.map((x, i) => (i === o ? e.target.value : x)),
                    })
                  }
                />
              </div>
            ))}
          </div>
        </fieldset>
      ))}
      <Button
        size="sm"
        variant="ghost"
        disabled={content.questions.length >= 100}
        onClick={() =>
          onChange({
            questions: [
              ...content.questions,
              { type: 'mcq', prompt: '', options: ['', '', '', ''], answer: null },
            ],
          })
        }
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
            <Button size="sm" variant="outline" onClick={props.onSave} disabled={busy}>
              Lưu nháp
            </Button>
            <Button size="sm" onClick={props.onPublish} disabled={busy}>
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
            disabled={busy}
          >
            Lưu thay đổi
          </Button>
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
      <div className="field">
        <label className="field__label" htmlFor={`${item.id}-title`}>
          Tên
        </label>
        <input
          ref={title}
          id={`${item.id}-title`}
          className="input cur-item__title"
          value={working.title}
          maxLength={200}
          placeholder={isStep ? 'Tên bước học' : 'Tên bộ bài tập'}
          onChange={(e) => props.onEdit({ ...working, title: e.target.value })}
        />
      </div>
      {isStep ? (
        <StepFields
          base={item.id}
          content={stepOf(working.content)}
          onChange={(content) => props.onEdit({ ...working, content })}
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
