import {
  type FileBlock,
  type FileKind,
  FILE_RULES,
  STEP_LIMITS,
  STEP_MESSAGES as SM,
  formatSize,
  parseYouTubeUrl,
} from '@sat/shared';
import { useState } from 'react';
import { Button, Icon } from '../../components';
import { Cell } from './editor-parts';
import { fileUrl } from './step-dom';
import { useFileInput } from './use-file-input';
import { patchBlock } from './step-content';
import { type Upload, chooseFile, useStepEditorStore } from './step-editor-store';

/** Progress, processing, failure and refusal of one upload (AC-6.1 – AC-6.6). */
export function UploadStatus({
  upload,
  onPickAnother,
}: {
  upload: Upload;
  onPickAnother: () => void;
}) {
  const cancel = useStepEditorStore((s) => s.cancel);
  const retry = useStepEditorStore((s) => s.retry);
  const dismiss = useStepEditorStore((s) => s.dismiss);
  if (upload.phase === 'failed') {
    return (
      <div className="st-upload st-upload--failed" role="alert">
        <Icon name="alert" size={16} />
        <span className="grow">{upload.error}</span>
        {upload.retry && (
          <Button size="sm" variant="outline" onClick={() => retry(upload.key)}>
            Thử lại
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={onPickAnother}>
          Chọn tệp khác
        </Button>
        {!upload.retry && (
          <Button size="sm" variant="ghost" onClick={() => dismiss(upload.key)}>
            Đóng
          </Button>
        )}
      </div>
    );
  }
  return (
    <div className="st-upload" aria-live="polite">
      <Icon name="upload" size={16} />
      <span className="st-upload__name">{upload.name}</span>
      {upload.phase === 'processing' ? (
        <span className="small muted">{SM.processing}</span>
      ) : (
        <>
          <span
            className="st-progress"
            role="progressbar"
            aria-label={`Tải lên ${upload.name}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={upload.percent}
          >
            <i style={{ width: `${upload.percent}%` }} />
          </span>
          <span className="small num">{upload.percent}%</span>
        </>
      )}
      <Button size="sm" variant="ghost" onClick={() => cancel(upload.key)}>
        Hủy
      </Button>
    </div>
  );
}

function FilePreview({ block }: { block: FileBlock }) {
  if (!block.file) return null;
  const ref = block.file;
  const meta = (
    <span className="small muted">
      {ref.name} · {formatSize(ref.size)}
      {ref.pages ? ` · ${ref.pages} trang` : ''}
    </span>
  );
  switch (block.type) {
    case 'image':
      return (
        <figure className="st-preview">
          <img src={fileUrl(ref)} alt={block.caption || ref.name} className="st-preview__img" />
          {meta}
        </figure>
      );
    case 'video':
      return (
        <figure className="st-preview">
          <video src={fileUrl(ref)} controls preload="metadata" className="st-preview__video" />
          {meta}
        </figure>
      );
    case 'audio':
      return (
        <figure className="st-preview">
          <audio src={fileUrl(ref)} controls preload="none" />
          {meta}
        </figure>
      );
    default:
      return (
        <div className="st-preview st-preview--doc">
          <Icon name="file" size={22} />
          {meta}
        </div>
      );
  }
}

/** AC-18.1 – AC-18.2: a YouTube link instead of a file (video blocks). */
function YouTubeField({ onUse }: { onUse: (id: string) => void }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const use = () => {
    const id = parseYouTubeUrl(url);
    if (!id) {
      setError(SM.youtubeInvalid);
      return;
    }
    setError(null);
    setUrl('');
    onUse(id);
  };
  return (
    <div className="st-yt-field">
      <Cell
        label="Liên kết YouTube"
        placeholder="https://youtu.be/…"
        value={url}
        error={error ?? undefined}
        onChange={setUrl}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            use();
          }
        }}
      />
      <Button size="sm" variant="outline" onClick={use}>
        Dùng liên kết
      </Button>
    </div>
  );
}

/** Video, Tài liệu, Hình ảnh, Âm thanh blocks: file, upload state, YouTube link (video) and caption (AC-3.4). */
export function FileBlockEditor({
  itemId,
  block,
  onChange,
}: {
  itemId: string;
  block: FileBlock;
  onChange: (block: FileBlock) => void;
}) {
  const kind: FileKind = block.type;
  const key = `${itemId}/${block.id}`;
  const upload = useStepEditorStore((s) => s.uploads[key]);
  const [pasting, setPasting] = useState(false);
  const picker = useFileInput(kind, (file) =>
    chooseFile(key, itemId, kind, file, (ref) =>
      patchBlock(itemId, block.id, (b) =>
        b.type === 'video' ? { ...b, file: ref, youtube: null } : ({ ...b, file: ref } as typeof b),
      ),
    ),
  );
  const youtube = block.type === 'video' ? block.youtube : null;
  const empty = !block.file && !youtube;

  return (
    <div className="st-file">
      {picker.element}
      {youtube && (
        <div className="st-preview">
          <iframe
            className="st-yt"
            title="Xem trước video YouTube"
            src={`https://www.youtube-nocookie.com/embed/${youtube}?rel=0`}
            allow="encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
          <span className="small muted">Video YouTube · không tính vào dung lượng lưu trữ</span>
        </div>
      )}
      <FilePreview block={block} />
      {upload && <UploadStatus upload={upload} onPickAnother={picker.open} />}
      <div className="st-inline">
        {!upload || upload.phase === 'failed' ? (
          <Button size="sm" variant="outline" onClick={picker.open}>
            <Icon name="upload" size={15} />
            {empty ? 'Chọn tệp' : 'Thay tệp'}
          </Button>
        ) : null}
        {block.type === 'video' && !upload && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPasting((v) => !v)}
            aria-expanded={pasting}
          >
            Dán liên kết YouTube
          </Button>
        )}
        {block.type === 'video' && youtube && (
          <Button size="sm" variant="ghost" onClick={() => onChange({ ...block, youtube: null })}>
            Bỏ liên kết YouTube
          </Button>
        )}
        <span className="small muted">
          {FILE_RULES[kind].formats} · tối đa {formatSize(FILE_RULES[kind].maxBytes)}
        </span>
      </div>
      {block.type === 'video' && pasting && (
        <YouTubeField
          onUse={(id) => {
            setPasting(false);
            onChange({ ...block, youtube: id, file: null });
          }}
        />
      )}
      <Cell
        visibleLabel
        label="Chú thích"
        placeholder="Không bắt buộc · tối đa 200 ký tự"
        value={block.caption}
        maxLength={STEP_LIMITS.captionMax}
        onChange={(caption) => onChange({ ...block, caption })}
      />
    </div>
  );
}
