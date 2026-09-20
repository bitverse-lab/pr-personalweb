import { FiCheckSquare } from "react-icons/fi";
import EmptyState from "@/components/shared/EmptyState";
import DraggableTaskRow from "./DraggableTaskRow";

export interface TaskPreview {
  id: string;
  title: string;
  dueLabel?: string;
}

export default function TasksSection({ tasks = [] }: { tasks?: TaskPreview[] }) {
  return (
    <div className="card rounded shadow-sm h-100">
      <div className="card-body">
        <h6 className="card-title mb-3">Today&apos;s Tasks</h6>
        {tasks.length === 0 ? (
          <EmptyState
            icon={FiCheckSquare}
            title="No tasks yet"
            description="Quick-capture and tracking land in a future phase."
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
      </div>
    </div>
  );
}
