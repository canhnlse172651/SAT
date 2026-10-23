import type { AiLabel } from '@sat/shared';
import { useNavigate } from 'react-router';
import { aiReviewPath, lessonPath } from './paths';

/** AI label of a Bài (AC-11.3) — opens T20 when waiting for review, else T18 at the "Tạo bằng AI" panel (AC-11.4). */
export function AiChip({
  label,
  curriculumId,
  lessonId,
}: {
  label: AiLabel;
  curriculumId: string;
  lessonId: string;
}) {
  const navigate = useNavigate();
  const open = () => {
    if (label.state === 'review') navigate(aiReviewPath(curriculumId, lessonId));
    else navigate(`${lessonPath(curriculumId, lessonId)}#tao-bang-ai`);
  };
  return (
    <button type="button" className="chip cur-ai-chip" onClick={open}>
      {label.label}
    </button>
  );
}
