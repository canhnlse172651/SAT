const MEDALS = ['Vàng', 'Bạc', 'Đồng'] as const;

/** AC-7.4: rank 1–3 carry a medal with its name (never colour alone, NFR-6); unranked is "—" (AC-6.3). */
export function RankBadge({ rank }: { rank: number | null }) {
  if (!rank) return <span className="rk-no">—</span>;
  const medal = rank <= 3 ? MEDALS[rank - 1] : null;
  return (
    <span className={`rk-no${medal ? ` rk-no--m${rank}` : ''}`}>
      {rank}
      {medal && <span className="rk-no__medal">{medal}</span>}
    </span>
  );
}

/** Status chip with its text (AC-11.1, AC-11.8). */
export function Chip({ label, tone }: { label: string; tone: string }) {
  return <span className={`chip chip--${tone} rk-chip`}>{label}</span>;
}
