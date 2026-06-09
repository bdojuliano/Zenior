import styles from "./ModalContact.module.css";
import { useState, useEffect } from "react";
import Field from "../../atoms/Field/Field";
import Button from "../../atoms/Button/Button";

export type ModalContactData = {
  name: string;
  phone: string;
  observations: string;
};

type ModalContactProps = {
  isOpen: boolean;
  initialData?: ModalContactData;
  onClose: () => void;
  onSave: (data: ModalContactData) => void;
  onDelete?: () => void;
};

const empty: ModalContactData = {
  name: "",
  phone: "",
  observations: "",
};

export default function ModalContact({ isOpen, initialData, onClose, onSave, onDelete }: ModalContactProps) {
  const isEditing = !!initialData;
  const [form, setForm] = useState<ModalContactData>(initialData ?? empty);

  useEffect(() => { setForm(initialData ?? empty); }, [initialData, isOpen]);

  if (!isOpen) return null;

  function handleChange(field: keyof ModalContactData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.name || !form.phone) {
      alert("Preencha nome e número");
      return;
    }
    onSave(form);
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? "Editar contato" : "Novo contato"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <Field
            label="Nome *"
            placeholder="Ex: Dr. João Silva"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
          />
          <Field
            label="Número *"
            placeholder="Ex: 11 99999-9999"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
          <div className={styles.observations}>
            <label className={styles.observationsLabel}>Observações</label>
            <textarea
              className={styles.textArea}
              placeholder="Ex: Médico de família, ligar em emergências..."
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