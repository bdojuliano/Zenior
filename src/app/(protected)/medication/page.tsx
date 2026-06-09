"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/service/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "../../components/atoms/Loading/Loading";
import MedicationItem from "../../components/molecules/MedicationItem/MedicationItem";
import ModalMedication, { type ModalMedicationData } from "../../components/molecules/ModalMedication/ModalMedication";
import styles from "./page.module.css";

type Medication = {
  id: string;
  name: string;
  dose: string;
  observations?: string;
};

export default function Medications() {
  const { member } = useAuth();
  const router = useRouter();

  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);

  useEffect(() => {
    if (!member?.familyId) return;
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, "medications"), where("familyId", "==", member!.familyId)));
        setMedications(snap.docs.map((d) => ({
          id: d.id,
          name: d.data().name,
          dose: d.data().dose,
          observations: d.data().observations,
        })));
      } catch (error) {
        console.error("Erro ao carregar medicamentos:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [member?.familyId]);

  function handleOpenCreate() { setEditingMedication(null); setModalOpen(true); }
  function handleOpenEdit(med: Medication) { setEditingMedication(med); setModalOpen(true); }
  function handleCloseModal() { setModalOpen(false); setEditingMedication(null); }

  function medicationToModalData(med: Medication): ModalMedicationData {
    return { name: med.name, dose: med.dose, observations: med.observations ?? "" };
  }

  async function handleSave(data: ModalMedicationData) {
    if (!member?.familyId) return;
    const payload = { name: data.name, dose: data.dose, observations: data.observations, familyId: member.familyId };
    try {
      if (editingMedication) {
        await updateDoc(doc(db, "medications", editingMedication.id), payload);
        setMedications((prev) => prev.map((m) => m.id === editingMedication.id ? { ...m, ...payload } : m));
      } else {
        const ref = await addDoc(collection(db, "medications"), payload);
        setMedications((prev) => [...prev, { id: ref.id, ...data }]);
      }
      handleCloseModal();
    } catch {
      alert("Erro ao salvar medicamento");
    }
  }

  async function handleDelete() {
    if (!editingMedication) return;
    try {
      await deleteDoc(doc(db, "medications", editingMedication.id));
      setMedications((prev) => prev.filter((m) => m.id !== editingMedication.id));
      handleCloseModal();
    } catch {
      alert("Erro ao deletar medicamento");
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}>← Voltar</button>
          <h1 className={styles.title}>Medicamentos</h1>
          <button className={styles.addBtn} onClick={handleOpenCreate}>+ Novo medicamento</button>
        </div>
        <div className={styles.list}>
          {loading ? <Loading /> : medications.length === 0 ? (
            <p className={styles.empty}>Nenhum medicamento cadastrado</p>
          ) : (
            medications.map((med) => (
              <MedicationItem
                key={med.id}
                name={med.name}
                dose={med.dose}
                observations={med.observations}
                onEdit={() => handleOpenEdit(med)}
              />
            ))
          )}
        </div>
      </div>
      <ModalMedication
        isOpen={modalOpen}
        initialData={editingMedication ? medicationToModalData(editingMedication) : undefined}
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={editingMedication ? handleDelete : undefined}
      />
    </main>
  );
}