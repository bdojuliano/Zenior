import Avatar from "../../atoms/Avatar/Avatar";
import styles from "./TaskItem.module.css";

type TaskItemProps = {
  title: string;
  date: Date;
  time?: string;
  description?: string;
  status: "pending" | "done";
  owner: {
    id: string;
    firstName: string;
    lastName: string;
    photoURL?: string;
  };
  onEdit: () => void;
};

export default function TaskItem({
  title, date, time, description, status,
  owner: { firstName, lastName, photoURL },
  onEdit,
}: TaskItemProps) {
  const isDone = status === "done";
  const [day] = date.toLocaleDateString("pt-BR").split("/");
  const monthName = date.toLocaleString("pt-BR", { month: "short" }).replace(".", "");

  return (
    <div
      className={`${styles.container} ${isDone ? styles.containerDone : ""}`}
      onClick={onEdit}
      role="button"
      tabIndex={0}
    >
      <div className={styles.dateBlock}>
        <span className={styles.day}>{day}</span>
        <span className={styles.month}>{monthName}</span>
      </div>

      <div className={styles.body}>
        <p className={`${styles.title} ${isDone ? styles.titleDone : ""}`}>{title}</p>
        {description && <p className={styles.description}>{description}</p>}
        <div className={styles.meta}>
          {time && <span className={styles.time}>{time}</span>}
          {time && <span className={styles.dot}>·</span>}
          <span className={`${styles.chip} ${isDone ? styles.chipDone : styles.chipPending}`}>
            {isDone ? "Concluída" : "Pendente"}
          </span>
        </div>
      </div>

      <div className={styles.right}>
        <Avatar firstName={firstName} lastName={lastName} size={2.25} photoURL={photoURL} />
      </div>
    </div>
  );
}