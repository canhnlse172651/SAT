import type { Lesson } from '@sat/shared';
import type { Ref } from 'react';
import { Icon } from '../../components';

/**
 * Right panel of T18 on every Bài (AC-11.1). Its content — upload, "Mô tả ngắn", "Tạo bằng AI", progress, review —
 * belongs to module 010; until 010 ships the frame says so. Approved content arrives through REQ-19.
 */
export function AiPanelFrame({ lesson, ref }: { lesson: Lesson; ref?: Ref<HTMLElement> }) {
  return (
    <section
      ref={ref}
      id="tao-bang-ai"
      tabIndex={-1}
      className="cur-panel cur-panel--ai"
      aria-labelledby="t18-ai"
    >
      <div className="cur-panel__head">
        <Icon name="upload" size={18} />
        <h2 id="t18-ai">Tạo bằng AI</h2>
        <span className="small muted">
          Tải tài liệu PDF/Word và nhập mô tả ngắn; nội dung chỉ vào bài khi bạn duyệt.
        </span>
      </div>
      <div className="cur-panel__body">
        {lesson.ai && <p className="cur-ai-state">{lesson.ai.label}</p>}
        <p className="small muted">
          Chức năng tạo bài bằng AI (module 010) đang được xây dựng. Khi duyệt, nội dung mới thay
          toàn bộ nội dung của phần tương ứng và được xuất bản ngay.
        </p>
      </div>
    </section>
  );
}
