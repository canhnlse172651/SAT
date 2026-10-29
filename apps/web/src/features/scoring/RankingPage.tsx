import {
  type LearnRanking,
  RANKING_MESSAGES as M,
  type RankingTopRow,
  formatScore,
} from '@sat/shared';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  Avatar,
  BottomSheet,
  Button,
  ErrorState,
  Icon,
  IconButton,
  SegmentedControl,
  Skeleton,
} from '../../components';
import { useDocumentTitle } from '../../lib/use-document-title';
import { myProfilePath, studentProfilePath } from '../classes/paths';
import { useSessionStore } from '../session/session-store';
import { MyScore } from './MyScore';
import { RankBadge } from './rank-bits';
import { updatedText } from './rank-format';
import { RankInfo } from './RankInfo';
import { lastViewedClass, useRankingStore } from './ranking-store';
import './scoring.css';

type Segment = 'rank' | 'mine';
const profileOf = (r: RankingTopRow) => (r.me ? myProfilePath : studentProfilePath(r.id));

/** "Xếp hạng": podium, ranks 4–10 and the pinned own position (REQ-7). */
function Board({ board }: { board: LearnRanking }) {
  const me = useSessionStore((s) => s.user);
  const top = board.top;
  return (
    <>
      {board.class.status === 'ended' && <p className="rk-banner">{M.ended}</p>}
      {top.length ? (
        <>
          <div className="rk-podium" aria-label="Top 3">
            {[1, 0, 2].map((k) => {
              const r = top[k];
              if (!r) return <div key={k} />;
              return (
                <Link key={r.id} className={`rk-pod rk-pod--${k + 1}`} to={profileOf(r)}>
                  <Avatar name={r.name} size={k === 0 ? 'lg' : 'md'} />
                  <span className="rk-pod__name">
                    {r.name}
                    {r.me && ' (bạn)'}
                  </span>
                  <span className="rk-pod__pts num">{formatScore(r.score)} điểm</span>
                  <RankBadge rank={r.rank} />
                </Link>
              );
            })}
          </div>
          {top.slice(3).map((r) => (
            <Link key={r.id} className={`rk-lrow${r.me ? ' rk-lrow--me' : ''}`} to={profileOf(r)}>
              <RankBadge rank={r.rank} />
              <Avatar name={r.name} size="sm" />
              <span className="rk-lrow__name">
                {r.name}
                {r.me && <span className="rk-me">Bạn</span>}
              </span>
              <span className="rk-lrow__pts num">{formatScore(r.score)}</span>
              <span className="small muted">điểm</span>
            </Link>
          ))}
          <p className="rk-help">
            Tối đa 10 hạng đầu; chỉ tên và Điểm xếp hạng (0–100) của bạn cùng lớp.
          </p>
        </>
      ) : (
        <div className="empty">
          <h3>{M.nobodyYet}</h3>
        </div>
      )}
      <Link className="rk-pin" to={myProfilePath} aria-label="Vị trí của tôi">
        {board.me.rank ? (
          <>
            <RankBadge rank={board.me.rank} />
            <Avatar name={me?.displayName ?? ''} size="sm" />
            <span className="rk-pin__main">
              <span className="small muted">Vị trí của tôi</span>
              <span className="rk-pin__rank">{M.position(board.me.rank, board.total)}</span>
            </span>
            <span className="rk-pin__pts num">
              {formatScore(board.me.score)}
              <span className="small muted"> điểm</span>
            </span>
          </>
        ) : (
          <span className="rk-pin__main small">
            <b>Vị trí của tôi</b>
            <span>{M.unranked}</span>
          </span>
        )}
      </Link>
    </>
  );
}

