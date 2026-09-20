import MePageHeader from "@/components/me/MePageHeader";
import CalendarShell from "@/components/me/calendar/CalendarShell";
import { getCalendarEvents } from "@/features/calendar/actions";
import { toCalendarEventInput } from "@/features/calendar/mappers";

export default async function CalendarPage() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const range = { start: start.toISOString(), end: end.toISOString() };
  const events = await getCalendarEvents(range);

  return (
    <div className="container-fluid py-4 px-4">
      <MePageHeader title="Calendar" description="Plan your days and weeks." />
      <CalendarShell
        initialRange={range}
        initialEvents={events.map(toCalendarEventInput)}
      />
    </div>
  );
}
