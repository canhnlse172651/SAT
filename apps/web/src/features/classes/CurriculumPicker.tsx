import {
  CLASS_MESSAGES as M,
  type CurriculumOption,
  HSK_LEVELS,
  foldSearch,
  hskLevelLabel,
} from '@sat/shared';
import { useEffect, useState } from 'react';
import { Button, HskBadge, Icon, Skeleton } from '../../components';
import { useClassesStore } from './classes-store';

export interface CurriculumPickerProps {
  value: CurriculumOption | null;
  onChange: (c: CurriculumOption) => void;
  /** "Đổi giáo trình": the class's curriculum, labelled "Đang dùng" (AC-9.1). */
  currentId?: string;
  error?: string | null;
}

type Level = 'all' | `${(typeof HSK_LEVELS)[number]}`;

/** T03 step 3 and "Đổi giáo trình" (REQ-4, AC-9.1). */
export function CurriculumPicker({ value, onChange, currentId, error }: CurriculumPickerProps) {
  const curriculumOptions = useClassesStore((s) => s.curriculumOptions);
  const [items, setItems] = useState<CurriculumOption[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [level, setLevel] = useState<Level>('all');
  const [q, setQ] = useState('');

  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    curriculumOptions().then(
      (res) => {
        if (!live) return;
        setItems(res);
        setFailed(false);
      },
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [curriculumOptions, tick]);

  if (failed && !items) return <p className="err-msg">Không tải được danh sách giáo trình.</p>;
  if (!items) return <Skeleton height={200} />;
  if (!items.length)
    return (
      <div className="empty">
        <h3>{M.noCurricula}</h3>
        <div className="empty__actions">
          <a className="btn btn--outline" href="/gv/giao-trinh" target="_blank" rel="noreferrer">
            Mở danh sách giáo trình
          </a>
          <Button variant="outline" onClick={() => setTick((t) => t + 1)}>
            <Icon name="refresh" size={18} />
            Tải lại danh sách
          </Button>
        </div>
      </div>
    );

  const key = foldSearch(q);
  const count = (l: Level) => items.filter((c) => l === 'all' || String(c.hsk) === l).length;
  const shown = items.filter(
    (c) => (level === 'all' || String(c.hsk) === level) && foldSearch(c.name).includes(key),
  );
  const levels: Level[] = ['all', ...HSK_LEVELS.map((l) => `${l}` as const)];

  return (
    <div>
      <div className="toolbar">
        <div className="cls-seg" role="group" aria-label="Lọc theo cấp HSK">
          {levels.map((l) => (
            <button key={l} type="button" aria-pressed={level === l} onClick={() => setLevel(l)}>
              {l === 'all' ? 'Tất cả' : hskLevelLabel(Number(l) as (typeof HSK_LEVELS)[number])}{' '}
              <span className="muted">{count(l)}</span>
            </button>
          ))}
        </div>
        <div className="inp-search">
          <Icon name="search" size={18} />
          <input
            className="input"
            type="search"
            placeholder="Tìm theo tên giáo trình"
            aria-label="Tìm giáo trình"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      {error && (
        <p className="err-msg" role="alert">
          {error}
        </p>
      )}
      {value && value.publishedLessonCount === 0 && (
        <div className="cls-callout cls-callout--warn" role="status">
          {M.noPublishedLessons}
        </div>
      )}
      {shown.length === 0 ? (
        <div className="empty">
          <h3>{M.noCurriculumMatch}</h3>
        </div>
      ) : (
        <div className="cls-cur-grid" role="radiogroup" aria-label="Giáo trình">
          {shown.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={value?.id === c.id}
              className="cls-cur-card"
              onClick={() => onChange(c)}
            >
              <span className="cls-cur-card__top">
                <HskBadge level={c.hsk} />
                {c.id === currentId ? (
                  <span className="chip chip--info">Đang dùng</span>
                ) : (
                  <span className="small muted">Dùng bởi {c.usedBy} lớp</span>
                )}
              </span>
              <span className="cls-cur-card__name">{c.name}</span>
              <span className="small muted">{c.publishedLessonCount} bài đã xuất bản</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
