import styles from "./ModalAllergy.module.css";
import { useState, useEffect } from "react";
import Field from "../../atoms/Field/Field";
import Button from "../../atoms/Button/Button";

export type ModalAllergyData = {
  allergy: string;
  risk: string;
  observations: string;
};

type ModalAllergyProps = {
  isOpen: boolean;
  initialData?: ModalAllergyData;
  onClose: () => void;
  onSave: (data: ModalAllergyData) => void;
  onDelete?: () => void;
};

const empty: ModalAllergyData = {
  allergy: "",
  risk: "",
  observations: "",
};

export default function ModalAllergy({ isOpen, initialData, onClose, onSave, onDelete }: ModalAllergyProps) {
  const isEditing = !!initialData;
  const [form, setForm] = useState<ModalAllergyData>(initialData ?? empty);

  useEffect(() => { setForm(initialData ?? empty); }, [initialData, isOpen]);

  if (!isOpen) return null;

  function handleChange(field: keyof ModalAllergyData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.allergy || !form.risk) {
      alert("Preencha alergia e risco");
      return;
    }
    onSave(form);
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? "Editar alergia" : "Nova alergia"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <Field
            label="Alergia *"
            placeholder="Ex: Penicilina"
            value={form.allergy}
            onChange={(e) => handleChange("allergy", e.target.value)}
          />
          <div className={styles.selectContainer}>
            <label>Risco *</label>
              <select value={form.risk} onChange={(e) => handleChange("risk", e.target.value)} className={styles.select}>
                <option value="">Selecione</option>
                <option value="Baixo">Baixo</option>
                <option value="Médio">Médio</option>
                <option value="Alto">Alto</option>
              </select>
          </div>
          <div className={styles.observations}>
            <label className={styles.observationsLabel}>Observações</label>
            <textarea
              className={styles.textArea}
              placeholder="Ex: Causa anafilaxia, evitar qualquer derivado..."
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