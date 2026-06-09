import styles from "./ExpenseItem.module.css";

export const TAGS = [
  "Saúde",
  "Alimentação",
  "Lazer",
  "Transporte",
  "Aluguel",
  "Vestuário",
  "Higiene",
  "Outros",
] as const;

export type Tag = typeof TAGS[number];

const TAG_CONFIG: Record<Tag, { icon: string; bg: string }> = {
  Saúde:       { icon: "🩺", bg: "#EAF3DE" },
  Alimentação: { icon: "🛒", bg: "#FFF3E0" },
  Lazer:       { icon: "🎭", bg: "#EDE8FB" },
  Transporte:  { icon: "🚌", bg: "#E6F1FB" },
  Aluguel:     { icon: "🏠", bg: "#E6F1FB" },
  Vestuário:   { icon: "👕", bg: "#FBF0E6" },
  Higiene:     { icon: "🧴", bg: "#FBEAF0" },
  Outros:      { icon: "📋", bg: "#F2F2F2" },
};

type ExpenseItemProps = {
  description: string;
  amount: number;
  date: string;
  tag: Tag;
  source: string;
  onEdit: () => void;
};

export default function ExpenseItem({ description, amount, date, tag, source, onEdit }: ExpenseItemProps) {
  const { icon, bg } = TAG_CONFIG[tag] ?? TAG_CONFIG["Outros"];
  const isPension = source === "Aposentadoria";

  return (
    <div className={styles.container} onClick={onEdit} role="button" tabIndex={0}>
      <div className={styles.icon} style={{ background: bg }}>
        <span>{icon}</span>
      </div>

      <div className={styles.left}>
        <p className={styles.description}>{description}</p>
        <p className={styles.date}>{date}</p>
      </div>

      <div className={styles.right}>
        <p className={styles.amount}>R$ {amount.toFixed(2).replace(".", ",")}</p>
        <span className={`${styles.source} ${isPension ? styles.pension : styles.member}`}>
          {source}
        </span>
      </div>
    </div>
  );
}