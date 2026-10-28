import { EXERCISE_MESSAGES as XM, type FileRef } from '@sat/shared';
import { Button, Icon, IconButton } from '../../components';
import { UploadStatus } from '../steps/FileBlockEditor';
import { chooseFile, useStepEditorStore } from '../steps/step-editor-store';
import { fileUrl } from '../steps/step-dom';
import { useFileInput } from '../steps/use-file-input';
import { type ImageTarget, patchSetImage, useSetEditing } from './set-editing';

/**
 * AC-3.1 – AC-3.3, AC-3.6: at most one image (JPG/PNG/WebP/GIF ≤ 5 MB) on a stem or an option. A refused or failed
 * upload leaves the question as it was; a finished one lands in the set's current working copy.
 */
export function ImageField({
  target,
  label,
  image,
}: {
  target: ImageTarget;
  /** "đề câu 3", "phương án B của câu 3". */
  label: string;
  image: FileRef | null;
}) {
  const { itemId, patchImage } = useSetEditing();
  const key = `${itemId}/${target.ownerId}/${target.optionId ?? ''}`;
  const upload = useStepEditorStore((s) => s.uploads[key]);
  const retry = useStepEditorStore((s) => s.retry);
  const put = (ref: FileRef | null) =>
    patchImage ? patchImage(target, ref) : patchSetImage(itemId, target, ref);
  const picker = useFileInput('questionImage', (file) =>
    chooseFile(key, itemId, 'questionImage', file, put),
  );

  const status = () => {
    if (!upload) return null;
    // AC-3.3: a lost upload says "Tải tệp lên thất bại" with "Thử lại".
    if (upload.phase === 'failed' && upload.retry)
      return (
        <div className="st-upload st-upload--failed" role="alert">
          <Icon name="alert" size={16} />
          <span className="grow">{XM.uploadFailed}</span>
          <Button size="sm" variant="outline" onClick={() => retry(upload.key)}>
            Thử lại
          </Button>
          <Button size="sm" variant="ghost" onClick={picker.open}>
            Chọn tệp khác
          </Button>
        </div>
      );
    return <UploadStatus upload={upload} onPickAnother={picker.open} />;
  };

  return (
    <div className="ex-image">
      {picker.element}
      {image && <img className="ex-image__img" src={fileUrl(image)} alt={`Hình ${label}`} />}
      {status() ?? (
        <span className="st-inline">
          <Button
            size="sm"
            variant="ghost"
            aria-label={`${image ? 'Thay ảnh' : 'Thêm ảnh'} ${label}`}
            onClick={picker.open}
          >
            <Icon name="image" size={15} />
            {image ? 'Thay ảnh' : 'Thêm ảnh'}
          </Button>
          {image && (
            <IconButton
              size="sm"
              aria-label={`Gỡ ảnh ${label}`}
              icon={<Icon name="close" size={14} />}
              onClick={() => put(null)}
            />
          )}
        </span>
      )}
    </div>
  );
}
