import { FiCheckSquare } from "react-icons/fi";
import EmptyState from "@/components/shared/EmptyState";
import DraggableTaskRow from "./DraggableTaskRow";
import OverviewCard from "./OverviewCard";

export interface TaskPreview {
  id: string;
  title: string;
  dueLabel?: string;
  dueTone?: "overdue" | "today" | "soon" | "later";
}

export default function TasksSection({ tasks = [] }: { tasks?: TaskPreview[] }) {
  return (
    <OverviewCard title={"Today's Tasks"} icon={FiCheckSquare}>
      {tasks.length === 0 ? (
        <EmptyState
          icon={FiCheckSquare}
          title="No tasks yet"
          description="Add a task with Quick capture or open your task list to plan ahead."
          actionLabel="Open Tasks"
          actionHref="/me/tasks"
        />
      ) : (
        <ul className="list-unstyled mb-0">
          {tasks.map((task) => (
            <DraggableTaskRow key={task.id} task={task} />
          ))}
        </ul>
      )}
    </OverviewCard>
  );
}
