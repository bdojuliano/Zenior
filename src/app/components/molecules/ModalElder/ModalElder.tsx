"use client";

import styles from "./ModalElder.module.css";
import { useState, useEffect, useRef } from "react";
import Field from "../../atoms/Field/Field";
import Button from "../../atoms/Button/Button";
import Avatar from "../../atoms/Avatar/Avatar";

export type ModalElderData = {
  elderFirstName: string;
  elderLastName: string;
  elderAddress: string;
  elderBirthDate: string;
  elderBloodType: string;
  elderPhotoURL?: string;
};

type ModalElderProps = {
  isOpen: boolean;
  initialData: ModalElderData;
  onClose: () => void;
  onSave: (data: ModalElderData) => void;
};

export default function ModalElder({ isOpen, initialData, onClose, onSave }: ModalElderProps) {
  const [form, setForm] = useState<ModalElderData>(initialData);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setForm(initialData); }, [initialData, isOpen]);

  if (!isOpen) return null;

  function handleChange(field: keyof ModalElderData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) { alert("Selecione uma imagem válida"); return; }
    if (file.size > 1 * 1024 * 1024) { alert("A imagem deve ter no máximo 1MB"); return; }

    setUploading(true);
    try {
      // Redimensiona e converte para base64 via canvas
      const url = await resizeAndEncode(file, 300);
      setForm((prev) => ({ ...prev, elderPhotoURL: url }));
    } catch {
      alert("Erro ao processar imagem");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleSave() {
    if (!form.elderFirstName || !form.elderLastName || !form.elderBirthDate || !form.elderBloodType) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }
    onSave(form);
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Editar dados do idoso</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>
          {/* Foto */}
          <div className={styles.photoSection}>
            <div className={styles.avatarWrapper} onClick={() => fileInputRef.current?.click()}>
              <Avatar
                firstName={form.elderFirstName || "?"}
                lastName={form.elderLastName || ""}
                size={4}
                photoURL={form.elderPhotoURL}
              />
              <div className={styles.avatarOverlay}>
                {uploading
                  ? <span className={styles.spinner} />
                  : <span className={styles.cameraIcon}>📷</span>
                }
              </div>
            </div>
            <p className={styles.photoHint}>
              {form.elderPhotoURL ? "Toque para trocar a foto" : "Toque para adicionar foto"}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handlePhotoChange}
            />
          </div>

          <div className={styles.row}>
            <Field
              label="Nome *"
              placeholder="Maria"
              value={form.elderFirstName}
              onChange={(e) => handleChange("elderFirstName", e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
            />
            <Field
              label="Sobrenome *"
              placeholder="Silva"
              value={form.elderLastName}
              onChange={(e) => handleChange("elderLastName", e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
            />
          </div>
          <Field
            label="Endereço"
            placeholder="Rua das Flores, 123"
            value={form.elderAddress}
            onChange={(e) => handleChange("elderAddress", e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
          />
          <Field
            label="Data de nascimento *"
            placeholder="DD/MM/YYYY"
            value={form.elderBirthDate}
            onChange={(e) => handleChange("elderBirthDate", e.target.value)}
          />
          <Field
            label="Tipo sanguíneo *"
            placeholder="Ex: A+"
            value={form.elderBloodType}
            onChange={(e) => handleChange("elderBloodType", e.target.value)}
          />

          <div className={styles.footer}>
            <Button onClick={handleSave}>Salvar alterações</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Redimensiona a imagem para max 300x300 e retorna base64
function resizeAndEncode(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);

    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > height) {
        if (width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
      } else {
        if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; }
      }

      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
  });
}