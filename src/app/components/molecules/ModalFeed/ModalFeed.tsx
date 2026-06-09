import styles from "./ModalFeed.module.css";
import { useState, useEffect } from "react";
import Field from "../../atoms/Field/Field";
import Button from "../../atoms/Button/Button";

export type ModalFeedData = {
  title: string;
  description: string;
};

type ModalFeedProps = {
  isOpen: boolean;
  initialData?: ModalFeedData;
  onClose: () => void;
  onSave: (data: ModalFeedData) => void;
  onDelete?: () => void;
};

const empty: ModalFeedData = {
  title: "",
  description: "",
};

export default function ModalFeed({ isOpen, initialData, onClose, onSave, onDelete }: ModalFeedProps) {
  const isEditing = !!initialData;
  const [form, setForm] = useState<ModalFeedData>(initialData ?? empty);

  useEffect(() => { setForm(initialData ?? empty); }, [initialData, isOpen]);

  if (!isOpen) return null;

  function handleChange(field: keyof ModalFeedData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    if (!form.title || !form.description) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }
    onSave(form);
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? "Editar recado" : "Novo recado"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <Field
            label="Título *"
            placeholder="Ex: Lembrete importante"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
          />

          <div className={styles.description}>
            <label className={styles.descriptionLabel}>Descrição *</label>
            <textarea
              className={styles.textArea}
              placeholder="Escreva seu recado aqui..."
              value={form.description}
              rows={4}
              onChange={(e) => handleChange("description", e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
            />
          </div>

          <div className={styles.footer}>
            {isEditing && onDelete && (
              <Button onClick={onDelete}>Excluir</Button>
            )}
            <Button onClick={handleSave}>
              {isEditing ? "Salvar alterações" : "Publicar"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}