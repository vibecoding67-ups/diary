import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Entry } from "./api";
import { getMood } from "./moods";

/**
 * "simple"  → format biasa, minimalis, tanpa halaman judul terpisah
 * "formal"  → format laporan resmi: halaman judul, daftar isi dengan titik-titik & nomor halaman
 */
export type ExportFormat = "simple" | "formal";

export interface ExportOptions {
  /** Tag yang ingin diekspor. Kosong = semua entry. */
  tags: string[];
  /** Judul dokumen */
  title: string;
  /** Urutkan ascending (lama ke baru) atau descending */
  order: "asc" | "desc";
  /** Sertakan daftar isi */
  includeToc: boolean;
  /** Format dokumen */
  format: ExportFormat;
}

/** Format tanggal ke bahasa Indonesia */
function formatDateId(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEEE, d MMMM yyyy", { locale: idLocale });
  } catch {
    return dateStr;
  }
}

/** Format tanggal pendek */
function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "d MMMM yyyy", { locale: idLocale });
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
function contentToHtml(content: string, fontFamily: string, fontSize: string): string {
  if (!content.trim()) return `<p style="margin:0 0 10pt 0;">&nbsp;</p>`;
  return content
    .split(/\n\n+/)
    .map((para) => {
      const lines = para
        .split(/\n/)
        .map((l) => esc(l))
        .join("<br/>");
      return `<p style="margin:0 0 10pt 0; line-height:1.8; font-family:${fontFamily}; font-size:${fontSize}; text-align:justify;">${lines}</p>`;
    })
    .join("");
}

