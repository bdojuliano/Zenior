"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/service/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "../components/atoms/Loading/Loading";
import MemberItem from "../components/molecules/MemberItem/MemberItem";
import styles from "./page.module.css";

type Member = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
  isAdmin: boolean;
  isActive: boolean;
};

type ConfirmModal = {
  title: string;
  description: string;
  onConfirm: () => void;
};

export default function Members() {
  const { user, member } = useAuth();
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModal | null>(null);

  useEffect(() => {
    if (!member?.familyId) return;
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, "member"), where("familyId", "==", member!.familyId)));
        setMembers(snap.docs.map((d) => ({
          id: d.id,
          firstName: d.data().firstName,
          lastName: d.data().lastName,
          email: d.data().email,
          photoURL: d.data().photoURL ?? undefined,
          isAdmin: d.data().isAdmin === true,
          isActive: d.data().isActive !== false,
        })));
      } catch (error) {
        console.error("Erro ao carregar membros:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [member?.familyId]);

  function closeModal() { setConfirmModal(null); }

  function handleRemoveAdmin(m: Member) {
    const admins = members.filter((x) => x.isAdmin);
    if (admins.length <= 1) {
      alert("Você é o único administrador. Designe outro membro como admin antes de remover seu acesso.");
      return;
    }
    setConfirmModal({
      title: "Remover administrador",
      description: `Tem certeza que deseja remover o acesso de administrador de ${m.firstName} ${m.lastName}?`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "member", m.id), { isAdmin: false });
          setMembers((prev) => prev.map((x) => x.id === m.id ? { ...x, isAdmin: false } : x));
          closeModal();
        } catch { alert("Erro ao remover administrador"); }
      },
    });
  }

  function handleMakeAdmin(m: Member) {
    setConfirmModal({
      title: "Tornar administrador",
      description: `Tem certeza que deseja tornar ${m.firstName} ${m.lastName} administrador?`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "member", m.id), { isAdmin: true });
          setMembers((prev) => prev.map((x) => x.id === m.id ? { ...x, isAdmin: true } : x));
          closeModal();
        } catch { alert("Erro ao tornar administrador"); }
      },
    });
  }

  function handleToggleActive(m: Member) {
    const activeAdmins = members.filter((x) => x.isAdmin && x.isActive);
    const isOnlyAdmin = activeAdmins.length === 1 && m.isAdmin;

    if (m.isActive && isOnlyAdmin) {
      const otherActive = members.find((x) => x.id !== m.id && x.isActive);
      if (!otherActive) { alert("Não é possível desativar o único membro ativo."); return; }
      setConfirmModal({
        title: "Desativar administrador único",
        description: `${m.firstName} é o único administrador. ${otherActive.firstName} ${otherActive.lastName} será promovido automaticamente. Deseja continuar?`,
        onConfirm: async () => {
          try {
            await updateDoc(doc(db, "member", otherActive.id), { isAdmin: true });
            await updateDoc(doc(db, "member", m.id), { isActive: false });
            setMembers((prev) => prev.map((x) => {
              if (x.id === otherActive.id) return { ...x, isAdmin: true };
              if (x.id === m.id) return { ...x, isActive: false };
              return x;
            }));
            closeModal();
          } catch { alert("Erro ao desativar membro"); }
        },
      });
      return;
    }

    const action = m.isActive ? "desativar" : "reativar";
    setConfirmModal({
      title: `${m.isActive ? "Desativar" : "Reativar"} membro`,
      description: `Tem certeza que deseja ${action} ${m.firstName} ${m.lastName}?`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "member", m.id), { isActive: !m.isActive });
          setMembers((prev) => prev.map((x) => x.id === m.id ? { ...x, isActive: !m.isActive } : x));
          closeModal();
        } catch { alert("Erro ao atualizar membro"); }
      },
    });
  }

  function handleCopyCode() {
    if (!member?.familyId) return;
    navigator.clipboard.writeText(member.familyId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Ativos primeiro, inativos embaixo
  const sorted = [...members].sort((a, b) => {
    if (a.isActive === b.isActive) return 0;
    return a.isActive ? -1 : 1;
  });

  return (
    <main className={styles.page}>
      <div className={styles.banner}>
        <button className={styles.backBtn} onClick={() => router.back()}>← Voltar</button>
        <div className={styles.bannerContent}>
          <p className={styles.bannerLabel}>Código da família</p>
          <p className={styles.bannerCode}>{member?.familyId ?? "..."}</p>
          <button className={styles.copyBtn} onClick={handleCopyCode}>
            {copied ? "Copiado!" : "Copiar código"}
          </button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Membros</h1>
          <span className={styles.count}>{members.filter(m => m.isActive).length} ativos</span>
        </div>
        <div className={styles.list}>
          {loading ? <Loading /> : sorted.length === 0 ? (
            <p className={styles.empty}>Nenhum membro encontrado</p>
          ) : (
            sorted.map((m) => (
              <MemberItem
                key={m.id}
                firstName={m.firstName}
                lastName={m.lastName}
                email={m.email}
                photoURL={m.photoURL}
                isAdmin={m.isAdmin}
                isActive={m.isActive}
                isSelf={m.id === user?.uid}
                canManage={member?.isAdmin === true}
                onToggleActive={() => handleToggleActive(m)}
                onMakeAdmin={() => handleMakeAdmin(m)}
                onRemoveAdmin={() => handleRemoveAdmin(m)}
              />
            ))
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
              <button className={styles.confirmBtn} onClick={confirmModal.onConfirm}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}