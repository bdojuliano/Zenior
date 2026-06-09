"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import styles from "./page.module.css";
import { db } from "@/service/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Avatar from "../components/atoms/Avatar/Avatar";
import Button from "../components/atoms/Button/Button";
import Loading from "../components/atoms/Loading/Loading";
import TaskList, { Task } from "../components/organisms/TaskList/TaskList";
import ModalTask, { ModalTaskData } from "../components/molecules/ModalTask/ModalTask";
import AppointmentList, { Appointment } from "../components/organisms/AppointmentList/AppointmentList";
import ModalAppointment, { ModalAppointmentData } from "../components/molecules/ModalAppointment/ModalAppointment";
import FeedList, { FeedPost } from "../components/organisms/FeedList/FeedList";
import ModalFeed, { ModalFeedData } from "../components/molecules/ModalFeed/ModalFeed";
import ModalElder, { ModalElderData } from "../components/molecules/ModalElder/ModalElder";

type FamilyMember = {
  id: string;
  firstName: string;
  lastName: string;
};

type ElderData = {
  elderFirstName: string;
  elderLastName: string;
  elderAddress: string;
  elderBirthDate: string;
  elderBloodType: string;
  elderPhotoURL?: string;
};

type Expense = {
  amount: number;
  date: string; // DD/MM/YYYY
};

function calcAge(birthDate: string): number | null {
  const parts = birthDate.split("/");
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if (!day || !month || !year) return null;
  const today = new Date();
  const birth = new Date(year, month - 1, day);
  let age = today.getFullYear() - birth.getFullYear();
  const hasHadBirthday =
    today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate());
  if (!hasHadBirthday) age--;
  return age;
}

