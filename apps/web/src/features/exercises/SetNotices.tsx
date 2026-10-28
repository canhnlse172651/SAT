import { STEP_MESSAGES as SM, saveRefusedMessage } from '@sat/shared';
import { Button } from '../../components';

export const SET_CHANGED_ELSEWHERE =
  'Bộ bài tập đã được thay đổi ở cửa sổ khác. Hãy tải lại để xem bản mới nhất.';
export const SECTION_CHANGED_ELSEWHERE =
  'Phần Bài tập đã được thay đổi ở cửa sổ khác. Hãy tải lại để xem bản mới nhất.';

/** What the last save / publish of a set left on its block (AC-1.7, AC-12.5, AC-12.7, AC-12.14). */
export type SetNotice =
  | { kind: 'conflict' }
  | { kind: 'failed'; retry: 'save' | 'publish' }
  | { kind: 'blocked'; message: string }
  | { kind: 'issues'; issues: string[]; publishing: boolean };

export function SetNoticeView({
  notice,
  onReload,
  onRetry,
}: {
  notice: SetNotice;
  onReload: () => void;
  onRetry: () => void;
}) {
  switch (notice.kind) {
    case 'conflict':
      return (
        <div className="st-notice" role="alert">
          <span>{SET_CHANGED_ELSEWHERE}</span>
          <span>
            <Button size="sm" variant="outline" onClick={onReload}>
              Tải lại
            </Button>
          </span>
        </div>
      );
    case 'failed':
      return (
        <div className="st-notice st-notice--danger" role="alert">
          <span>{SM.saveFailed}</span>
          <span>
            <Button size="sm" variant="outline" onClick={onRetry}>
              Thử lại
            </Button>
          </span>
        </div>
      );
    case 'blocked':
      return (
        <div className="st-notice st-notice--danger" role="alert">
          <span>{saveRefusedMessage(notice.message)}</span>
        </div>
      );
    case 'issues':
      return (
        <div className="st-notice st-notice--danger" role="alert">
          <div>
            <strong>{notice.publishing ? 'Chưa thể xuất bản:' : 'Chưa lưu được:'}</strong>
            <ul className="ex-issues">
              {notice.issues.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      );
  }
}
