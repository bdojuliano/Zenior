import styles from "./ModalAppointment.module.css";
import { useState, useEffect } from "react";
import Field from "../../atoms/Field/Field";
import Button from "../../atoms/Button/Button";

export type ModalAppointmentData = {
  doctor: string;
  specialty: string;
  date: string;  
  time: string;  
  description: string;
};

type ModalAppointmentProps = {
  isOpen: boolean;
  initialData?: ModalAppointmentData;
  onClose: () => void;
  onSave: (data: ModalAppointmentData) => void;
  onDelete?: () => void;
};

const empty: ModalAppointmentData = {
  doctor: "",
  specialty: "",
  date: "",
  time: "",
  description: "",
};

export default function ModalAppointment({ isOpen, initialData, onClose, onSave, onDelete }: ModalAppointmentProps) {
  const isEditing = !!initialData;
  const [form, setForm] = useState<ModalAppointmentData>(initialData ?? empty);

  useEffect(() => { setForm(initialData ?? empty); }, [initialData, isOpen]);

  if (!isOpen) return null;

  function handleChange(field: keyof ModalAppointmentData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Máscara DD/MM/YYYY automática
  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    let masked = digits;
    if (digits.length > 2) masked = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4) masked = masked.slice(0, 5) + "/" + digits.slice(4);
    setForm((prev) => ({ ...prev, date: masked }));
  }

  function handleSave() {
    if (!form.doctor || !form.specialty || !form.date || !form.time) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }
    if (form.date.length < 10) {
      alert("Data incompleta. Use o formato DD/MM/YYYY");
      return;
    }
    onSave(form);
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {isEditing ? "Editar Consulta" : "Nova Consulta"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <Field
            label="Médico *"
            placeholder="Ex: Dr. João Silva"
            value={form.doctor}
            onChange={(e) => handleChange("doctor", e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
          />

          <Field
            label="Especialidade *"
            placeholder="Ex: Cardiologia"
            value={form.specialty}
            onChange={(e) => handleChange("specialty", e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
          />

          <div className={styles.timestamp}>
            <Field
              label="Data *"
              placeholder="DD/MM/YYYY"
              value={form.date}
              onChange={handleDateChange}
            />
            <Field
              label="Horário *"
              type="time"
              value={form.time}
              onChange={(e) => handleChange("time", e.target.value)}
            />
          </div>

          <div className={styles.description}>
            <label className={styles.descriptionLabel}>Descrição</label>
            <textarea
              className={styles.textArea}
              placeholder="Observações sobre a consulta..."
              value={form.description}
              rows={3}
              onChange={(e) => handleChange("description", e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
            />
          </div>

          <div className={styles.footer}>
            {isEditing && onDelete && (
              <Button onClick={onDelete}>Excluir</Button>
            )}
            <Button onClick={handleSave}>
              {isEditing ? "Salvar alterações" : "Criar consulta"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}