/** S09 Bảng xếp hạng lớp (REQ-7, REQ-8, REQ-11, REQ-13). */
export function RankingPage() {
  useDocumentTitle('Xếp hạng');
  const [params, setParams] = useSearchParams();
  const classes = useRankingStore((s) => s.classes);
  const classesStatus = useRankingStore((s) => s.classesStatus);
  const board = useRankingStore((s) => s.board);
  const boardStatus = useRankingStore((s) => s.boardStatus);
  const loadClasses = useRankingStore((s) => s.loadClasses);
  const loadBoard = useRankingStore((s) => s.loadBoard);
  const [segment, setSegment] = useState<Segment>('rank');
  const [info, setInfo] = useState(false);

  // AC-8.3: `?lop=` (from S02) wins; else the class viewed last if still mine (AC-8.2); else the first one (AC-8.1).
  const requested = params.get('lop');
  const stored = lastViewedClass.get();
  const chosen =
    requested ?? (classes?.some((c) => c.id === stored) ? stored : (classes?.[0]?.id ?? null));

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  // AC-13.3: opening S09 and changing class always load the newest data.
  useEffect(() => {
    if (chosen) void loadBoard(chosen);
  }, [chosen, loadBoard]);

  useEffect(() => {
    if (board) lastViewedClass.set(board.class.id);
  }, [board]);

  const refresh = () => {
    if (chosen) void loadBoard(chosen);
  };

  const head = (
    <div className="rk-head">
      <div className="rk-head__title">
        <h1>Xếp hạng</h1>
        <IconButton
          aria-label="Cách tính điểm"
          icon={<Icon name="info" size={22} />}
          onClick={() => setInfo(true)}
        />
      </div>
      {classes && classes.length > 1 && (
        <label className="rk-picker">
          <span className="small muted">Lớp</span>
          <select
            aria-label="Chọn lớp"
            value={chosen ?? ''}
            onChange={(e) => setParams({ lop: e.target.value })}
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <SegmentedControl<Segment>
        aria-label="Mục"
        className="rk-seg"
        value={segment}
        onChange={setSegment}
        options={[
          { value: 'rank', label: 'Xếp hạng' },
          { value: 'mine', label: 'Điểm của tôi' },
        ]}
      />
      <div className="rk-updated small">
        <span className="muted num">{board ? updatedText(board.loadedAt) : ''}</span>
        <Button variant="ghost" size="sm" onClick={refresh} disabled={boardStatus === 'loading'}>
          <Icon name="refresh" size={14} />
          Làm mới
        </Button>
      </div>
    </div>
  );

  let body;
  if (classesStatus === 'error')
    body = <ErrorState title={M.loadError} message="" onRetry={() => void loadClasses()} />;
  else if (!classes && !requested) body = <Skeleton height={240} />;
  else if (!chosen)
    return (
      <div className="rk-page" data-screen="S09">
        <h1 className="sr-only">Xếp hạng</h1>
        <div className="empty rk-noclass">
          <h3>{M.noClass}</h3>
        </div>
      </div>
    );
  else if (boardStatus === 'notFound')
    body = (
      <div className="empty">
        <h3>{M.notFound}</h3>
      </div>
    );
  else if (boardStatus === 'error')
    body = <ErrorState title={M.loadError} message="" onRetry={refresh} />;
  else if (!board) body = <Skeleton height={240} />;
  else if (board.class.status === 'upcoming')
    body = (
      <div className="empty">
        <div className="empty__ill">
          <Icon name="clock" size={28} />
        </div>
        <h3>{M.upcoming(board.class.startDate)}</h3>
      </div>
    );
  else
    body =
      segment === 'rank' ? (
        <Board board={board} />
      ) : (
        <MyScore
          classId={board.class.id}
          mine={board.mine}
          rank={board.me.rank}
          total={board.total}
        />
      );

  return (
    <div className="rk-page" data-screen="S09">
      {head}
      <div className="rk-body">{body}</div>
      <BottomSheet
        open={info}
        onClose={() => setInfo(false)}
        title="Cách tính điểm"
        footer={
          <Button block onClick={() => setInfo(false)}>
            Đã hiểu
          </Button>
        }
      >
        <RankInfo />
      </BottomSheet>
    </div>
  );
}
