import { CLASS_MESSAGES as M, formatDay, startsOnLine } from '@sat/shared';
import { useEffect } from 'react';
import { Link } from 'react-router';
import { ErrorState, HskBadge, Skeleton } from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { useSessionStore } from '../session/session-store';
import { ClassStatusChip, ProgressLine } from './ClassBits';
import { useMyClassesStore } from './my-classes-store';
import { myClassPath } from './paths';
import './classes.css';

/** S01 Lớp của tôi (REQ-12). */
export function MyClassesPage() {
  useDocumentTitle('Lớp của tôi');
  const name = useSessionStore((s) => s.user?.displayName ?? '');
  const status = useMyClassesStore((s) => s.listStatus);
  const classes = useMyClassesStore((s) => s.classes);
  const load = useMyClassesStore((s) => s.loadClasses);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'error' && !classes.length)
    return <ErrorState title="Không tải được lớp của bạn." />;
  if (status !== 'ok' && !classes.length) return <Skeleton height={200} />;
  if (!classes.length)
    return (
      <div className="empty hv-pad" data-screen="S01">
        <h3>{M.noMyClasses}</h3>
      </div>
    );

  const first = name.trim().split(/\s+/).at(-1) ?? name;
  return (
    <div data-screen="S01" className="hv-pad">
      <h2 className="hv-hello">Chào {first}!</h2>
      <p className="small muted">{classes.length} lớp</p>
      <ul className="hv-cards">
        {classes.map((c) => (
          <li key={c.id}>
            <Link
              to={myClassPath(c.id)}
              className={`hv-class-card ${c.status === 'ended' ? 'is-ended' : ''}`}
            >
              <span className="hv-class-card__top">
                <ClassStatusChip status={c.status} />
              </span>
              <span className="hv-class-card__name">{c.name}</span>
              <span className="hv-class-card__meta small muted">
                <span>{formatDay(c.startDate)}</span>
                <span className="cls-cur">
                  <HskBadge level={c.curriculum.hsk} /> {c.curriculum.name}
                </span>
              </span>
              {c.status === 'upcoming' ? (
                <span className="cls-callout">{startsOnLine(c.startDate)}</span>
              ) : (
                c.progress && c.progress.total > 0 && <ProgressLine progress={c.progress} />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
