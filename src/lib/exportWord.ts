import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Entry } from "./api";
import { getMood } from "./moods";

export interface ExportOptions {
  /** Tag yang ingin diekspor. Kosong = semua entry. */
  tags: string[];
  /** Judul dokumen */
  title: string;
  /** Urutkan ascending (lama ke baru) atau descending */
  order: "asc" | "desc";
  /** Sertakan daftar isi */
  includeToc: boolean;
}

/** Format tanggal ke bahasa Indonesia */
function formatDateId(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEEE, d MMMM yyyy", { locale: idLocale });
  } catch {
    return dateStr;
  }
}

/** Escape karakter HTML */
function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Konversi newline ke paragraf HTML */
function contentToHtml(content: string): string {
  if (!content.trim()) return "<p>&nbsp;</p>";
  return content
    .split(/\n\n+/)
    .map((para) => {
      const lines = para
        .split(/\n/)
        .map((l) => esc(l))
        .join("<br/>");
      return `<p style="margin:0 0 10pt 0; line-height:1.6;">${lines}</p>`;
    })
    .join("");
}

/**
 * Filter entries berdasarkan tag yang dipilih.
 * Jika tags kosong, kembalikan semua entry.
 */
export function filterEntriesByTags(entries: Entry[], tags: string[]): Entry[] {
  if (tags.length === 0) return entries;
  return entries.filter((e) => tags.some((t) => e.tags.includes(t)));
}

/**
 * Generate HTML yang kompatibel dengan Microsoft Word (.doc)
 * menggunakan Word XML namespace agar formatting terjaga.
 */
export function generateWordHtml(entries: Entry[], options: ExportOptions): string {
  const filtered = filterEntriesByTags(entries, options.tags);

  // Urutkan berdasarkan tanggal
  const sorted = [...filtered].sort((a, b) => {
    const cmp = a.entryDate.localeCompare(b.entryDate);
    return options.order === "asc" ? cmp : -cmp;
  });

  const docTitle = esc(options.title || "Jurnal Harian");
  const exportDate = format(new Date(), "d MMMM yyyy", { locale: idLocale });
  const tagLabel =
    options.tags.length > 0
      ? options.tags.map(esc).join(", ")
      : "Semua entri";

  // ── Daftar Isi ──────────────────────────────────────────────────────────────
  let tocHtml = "";
  if (options.includeToc && sorted.length > 0) {
    const tocRows = sorted
      .map((e, i) => {
        const dateLabel = formatDateId(e.entryDate);
        const titleLabel = esc(e.title);
        return `
          <tr>
            <td style="padding:3pt 8pt 3pt 0; width:30pt; color:#888; font-size:9pt;">${i + 1}.</td>
            <td style="padding:3pt 0; font-size:10pt;">${titleLabel}</td>
            <td style="padding:3pt 0 3pt 8pt; text-align:right; color:#888; font-size:9pt; white-space:nowrap;">${dateLabel}</td>
          </tr>`;
      })
      .join("");

    tocHtml = `
      <div style="page-break-after:always;">
        <h2 style="font-family:'Georgia',serif; font-size:16pt; margin:0 0 16pt 0; color:#333; border-bottom:1px solid #ddd; padding-bottom:8pt;">
          Daftar Isi
        </h2>
        <table style="width:100%; border-collapse:collapse; font-family:'Calibri','Arial',sans-serif;">
          <tbody>${tocRows}</tbody>
        </table>
      </div>`;
  }

  // ── Konten Entri ────────────────────────────────────────────────────────────
  const entriesHtml = sorted
    .map((entry, idx) => {
      const dateLabel = formatDateId(entry.entryDate);
      const moodObj = getMood(entry.mood);
      const moodLabel = moodObj ? esc(moodObj.label) : "";
      const tagsLabel = entry.tags.length > 0
        ? entry.tags.map(esc).join(" · ")
        : "";

      const metaItems: string[] = [];
      if (moodLabel) metaItems.push(`Mood: ${moodLabel}`);
      if (tagsLabel) metaItems.push(`Tag: ${tagsLabel}`);
      const metaHtml = metaItems.length > 0
        ? `<p style="font-size:9pt; color:#888; margin:0 0 12pt 0; font-family:'Calibri','Arial',sans-serif;">${metaItems.join("&nbsp;&nbsp;|&nbsp;&nbsp;")}</p>`
        : "";

      const isLast = idx === sorted.length - 1;
      const pageBreak = !isLast ? 'page-break-after:always;' : '';

      return `
        <div style="${pageBreak} padding-bottom:20pt;">
          <p style="font-size:10pt; color:#888; margin:0 0 4pt 0; font-family:'Calibri','Arial',sans-serif; text-transform:uppercase; letter-spacing:1px;">
            ${esc(dateLabel)}
          </p>
          <h2 style="font-family:'Georgia',serif; font-size:18pt; margin:0 0 8pt 0; color:#1a1a1a; font-weight:normal;">
            ${esc(entry.title)}
          </h2>
          ${metaHtml}
          <div style="font-family:'Georgia',serif; font-size:11pt; color:#222; line-height:1.7;">
            ${contentToHtml(entry.content)}
          </div>
        </div>`;
    })
    .join("\n");

  // ── Dokumen Lengkap ──────────────────────────────────────────────────────────
  return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="UTF-8"/>
  <meta name="ProgId" content="Word.Document"/>
  <meta name="Generator" content="Microsoft Word 15"/>
  <meta name="Originator" content="Microsoft Word 15"/>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4;
      margin: 2.5cm 2.5cm 2.5cm 2.5cm;
    }
    body {
      font-family: 'Calibri', 'Arial', sans-serif;
      font-size: 11pt;
      color: #222;
      line-height: 1.6;
    }
    h1, h2, h3 {
      font-family: 'Georgia', serif;
    }
    p { margin: 0 0 8pt 0; }
    table { border-collapse: collapse; }
  </style>
  <title>${docTitle}</title>
</head>
<body>

  <!-- Halaman Judul -->
  <div style="page-break-after:always; text-align:center; padding-top:120pt;">
    <h1 style="font-family:'Georgia',serif; font-size:28pt; font-weight:normal; color:#1a1a1a; margin:0 0 16pt 0;">
      ${docTitle}
    </h1>
    <p style="font-size:12pt; color:#666; margin:0 0 8pt 0; font-family:'Calibri','Arial',sans-serif;">
      ${tagLabel}
    </p>
    <p style="font-size:10pt; color:#999; margin:0; font-family:'Calibri','Arial',sans-serif;">
      Diekspor pada ${esc(exportDate)} &nbsp;·&nbsp; ${sorted.length} entri
    </p>
    <div style="margin:40pt auto; width:60pt; border-top:1px solid #ccc;"></div>
  </div>

  ${tocHtml}

  ${entriesHtml}

</body>
</html>`.trim();
}

/**
 * Trigger download file .doc ke browser
 */
export function downloadAsWord(
  entries: Entry[],
  options: ExportOptions
): void {
  const html = generateWordHtml(entries, options);
  const blob = new Blob(["\ufeff", html], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeTitle = (options.title || "jurnal")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  a.href = url;
  a.download = `${safeTitle}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
