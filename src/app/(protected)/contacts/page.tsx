"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/service/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "../../components/atoms/Loading/Loading";
import ContactItem from "../../components/molecules/ContactItem/ContactItem";
import ModalContact, { type ModalContactData } from "../../components/molecules/ModalContact/ModalContact";
import styles from "./page.module.css";

type Contact = {
  id: string;
  name: string;
  phone: string;
  observations?: string;
};

export default function Contacts() {
  const { member } = useAuth();
  const router = useRouter();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  useEffect(() => {
    if (!member?.familyId) return;
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, "contacts"), where("familyId", "==", member!.familyId)));
        setContacts(snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          phone: d.data().phone,
          observations: d.data().observations,
        })));
      } catch (error) {
        console.error("Erro ao carregar contatos:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [member?.familyId]);

  function handleOpenCreate() { setEditingContact(null); setModalOpen(true); }
  function handleOpenEdit(c: Contact) { setEditingContact(c); setModalOpen(true); }
  function handleCloseModal() { setModalOpen(false); setEditingContact(null); }

  function contactToModalData(c: Contact): ModalContactData {
    return { name: c.name, phone: c.phone, observations: c.observations ?? "" };
  }

  async function handleSave(data: ModalContactData) {
    if (!member?.familyId) return;
    const payload = { name: data.name, phone: data.phone, observations: data.observations, familyId: member.familyId };
    try {
      if (editingContact) {
        await updateDoc(doc(db, "contacts", editingContact.id), payload);
        setContacts((prev) => prev.map((c) => c.id === editingContact.id ? { ...c, ...payload } : c));
      } else {
        const ref = await addDoc(collection(db, "contacts"), payload);
        setContacts((prev) => [...prev, { id: ref.id, ...data }]);
      }
      handleCloseModal();
    } catch {
      alert("Erro ao salvar contato");
    }
  }

  async function handleDelete() {
    if (!editingContact) return;
    try {
      await deleteDoc(doc(db, "contacts", editingContact.id));
      setContacts((prev) => prev.filter((c) => c.id !== editingContact.id));
      handleCloseModal();
    } catch {
      alert("Erro ao deletar contato");
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}>← Voltar</button>
          <h1 className={styles.title}>Contatos</h1>
          <button className={styles.addBtn} onClick={handleOpenCreate}>+ Novo contato</button>
        </div>
        <div className={styles.list}>
          {loading ? <Loading /> : contacts.length === 0 ? (
            <p className={styles.empty}>Nenhum contato cadastrado</p>
          ) : (
            contacts.map((c) => (
              <ContactItem
                key={c.id}
                name={c.name}
                phone={c.phone}
                observations={c.observations}
                onEdit={() => handleOpenEdit(c)}
              />
            ))
          )}
        </div>
      </div>
      <ModalContact
        isOpen={modalOpen}
        initialData={editingContact ? contactToModalData(editingContact) : undefined}
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={editingContact ? handleDelete : undefined}
      />
    </main>
  );
}