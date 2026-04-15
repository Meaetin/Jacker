import type { DocumentType } from "@/types/profile";
import type { Content, TDocumentDefinitions } from "pdfmake/interfaces";

// ─── Markdown → pdfmake content nodes ───────────────────────────
// Handles paragraphs, bold (**text**), bullet lists, and headers —
// which covers cover letters and application emails.

function parseMarkdownToPdfMake(md: string): Content[] {
  const lines = md.split("\n");
  const content: Content[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line → skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Bullet list
    if (/^[-*]\s/.test(line)) {
      const items: Content[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push({ text: parseInlineBold(lines[i].replace(/^[-*]\s/, "")), lineHeight: 1.4 });
        i++;
      }
      content.push({ ul: items, marginBottom: 6 });
      continue;
    }

    // Header (# )
    if (/^#+\s/.test(line)) {
      content.push({ text: parseInlineBold(line.replace(/^#+\s/, "")), style: "heading", marginBottom: 4 });
      i++;
      continue;
    }

    // Paragraph — collect consecutive non-blank, non-bullet, non-header lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^[-*]\s/.test(lines[i]) &&
      !/^#+\s/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      content.push({ text: parseInlineBold(paraLines.join("\n")), lineHeight: 1.5, marginBottom: 6 });
    }
  }

  return content;
}

function parseInlineBold(text: string): Content[] {
  const parts: Content[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push({ text: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text] as Content[];
}

// ─── PDF (pdfmake — real vector text, selectable) ────────────────

export async function downloadAsPdf(
  content: string,
  analysis: { job_title: string | null; company_name: string | null },
  documentType: DocumentType,
) {
  // Dynamic imports — pdfmake's font module is plain JS, types are incomplete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfMake = (await import("pdfmake/build/pdfmake")).default as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfFonts = (await import("pdfmake/build/vfs_fonts")).default as any;
  pdfMake.vfs = pdfFonts?.vfs ?? pdfFonts?.pdfMake?.vfs ?? {};

  const title = documentType === "cover_letter" ? "Cover Letter" : "Application Email";
  const jobLabel = [analysis.job_title, analysis.company_name].filter(Boolean).join(" — ");

  const bodyContent = parseMarkdownToPdfMake(content);

  const docDefinition = {
    pageSize: "A4" as const,
    pageMargins: [50, 50, 50, 50] as [number, number, number, number],
    content: [
      { text: title, style: "title" as const, marginBottom: 2 },
      ...(jobLabel ? [{ text: jobLabel, style: "subtitle" as const, marginBottom: 16 }] : []),
      ...bodyContent,
    ],
    styles: {
      title: { fontSize: 18, bold: true, color: "#2a2118" },
      subtitle: { fontSize: 11, color: "#7a6e62" },
      heading: { fontSize: 13, bold: true, color: "#2a2118", marginTop: 10 },
    },
    defaultStyle: {
      font: "Roboto",
      fontSize: 11,
      color: "#2a2118",
      lineHeight: 1.5,
    },
  };

  pdfMake.createPdf(docDefinition).download(buildFilename(analysis, documentType, "pdf"));
}

// ─── DOC (HTML blob — Word-compatible) ───────────────────────────

function buildDocumentHtml(
  content: string,
  analysis: { job_title: string | null; company_name: string | null },
  documentType: DocumentType,
): string {
  const title = documentType === "cover_letter" ? "Cover Letter" : "Application Email";
  const jobLabel = [analysis.job_title, analysis.company_name].filter(Boolean).join(" — ");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}${jobLabel ? ` — ${jobLabel}` : ""}</title>
<style>
  body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; font-size: 11pt; line-height: 1.6; color: #2a2118; max-width: 700px; margin: 40px auto; padding: 0 20px; }
  h1 { font-size: 16pt; margin-bottom: 4px; color: #2a2118; }
  .subtitle { font-size: 10pt; color: #7a6e62; margin-bottom: 24px; }
  .content { white-space: pre-wrap; }
</style>
</head>
<body>
  <h1>${title}</h1>
  ${jobLabel ? `<p class="subtitle">${jobLabel}</p>` : ""}
  <div class="content">${escapeHtml(content)}</div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function downloadAsDoc(
  content: string,
  analysis: { job_title: string | null; company_name: string | null },
  documentType: DocumentType,
) {
  const html = buildDocumentHtml(content, analysis, documentType);
  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildFilename(analysis, documentType, "doc");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── Shared filename helper ──────────────────────────────────────

function buildFilename(
  analysis: { job_title: string | null; company_name: string | null },
  documentType: DocumentType,
  ext: string,
): string {
  const prefix = documentType === "cover_letter" ? "Cover Letter" : "Application Email";
  const parts = [prefix];
  if (analysis.company_name) parts.push(analysis.company_name);
  if (analysis.job_title) parts.push(analysis.job_title);
  return `${parts.join(" - ")}.${ext}`;
}
