import {
  COVER_CONTENT_TYPES,
  CURRICULUM_LIMITS,
  CURRICULUM_MESSAGES as M,
  type CurriculumDetail,
  HSK_LEVELS,
  type HskLevel,
  curriculumBodySchema,
  fieldErrors,
  hskChangeConfirm,
  hskLevelLabel,
} from '@sat/shared';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button, ConfirmDialog, Dialog, Icon, TextField, Textarea } from '../../components';
import { formFailure } from '../auth/form-errors';
import { Notice } from '../auth/Notice';
import { useToastStore } from '../toast/toast-store';
import { useCurriculumStore } from './curriculum-store';
import { isConflict } from './errors';
import { curriculumPath } from './paths';

export type CurriculumFormMode = 'create' | 'edit' | 'duplicate';

export interface CurriculumFormDialogProps {
  mode: CurriculumFormMode;
  open: boolean;
  onClose: () => void;
  /** The curriculum being edited or duplicated. */
  source?: CurriculumDetail | null;
}

type Errors = Partial<Record<'name' | 'hsk' | 'description' | 'coverFileId', string>>;

const TITLES: Record<CurriculumFormMode, string> = {
  create: 'Tạo giáo trình',
  edit: 'Sửa thông tin giáo trình',
  duplicate: 'Nhân bản giáo trình',
};

/** REQ-1 create, REQ-2 edit, REQ-15 duplicate (T05 / T06 dialog, prototype MODALS.newCur). */
export function CurriculumFormDialog(props: CurriculumFormDialogProps) {
  // Mounted only while open, so every opening starts from the source (or empty).
  return props.open ? <CurriculumForm {...props} /> : null;
}

