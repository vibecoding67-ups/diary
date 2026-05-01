import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Pencil, Trash2, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetEntry,
  useUpdateEntry,
  useDeleteEntry,
  getGetEntryQueryKey,
  getListEntriesQueryKey,
  getGetSummaryStatsQueryKey,
  getGetMoodStatsQueryKey,
  getGetTopTagsQueryKey,
  getGetCalendarHeatmapQueryKey,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoodChip } from "@/components/MoodChip";
import { EntryEditor, type EntryDraft } from "@/components/EntryEditor";

export function EntryDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const id = params.id ?? "";
  const validId = id.length > 0;
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: entry, isLoading, isError } = useGetEntry(id, {
    query: {
      enabled: validId,
      queryKey: getGetEntryQueryKey(id),
    },
  });

  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: getListEntriesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetSummaryStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMoodStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetTopTagsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetCalendarHeatmapQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetEntryQueryKey(id) });
  };

  const updateEntry = useUpdateEntry({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        setEditing(false);
      },
    },
  });

  const deleteEntry = useDeleteEntry({
    mutation: {
      onSuccess: () => {
        invalidateAll();
        setLocation("/journal");
      },
    },
  });

  const handleUpdate = async (draft: EntryDraft) => {
    await updateEntry.mutateAsync({ id, data: draft });
  };

  const handleDelete = async () => {
    await deleteEntry.mutateAsync({ id });
  };

  if (!validId || isError) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="font-serif text-2xl">This page seems to be missing.</p>
        <Link href="/journal">
          <Button variant="link" className="mt-2">
            Back to journal
          </Button>
        </Link>
      </div>
    );
  }

  if (isLoading || !entry) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <div className="paper-card rounded-2xl p-12 h-[400px] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <Link href="/journal">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Journal
          </Button>
        </Link>
        {!editing ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        ) : null}
      </div>

      <article className="paper-card rounded-2xl p-8 sm:p-12 relative overflow-hidden">
        <div
          aria-hidden
          className="absolute left-0 top-0 bottom-0 w-1.5 ribbon"
        />
        {!editing ? (
          <>
            <p className="font-handwritten text-2xl text-primary">
              {format(parseISO(entry.entryDate), "EEEE, MMMM d, yyyy")}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl mt-2 leading-tight">
              {entry.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <MoodChip mood={entry.mood ?? null} size="md" />
              {entry.tags.map((t) => (
                <span
                  key={t}
                  className="text-xs rounded-full border border-border px-2.5 py-1 text-muted-foreground bg-background"
                >
                  {t}
                </span>
              ))}
            </div>
            <div className="prose-diary mt-8 whitespace-pre-wrap">
              {entry.content || (
                <p className="text-muted-foreground italic">
                  This page was left blank.
                </p>
              )}
            </div>
            <p className="mt-12 pt-6 border-t border-border text-xs text-muted-foreground">
              Last edited {format(parseISO(entry.updatedAt), "MMM d, yyyy 'at' h:mm a")}
            </p>
          </>
        ) : (
          <EntryEditor
            initial={{
              entryDate: entry.entryDate,
              title: entry.title,
              content: entry.content,
              mood: entry.mood ?? null,
              tags: entry.tags,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
            submitting={updateEntry.isPending}
            submitLabel="Save changes"
          />
        )}
      </article>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              Tear out this page?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the entry. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:opacity-90"
            >
              {deleteEntry.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Delete entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
