import { CLASS_MESSAGES as M, type ClassDetail, formatDay, formatVnDate } from '@sat/shared';
import { useState } from 'react';
import { Link } from 'react-router';
import { Button, HskBadge } from '../../components';
import { curriculumPath } from '../curriculum/paths';
import { ChangeCurriculumDialog } from './ChangeCurriculumDialog';

/** T04 tab Tổng quan (AC-7.2, AC-9.3). */
export function OverviewTab({
  detail,
  onShowContent,
}: {
  detail: ClassDetail;
  onShowContent: () => void;
}) {
  const [changing, setChanging] = useState(false);
  const ended = detail.status === 'ended';
  const locked = detail.hasExerciseSubmissions;
  const row = (k: string, v: string) => (
    <div className="cls-kv">
      <span className="cls-kv__k">{k}</span>
      <span className="grow">{v}</span>
    </div>
  );
  return (
    <div className="cls-grid-2">
      <section className="card card-pad" aria-labelledby="t04-info">
        <h2 id="t04-info" className="cls-card-title">
          Thông tin lớp
        </h2>
        {row('Mô tả', detail.description || '—')}
        {row('Lịch học', detail.schedule || '—')}
        {row('Ngày tạo', formatVnDate(new Date(detail.createdAt)))}
        {detail.endDate && row('Ngày kết thúc', formatDay(detail.endDate))}
      </section>
      <section className="card card-pad" aria-labelledby="t04-cur">
        <div className="cls-card-head">
          <h2 id="t04-cur" className="cls-card-title">
            Giáo trình
          </h2>
          <Button
            variant="outline"
            size="sm"
            disabled={locked || ended}
            aria-describedby={locked ? 't04-cur-lock' : ended ? 't04-cur-ended' : undefined}
            onClick={() => setChanging(true)}
          >
            Đổi giáo trình
          </Button>
        </div>
        <div className="cls-cur">
          <HskBadge level={detail.curriculum.hsk} />
          <Link to={curriculumPath(detail.curriculum.id)} className="strong">
            {detail.curriculum.name}
          </Link>
        </div>
        <p className="small muted">
          {detail.curriculum.publishedLessonCount} bài đã xuất bản · {detail.hiddenCount} phần đang
          ẩn với lớp ·{' '}
          <button type="button" className="cls-link" onClick={onShowContent}>
            Xem tab Nội dung
          </button>
        </p>
        {locked && (
          <div id="t04-cur-lock" className="cls-callout">
            {M.curriculumLocked}
          </div>
        )}
        {!locked && ended && (
          <p id="t04-cur-ended" className="small muted">
            {M.endedHint}
          </p>
        )}
      </section>
      {changing && <ChangeCurriculumDialog detail={detail} onClose={() => setChanging(false)} />}
    </div>
  );
}
