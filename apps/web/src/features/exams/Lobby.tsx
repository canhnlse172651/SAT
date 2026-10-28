import { EXAM_MESSAGES as M, type LearnerExam, formatVnDateTime } from '@sat/shared';
import { Button, Icon } from '../../components';
import { useServerNow } from './server-clock';

/** The lobby of S07 (AC-8.1, AC-8.2): facts and rules, never a question. */
export function Lobby({
  exam,
  busy,
  onStart,
  onBack,
}: {
  exam: LearnerExam & { instructions: string };
  busy: boolean;
  onStart: () => void;
  onBack: () => void;
}) {
  const now = useServerNow(1000);
  const close = new Date(exam.closesAt);
  const left = close.getTime() - now.getTime();
  return (
    <div className="hv-pad xm-lobby" data-screen="S07" aria-labelledby="xm-lobby-title">
      <p className="small muted">{exam.classNames.join(' · ')}</p>
      <h1 id="xm-lobby-title" className="ex-learn__title">
        {exam.name}
      </h1>
      {exam.instructions.trim() && <p className="xm-instructions">{exam.instructions}</p>}
      {exam.durationMin * 60_000 > left && left > 0 && (
        <p className="cls-callout cls-callout--warn" role="alert">
          {M.shortTime(close, Math.floor(left / 60_000))}
        </p>
      )}
      <dl className="ex-learn__facts">
        <dt>Số câu hỏi</dt>
        <dd>{exam.questionCount}</dd>
        <dt>Thời lượng</dt>
        <dd>{exam.durationMin} phút</dd>
        <dt>Giờ đóng</dt>
        <dd>{formatVnDateTime(close)}</dd>
      </dl>
      <ul className="xm-rules">
        <li>
          <Icon name="info" size={16} />
          <span>{M.oneAttempt}</span>
        </li>
        <li>
          <Icon name="clock" size={16} />
          <span>{M.clockRuns}</span>
        </li>
        <li>
          <Icon name="send" size={16} />
          <span>
            Bài được nộp tự động khi hết giờ. Điểm hiện ngay sau khi nộp; đáp án và giải thích hiện
            sau giờ đóng.
          </span>
        </li>
      </ul>
      <div className="xm-lobby__acts">
        <Button variant="outline" onClick={onBack}>
          Quay lại
        </Button>
        <Button disabled={busy} onClick={onStart}>
          Bắt đầu làm bài
        </Button>
      </div>
    </div>
  );
}
