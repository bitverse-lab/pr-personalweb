"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { FiPlay } from "react-icons/fi";
import { startWorkout } from "@/features/health/workout-actions";
import { useToast } from "@/components/shared/ToastProvider";

export default function StartWorkoutButton({
  routineId,
  label = "Start workout",
  className = "btn btn-primary d-inline-flex align-items-center gap-1",
}: {
  routineId?: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const start = () =>
    startTransition(async () => {
      const result = await startWorkout({ routineId });
      if (!result.ok) return toast.error(result.error);
      if (result.data.resumed) toast.success("You already have a workout in progress — resuming it");
      router.push(`/me/health/workouts/${result.data.id}`);
    });

  return (
    <button type="button" className={className} disabled={isPending} onClick={start}>
      <FiPlay /> {label}
    </button>
  );
}
