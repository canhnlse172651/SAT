import { CLASS_MESSAGES as M } from '@sat/shared';
import { useEffect } from 'react';
import { Link } from 'react-router';
import { Avatar, Button, ErrorState, Icon, Skeleton } from '../../components';
import { useMyClassesStore } from './my-classes-store';
import { myProfilePath, studentProfilePath } from './paths';
import { useHvRefusal } from './use-hv-refusal';

/** S02 "Thành viên" (REQ-20): activated classmates, me first ("Bạn"), avatar and name only. */
export function MembersList({ classId, onBack }: { classId: string; onBack: () => void }) {
  const status = useMyClassesStore((s) => s.membersStatus);
  const members = useMyClassesStore((s) => s.members);
  const error = useMyClassesStore((s) => s.error);
  const load = useMyClassesStore((s) => s.loadMembers);
  useHvRefusal(error);

  useEffect(() => {
    void load(classId);
  }, [classId, load]);

  return (
    <section data-screen="S02" aria-labelledby="s02-members">
      <div className="hv-pad hv-members-head">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <Icon name="back" size={18} />
          Trang lớp
        </Button>
        <h2 id="s02-members" className="hv-title">
          Thành viên ({members.length})
        </h2>
      </div>
      {status === 'error' && !members.length && <ErrorState title="Không tải được thành viên." />}
      {status === 'loading' && !members.length && <Skeleton height={200} />}
      <ul className="hv-list">
        {members.map((m) => (
          <li key={m.id}>
            <Link to={m.me ? myProfilePath : studentProfilePath(m.id)} className="hv-row">
              <Avatar name={m.displayName} {...(m.avatarUrl ? { src: m.avatarUrl } : {})} />
              <span className="hv-row__main">
                <span className="hv-row__title">{m.displayName}</span>
              </span>
              {m.me && <span className="chip chip--info">Bạn</span>}
              <Icon name="fwd" size={18} />
            </Link>
          </li>
        ))}
      </ul>
      {status === 'ok' && members.length === 1 && <p className="muted hv-pad">{M.aloneInClass}</p>}
    </section>
  );
}