function fmt(n: number) {
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

const ADD_LABEL: Record<"tasks" | "appointments" | "feed", string> = {
  feed: "Adicionar recado",
  tasks: "Adicionar tarefa",
  appointments: "Adicionar consulta",
};

export default function Dashboard() {
  const { user, member } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"tasks" | "appointments" | "feed">("feed");

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [elder, setElder] = useState<ElderData | null>(null);
  const [modalElderOpen, setModalElderOpen] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [modalAppointmentOpen, setModalAppointmentOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);

  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [modalFeedOpen, setModalFeedOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);

  // Despesas do mês atual (todas as fontes)
  const [monthExpensesTotal, setMonthExpensesTotal] = useState(0);

  useEffect(() => {
    if (!member?.familyId) return;
    async function loadFamilyData() {
      try {
        const membersSnap = await getDocs(
          query(collection(db, "member"), where("familyId", "==", member!.familyId))
        );
        setFamilyMembers(
          membersSnap.docs.map((d) => ({
            id: d.id,
            firstName: d.data().firstName,
            lastName: d.data().lastName,
          }))
        );

        const familySnap = await getDoc(doc(db, "family", member!.familyId));
        if (familySnap.exists()) {
          const fd = familySnap.data();
          setElder({
            elderFirstName: fd.elderFirstName,
            elderLastName: fd.elderLastName,
            elderAddress: fd.elderAddress ?? "",
            elderBirthDate: fd.elderBirthDate ?? "",
            elderBloodType: fd.elderBloodType ?? "",
            elderPhotoURL: fd.elderPhotoURL ?? undefined,
          });
        }

        // Despesas do mês atual
        const expSnap = await getDocs(
          query(collection(db, "expenses"), where("familyId", "==", member!.familyId))
        );
        const now = new Date();
        let total = 0;
        expSnap.docs.forEach((d) => {
          const data = d.data() as Expense;
          const parts = data.date?.split("/");
          if (parts?.length === 3) {
            const m = Number(parts[1]) - 1;
            const y = Number(parts[2]);
            if (m === now.getMonth() && y === now.getFullYear()) {
              total += data.amount ?? 0;
            }
          }
        });
        setMonthExpensesTotal(total);
      } catch (error) {
        console.error("Erro ao carregar dados da família:", error);
      }
    }
    loadFamilyData();
  }, [member?.familyId]);

  useEffect(() => {
    if (!member?.familyId) return;
    async function loadTasks() {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, "tasks"), where("familyId", "==", member!.familyId))
        );
        setTasks(
          snap.docs.map((d) => {
            const data = d.data();
            const date =
              data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
            return {
              id: d.id,
              title: data.title,
              date,
              time: data.time,
              description: data.description,
              status: data.status,
              owner: data.owner,
            };
          })
        );
      } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, [member?.familyId]);

  useEffect(() => {
    if (!member?.familyId) return;
    async function loadAppointments() {
      setLoadingAppointments(true);
      try {
        const snap = await getDocs(
          query(collection(db, "appointments"), where("familyId", "==", member!.familyId))
        );
        setAppointments(
          snap.docs.map((d) => {
            const data = d.data();
            const date =
              data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
            return {
              id: d.id,
              doctor: data.doctor,
              specialty: data.specialty,
              date,
              time: data.time,
              description: data.description,
            };
          })
        );
      } catch (error) {
        console.error("Erro ao carregar consultas:", error);
      } finally {
        setLoadingAppointments(false);
      }
    }
    loadAppointments();
  }, [member?.familyId]);

  useEffect(() => {
    if (!member?.familyId) return;
    async function loadFeed() {
      setLoadingFeed(true);
      try {
        const snap = await getDocs(
          query(collection(db, "feed"), where("familyId", "==", member!.familyId))
        );
        setPosts(
          snap.docs.map((d) => {
            const data = d.data();
            const createdAt =
              data.createdAt instanceof Timestamp
                ? data.createdAt.toDate()
                : new Date(data.createdAt);
            return {
              id: d.id,
              title: data.title,
              description: data.description,
              author: data.author,
              createdAt,
            };
          })
        );
      } catch (error) {
        console.error("Erro ao carregar feed:", error);
      } finally {
        setLoadingFeed(false);
      }
    }
    loadFeed();
  }, [member?.familyId]);

  // ── Cálculos dos cards de resumo ──
  const now = new Date();
  const in15 = new Date(now);
  in15.setDate(in15.getDate() + 15);

  const myTasksNext15 = tasks.filter((t) => {
    const isMyTask = t.owner?.id === member?.uid;
    return isMyTask && t.date >= now && t.date <= in15;
  }).length;

  const appointmentsNext15 = appointments.filter(
    (a) => a.date >= now && a.date <= in15
  ).length;

  // ── Handlers do idoso ──
  async function handleSaveElder(data: ModalElderData) {
    if (!member?.familyId) return;
    try {
      await updateDoc(doc(db, "family", member.familyId), { ...data });
      setElder(data);
      setModalElderOpen(false);
    } catch {
      alert("Erro ao salvar dados do idoso");
    }
  }

  // ── Handlers de tarefa ──
  function handleOpenCreateTask() { setEditingTask(null); setModalOpen(true); }
  function handleOpenEdit(task: Task) { setEditingTask(task); setModalOpen(true); }
  function handleCloseModal() { setModalOpen(false); setEditingTask(null); }

  function taskToModalData(task: Task): ModalTaskData {
    return {
      title: task.title,
      date: task.date.toLocaleDateString("pt-BR"),
      time: task.time ?? "",
      description: task.description ?? "",
      status: task.status,
      ownerId: task.owner.id,
    };
  }

  async function handleSave(data: ModalTaskData) {
    if (!member?.familyId) return;
    const ownerMember = familyMembers.find((m) => m.id === data.ownerId);
    if (!ownerMember) return;
    const parts = data.date.split("/");
    const [day, month, year] = parts.map(Number);
    if (parts.length !== 3 || !day || !month || !year || year < 1900) { alert("Data inválida"); return; }
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj.getTime())) { alert("Data inválida"); return; }
    const payload = {
      title: data.title, date: Timestamp.fromDate(dateObj), time: data.time,
      description: data.description, status: data.status, familyId: member.familyId,
      owner: { id: ownerMember.id, firstName: ownerMember.firstName, lastName: ownerMember.lastName },
    };
    try {
      if (editingTask) {
        await updateDoc(doc(db, "tasks", editingTask.id), payload);
        setTasks((prev) => prev.map((t) => t.id === editingTask.id ? { ...t, ...payload, date: dateObj, owner: ownerMember } : t));
      } else {
        const ref = await addDoc(collection(db, "tasks"), payload);
        setTasks((prev) => [...prev, { id: ref.id, title: data.title, date: dateObj, time: data.time, description: data.description, status: data.status, owner: ownerMember }]);
      }
      handleCloseModal();
    } catch { alert("Erro ao salvar tarefa"); }
  }

  async function handleDelete() {
    if (!editingTask) return;
    try {
      await deleteDoc(doc(db, "tasks", editingTask.id));
      setTasks((prev) => prev.filter((t) => t.id !== editingTask.id));
      handleCloseModal();
    } catch { alert("Erro ao deletar tarefa"); }
  }

  // ── Handlers de consulta ──
  function handleOpenCreateAppointment() { setEditingAppointment(null); setModalAppointmentOpen(true); }
  function handleOpenEditAppointment(a: Appointment) { setEditingAppointment(a); setModalAppointmentOpen(true); }
  function handleCloseAppointmentModal() { setModalAppointmentOpen(false); setEditingAppointment(null); }

  function appointmentToModalData(a: Appointment): ModalAppointmentData {
    return { doctor: a.doctor, specialty: a.specialty, date: a.date.toLocaleDateString("pt-BR"), time: a.time ?? "", description: a.description ?? "" };
  }

  async function handleSaveAppointment(data: ModalAppointmentData) {
    if (!member?.familyId) return;
    const parts = data.date.split("/");
    const [day, month, year] = parts.map(Number);
    if (parts.length !== 3 || !day || !month || !year || year < 1900) { alert("Data inválida"); return; }
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj.getTime())) { alert("Data inválida"); return; }
    const payload = { doctor: data.doctor, specialty: data.specialty, date: Timestamp.fromDate(dateObj), time: data.time, description: data.description, familyId: member.familyId };
    try {
      if (editingAppointment) {
        await updateDoc(doc(db, "appointments", editingAppointment.id), payload);
        setAppointments((prev) => prev.map((a) => a.id === editingAppointment.id ? { ...a, ...payload, date: dateObj } : a));
      } else {
        const ref = await addDoc(collection(db, "appointments"), payload);
        setAppointments((prev) => [...prev, { id: ref.id, doctor: data.doctor, specialty: data.specialty, date: dateObj, time: data.time, description: data.description }]);
      }
      handleCloseAppointmentModal();
    } catch { alert("Erro ao salvar consulta"); }
  }

  async function handleDeleteAppointment() {
    if (!editingAppointment) return;
    try {
      await deleteDoc(doc(db, "appointments", editingAppointment.id));
      setAppointments((prev) => prev.filter((a) => a.id !== editingAppointment.id));
      handleCloseAppointmentModal();
    } catch { alert("Erro ao deletar consulta"); }
  }

  // ── Handlers de feed ──
  function handleOpenCreatePost() { setEditingPost(null); setModalFeedOpen(true); }
  function handleOpenEditPost(post: FeedPost) { setEditingPost(post); setModalFeedOpen(true); }
  function handleCloseFeedModal() { setModalFeedOpen(false); setEditingPost(null); }

  function postToModalData(post: FeedPost): ModalFeedData {
    return { title: post.title, description: post.description };
  }

  async function handleSavePost(data: ModalFeedData) {
    if (!member?.familyId || !member) return;
    const payload = {
      title: data.title, description: data.description, familyId: member.familyId,
      author: { id: user!.uid, firstName: member.firstName, lastName: member.lastName },
      createdAt: Timestamp.fromDate(new Date()),
    };
    try {
      if (editingPost) {
        await updateDoc(doc(db, "feed", editingPost.id), { title: data.title, description: data.description });
        setPosts((prev) => prev.map((p) => p.id === editingPost.id ? { ...p, title: data.title, description: data.description } : p));
      } else {
        const ref = await addDoc(collection(db, "feed"), payload);
        setPosts((prev) => [{ id: ref.id, title: data.title, description: data.description, author: { id: user!.uid, firstName: member.firstName, lastName: member.lastName }, createdAt: new Date() }, ...prev]);
      }
      handleCloseFeedModal();
    } catch { alert("Erro ao salvar recado"); }
  }

  async function handleDeletePost() {
    if (!editingPost) return;
    try {
      await deleteDoc(doc(db, "feed", editingPost.id));
      setPosts((prev) => prev.filter((p) => p.id !== editingPost.id));
      handleCloseFeedModal();
    } catch { alert("Erro ao deletar recado"); }
  }

  function handleOpenCreate() {
    if (activeTab === "tasks") handleOpenCreateTask();
    if (activeTab === "appointments") handleOpenCreateAppointment();
    if (activeTab === "feed") handleOpenCreatePost();
  }

  const age = elder ? calcAge(elder.elderBirthDate) : null;

  return (
    <main className={styles.dashboard}>
      {elder && (
        <section className={styles.idosoBanner}>
          {/* Linha superior: avatar + dados + botão editar */}
          <div className={styles.bannerHeader}>
            <Avatar firstName={elder.elderFirstName} lastName={elder.elderLastName} size={5} photoURL={elder.elderPhotoURL} />
            <div className={styles.elderData}>
              <h1 className={styles.elderName}>
                {elder.elderFirstName} {elder.elderLastName}
              </h1>
              <div className={styles.elderMeta}>
                {elder.elderBirthDate && (
                  <span className={styles.metaChip}>
                    🎂 {elder.elderBirthDate}{age !== null ? ` · ${age} anos` : ""}
                  </span>
                )}
                {elder.elderBloodType && (
                  <span className={styles.metaChip}>🩸 {elder.elderBloodType}</span>
                )}
                {elder.elderAddress && (
                  <span className={styles.metaChip}>📍 {elder.elderAddress}</span>
                )}
              </div>
            </div>
            <button className={styles.bannerEdit} onClick={() => setModalElderOpen(true)}>
              Editar
            </button>
          </div>

          {/* Botões de navegação */}
          <div className={styles.pageButtons}>
            <button onClick={() => router.push("/allergy")}>Alergias</button>
            <button onClick={() => router.push("/contacts")}>Contatos</button>
            <button onClick={() => router.push("/medication")}>Medicamentos</button>
          </div>
        </section>
      )}

      {/* Cards de resumo rápido */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>✅</span>
          <div>
            <p className={styles.summaryValue}>{myTasksNext15}</p>
            <p className={styles.summaryLabel}>Suas tarefas nos próximos 15 dias</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>🩺</span>
          <div>
            <p className={styles.summaryValue}>{appointmentsNext15}</p>
            <p className={styles.summaryLabel}>Consultas nos próximos 15 dias</p>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryIcon}>💰</span>
          <div>
            <p className={styles.summaryValue}>{fmt(monthExpensesTotal)}</p>
            <p className={styles.summaryLabel}>Gastos totais este mês</p>
          </div>
        </div>
      </div>

      {/* Abas */}
      <section className={styles.tabs}>
        <div className={styles.tabsHeader}>
          <div className={styles.tabButtons}>
            {(["feed", "tasks", "appointments"] as const).map((tab) => (
              <button
                key={tab}
                className={`${styles.tabBtn} ${activeTab === tab ? styles.tabBtnActive : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === "feed" && "Mural"}
                {tab === "tasks" && "Tarefas"}
                {tab === "appointments" && "Consultas"}
              </button>
            ))}
          </div>
          <button className={styles.addItem} onClick={handleOpenCreate}>
            + {ADD_LABEL[activeTab]}
          </button>
        </div>

        {activeTab === "feed" && (
          <div className={styles.tabsContent}>
            {loadingFeed ? <Loading /> : posts.length === 0 ? (
              <p className={styles.noContent}>Nenhum recado encontrado</p>
            ) : <FeedList posts={posts} onEditPost={handleOpenEditPost} />}
          </div>
        )}
        {activeTab === "tasks" && (
          <div className={styles.tabsContent}>
            {loading ? <Loading /> : tasks.length === 0 ? (
              <p className={styles.noContent}>Nenhuma tarefa encontrada</p>
            ) : <TaskList tasks={tasks} onEditTask={handleOpenEdit} />}
          </div>
        )}
        {activeTab === "appointments" && (
          <div className={styles.tabsContent}>
            {loadingAppointments ? <Loading /> : appointments.length === 0 ? (
              <p className={styles.noContent}>Nenhuma consulta encontrada</p>
            ) : <AppointmentList appointments={appointments} onEditAppointment={handleOpenEditAppointment} />}
          </div>
        )}
      </section>

      <ModalTask
        isOpen={modalOpen}
        initialData={editingTask ? taskToModalData(editingTask) : undefined}
        familyMembers={familyMembers}
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={editingTask ? handleDelete : undefined}
      />
      <ModalAppointment
        isOpen={modalAppointmentOpen}
        initialData={editingAppointment ? appointmentToModalData(editingAppointment) : undefined}
        onClose={handleCloseAppointmentModal}
        onSave={handleSaveAppointment}
        onDelete={editingAppointment ? handleDeleteAppointment : undefined}
      />
      <ModalFeed
        isOpen={modalFeedOpen}
        initialData={editingPost ? postToModalData(editingPost) : undefined}
        onClose={handleCloseFeedModal}
        onSave={handleSavePost}
        onDelete={editingPost ? handleDeletePost : undefined}
      />
      {elder && (
        <ModalElder
          isOpen={modalElderOpen}
          initialData={elder}
          onClose={() => setModalElderOpen(false)}
          onSave={handleSaveElder}
        />
      )}
    </main>
  );
}