import styles from "./MedicationItem.module.css";

type MedicationItemProps = {
  name: string;
  dose: string;
  observations?: string;
  onEdit: () => void;
};

export default function MedicationItem({ name, dose, observations, onEdit }: MedicationItemProps) {
  return (
    <div className={styles.container} onClick={onEdit} role="button" tabIndex={0}>
      <div className={styles.iconWrap}>
        <span>💊</span>
      </div>
      <div className={styles.body}>
        <p className={styles.name}>{name}</p>
        {observations && <p className={styles.obs}>{observations}</p>}
        <p className={styles.dose}>{dose}</p>
      </div>
    </div>
  );
}