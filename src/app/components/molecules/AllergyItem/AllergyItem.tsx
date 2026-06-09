import styles from "./AllergyItem.module.css";

type AllergyItemProps = {
  allergy: string;
  risk: string;
  observations?: string;
  onEdit: () => void;
};

const RISK_CLASS: Record<string, string> = {
  Alto:  "alto",
  Médio: "medio",
  Baixo: "baixo",
};

export default function AllergyItem({ allergy, risk, observations, onEdit }: AllergyItemProps) {
  const riskKey = RISK_CLASS[risk] ?? "baixo";

  return (
    <div className={styles.container} onClick={onEdit} role="button" tabIndex={0}>
      <div className={`${styles.dot} ${styles[`dot_${riskKey}`]}`} />

      <div className={styles.body}>
        <p className={styles.name}>{allergy}</p>
        {observations && <p className={styles.obs}>{observations}</p>}
      </div>

      <span className={`${styles.chip} ${styles[`chip_${riskKey}`]}`}>
        {risk} risco
      </span>
    </div>
  );
}