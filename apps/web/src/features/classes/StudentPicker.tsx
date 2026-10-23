import {
  CLASS_LIMITS,
  CLASS_MESSAGES as M,
  STUDENT_STATUS_LABELS,
  type StudentOption,
  type StudentOptionsResponse,
} from '@sat/shared';
import { useEffect, useState } from 'react';
import { Avatar, Button, Checkbox, Icon, IconButton, Pagination, Skeleton } from '../../components';
import { AddStudentsDialog, type Added } from '../students/AddStudentsDialog';
import type { PickedStudent } from './class-wizard-store';
import { useClassesStore } from './classes-store';

export interface StudentPickerProps {
  selected: PickedStudent[];
  /** Adds students; false when some did not fit the limit. */
  onSelect: (students: PickedStudent[]) => boolean;
  onUnselect: (id: string) => void;
  /** T04 dialog: members of this class are listed as "Đã trong lớp" and cannot be chosen (AC-8.2). */
  classId?: string;
  /** Shown when a selection does not fit (AC-3.5, AC-8.4). */
  limitMessage?: string;
}

const pick = (
  s: Pick<StudentOption, 'id' | 'displayName' | 'email' | 'status'>,
): PickedStudent => ({
  id: s.id,
  displayName: s.displayName,
  email: s.email,
  status: s.status,
});

/** T03 step 2 and "Thêm học viên" (REQ-3, AC-8.2): workspace students A→Z, search, pages of 20, T12. */
export function StudentPicker({
  selected,
  onSelect,
  onUnselect,
  classId,
  limitMessage = M.maxStudents,
}: StudentPickerProps) {
  const studentOptions = useClassesStore((s) => s.studentOptions);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<StudentOptionsResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [limitHit, setLimitHit] = useState(false);
  const [creating, setCreating] = useState(false);

  const [tick, setTick] = useState(0);
  const reload = () => setTick((t) => t + 1);

  useEffect(() => {
    let live = true;
    studentOptions(q, page, classId).then(
      (res) => {
        if (!live) return;
        setData(res);
        setFailed(false);
      },
      () => live && setFailed(true),
    );
    return () => {
      live = false;
    };
  }, [studentOptions, q, page, classId, tick]);

  // AC-3.2, NFR-2: search as the GV types.
  useEffect(() => {
    if (search === q) return;
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 250);
    return () => clearTimeout(t);
  }, [search, q]);

  const chosen = new Set(selected.map((s) => s.id));
  const toggle = (s: StudentOption) => {
    if (chosen.has(s.id)) {
      onUnselect(s.id);
      setLimitHit(false);
    } else setLimitHit(!onSelect([pick(s)]));
  };
  const onAdded = (added: Added[]) => {
    setLimitHit(!onSelect(added.map((a) => ({ ...a, status: 'pending' as const }))));
    reload();
  };

  const pageCount = data ? Math.max(1, Math.ceil(data.total / CLASS_LIMITS.pageSize)) : 1;
  const createButton = (
    <Button variant="outline" onClick={() => setCreating(true)}>
      <Icon name="plus" size={18} />
      Tạo học viên mới
    </Button>
  );

  return (
    <div className="cls-picker">
      <div className="cls-picker__main">
        {data && data.workspaceTotal === 0 ? (
          <div className="empty">
            <h3>{M.noStudents}</h3>
            <div className="empty__actions">{createButton}</div>
          </div>
        ) : (
          <>
            <div className="cls-picker__bar">
              <div className="inp-search grow">
                <Icon name="search" size={18} />
                <input
                  className="input"
                  type="search"
                  placeholder="Tìm học viên theo họ tên hoặc email"
                  aria-label="Tìm học viên"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              {createButton}
            </div>
            {limitHit && (
              <p className="err-msg" role="alert">
                {limitMessage}
              </p>
            )}
            {failed && !data && <p className="err-msg">Không tải được danh sách học viên.</p>}
            {!data && !failed && <Skeleton height={200} />}
            {data && (
              <div className="cls-pick-list" role="group" aria-label="Học viên trong workspace">
                {data.items.length === 0 && (
                  <div className="empty">
                    <h3>{M.noStudentMatch}</h3>
                  </div>
                )}
                {data.items.map((s) => (
                  <div key={s.id} className="cls-pick-row">
                    <Checkbox
                      checked={s.inClass || chosen.has(s.id)}
                      disabled={s.inClass}
                      onChange={() => toggle(s)}
                      aria-label={s.displayName}
                      label={
                        <span className="cls-pick-row__who">
                          <Avatar name={s.displayName} size="sm" />
                          <span className="cls-pick-row__text">
                            <span className="strong">{s.displayName}</span>
                            <span className="small muted">{s.email}</span>
                          </span>
                        </span>
                      }
                    />
                    {s.inClass ? (
                      <span className="chip chip--todo">Đã trong lớp</span>
                    ) : (
                      s.status !== 'active' && (
                        <span
                          className={`chip ${s.status === 'locked' || s.status === 'failed' ? 'chip--danger' : 'chip--pending'}`}
                        >
                          {STUDENT_STATUS_LABELS[s.status]}
                        </span>
                      )
                    )}
                  </div>
                ))}
              </div>
            )}
            {data && (
              <div className="cls-picker__foot">
                <span className="small muted">
                  Sắp theo họ tên A→Z · {data.total} học viên · 20 mỗi trang
                </span>
                {pageCount > 1 && (
                  <Pagination page={page} pageCount={pageCount} onChange={setPage} />
                )}
              </div>
            )}
          </>
        )}
      </div>
      <aside className="card cls-picker__chosen" aria-labelledby="cls-chosen-title">
        <h3 id="cls-chosen-title" className="cls-picker__chosen-title">
          Đã chọn ({selected.length})
        </h3>
        {selected.length === 0 ? (
          <p className="small muted cls-picker__none">Chưa chọn học viên nào.</p>
        ) : (
          <ul className="cls-chosen-list">
            {selected.map((s) => (
              <li key={s.id}>
                <Avatar name={s.displayName} size="sm" />
                <span className="grow">{s.displayName}</span>
                <IconButton
                  aria-label={`Bỏ chọn ${s.displayName}`}
                  icon={<Icon name="close" size={16} />}
                  onClick={() => {
                    onUnselect(s.id);
                    setLimitHit(false);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
        <p className="small muted cls-picker__none">Tối đa 100 học viên mỗi lớp.</p>
      </aside>
      {creating && (
        <AddStudentsDialog
          open
          initialTab="one"
          onClose={() => setCreating(false)}
          onAdded={onAdded}
        />
      )}
    </div>
  );
}
