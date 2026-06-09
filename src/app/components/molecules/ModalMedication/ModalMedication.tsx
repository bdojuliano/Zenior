import styles from "./ModalMedication.module.css";
import { useState, useEffect } from "react";
import Field from "../../atoms/Field/Field";
import Button from "../../atoms/Button/Button";

export type ModalMedicationData = {
  name: string;
  dose: string;
  observations: string;
};

type ModalMedicationProps = {
  isOpen: boolean;
  initialData?: ModalMedicationData;
  onClose: () => void;
  onSave: (data: ModalMedicationData) => void;
  onDelete?: () => void;
};

const empty: ModalMedicationData = {
  name: "",
  dose: "",
  observations: "",
};

export default function ModalMedication({ isOpen, initialData, onClose, onSave, onDelete }: ModalMedicationProps) {
  const isEditing = !!initialData;
  const [form, setForm] = useState<ModalMedicationData>(initialData ?? empty);

  useEffect(() => { setForm(initialData ?? empty); }, [initialData, isOpen]);

  if (!isOpen) return null;

  function handleChange(field: keyof ModalMedicationData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.name || !form.dose) {
      alert("Preencha nome e dose");
      return;
    }
    onSave(form);
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? "Editar medicamento" : "Novo medicamento"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <Field
            label="Nome *"
            placeholder="Ex: Paracetamol"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
          />
          <Field
            label="Dose *"
            placeholder="Ex: 500mg"
            value={form.dose}
            onChange={(e) => handleChange("dose", e.target.value)}
          />
          <div className={styles.observations}>
            <label className={styles.observationsLabel}>Observações</label>
            <textarea
              className={styles.textArea}
              placeholder="Ex: Tomar 2x ao dia após as refeições..."
              value={form.observations}
              rows={3}
              onChange={(e) => handleChange("observations", e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
            />
          </div>

          <div className={styles.footer}>
            {isEditing && onDelete && (
              <Button onClick={onDelete}>Excluir</Button>
            )}
            <Button onClick={handleSave}>
              {isEditing ? "Salvar alterações" : "Adicionar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}