import { toJpeg, toPng } from "html-to-image";
import { jsPDF } from "jspdf";

export type ExportViewport = "story" | "square" | "desktop";

export const EXPORT_VIEWPORTS: Record<
  ExportViewport,
  { width: number; height: number; label: string }
> = {
  story: { width: 1080, height: 1920, label: "Story 1080×1920" },
  square: { width: 1080, height: 1080, label: "Square 1080×1080" },
  desktop: { width: 1200, height: 1600, label: "Desktop" },
};

export async function exportElementAsPng(node: HTMLElement, filename: string) {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  downloadDataUrl(dataUrl, filename.endsWith(".png") ? filename : `${filename}.png`);
  return dataUrl;
}

export async function exportElementAsJpg(node: HTMLElement, filename: string) {
  const dataUrl = await toJpeg(node, {
    pixelRatio: 2,
    quality: 0.92,
    cacheBust: true,
  });
  downloadDataUrl(dataUrl, filename.endsWith(".jpg") ? filename : `${filename}.jpg`);
  return dataUrl;
}

export async function exportElementAsPdf(node: HTMLElement, filename: string) {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const width = node.offsetWidth || 1080;
  const height = node.offsetHeight || 1920;
  const orientation = width > height ? "l" : "p";
  const pdf = new jsPDF({
    orientation,
    unit: "px",
    format: [width, height],
  });
  pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
