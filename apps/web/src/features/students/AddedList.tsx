import { Avatar } from '../../components';
import { StudentStatusChip } from './StudentFields';
import './students.css';

/** Prototype `addedList`: students just added, each "Chưa kích hoạt" (AC-8.2, AC-10.2). */
export function AddedList({
  students,
}: {
  students: { id: string; displayName: string; email: string }[];
}) {
  return (
    <ul className="added-list" aria-label="Học viên vừa thêm">
      {students.map((s) => (
        <li key={s.id}>
          <Avatar name={s.displayName} size="sm" />
          <span className="added-list__who">
            <b>{s.displayName}</b> <span className="imp-muted">{s.email}</span>
          </span>
          <StudentStatusChip status="pending" plain />
        </li>
      ))}
    </ul>
  );
}
