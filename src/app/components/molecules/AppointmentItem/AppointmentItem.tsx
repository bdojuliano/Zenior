import styles from "./AppointmentItem.module.css";

type AppointmentItemProps = {
  doctor: string;
  specialty: string;
  date: Date;
  time?: string;
  description?: string;
  onEdit: () => void;
};

export default function AppointmentItem({ doctor, specialty, date, time, description, onEdit }: AppointmentItemProps) {
  const day = date.toLocaleDateString("pt-BR").split("/")[0];
  const monthName = date.toLocaleString("pt-BR", { month: "short" }).replace(".", "");

  return (
    <div className={styles.container} onClick={onEdit} role="button" tabIndex={0}>
      <div className={styles.dateBlock}>
        <span className={styles.day}>{day}</span>
        <span className={styles.month}>{monthName}</span>
      </div>

      <div className={styles.body}>
        <p className={styles.doctor}>{doctor}</p>
        {description && <p className={styles.description}>{description}</p>}
        <div className={styles.meta}>
          <span className={styles.specialty}>{specialty}</span>
          {time && <span className={styles.dot}>·</span>}
          {time && <span className={styles.time}>{time}</span>}
        </div>
      </div>

      <div className={styles.icon}>🩺</div>
    </div>
  );
}