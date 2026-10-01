import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/** Draws the first page of the PDF in `canvas[data-pdf]` onto the canvas. */
export async function renderPdf(canvas: HTMLCanvasElement): Promise<void> {
  if (canvas.dataset.rendered) return;
  canvas.dataset.rendered = 'pending';
  const loading = canvas.parentElement?.querySelector<HTMLElement>('[data-pdf-loading]');

  try {
    const pdf = await pdfjsLib.getDocument({ url: canvas.dataset.pdf! }).promise;
    const page = await pdf.getPage(1);
    const unscaled = page.getViewport({ scale: 1 });
    // Render at the canvas's on-screen width × device pixel ratio so it stays sharp.
    const cssWidth = canvas.clientWidth || canvas.parentElement?.clientWidth || 600;
    const scale = (cssWidth * (window.devicePixelRatio || 1)) / unscaled.width;
    const viewport = page.getViewport({ scale });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvas, viewport }).promise;
    canvas.dataset.rendered = 'done';
    loading?.remove();
  } catch (error) {
    console.error('Could not render PDF preview', canvas.dataset.pdf, error);
    canvas.dataset.rendered = 'error';
    if (loading) loading.textContent = 'PDF preview unavailable';
  }
}

/** Renders PDFs only when they scroll into view, so a page with many certificates stays fast. */
export function renderPdfsWhenVisible(root: ParentNode = document): void {
  const canvases = root.querySelectorAll<HTMLCanvasElement>('canvas[data-pdf]');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        renderPdf(entry.target as HTMLCanvasElement);
      }
    },
    { rootMargin: '200px' },
  );
  canvases.forEach((canvas) => observer.observe(canvas));
}
