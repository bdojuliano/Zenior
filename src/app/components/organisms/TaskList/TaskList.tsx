import TaskItem from "../../molecules/TaskItem/TaskItem";

export type Task = {
  id: string;
  title: string;
  date: Date;
  time?: string;
  description?: string;
  status: "pending" | "done";
  owner: {
    id: string;
    firstName: string;
    lastName: string;
  };
};

type TaskListProps = {
  tasks: Task[];
  onEditTask: (task: Task) => void;
};

export default function TaskList({ tasks,onEditTask }: TaskListProps) {
  return (
    <div>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          title={task.title}
          date={task.date}
          time={task.time}
          description={task.description}
          status={task.status}
          owner={task.owner}
          onEdit={() => onEditTask(task)}
        />  
      ))}
    </div>
  );
}