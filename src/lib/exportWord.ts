import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  TableOfContents,
  StyleLevel,
  PageNumber,
  NumberFormat,
  Footer,
  Header,
  Tab,
  TabStopType,
  TabStopLeader,
  SectionType,
  convertInchesToTwip,
  BorderStyle,
  UnderlineType,
  LineRuleType,
  LevelFormat,
} from "docx";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { Entry } from "./api";
import { getMood } from "./moods";

export type ExportFormat = "simple" | "formal";

export interface ExportOptions {
  tags: string[];
  title: string;
  order: "asc" | "desc";
  includeToc: boolean;
  format: ExportFormat;
}

function formatDateId(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEEE, d MMMM yyyy", { locale: idLocale });
  } catch {
    return dateStr;
  }
}

function formatDateShort(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "d MMMM yyyy", { locale: idLocale });
  } catch {
    return dateStr;
  }
}

export function filterEntriesByTags(entries: Entry[], tags: string[]): Entry[] {
  if (tags.length === 0) return entries;
  return entries.filter((e) => tags.some((t) => e.tags.includes(t)));
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT BIASA (Simple)
// ─────────────────────────────────────────────────────────────────────────────
function buildSimpleDoc(sorted: Entry[], options: ExportOptions): Document {
  const title = options.title || "Jurnal Harian";
  const exportDate = format(new Date(), "d MMMM yyyy", { locale: idLocale });
  const tagLabel =
    options.tags.length > 0 ? options.tags.join(", ") : "Semua entri";

  const children: Paragraph[] = [];

  // ── Header dokumen (bukan halaman judul terpisah) ──
  children.push(
    new Paragraph({
      text: title,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: tagLabel, color: "888888", size: 20 }),
        new TextRun({ text: "   ·   ", color: "CCCCCC", size: 20 }),
        new TextRun({ text: `${sorted.length} entri`, color: "888888", size: 20 }),
        new TextRun({ text: "   ·   ", color: "CCCCCC", size: 20 }),
        new TextRun({ text: exportDate, color: "888888", size: 20 }),
      ],
      spacing: { after: 400 },
    })
  );

  // ── Daftar Isi ──
  if (options.includeToc) {
    children.push(
      new TableOfContents("Daftar Isi", {
        hyperlink: true,
        headingStyleRange: "1-2",
        stylesWithLevels: [
          new StyleLevel("Heading1", 1),
          new StyleLevel("Heading2", 2),
        ],
      }),
      new Paragraph({ children: [new PageBreak()] })
    );
  }

  // ── Entri ──
  sorted.forEach((entry, idx) => {
    const moodObj = getMood(entry.mood);
    const isLast = idx === sorted.length - 1;

    // Tanggal
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: formatDateId(entry.entryDate).toUpperCase(),
            color: "999999",
            size: 18,
            font: "Calibri",
          }),
        ],
        spacing: { before: 0, after: 80 },
      })
    );

    // Judul entri (Heading 1 agar masuk TOC)
    children.push(
      new Paragraph({
        text: entry.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 0, after: 120 },
      })
    );

    // Meta (mood + tag)
    const metaParts: string[] = [];
    if (moodObj) metaParts.push(`Mood: ${moodObj.label}`);
    if (entry.tags.length > 0) metaParts.push(`Tag: ${entry.tags.join(", ")}`);
    if (metaParts.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: metaParts.join("   |   "),
              color: "888888",
              size: 18,
              italics: true,
              font: "Calibri",
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Konten
    const paragraphs = entry.content.split(/\n\n+/).filter(Boolean);
    if (paragraphs.length === 0) {
      children.push(new Paragraph({ text: "", spacing: { after: 160 } }));
    } else {
      paragraphs.forEach((para) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: para.replace(/\n/g, " "),
                size: 22,
                font: "Georgia",
              }),
            ],
            spacing: { after: 160, line: 360, lineRule: LineRuleType.AUTO },
          })
        );
      });
    }

    // Page break antar entri
    if (!isLast) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  return new Document({
    title,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
      paragraphStyles: [
        {
          id: "Title",
          name: "Title",
          basedOn: "Normal",
          run: {
            font: "Georgia",
            size: 52,
            bold: false,
            color: "1A1A1A",
          },
          paragraph: { spacing: { after: 200 } },
        },
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          run: {
            font: "Georgia",
            size: 36,
            bold: false,
            color: "1A1A1A",
          },
          paragraph: { spacing: { before: 0, after: 120 } },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          run: {
            font: "Georgia",
            size: 28,
            bold: false,
            color: "333333",
          },
          paragraph: { spacing: { before: 0, after: 80 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    color: "888888",
                    font: "Calibri",
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMAT FORMAL (Laporan — mirip gambar referensi)
// ─────────────────────────────────────────────────────────────────────────────
function buildFormalDoc(sorted: Entry[], options: ExportOptions): Document {
  const title = options.title || "Jurnal Harian";
  const exportDate = format(new Date(), "d MMMM yyyy", { locale: idLocale });
  const tagLabel =
    options.tags.length > 0 ? options.tags.join(", ") : "Semua Entri";

  // ── Halaman Judul ──────────────────────────────────────────────────────────
  const coverChildren: Paragraph[] = [
    // Spasi atas
    ...Array(8).fill(null).map(() => new Paragraph({ text: "" })),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "─────────────────────────",
          size: 24,
          font: "Times New Roman",
          color: "555555",
        }),
      ],
      spacing: { after: 400 },
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 48,
          font: "Times New Roman",
          color: "000000",
        }),
      ],
      spacing: { after: 400 },
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: "─────────────────────────",
          size: 24,
          font: "Times New Roman",
          color: "555555",
        }),
      ],
      spacing: { after: 600 },
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: tagLabel,
          size: 24,
          font: "Times New Roman",
          color: "333333",
        }),
      ],
      spacing: { after: 160 },
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${sorted.length} Entri`,
          size: 24,
          font: "Times New Roman",
          color: "333333",
        }),
      ],
      spacing: { after: 160 },
    }),

    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: exportDate,
          size: 24,
          font: "Times New Roman",
          color: "333333",
        }),
      ],
      spacing: { after: 0 },
    }),
  ];

  // ── Daftar Isi (TOC field Word native) ────────────────────────────────────
  const tocChildren: Paragraph[] = [];
  if (options.includeToc) {
    tocChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: "DAFTAR ISI",
            bold: true,
            size: 28,
            font: "Times New Roman",
            color: "000000",
          }),
        ],
        spacing: { before: 0, after: 480 },
      }),
      // TOC field — Word akan auto-generate dengan titik-titik dan nomor halaman
      new TableOfContents("", {
        hyperlink: true,
        headingStyleRange: "1-2",
        stylesWithLevels: [
          new StyleLevel("Heading1", 1),
          new StyleLevel("Heading2", 2),
        ],
      })
    );
  }

  // ── Konten Entri ──────────────────────────────────────────────────────────
  const entryChildren: Paragraph[] = [];

  sorted.forEach((entry, idx) => {
    const moodObj = getMood(entry.mood);
    const isLast = idx === sorted.length - 1;

    // Nomor entri
    entryChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: `Entri ${idx + 1}`,
            size: 20,
            font: "Times New Roman",
            color: "666666",
          }),
        ],
        spacing: { before: 0, after: 80 },
      })
    );

    // Judul entri (Heading 1 → masuk TOC)
    entryChildren.push(
      new Paragraph({
        text: entry.title.toUpperCase(),
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
      })
    );

    // Tanggal
    entryChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: formatDateId(entry.entryDate),
            size: 20,
            font: "Times New Roman",
            color: "555555",
          }),
        ],
        spacing: { after: 320 },
      })
    );

    // Garis pemisah (simulasi dengan border bawah)
    entryChildren.push(
      new Paragraph({
        text: "",
        border: {
          bottom: {
            color: "999999",
            space: 1,
            style: BorderStyle.SINGLE,
            size: 6,
          },
        },
        spacing: { after: 280 },
      })
    );

    // Meta
    const metaParts: string[] = [];
    if (moodObj) metaParts.push(`Mood: ${moodObj.label}`);
    if (entry.tags.length > 0) metaParts.push(`Tag: ${entry.tags.join(", ")}`);
    if (metaParts.length > 0) {
      entryChildren.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [
            new TextRun({
              text: metaParts.join("   |   "),
              size: 20,
              font: "Times New Roman",
              italics: true,
              color: "666666",
            }),
          ],
          spacing: { after: 280 },
        })
      );
    }

    // Konten
    const paragraphs = entry.content.split(/\n\n+/).filter(Boolean);
    if (paragraphs.length === 0) {
      entryChildren.push(new Paragraph({ text: "", spacing: { after: 240 } }));
    } else {
      paragraphs.forEach((para) => {
        entryChildren.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: para.replace(/\n/g, " "),
                size: 24,
                font: "Times New Roman",
              }),
            ],
            spacing: {
              after: 240,
              line: 480, // spasi 2x (240 twips per line = single, 480 = double)
              lineRule: LineRuleType.AUTO,
            },
            indent: { firstLine: convertInchesToTwip(0.5) },
          })
        );
      });
    }

    if (!isLast) {
      entryChildren.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });

  // ── Styles formal ─────────────────────────────────────────────────────────
  const formalStyles = {
    default: {
      document: {
        run: { font: "Times New Roman", size: 24 },
      },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        run: {
          font: "Times New Roman",
          size: 28,
          bold: true,
          color: "000000",
        },
        paragraph: {
          spacing: { before: 0, after: 80 },
          alignment: AlignmentType.CENTER,
        },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        run: {
          font: "Times New Roman",
          size: 24,
          bold: true,
          color: "000000",
        },
        paragraph: {
          spacing: { before: 0, after: 80 },
        },
      },
      {
        id: "TOC1",
        name: "TOC 1",
        basedOn: "Normal",
        run: { font: "Times New Roman", size: 24 },
        paragraph: { spacing: { after: 120 } },
      },
      {
        id: "TOC2",
        name: "TOC 2",
        basedOn: "Normal",
        run: { font: "Times New Roman", size: 22 },
        paragraph: {
          spacing: { after: 80 },
          indent: { left: convertInchesToTwip(0.3) },
        },
      },
    ],
  };

  // Margin laporan: kiri 4cm, lainnya 3cm
  const pageMargin = {
    top: convertInchesToTwip(1.18),    // ~3cm
    right: convertInchesToTwip(1.18),  // ~3cm
    bottom: convertInchesToTwip(1.18), // ~3cm
    left: convertInchesToTwip(1.57),   // ~4cm
  };

  const footerParagraph = new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        children: [PageNumber.CURRENT],
        size: 20,
        font: "Times New Roman",
      }),
    ],
  });

  return new Document({
    title,
    styles: formalStyles as any,
    sections: [
      // Section 1: Halaman Judul (tanpa nomor halaman)
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            margin: pageMargin,
            pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN },
          },
        },
        footers: { default: new Footer({ children: [new Paragraph({ text: "" })] }) },
        children: coverChildren,
      },
      // Section 2: Daftar Isi (nomor romawi)
      ...(options.includeToc
        ? [
            {
              properties: {
                type: SectionType.NEXT_PAGE,
                page: {
                  margin: pageMargin,
                  pageNumbers: {
                    start: 2,
                    formatType: NumberFormat.LOWER_ROMAN,
                  },
                },
              },
              footers: {
                default: new Footer({ children: [footerParagraph] }),
              },
              children: tocChildren,
            },
          ]
        : []),
      // Section 3: Konten (nomor arab mulai dari 1)
      {
        properties: {
          type: SectionType.NEXT_PAGE,
          page: {
            margin: pageMargin,
            pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
          },
        },
        footers: {
          default: new Footer({ children: [footerParagraph] }),
        },
        children: entryChildren,
      },
    ],
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export async function downloadAsWord(
  entries: Entry[],
  options: ExportOptions
): Promise<void> {
  const filtered = filterEntriesByTags(entries, options.tags);
  const sorted = [...filtered].sort((a, b) => {
    const cmp = a.entryDate.localeCompare(b.entryDate);
    return options.order === "asc" ? cmp : -cmp;
  });

  const doc =
    options.format === "formal"
      ? buildFormalDoc(sorted, options)
      : buildSimpleDoc(sorted, options);

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safeTitle = (options.title || "jurnal")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");
  a.href = url;
  a.download = `${safeTitle}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
