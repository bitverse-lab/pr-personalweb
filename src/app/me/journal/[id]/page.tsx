import { notFound } from "next/navigation";
import JournalEditor from "@/components/me/content/JournalEditor";
import { getJournalEntry } from "@/features/content/journal-actions";

export default async function JournalEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getJournalEntry(id);
  if (!data) notFound();
  return (
    <div className="container-fluid py-4 px-4">
      <JournalEditor key={data.entry.id} entry={data.entry} prev={data.prev} next={data.next} tagSuggestions={data.tagNames} />
    </div>
  );
}
