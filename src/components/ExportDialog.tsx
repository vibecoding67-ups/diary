import { useState, useMemo } from "react";
import { FileDown, Loader2, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useListEntries, getListEntriesQueryKey } from "@/lib/api";
import { downloadAsWord, filterEntriesByTags } from "@/lib/exportWord";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Semua tag yang tersedia dari entries yang sedang ditampilkan */
  availableTags: string[];
  /** Tag yang sedang aktif di filter (pre-select) */
  activeTag?: string;
}

export function ExportDialog({
  open,
  onOpenChange,
  availableTags,
  activeTag,
}: ExportDialogProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>(
    activeTag && activeTag !== "all" ? [activeTag] : []
  );
  const [docTitle, setDocTitle] = useState("Jurnal Harian");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [includeToc, setIncludeToc] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);

  // Ambil semua entries (tanpa filter) untuk ekspor
  const { data: allEntries, isLoading } = useListEntries(undefined, {
    query: { queryKey: getListEntriesQueryKey() },
  });

  // Hitung preview jumlah entri yang akan diekspor
  const previewCount = useMemo(() => {
    if (!allEntries) return 0;
    return filterEntriesByTags(allEntries, selectedTags).length;
  }, [allEntries, selectedTags]);

  // Kumpulkan semua tag dari semua entries (bukan hanya yang difilter)
  const allTags = useMemo(() => {
    const s = new Set<string>();
    (allEntries ?? []).forEach((e) => e.tags.forEach((t) => s.add(t)));
    // Gabungkan dengan availableTags
    availableTags.forEach((t) => s.add(t));
    return Array.from(s).sort();
  }, [allEntries, availableTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setDone(false);
  };

  const handleExport = async () => {
    if (!allEntries || exporting) return;
    setExporting(true);
    setDone(false);
    try {
      // Sedikit delay agar UI update dulu
      await new Promise((r) => setTimeout(r, 100));
      downloadAsWord(allEntries, {
        tags: selectedTags,
        title: docTitle.trim() || "Jurnal Harian",
        order,
        includeToc,
      });
      setDone(true);
    } finally {
      setExporting(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) {
      // Reset state saat dialog ditutup
      setDone(false);
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Ekspor ke Word
          </DialogTitle>
          <DialogDescription>
            Pilih tag yang ingin diekspor. Entri akan diurutkan berdasarkan
            tanggal dan disertai daftar isi.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Judul Dokumen */}
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Judul dokumen</Label>
            <Input
              id="doc-title"
              value={docTitle}
              onChange={(e) => {
                setDocTitle(e.target.value);
                setDone(false);
              }}
              placeholder="Jurnal Harian"
            />
          </div>

          {/* Pilih Tag */}
          <div className="space-y-2">
            <Label>Filter berdasarkan tag</Label>
            {allTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Belum ada tag di jurnal kamu.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1">
                {allTags.map((tag) => {
                  const checked = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`inline-flex items-center gap-1.5 text-xs rounded-full border px-3 py-1 transition-colors cursor-pointer
                        ${
                          checked
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                        }`}
                    >
                      {checked && <Check className="h-3 w-3" />}
                      {tag}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedTags.length === 0
                ? "Tidak ada tag dipilih — semua entri akan diekspor."
                : `${selectedTags.length} tag dipilih.`}
            </p>
          </div>

          {/* Urutan */}
          <div className="space-y-1.5">
            <Label>Urutan entri</Label>
            <Select
              value={order}
              onValueChange={(v) => {
                setOrder(v as "asc" | "desc");
                setDone(false);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Terlama ke terbaru ↑</SelectItem>
                <SelectItem value="desc">Terbaru ke terlama ↓</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Daftar Isi */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="include-toc"
              checked={includeToc}
              onCheckedChange={(v) => {
                setIncludeToc(Boolean(v));
                setDone(false);
              }}
            />
            <Label htmlFor="include-toc" className="cursor-pointer font-normal">
              Sertakan daftar isi
            </Label>
          </div>

          {/* Preview */}
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm">
            {isLoading ? (
              <span className="text-muted-foreground">Memuat entri…</span>
            ) : (
              <span>
                <span className="font-medium">{previewCount}</span>{" "}
                <span className="text-muted-foreground">
                  entri akan diekspor
                  {selectedTags.length > 0
                    ? ` dengan tag: ${selectedTags.join(", ")}`
                    : " (semua tag)"}
                </span>
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={exporting}
          >
            Batal
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || isLoading || previewCount === 0}
            className="min-w-[140px]"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Mengekspor…
              </>
            ) : done ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Berhasil!
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                Unduh .doc
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
