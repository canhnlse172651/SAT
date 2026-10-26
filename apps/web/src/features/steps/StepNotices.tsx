import {
  STEP_MESSAGES as SM,
  type StepIssue,
  changedElsewhereAt,
  issueLine,
  notReadyMessage,
  saveBlockedMessage,
} from '@sat/shared';
import { Button } from '../../components';
import { scrollToBlock } from './step-dom';

/** What the last save / publish of a step left on it (REQ-2, AC-7.2). */
export type StepNotice =
  | { kind: 'conflict'; at: string; currentVersion: number }
  | { kind: 'failed'; retry: 'save' | 'publish' }
  | { kind: 'blocked'; message: string }
  | { kind: 'issues'; issues: StepIssue[] };

export function StepNoticeView({
  itemId,
  stepNo,
  notice,
  onReload,
  onOverwrite,
  onRetry,
}: {
  itemId: string;
  stepNo: number;
  notice: StepNotice;
  onReload: () => void;
  onOverwrite: () => void;
  onRetry: () => void;
}) {
  switch (notice.kind) {
    case 'conflict':
      return (
        <div className="st-notice" role="alert">
          <span>{changedElsewhereAt(notice.at)}</span>
          <span className="st-inline">
            <Button size="sm" variant="outline" onClick={onReload}>
              Tải lại bản mới nhất
            </Button>
            <Button size="sm" variant="ghost" onClick={onOverwrite}>
              Ghi đè bằng bản của tôi
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
          {saveBlockedMessage(notice.message)}
        </div>
      );
    case 'issues': {
      const first = notice.issues[0];
      const firstText = first
        ? first.block
          ? `Khối ${first.block} · ${first.text}`
          : first.text
        : '';
      return (
        <div className="st-notice" role="alert">
          <span className="strong">{notReadyMessage(firstText)}</span>
          <ul className="st-notice__issues">
            {notice.issues.map((i, k) => (
              <li key={k}>
                {i.block ? (
                  <button type="button" onClick={() => scrollToBlock(itemId, i.block ?? 1)}>
                    {issueLine(stepNo, i)}
                  </button>
                ) : (
                  issueLine(stepNo, i)
                )}
              </li>
            ))}
          </ul>
        </div>
      );
    }
  }
}
