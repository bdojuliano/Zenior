"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/service/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "../../components/atoms/Loading/Loading";
import AllergyItem from "../../components/molecules/AllergyItem/AllergyItem";
import ModalAllergy, { type ModalAllergyData } from "../../components/molecules/ModalAllergy/ModalAllergy";
import styles from "./page.module.css";

type Allergy = {
  id: string;
  allergy: string;
  risk: string;
  observations?: string;
};

export default function Allergy() {
  const { member } = useAuth();
  const router = useRouter();

  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState<Allergy | null>(null);

  useEffect(() => {
    if (!member?.familyId) return;
    async function load() {
      try {
        const snap = await getDocs(query(collection(db, "allergies"), where("familyId", "==", member!.familyId)));
        setAllergies(snap.docs.map((d) => ({
          id: d.id,
          allergy: d.data().allergy,
          risk: d.data().risk,
          observations: d.data().observations,
        })));
      } catch (error) {
        console.error("Erro ao carregar alergias:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [member?.familyId]);

  function handleOpenCreate() { setEditingAllergy(null); setModalOpen(true); }
  function handleOpenEdit(a: Allergy) { setEditingAllergy(a); setModalOpen(true); }
  function handleCloseModal() { setModalOpen(false); setEditingAllergy(null); }

  function allergyToModalData(a: Allergy): ModalAllergyData {
    return { allergy: a.allergy, risk: a.risk, observations: a.observations ?? "" };
  }

  async function handleSave(data: ModalAllergyData) {
    if (!member?.familyId) return;
    const payload = { allergy: data.allergy, risk: data.risk, observations: data.observations, familyId: member.familyId };
    try {
      if (editingAllergy) {
        await updateDoc(doc(db, "allergies", editingAllergy.id), payload);
        setAllergies((prev) => prev.map((a) => a.id === editingAllergy.id ? { ...a, ...payload } : a));
      } else {
        const ref = await addDoc(collection(db, "allergies"), payload);
        setAllergies((prev) => [...prev, { id: ref.id, ...data }]);
      }
      handleCloseModal();
    } catch {
      alert("Erro ao salvar alergia");
    }
  }

  async function handleDelete() {
    if (!editingAllergy) return;
    try {
      await deleteDoc(doc(db, "allergies", editingAllergy.id));
      setAllergies((prev) => prev.filter((a) => a.id !== editingAllergy.id));
      handleCloseModal();
    } catch {
      alert("Erro ao deletar alergia");
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.back()}>← Voltar</button>
          <h1 className={styles.title}>Alergias</h1>
          <button className={styles.addBtn} onClick={handleOpenCreate}>+ Nova alergia</button>
        </div>
        <div className={styles.list}>
          {loading ? <Loading /> : allergies.length === 0 ? (
            <p className={styles.empty}>Nenhuma alergia cadastrada</p>
          ) : (
            allergies.map((a) => (
              <AllergyItem
                key={a.id}
                allergy={a.allergy}
                risk={a.risk}
                observations={a.observations}
                onEdit={() => handleOpenEdit(a)}
              />
            ))
          )}
        </div>
      </div>

      <ModalAllergy
        isOpen={modalOpen}
        initialData={editingAllergy ? allergyToModalData(editingAllergy) : undefined}
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={editingAllergy ? handleDelete : undefined}
      />
    </main>
  );
}