import styles from "./ContactItem.module.css";

type ContactItemProps = {
  name: string;
  phone: string;
  observations?: string;
  onEdit: () => void;
};

export default function ContactItem({ name, phone, observations, onEdit }: ContactItemProps) {
  return (
    <div className={styles.container} onClick={onEdit} role="button" tabIndex={0}>
      <div className={styles.iconWrap}>
        <span className={styles.icon}>👤</span>
      </div>
      <div className={styles.body}>
        <p className={styles.name}>{name}</p>
        {observations && <p className={styles.obs}>{observations}</p>}
        <p className={styles.phone}>{phone}</p>
      </div>
    </div>
  );
}