import type { PDFDocumentProxy } from 'pdfjs-dist';
import { type FileRef, STEP_MESSAGES as SM, fileExtension } from '@sat/shared';
import { useEffect, useRef, useState } from 'react';
import { Button, Icon, IconButton } from '../../components';
import { apiRequest } from '../../lib/api-client';
import { downloadUrl, previewUrl } from './viewer-prefs';

type PdfDoc = PDFDocumentProxy;

const ZOOMS = [1, 1.25, 1.5, 2, 2.5, 3] as const;

/** pdf.js is large: loaded only when a PDF is shown (S03, T21). */
async function loadPdf(url: string): Promise<PdfDoc> {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs.getDocument({ url }).promise;
}

function PdfPage({ doc, page, zoom }: { doc: PdfDoc; page: number; zoom: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let cancelled = false;
    let task: { cancel: () => void } | null = null;
    void (async () => {
      const p = await doc.getPage(page);
      const el = canvas.current;
      const width = box.current?.clientWidth ?? 320;
      if (!el || cancelled) return;
      const base = p.getViewport({ scale: 1 });
      const ratio = window.devicePixelRatio || 1;
      const viewport = p.getViewport({ scale: ((width * zoom) / base.width) * ratio });
      el.width = viewport.width;
      el.height = viewport.height;
      el.style.width = `${viewport.width / ratio}px`;
      const ctx = el.getContext('2d');
      if (!ctx) return;
      const render = p.render({ canvasContext: ctx, viewport, canvas: el });
      task = render;
      await render.promise.catch(() => undefined);
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, page, zoom]);
  return (
    <div ref={box} className="st-doc__page">
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  );
}

/**
 * AC-14.5: PDF, DOCX and PPTX read inside the step — page back / forward, "Trang {x}/{y}", zoom and "Tải về" (the original
 * file). PDF pages are drawn by pdf.js; DOCX / PPTX pages are their text per page / slide.
 */
export function DocumentViewer({ file, title }: { file: FileRef; title: string }) {
  const url = file.url ?? `/api/files/${file.id}`;
  const ext = fileExtension(file.name);
  const isPdf = ext === 'pdf' || file.contentType === 'application/pdf';
  const [pdf, setPdf] = useState<PdfDoc | null>(null);
  const [pages, setPages] = useState<string[][] | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(0);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        if (isPdf) {
          const doc = await loadPdf(url);
          if (alive) setPdf(doc);
        } else {
          const res = await apiRequest<{ pages: string[][] }>(
            previewUrl(url, file.id).replace(/^\/api/, ''),
          );
          if (alive) setPages(res.pages.length ? res.pages : [[]]);
        }
      } catch {
        if (alive) setFailed(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [isPdf, url, file.id, attempt]);

  if (failed) {
    return (
      <div className="st-blockerr" role="alert">
        <span>{SM.blockFailed}</span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setFailed(false);
            setAttempt((a) => a + 1);
          }}
        >
          Thử lại
        </Button>
      </div>
    );
  }
  const total = pdf ? pdf.numPages : (pages?.length ?? 0);
  const scale = ZOOMS[zoom] ?? 1;
  return (
    <div className="st-doc" aria-label={`Tài liệu ${title || file.name}`} role="group">
      <div className="st-doc__view" style={{ fontSize: `${scale}em` }}>
        {pdf ? (
          <PdfPage doc={pdf} page={page} zoom={scale} />
        ) : pages ? (
          <div className="st-doc__text">
            {(pages[page - 1] ?? []).map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        ) : (
          <p className="small muted st-doc__loading">Đang tải tài liệu…</p>
        )}
      </div>
      <div className="st-doc__bar">
        <IconButton
          size="sm"
          aria-label="Trang trước"
          icon={<Icon name="back" size={16} />}
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        />
        <span className="small num" aria-live="polite">
          Trang {total ? page : 0}/{total}
        </span>
        <IconButton
          size="sm"
          aria-label="Trang sau"
          icon={<Icon name="fwd" size={16} />}
          disabled={page >= total}
          onClick={() => setPage((p) => p + 1)}
        />
        <IconButton
          size="sm"
          aria-label="Thu nhỏ"
          icon={<span aria-hidden="true">−</span>}
          disabled={zoom <= 0}
          onClick={() => setZoom((z) => z - 1)}
        />
        <IconButton
          size="sm"
          aria-label="Phóng to"
          icon={<span aria-hidden="true">+</span>}
          disabled={zoom >= ZOOMS.length - 1}
          onClick={() => setZoom((z) => z + 1)}
        />
        <span className="grow" />
        <a className="btn btn--outline btn--sm" href={downloadUrl(url)} download={file.name}>
          <Icon name="download" size={16} />
          Tải về
        </a>
      </div>
    </div>
  );
}