/** Filter entries berdasarkan tag yang dipilih. Kosong = semua. */
export function filterEntriesByTags(entries: Entry[], tags: string[]): Entry[] {
  if (tags.length === 0) return entries;
  return entries.filter((e) => tags.some((t) => e.tags.includes(t)));
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT BIASA (Simple)
// ─────────────────────────────────────────────────────────────────────────────
function generateSimpleHtml(sorted: Entry[], options: ExportOptions): string {
  const docTitle = esc(options.title || "Jurnal Harian");
  const exportDate = format(new Date(), "d MMMM yyyy", { locale: idLocale });
  const tagLabel =
    options.tags.length > 0
      ? options.tags.map(esc).join(", ")
      : "Semua entri";

  // Daftar isi sederhana (tanpa titik-titik)
  let tocHtml = "";
  if (options.includeToc && sorted.length > 0) {
    const rows = sorted
      .map((e, i) => `
        <tr>
          <td style="padding:3pt 8pt 3pt 0; width:24pt; color:#888; font-size:9pt;">${i + 1}.</td>
          <td style="padding:3pt 0; font-size:10pt; font-family:'Calibri','Arial',sans-serif;">${esc(e.title)}</td>
          <td style="padding:3pt 0 3pt 8pt; text-align:right; color:#888; font-size:9pt; white-space:nowrap; font-family:'Calibri','Arial',sans-serif;">${formatDateShort(e.entryDate)}</td>
        </tr>`)
      .join("");

    tocHtml = `
      <div style="page-break-after:always;">
        <h2 style="font-family:'Georgia',serif; font-size:15pt; margin:0 0 14pt 0; color:#333; border-bottom:1px solid #ddd; padding-bottom:6pt;">
          Daftar Isi
        </h2>
        <table style="width:100%; border-collapse:collapse;">
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  const entriesHtml = sorted
    .map((entry, idx) => {
      const moodObj = getMood(entry.mood);
      const metaItems: string[] = [];
      if (moodObj) metaItems.push(`Mood: ${esc(moodObj.label)}`);
      if (entry.tags.length > 0) metaItems.push(`Tag: ${entry.tags.map(esc).join(", ")}`);

      const isLast = idx === sorted.length - 1;
      return `
        <div style="${!isLast ? "page-break-after:always;" : ""} padding-bottom:20pt;">
          <p style="font-size:9pt; color:#999; margin:0 0 3pt 0; font-family:'Calibri','Arial',sans-serif; text-transform:uppercase; letter-spacing:0.8px;">
            ${esc(formatDateId(entry.entryDate))}
          </p>
          <h2 style="font-family:'Georgia',serif; font-size:17pt; margin:0 0 6pt 0; color:#1a1a1a; font-weight:normal;">
            ${esc(entry.title)}
          </h2>
          ${metaItems.length > 0 ? `<p style="font-size:9pt; color:#888; margin:0 0 12pt 0; font-family:'Calibri','Arial',sans-serif;">${metaItems.join("&nbsp;&nbsp;·&nbsp;&nbsp;")}</p>` : ""}
          <div>${contentToHtml(entry.content, "'Georgia',serif", "11pt")}</div>
        </div>`;
    })
    .join("\n");

  return buildDocument({
    docTitle,
    bodyContent: `
      <!-- Header ringkas -->
      <div style="margin-bottom:24pt; border-bottom:2px solid #222; padding-bottom:10pt;">
        <h1 style="font-family:'Georgia',serif; font-size:22pt; font-weight:normal; margin:0 0 4pt 0; color:#1a1a1a;">${docTitle}</h1>
        <p style="font-size:9pt; color:#888; margin:0; font-family:'Calibri','Arial',sans-serif;">
          ${tagLabel} &nbsp;·&nbsp; ${sorted.length} entri &nbsp;·&nbsp; ${esc(exportDate)}
        </p>
      </div>
      ${tocHtml}
      ${entriesHtml}`,
    margin: "2.5cm",
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT FORMAL (Laporan)
// ─────────────────────────────────────────────────────────────────────────────
function generateFormalHtml(sorted: Entry[], options: ExportOptions): string {
  const docTitle = esc(options.title || "Jurnal Harian");
  const exportDate = format(new Date(), "d MMMM yyyy", { locale: idLocale });
  const tagLabel =
    options.tags.length > 0
      ? options.tags.map(esc).join(", ")
      : "Semua Entri";

  // ── Halaman Judul ──────────────────────────────────────────────────────────
  const coverPage = `
    <div style="page-break-after:always; text-align:center; padding-top:100pt;">
      <p style="font-size:12pt; font-family:'Times New Roman',serif; margin:0 0 40pt 0; letter-spacing:2px; text-transform:uppercase;">
        ─────────────────────────
      </p>
      <h1 style="font-family:'Times New Roman',serif; font-size:24pt; font-weight:bold; color:#000; margin:0 0 12pt 0; text-transform:uppercase; letter-spacing:1px;">
        ${docTitle}
      </h1>
      <p style="font-size:12pt; font-family:'Times New Roman',serif; margin:0 0 40pt 0; letter-spacing:2px;">
        ─────────────────────────
      </p>
      <p style="font-size:11pt; font-family:'Times New Roman',serif; margin:0 0 6pt 0; color:#333;">
        ${esc(tagLabel)}
      </p>
      <p style="font-size:11pt; font-family:'Times New Roman',serif; margin:0 0 6pt 0; color:#333;">
        ${sorted.length} Entri
      </p>
      <p style="font-size:11pt; font-family:'Times New Roman',serif; margin:0; color:#333;">
        ${esc(exportDate)}
      </p>
    </div>`;

  // ── Daftar Isi Formal (titik-titik + nomor halaman simulasi) ───────────────
  let tocPage = "";
  if (options.includeToc && sorted.length > 0) {
    // Simulasi nomor halaman: cover=i, toc=ii, entri mulai dari 1
    const rows = sorted
      .map((e, i) => {
        const pageNum = i + 1;
        const title = esc(e.title);
        const dateStr = esc(formatDateShort(e.entryDate));
        // Titik-titik menggunakan leader dots via CSS
        return `
          <tr>
            <td style="padding:4pt 0; font-family:'Times New Roman',serif; font-size:11pt; width:100%;">
              <table style="width:100%; border-collapse:collapse;">
                <tr>
                  <td style="font-family:'Times New Roman',serif; font-size:11pt; white-space:nowrap; padding-right:4pt;">
                    ${title}
                  </td>
                  <td style="font-family:'Times New Roman',serif; font-size:11pt; color:#555; font-size:10pt; white-space:nowrap; padding-right:4pt; width:1%;">
                    (${dateStr})
                  </td>
                  <td style="font-family:'Times New Roman',serif; font-size:11pt; width:99%;
                    background-image: radial-gradient(circle, #555 1px, transparent 1px);
                    background-size: 6px 100%;
                    background-repeat: repeat-x;
                    background-position: 0 bottom;">
                    &nbsp;
                  </td>
                  <td style="font-family:'Times New Roman',serif; font-size:11pt; text-align:right; white-space:nowrap; padding-left:4pt;">
                    ${pageNum}
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
      })
      .join("");

    tocPage = `
      <div style="page-break-after:always;">
        <h2 style="font-family:'Times New Roman',serif; font-size:14pt; font-weight:bold; text-align:center; margin:0 0 20pt 0; text-transform:uppercase; letter-spacing:1px;">
          DAFTAR ISI
        </h2>
        <table style="width:100%; border-collapse:collapse;">
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  // ── Konten Entri Formal ────────────────────────────────────────────────────
  const entriesHtml = sorted
    .map((entry, idx) => {
      const moodObj = getMood(entry.mood);
      const metaItems: string[] = [];
      if (moodObj) metaItems.push(`Mood: ${esc(moodObj.label)}`);
      if (entry.tags.length > 0) metaItems.push(`Tag: ${entry.tags.map(esc).join(", ")}`);

      const isLast = idx === sorted.length - 1;
      return `
        <div style="${!isLast ? "page-break-after:always;" : ""} padding-bottom:20pt;">
          <!-- Nomor entri & tanggal -->
          <p style="font-size:10pt; font-family:'Times New Roman',serif; color:#555; margin:0 0 2pt 0; text-align:center;">
            Entri ${idx + 1}
          </p>
          <h2 style="font-family:'Times New Roman',serif; font-size:14pt; font-weight:bold; margin:0 0 4pt 0; color:#000; text-align:center; text-transform:uppercase; letter-spacing:0.5px;">
            ${esc(entry.title)}
          </h2>
          <p style="font-size:10pt; font-family:'Times New Roman',serif; color:#555; margin:0 0 16pt 0; text-align:center;">
            ${esc(formatDateId(entry.entryDate))}
          </p>
          <div style="border-top:1px solid #999; margin-bottom:14pt;"></div>
          ${metaItems.length > 0 ? `
          <p style="font-size:10pt; color:#555; margin:0 0 14pt 0; font-family:'Times New Roman',serif; font-style:italic;">
            ${metaItems.join("&nbsp;&nbsp;|&nbsp;&nbsp;")}
          </p>` : ""}
          <div>${contentToHtml(entry.content, "'Times New Roman',serif", "12pt")}</div>
        </div>`;
    })
    .join("\n");

  return buildDocument({
    docTitle,
    bodyContent: `${coverPage}${tocPage}${entriesHtml}`,
    margin: "3cm 3cm 3cm 4cm", // margin laporan: kiri lebih lebar
    extraStyle: `
      body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 2; }
    `,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder HTML dokumen
// ─────────────────────────────────────────────────────────────────────────────
function buildDocument({
  docTitle,
  bodyContent,
  margin,
  extraStyle = "",
}: {
  docTitle: string;
  bodyContent: string;
  margin: string;
  extraStyle?: string;
}): string {
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
    @page { size: A4; margin: ${margin}; }
    body { color: #111; line-height: 1.6; }
    h1, h2, h3 { page-break-after: avoid; }
    p { margin: 0 0 8pt 0; }
    table { border-collapse: collapse; }
    ${extraStyle}
  </style>
  <title>${docTitle}</title>
</head>
<body>
  ${bodyContent}
</body>
</html>`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/** Generate HTML Word document sesuai format yang dipilih */
export function generateWordHtml(entries: Entry[], options: ExportOptions): string {
  const filtered = filterEntriesByTags(entries, options.tags);
  const sorted = [...filtered].sort((a, b) => {
    const cmp = a.entryDate.localeCompare(b.entryDate);
    return options.order === "asc" ? cmp : -cmp;
  });

  if (options.format === "formal") {
    return generateFormalHtml(sorted, options);
  }
  return generateSimpleHtml(sorted, options);
}

/** Trigger download file .doc ke browser */
export function downloadAsWord(entries: Entry[], options: ExportOptions): void {
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
