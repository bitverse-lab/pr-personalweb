"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { FiChevronLeft, FiChevronRight, FiPlus, FiCalendar } from "react-icons/fi";
import EmptyState from "@/components/shared/EmptyState";
import EventFormDialog, { type EventFormValues } from "./EventFormDialog";
import { getCalendarEvents, createEvent } from "@/features/calendar/actions";
import { toCalendarEventInput } from "@/features/calendar/mappers";
import { useToast } from "@/components/shared/ToastProvider";
import type { CalendarApi, CalendarEventInput, CalendarViewMode } from "./CalendarView";

const CalendarView = dynamic(() => import("./CalendarView"), {
  ssr: false,
  loading: () => (
    <div className="d-flex justify-content-center py-5">
      <div className="spinner-border text-primary" role="status" />
    </div>
  ),
});

const VIEW_OPTIONS: { value: CalendarViewMode; label: string }[] = [
  { value: "dayGridMonth", label: "Month" },
  { value: "timeGridWeek", label: "Week" },
  { value: "timeGridDay", label: "Day" },
  { value: "listWeek", label: "List" },
];

interface CalendarShellProps {
  initialEvents: CalendarEventInput[];
  initialRange: { start: string; end: string };
}

export default function CalendarShell({ initialEvents, initialRange }: CalendarShellProps) {
  const [calendarApi, setCalendarApi] = useState<CalendarApi | null>(null);
  const [events, setEvents] = useState<CalendarEventInput[]>(initialEvents);
  const [view, setView] = useState<CalendarViewMode>("dayGridMonth");
  const [dialogValues, setDialogValues] = useState<EventFormValues | null>(null);
  const [isPending, startTransition] = useTransition();
  const currentRange = useRef(initialRange);
  const toast = useToast();

  const handleCalendarApi = useCallback((api: CalendarApi | null) => {
    setCalendarApi(api);
  }, []);

  useEffect(() => {
    if (window.matchMedia("(max-width: 576px)").matches) {
      setView("listDay");
      calendarApi?.changeView("listDay");
    }
  }, [calendarApi]);

  const refetch = (range: { start: string; end: string }) => {
    currentRange.current = range;
    startTransition(async () => {
      const rows = await getCalendarEvents(range);
      setEvents(rows.map(toCalendarEventInput));
    });
  };

  const handleDeleted = (values: EventFormValues) => {
    toast.success("Event deleted", {
      action: {
        label: "Undo",
        onClick: () => {
          startTransition(async () => {
            const payload = {
              title: values.title,
              description: values.description,
              location: values.location,
              start: values.start,
              end: values.end,
              allDay: values.allDay,
              color: values.color,
            };
            const result = await createEvent(payload);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            toast.success("Event restored");
            refetch(currentRange.current);
          });
        },
      },
    });
  };

  const changeView = (nextView: CalendarViewMode) => {
    setView(nextView);
    calendarApi?.changeView(nextView);
  };

  const handleMove = (
    move: { id: string; start: string; end: string; allDay: boolean },
    revert: () => void
  ) => {
    startTransition(async () => {
      const { moveEvent } = await import("@/features/calendar/actions");
      const result = await moveEvent(move);
      if (!result.ok) {
        revert();
        toast.error(result.error);
        return;
      }
      toast.success("Event moved");
      refetch(currentRange.current);
    });
  };

  return (
    <div className="card rounded shadow-sm">
      <div className="card-body">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
          <div className="btn-group">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                calendarApi?.prev();
              }}
              aria-label="Previous"
            >
              <FiChevronLeft />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                calendarApi?.today();
              }}
            >
              Today
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                calendarApi?.next();
              }}
              aria-label="Next"
            >
              <FiChevronRight />
            </button>
          </div>

          <div className="btn-group">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`btn btn-sm ${view === option.value ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => changeView(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
            onClick={() => {
              const now = new Date();
              const end = new Date(now.getTime() + 60 * 60 * 1000);
              setDialogValues({
                title: "",
                start: now.toISOString(),
                end: end.toISOString(),
                allDay: false,
              });
            }}
          >
            <FiPlus /> New event
          </button>
        </div>

        {events.length === 0 && !isPending && (
          <EmptyState
            icon={FiCalendar}
            title="No events in this range"
            description='Click "New event" above or select a day below to add one.'
            className="mb-3"
          />
        )}

        <CalendarView
          onCalendarApi={handleCalendarApi}
          events={events}
          initialView={view}
          onRangeChange={refetch}
          onDateSelect={(selection) =>
            setDialogValues({
              title: "",
              start: selection.start,
              end: selection.end,
              allDay: selection.allDay,
            })
          }
          onEventClick={(eventId) => {
            const found = events.find((e) => e.id === eventId);
            if (found) {
              setDialogValues({
                id: found.id,
                title: found.title,
                start: found.start,
                end: found.end,
                allDay: found.allDay,
                color: found.color,
              });
            }
          }}
          onEventMove={handleMove}
        />
      </div>

      {dialogValues && (
        <EventFormDialog
          initialValues={dialogValues}
          onClose={() => setDialogValues(null)}
          onSaved={() => refetch(currentRange.current)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
