import {
  CLASS_LIMITS,
  CLASS_MESSAGES as M,
  type ClassDetail,
  type ClassMember,
  STUDENT_STATUS_LABELS,
  addedMessage,
  foldSearch,
  formatDay,
  removeConfirm,
  seatsLeftMessage,
} from '@sat/shared';
import { useEffect, useState } from 'react';
import { Avatar, Button, ConfirmDialog, Dialog, Icon, Skeleton } from '../../components';
import { useToastStore } from '../toast/toast-store';
import type { PickedStudent } from './class-wizard-store';
import { useClassesStore } from './classes-store';
import { messageOf } from './errors';
import { StudentPicker } from './StudentPicker';

const STATUS_TONE: Record<ClassMember['status'], string> = {
  pending: 'chip--pending',
  sending: 'chip--info',
  active: 'chip--done',
  failed: 'chip--danger',
  locked: 'chip--danger',
};

/** T04 tab Học viên (REQ-8). */
export function StudentsTab({ detail }: { detail: ClassDetail }) {
  const push = useToastStore((s) => s.push);
  const status = useClassesStore((s) => s.membersStatus);
  const members = useClassesStore((s) => s.members);
  const loadMembers = useClassesStore((s) => s.loadMembers);
  const removeStudent = useClassesStore((s) => s.removeStudent);
  const loadDetail = useClassesStore((s) => s.loadDetail);
  const [q, setQ] = useState('');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<ClassMember | null>(null);
  const [busy, setBusy] = useState(false);
  const ended = detail.status === 'ended';

  useEffect(() => {
    void loadMembers(detail.id);
  }, [detail.id, loadMembers]);

  const key = foldSearch(q);
  const shown = members.filter(
    (m) => !key || foldSearch(m.displayName).includes(key) || m.email.toLowerCase().includes(key),
  );

  const onRemove = async () => {
    if (!removing || busy) return;
    setBusy(true);
    try {
      await removeStudent(detail.id, removing.id);
      void loadDetail(detail.id).catch(() => {});
    } catch (err) {
      push(messageOf(err), 'error');
    } finally {
      setBusy(false);
      setRemoving(null);
    }
  };

  const addButton = (
    <Button disabled={ended} onClick={() => setAdding(true)}>
      <Icon name="plus" size={18} />
      Thêm học viên
    </Button>
  );

  return (
    <div>
      <div className="toolbar">
        <span className="strong">Sĩ số {detail.memberCount}/100</span>
        <div className="inp-search">
          <Icon name="search" size={18} />
          <input
            className="input"
            type="search"
            placeholder="Tìm theo họ tên hoặc email"
            aria-label="Tìm học viên trong lớp"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <span className="grow" />
        {ended && <span className="small muted">{M.endedHint}</span>}
        {addButton}
      </div>
      <div className="card">
        {status === 'loading' && !members.length && <Skeleton height={160} />}
        {status !== 'loading' && !members.length && (
          <div className="empty">
            <h3>{M.noMembers}</h3>
            <div className="empty__actions">{addButton}</div>
          </div>
        )}
        {members.length > 0 && (
          <div className="tbl-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>Tài khoản</th>
                  <th>Ngày vào lớp</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {shown.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <span className="cls-who">
                        <Avatar name={m.displayName} size="sm" />
                        <span className="strong">{m.displayName}</span>
                      </span>
                    </td>
                    <td className="muted">{m.email}</td>
                    <td>
                      <span className={`chip ${STATUS_TONE[m.status]}`}>
                        {STUDENT_STATUS_LABELS[m.status]}
                      </span>
                    </td>
                    <td className="nowrap">{formatDay(m.joinedAt)}</td>
                    <td className="r">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={ended}
                        aria-label={`Gỡ khỏi lớp: ${m.displayName}`}
                        onClick={() => setRemoving(m)}
                      >
                        Gỡ khỏi lớp
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {adding && <AddToClassDialog detail={detail} onClose={() => setAdding(false)} />}
      <ConfirmDialog
        open={!!removing}
        title="Gỡ khỏi lớp"
        message={removing ? removeConfirm(removing.displayName, detail.name) : ''}
        confirmLabel="Gỡ khỏi lớp"
        tone="danger"
        loading={busy}
        onConfirm={() => void onRemove()}
        onCancel={() => setRemoving(null)}
      />
    </div>
  );
}

/** "Thêm học viên" (AC-8.2 … AC-8.4): the T03 step-2 picker; members show "Đã trong lớp". */
function AddToClassDialog({ detail, onClose }: { detail: ClassDetail; onClose: () => void }) {
  const push = useToastStore((s) => s.push);
  const addStudents = useClassesStore((s) => s.addStudents);
  const loadDetail = useClassesStore((s) => s.loadDetail);
  const [selected, setSelected] = useState<PickedStudent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const room = Math.max(0, CLASS_LIMITS.maxStudents - detail.memberCount);

  const select = (students: PickedStudent[]) => {
    const have = new Set(selected.map((s) => s.id));
    const fresh = students.filter((s) => !have.has(s.id));
    const left = room - selected.length;
    setSelected((list) => [...list, ...fresh.slice(0, Math.max(0, left))]);
    return fresh.length <= left;
  };

  const add = async () => {
    if (busy || !selected.length) return;
    setBusy(true);
    setError(null);
    try {
      const n = await addStudents(
        detail.id,
        selected.map((s) => s.id),
      );
      push(addedMessage(n), 'success');
      void loadDetail(detail.id).catch(() => {});
      onClose();
    } catch (err) {
      setError(messageOf(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Thêm học viên"
      size="xl"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button loading={busy} disabled={!selected.length} onClick={() => void add()}>
            Thêm ({selected.length})
          </Button>
        </>
      }
    >
      {error && (
        <p className="err-msg" role="alert">
          {error}
        </p>
      )}
      <StudentPicker
        selected={selected}
        onSelect={select}
        onUnselect={(id) => setSelected((list) => list.filter((s) => s.id !== id))}
        classId={detail.id}
        limitMessage={seatsLeftMessage(room)}
      />
    </Dialog>
  );
}
