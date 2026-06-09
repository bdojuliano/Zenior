import styles from "./Field.module.css";

type FieldProps = {
  label: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Field({ label, placeholder, type = "text",value,onChange}: FieldProps) {
  
  return (
    <div className={styles.wrapper}>
      <label className={styles.label}>{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}/>
    </div>
  );
}