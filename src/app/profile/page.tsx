"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, updateDoc, getDocs, collection, query, where, deleteDoc, writeBatch } from "firebase/firestore";
import { sendPasswordResetEmail, signOut } from "firebase/auth";
import { db, auth } from "@/service/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Field from "../components/atoms/Field/Field";
import Button from "../components/atoms/Button/Button";
import Avatar from "../components/atoms/Avatar/Avatar";
import styles from "./page.module.css";

type ConfirmModal = {
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
};

export default function Profile() {
  const { user, member, refreshMember } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayFirstName, setDisplayFirstName] = useState(member?.firstName ?? "");
  const [displayLastName, setDisplayLastName] = useState(member?.lastName ?? "");
  const [displayPhotoURL, setDisplayPhotoURL] = useState(member?.photoURL ?? "");

  const [firstName, setFirstName] = useState(member?.firstName ?? "");
  const [lastName, setLastName] = useState(member?.lastName ?? "");
  const [cellphone, setCellphone] = useState("");
  const [email, setEmail] = useState("");

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);

  useEffect(() => {
    if (!user) return;
    async function loadProfile() {
      try {
        const snap = await getDoc(doc(db, "member", user!.uid));
        if (!snap.exists()) return;
        const data = snap.data();
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setDisplayFirstName(data.firstName);
        setDisplayLastName(data.lastName);
        setDisplayPhotoURL(data.photoURL ?? "");
        setCellphone(data.cellphone ?? "");
        setEmail(data.email ?? "");
      } catch (error) {
        console.error("Erro ao carregar perfil:", error);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();

    const saved = localStorage.getItem("darkMode");
    if (saved === "true") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, [user]);

  function closeModal() { setConfirmModal(null); }

  // ── Upload de foto de perfil (base64, sem Storage) ──
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) { alert("Selecione uma imagem válida"); return; }
    if (file.size > 5 * 1024 * 1024) { alert("A imagem deve ter no máximo 5MB"); return; }

    setUploadingPhoto(true);
    try {
      const url = await resizeAndEncode(file, 300);
      await updateDoc(doc(db, "member", user.uid), { photoURL: url });
      setDisplayPhotoURL(url);
      await refreshMember();
    } catch {
      alert("Erro ao processar foto");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!user) return;
    if (!firstName || !lastName) { alert("Preencha nome e sobrenome"); return; }
    setSaving(true);
    try {
      await updateDoc(doc(db, "member", user.uid), { firstName, lastName, cellphone });
      setDisplayFirstName(firstName);
      setDisplayLastName(lastName);
      await refreshMember();
      alert("Perfil atualizado!");
    } catch {
      alert("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword() {
    if (!email) return;
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Email de redefinição enviado para " + email);
    } catch {
      alert("Erro ao enviar email de redefinição");
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    router.push("/login");
  }

  function handleToggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("darkMode", String(next));
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  }

  async function prepareDeactivate() {
    if (!user || !member?.familyId) return;
    try {
      const membersSnap = await getDocs(query(collection(db, "member"), where("familyId", "==", member.familyId)));
      const allMembers = membersSnap.docs.map((d) => ({ id: d.id, ...d.data() as any }));
      const activeMembers = allMembers.filter((m) => m.isActive !== false);
      const activeAdmins = allMembers.filter((m) => m.isAdmin === true && m.isActive !== false);
      const isOnlyMember = activeMembers.length === 1;
      const isOnlyAdmin = activeAdmins.length === 1 && member.isAdmin;

      if (isOnlyMember) {
        setConfirmModal({
          title: "Desativar conta",
          description: "Você é o único membro ativo da família. Ao desativar sua conta, a família também será excluída permanentemente. Tem certeza?",
          confirmLabel: "Desativar e excluir família",
          danger: true,
          onConfirm: async () => {
            try {
              await updateDoc(doc(db, "member", user.uid), { isActive: false });
              await deleteDoc(doc(db, "family", member.familyId));
              await signOut(auth);
              router.push("/restricted");
            } catch { alert("Erro ao desativar conta"); }
          },
        });
        return;
      }

      if (isOnlyAdmin) {
        const otherActive = activeMembers.find((m) => m.id !== user.uid);
        if (!otherActive) { alert("Não foi possível encontrar outro membro para promover."); return; }
        setConfirmModal({
          title: "Desativar conta",
          description: `Você é o único administrador. ${otherActive.firstName} ${otherActive.lastName} será promovido a administrador automaticamente. Tem certeza?`,
          confirmLabel: "Desativar conta",
          danger: true,
          onConfirm: async () => {
            try {
              await updateDoc(doc(db, "member", otherActive.id), { isAdmin: true });
              await updateDoc(doc(db, "member", user.uid), { isActive: false });
              await signOut(auth);
              router.push("/restricted");
            } catch { alert("Erro ao desativar conta"); }
          },
        });
        return;
      }

      setConfirmModal({
        title: "Desativar conta",
        description: "Tem certeza que deseja desativar sua conta? Você não conseguirá mais acessar o sistema até que um administrador reative seu acesso.",
        confirmLabel: "Desativar conta",
        danger: true,
        onConfirm: async () => {
          try {
            await updateDoc(doc(db, "member", user.uid), { isActive: false });
            await signOut(auth);
            router.push("/restricted");
          } catch { alert("Erro ao desativar conta"); }
        },
      });
    } catch { alert("Erro ao verificar dados da conta"); }
  }

  async function prepareDeleteFamily() {
    if (!user || !member?.familyId) return;
    setConfirmModal({
      title: "Excluir família",
      description: "Tem certeza? Essa ação é irreversível. O documento da família e todos os membros serão excluídos permanentemente.",
      confirmLabel: "Excluir família",
      danger: true,
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          const membersSnap = await getDocs(query(collection(db, "member"), where("familyId", "==", member.familyId)));
          membersSnap.docs.forEach((d) => batch.delete(d.ref));
          batch.delete(doc(db, "family", member.familyId));
          await batch.commit();
          await signOut(auth);
          router.push("/login");
        } catch { alert("Erro ao excluir família"); }
      },
    });
  }

  if (loadingProfile) return null;

  return (
    <main className={styles.page}>

      {/* Topo — avatar clicável */}
      <div className={styles.profileTop}>
        <div className={styles.avatarWrapper} onClick={() => fileInputRef.current?.click()}>
          <Avatar
            firstName={displayFirstName}
            lastName={displayLastName}
            size={5}
            photoURL={displayPhotoURL || undefined}
          />
          <div className={styles.avatarOverlay}>
            {uploadingPhoto ? (
              <span className={styles.uploadingSpinner} />
            ) : (
              <span className={styles.cameraIcon}>📷</span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className={styles.fileInput}
            onChange={handlePhotoChange}
          />
        </div>
        <div className={styles.profileInfo}>
          <p className={styles.profileName}>{displayFirstName} {displayLastName}</p>
          <p className={styles.profileEmail}>{email}</p>
          <p className={styles.photoHint}>Toque na foto para alterar</p>
        </div>
      </div>

      {/* Informações pessoais */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Informações pessoais</h2>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.row}>
            <Field
              label="Nome"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
            />
            <Field
              label="Sobrenome"
              value={lastName}
              onChange={(e) => setLastName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
            />
          </div>
          <div className={styles.fieldWrap}>
            <Field label="Celular" type="tel" value={cellphone} onChange={(e) => setCellphone(e.target.value)} />
          </div>
          <div className={styles.cardActions}>
            <Button onClick={handleSave}>{saving ? "Salvando..." : "Salvar alterações"}</Button>
          </div>
        </div>
      </div>

      {/* Preferências */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Preferências</h2>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.actionRow}>
            <div className={styles.actionInfo}>
              <p className={styles.actionLabel}>Modo escuro</p>
              <p className={styles.actionDesc}>Altera o tema da interface</p>
            </div>
            <button className={`${styles.toggle} ${darkMode ? styles.toggleOn : ""}`} onClick={handleToggleDarkMode}>
              <span className={styles.toggleThumb} />
            </button>
          </div>
        </div>
      </div>

      {/* Conta */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Conta</h2>
        </div>
        <div className={styles.cardBody}>
          <div className={styles.actionRow}>
            <div className={styles.actionInfo}>
              <p className={styles.actionLabel}>Redefinir senha</p>
              <p className={styles.actionDesc}>Enviaremos um link para {email}</p>
            </div>
            <button className={styles.outlineBtn} onClick={handleResetPassword}>Enviar email</button>
          </div>
          <div className={styles.actionRow}>
            <div className={styles.actionInfo}>
              <p className={styles.actionLabel}>Sair da conta</p>
              <p className={styles.actionDesc}>Você será redirecionado para o login</p>
            </div>
            <button className={styles.neutralBtn} onClick={handleSignOut}>Sair</button>
          </div>
          <div className={styles.actionRow}>
            <div className={styles.actionInfo}>
              <p className={styles.actionLabel}>Desativar conta</p>
              <p className={styles.actionDesc}>Você perderá o acesso até ser reativado por um admin</p>
            </div>
            <button className={styles.dangerBtn} onClick={prepareDeactivate}>Desativar</button>
          </div>
          {member?.isAdmin && (
            <div className={styles.actionRow}>
              <div className={styles.actionInfo}>
                <p className={styles.actionLabel}>Excluir família</p>
                <p className={styles.actionDesc}>Remove permanentemente a família e todos os membros</p>
              </div>
              <button className={styles.dangerBtn} onClick={prepareDeleteFamily}>Excluir</button>
            </div>
          )}
        </div>
      </div>

      {confirmModal && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{confirmModal.title}</h2>
            <p className={styles.modalDescription}>{confirmModal.description}</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeModal}>Cancelar</button>
              <button
                className={confirmModal.danger ? styles.confirmDangerBtn : styles.confirmBtn}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function resizeAndEncode(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target?.result as string; };
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