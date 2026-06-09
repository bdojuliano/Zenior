import styles from "./ModalTask.module.css";
import { useState, useEffect } from "react";
import Field from "../../atoms/Field/Field";
import Button from "../../atoms/Button/Button";

type FamilyMember = {
  id: string;
  firstName: string;
  lastName: string;
};

export type ModalTaskData = {
    title: string;
    date: string;
    time: string;
    description: string;
    status: "pending"|"done";
    ownerId: string;
};

type ModalTaskProps ={
    isOpen: boolean;
    initialData?: ModalTaskData;
    familyMembers: FamilyMember[];
    onClose: () => void;
    onSave: (data: ModalTaskData) => void;
    onDelete?: () => void;
}

const empty: ModalTaskData = {
    title: "",
    date: "",
    time:"",
    description:"",
    status:"pending",
    ownerId:""
}

export default function ModalTask({isOpen,initialData,familyMembers,onClose,onSave,onDelete}:ModalTaskProps) {
    const isEditing = !!initialData;
    const [form, setForm] = useState<ModalTaskData>(initialData ?? empty);
    useEffect(() => {setForm(initialData ?? empty);}, [initialData, isOpen]);
    if (!isOpen) return null;

     function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
 
        let masked = digits;
        if (digits.length > 2) masked = digits.slice(0, 2) + "/" + digits.slice(2);
        if (digits.length > 4) masked = masked.slice(0, 5) + "/" + digits.slice(4);
 
        setForm((prev) => ({ ...prev, date: masked }));
    }

    function handleChange(field: keyof ModalTaskData,value: string) {
        setForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    function handleSave() {
        if (!form.title || !form.date || !form.time || !form.ownerId) {
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
                        {isEditing? "Editar Tarefa": "Nova Tarefa"}
                    </h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ✕  
                    </button>
                </div>
                <div className={styles.body}>
                    <Field
                    label="Título *"
                    placeholder="Ex: Comprar remédios"
                    value={form.title}
                    onChange={(e) => handleChange("title",e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}/>
                    <div className={styles.timestamp}>
                        <Field
                        label="Data *"
                        placeholder="DD/MM/YYYY"
                        value={form.date}
                        onChange={handleDateChange}/>

                        <Field
                        label="Horário *"
                        type="time"
                        value={form.time}
                        onChange={(e) =>handleChange("time",e.target.value)}/>
                    </div>
                    <div className={styles.dropdown}>
                        <div className={styles.status}>
                            <label className={styles.statusLabel}>Status *</label>
                            <select
                            className={styles.select}
                            value={form.status}
                            onChange={(e) => handleChange("status",e.target.value as | "pending"| "done")}>
                                <option value="pending">Pendente</option>
                                <option value="done">Concluído</option>
                            </select>
                        </div>
                        <div className={styles.owner}>
                            <label className={styles.ownerLabel}>Responsável *</label>
                            <select className={styles.select}
                            value={form.ownerId}
                            onChange={(e) => handleChange("ownerId",e.target.value)}>
                                <option value="" disabled>Selecione um responsável</option>
                                {familyMembers.map((m) => (
                                    <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>))}
                            </select>
                        </div>
                    </div>
                    <div className={styles.description}>
                        <label className={styles.descriptionLabel}>Descrição</label>
                        <textarea
                            className={styles.textArea}
                            placeholder="Detalhes da tarefa..."
                            value={form.description}
                            rows={3}
                            onChange={(e) => handleChange("description",e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}/>
                    </div>
                    <div className={styles.footer}>
                        {isEditing && onDelete && (
                            <Button  onClick={onDelete}>
                                Excluir
                            </Button>
                        )}
                        <Button onClick={handleSave}>
                            {isEditing? "Salvar alterações": "Criar tarefa"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
  );}