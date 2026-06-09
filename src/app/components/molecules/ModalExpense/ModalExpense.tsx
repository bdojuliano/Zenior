import styles from "./ModalExpense.module.css";
import { useState, useEffect } from "react";
import Field from "../../atoms/Field/Field";
import Button from "../../atoms/Button/Button";
import { TAGS, type Tag } from "../../molecules/ExpenseItem/ExpenseItem";

type FamilyMember = {
  id: string;
  firstName: string;
  lastName: string;
};

export type ModalExpenseData = {
  description: string;
  amount: string;
  date: string;
  tag: Tag;
  sourceType: "pension" | "member" | "reserve";
  sourceMemberId: string;
};

type ModalExpenseProps = {
  isOpen: boolean;
  initialData?: ModalExpenseData;
  familyMembers: FamilyMember[];
  onClose: () => void;
  onSave: (data: ModalExpenseData) => void;
  onDelete?: () => void;
};

const empty: ModalExpenseData = {
  description: "",
  amount: "",
  date: "",
  tag: "Outros",
  sourceType: "pension",
  sourceMemberId: "",
};

export default function ModalExpense({
  isOpen, initialData, familyMembers, onClose, onSave, onDelete,
}: ModalExpenseProps) {
  const isEditing = !!initialData;
  const [form, setForm] = useState<ModalExpenseData>(initialData ?? empty);

  useEffect(() => { setForm(initialData ?? empty); }, [initialData, isOpen]);

  if (!isOpen) return null;

  function handleChange(field: keyof ModalExpenseData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    let masked = digits;
    if (digits.length > 2) masked = digits.slice(0, 2) + "/" + digits.slice(2);
    if (digits.length > 4) masked = masked.slice(0, 5) + "/" + digits.slice(4);
    setForm((prev) => ({ ...prev, date: masked }));
  }

  function handleSave() {
    if (!form.description || !form.amount || !form.date) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }
    if (form.date.length < 10) {
      alert("Data incompleta. Use o formato DD/MM/YYYY");
      return;
    }
    if (isNaN(Number(form.amount.replace(",", ".")))) {
      alert("Valor inválido");
      return;
    }
    if (form.sourceType === "member" && !form.sourceMemberId) {
      alert("Selecione o membro responsável");
      return;
    }
    onSave(form);
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{isEditing ? "Editar despesa" : "Nova despesa"}</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          <Field
            label="Descrição *"
            placeholder="Ex: Consulta médica"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
          />

          <div className={styles.row}>
            <Field
              label="Valor (R$) *"
              placeholder="Ex: 150,00"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
            />
            <Field
              label="Data *"
              placeholder="DD/MM/YYYY"
              value={form.date}
              onChange={handleDateChange}
            />
          </div>

          <div className={styles.fieldWrapper}>
            <label className={styles.fieldLabel}>Categoria *</label>
            <select
              className={styles.select}
              value={form.tag}
              onChange={(e) => handleChange("tag", e.target.value as Tag)}
            >
              {TAGS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className={styles.fieldWrapper}>
            <label className={styles.fieldLabel}>Fonte *</label>
            <select
              className={styles.select}
              value={form.sourceType}
              onChange={(e) => {
                const val = e.target.value as "pension" | "member" | "reserve";
                setForm((prev) => ({ ...prev, sourceType: val, sourceMemberId: "" }));
              }}
            >
              <option value="pension">Aposentadoria</option>
              <option value="reserve">Reserva financeira</option>
              <option value="member">Membro da família</option>
            </select>
          </div>

          {form.sourceType === "member" && (
            <div className={styles.fieldWrapper}>
              <label className={styles.fieldLabel}>Responsável *</label>
              <select
                className={styles.select}
                value={form.sourceMemberId}
                onChange={(e) => handleChange("sourceMemberId", e.target.value)}
              >
                <option value="" disabled>Selecione um membro</option>
                {familyMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.footer}>
            {isEditing && onDelete && <Button onClick={onDelete}>Excluir</Button>}
            <Button onClick={handleSave}>{isEditing ? "Salvar alterações" : "Adicionar"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}