function CurriculumForm({ mode, onClose, source }: CurriculumFormDialogProps) {
  const navigate = useNavigate();
  const push = useToastStore((s) => s.push);
  const create = useCurriculumStore((s) => s.create);
  const update = useCurriculumStore((s) => s.update);
  const duplicate = useCurriculumStore((s) => s.duplicate);
  const copyName = useCurriculumStore((s) => s.copyName);
  const uploadCover = useCurriculumStore((s) => s.uploadCover);
  const loadDetail = useCurriculumStore((s) => s.loadDetail);
  const from = mode === 'create' ? null : (source ?? null);

  const [name, setName] = useState(from?.name ?? '');
  const [hsk, setHsk] = useState<HskLevel | null>(from?.hsk ?? null);
  const [description, setDescription] = useState(from?.description ?? '');
  const [cover, setCover] = useState<{ fileId: string; url: string } | null>(() =>
    from?.coverFileId && from.coverUrl ? { fileId: from.coverFileId, url: from.coverUrl } : null,
  );
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmHsk, setConfirmHsk] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  // AC-15.1: "(bản sao)", or "(bản sao 2)"… when that name is taken.
  const sourceId = from?.id;
  const sourceName = from?.name;
  useEffect(() => {
    if (mode !== 'duplicate' || !sourceId) return;
    copyName(sourceId).then(
      (s) => setName(s.name),
      () => setName(`${sourceName ?? ''} (bản sao)`),
    );
  }, [mode, sourceId, sourceName, copyName]);

  const pickCover = async (file: File | undefined) => {
    if (!file) return;
    setErrors((e) => ({ ...e, coverFileId: undefined }));
    if (
      !(COVER_CONTENT_TYPES as readonly string[]).includes(file.type) ||
      file.size > CURRICULUM_LIMITS.coverMaxBytes
    ) {
      setErrors((e) => ({ ...e, coverFileId: M.invalidCover }));
      return;
    }
    setUploading(true);
    try {
      setCover(await uploadCover(file));
    } catch {
      setErrors((e) => ({ ...e, coverFileId: M.invalidCover }));
    } finally {
      setUploading(false);
    }
  };

  const save = async (confirmed = false) => {
    setFormError(null);
    const parsed = curriculumBodySchema.safeParse({
      name,
      hsk: hsk ?? undefined,
      description: mode === 'duplicate' ? '' : description,
    });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error.issues) as Errors);
      return;
    }
    setErrors({});
    const body = parsed.data;
    if (mode === 'edit' && source && !confirmed && body.hsk !== source.hsk && source.usedBy > 0) {
      setConfirmHsk(true);
      return;
    }
    setBusy(true);
    try {
      if (mode === 'create') {
        const created = await create({ ...body, coverFileId: cover?.fileId ?? null });
        push(M.created, 'success');
        onClose();
        navigate(curriculumPath(created.id));
      } else if (mode === 'duplicate' && source) {
        const copy = await duplicate(source.id, { name: body.name, hsk: body.hsk });
        push(M.curriculumDuplicated, 'success');
        onClose();
        navigate(curriculumPath(copy.id));
      } else if (source) {
        // The version read now, so a retry after a conflict applies on top of the latest data (AC-17.4).
        const current = useCurriculumStore.getState().detail;
        await update(source.id, {
          expectedVersion: current?.id === source.id ? current.version : source.version,
          name: body.name,
          hsk: body.hsk,
          description: body.description,
          coverFileId: cover?.fileId ?? null,
        });
        push(M.saved, 'success');
        onClose();
      }
    } catch (err) {
      if (isConflict(err)) {
        push(M.changedElsewhere, 'warn');
        if (source) void loadDetail(source.id).catch(() => undefined);
      } else {
        const f = formFailure(err);
        setErrors(f.fields as Errors);
        setFormError(f.form);
      }
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!busy) void save();
  };

  const submitLabel =
    mode === 'create' ? 'Tạo giáo trình' : mode === 'duplicate' ? 'Nhân bản' : 'Lưu';
  const formId = `cur-form-${mode}`;

  return (
    <>
      <Dialog
        open={!confirmHsk}
        onClose={onClose}
        title={TITLES[mode]}
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={onClose} disabled={busy}>
              Hủy
            </Button>
            <Button type="submit" form={formId} loading={busy} disabled={busy || uploading}>
              {busy && mode === 'duplicate' ? M.duplicating : submitLabel}
            </Button>
          </>
        }
      >
        <form id={formId} className="cur-form" onSubmit={submit} noValidate>
          {formError && <Notice tone="danger">{formError}</Notice>}
          <TextField
            label="Tên"
            required
            value={name}
            maxLength={150}
            placeholder="VD: HSK4 Luyện thi cấp tốc"
            error={errors.name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="field">
            <span className="field__label" id={`${formId}-hsk`}>
              Cấp độ HSK{' '}
              <span className="field__req" aria-hidden="true">
                *
              </span>
            </span>
            <div
              className="cur-chips"
              role="group"
              aria-labelledby={`${formId}-hsk`}
              aria-describedby={errors.hsk ? `${formId}-hsk-err` : undefined}
            >
              {HSK_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  className="cur-chip"
                  aria-pressed={hsk === level}
                  onClick={() => setHsk(level)}
                >
                  {hskLevelLabel(level)}
                </button>
              ))}
            </div>
            {errors.hsk && (
              <p className="field__error" id={`${formId}-hsk-err`}>
                {errors.hsk}
              </p>
            )}
          </div>
          {mode === 'duplicate' ? (
            <Notice tone="neutral" icon="copy">
              Bản sao gồm mô tả, ảnh bìa và mọi Bài (cùng thứ tự, 2 phần Bài học · Bài tập, dấu “AI
              tạo”), không kèm dữ liệu học viên hay thiết lập theo lớp.
            </Notice>
          ) : (
            <>
              <Textarea
                label="Mô tả"
                value={description}
                rows={3}
                placeholder="Mục tiêu, đối tượng, số buổi…"
                error={errors.description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="field">
                <span className="field__label">Ảnh bìa</span>
                <div className="cur-cover-field">
                  {cover && (
                    <img className="cur-cover-field__img" src={cover.url} alt="Ảnh bìa đã chọn" />
                  )}
                  <Button
                    variant="outline"
                    onClick={() => fileInput.current?.click()}
                    loading={uploading}
                  >
                    <Icon name="image" size={18} />
                    Chọn ảnh
                  </Button>
                  {cover && (
                    <Button variant="ghost" onClick={() => setCover(null)}>
                      Gỡ ảnh bìa
                    </Button>
                  )}
                  <span className="field__hint">
                    JPG, PNG hoặc WebP, tối đa 2 MB · không bắt buộc
                  </span>
                  <input
                    ref={fileInput}
                    type="file"
                    accept={COVER_CONTENT_TYPES.join(',')}
                    className="sr-only"
                    aria-label="Chọn tệp ảnh bìa"
                    tabIndex={-1}
                    onChange={(e) => {
                      void pickCover(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </div>
                {errors.coverFileId && (
                  <p className="field__error" role="alert">
                    {errors.coverFileId}
                  </p>
                )}
              </div>
            </>
          )}
        </form>
      </Dialog>
      <ConfirmDialog
        open={confirmHsk}
        title={hskChangeConfirm(source?.usedBy ?? 0)}
        message="Bài, mục và dữ liệu học tập không thay đổi."
        confirmLabel="Đổi cấp độ"
        loading={busy}
        onConfirm={() => {
          setConfirmHsk(false);
          void save(true);
        }}
        onCancel={() => {
          // AC-2.3: cancelling keeps the old level.
          setConfirmHsk(false);
          if (source) setHsk(source.hsk);
        }}
      />
    </>
  );
}
