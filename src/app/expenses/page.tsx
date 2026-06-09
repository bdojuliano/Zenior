"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/service/firebase";
import { useAuth } from "@/contexts/AuthContext";
import Loading from "../components/atoms/Loading/Loading";
import ExpenseItem, { TAGS, type Tag } from "../components/molecules/ExpenseItem/ExpenseItem";
import ModalExpense, { type ModalExpenseData } from "../components/molecules/ModalExpense/ModalExpense";
import styles from "./page.module.css";

type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  tag: Tag;
  sourceType: "pension" | "member" | "reserve";
  sourceMemberId: string;
  sourceName: string;
};

type FamilyMember = {
  id: string;
  firstName: string;
  lastName: string;
};

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function fmt(n: number) {
  return `R$ ${n.toFixed(2).replace(".", ",")}`;
}

function getSourceName(
  sourceType: "pension" | "member" | "reserve",
  sourceMemberId: string,
  members: FamilyMember[]
): string {
  if (sourceType === "pension") return "Aposentadoria";
  if (sourceType === "reserve") return "Reserva financeira";
  const m = members.find((x) => x.id === sourceMemberId);
  return m ? `${m.firstName} ${m.lastName}` : "Membro";
}

export default function Expenses() {
  const { member } = useAuth();

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [pensionIncome, setPensionIncome] = useState(0);
  const [financialReserve, setFinancialReserve] = useState(0);
  const [editingFinance, setEditingFinance] = useState(false);
  const [pensionInput, setPensionInput] = useState("");
  const [reserveInput, setReserveInput] = useState("");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const now = new Date();
  const [filterMonth, setFilterMonth] = useState<number | null>(now.getMonth());
  const [filterYear, setFilterYear] = useState<number | null>(now.getFullYear());
  const [filterTag, setFilterTag] = useState<Tag | "Todas">("Todas");
  const [filterSource, setFilterSource] = useState<"Todas" | "pension" | "member" | "reserve">("Todas");

  useEffect(() => {
    if (!member?.familyId) return;
    async function load() {
      try {
        const membersSnap = await getDocs(
          query(collection(db, "member"), where("familyId", "==", member!.familyId))
        );
        const members: FamilyMember[] = membersSnap.docs.map((d) => ({
          id: d.id,
          firstName: d.data().firstName,
          lastName: d.data().lastName,
        }));
        setFamilyMembers(members);

        const familySnap = await getDoc(doc(db, "family", member!.familyId));
        if (familySnap.exists()) {
          const fd = familySnap.data();
          const pi = fd.pensionIncome ?? 0;
          const fr = fd.financialReserve ?? 0;
          setPensionIncome(pi);
          setFinancialReserve(fr);
          setPensionInput(String(pi));
          setReserveInput(String(fr));
        }

        const expSnap = await getDocs(
          query(collection(db, "expenses"), where("familyId", "==", member!.familyId))
        );
        const loaded: Expense[] = expSnap.docs.map((d) => {
          const data = d.data();
          const sourceType = data.sourceType as "pension" | "member" | "reserve";
          return {
            id: d.id,
            description: data.description,
            amount: data.amount,
            date: data.date,
            tag: data.tag,
            sourceType,
            sourceMemberId: data.sourceMemberId ?? "",
            sourceName: getSourceName(sourceType, data.sourceMemberId ?? "", members),
          };
        });
        setExpenses(loaded);
      } catch (error) {
        console.error("Erro ao carregar finanças:", error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [member?.familyId]);

  async function handleSaveFinance() {
    if (!member?.familyId) return;
    const pi = parseFloat(pensionInput.replace(",", "."));
    const fr = parseFloat(reserveInput.replace(",", "."));
    if (isNaN(pi) || isNaN(fr)) { alert("Valores inválidos"); return; }
    try {
      await updateDoc(doc(db, "family", member.familyId), { pensionIncome: pi, financialReserve: fr });
      setPensionIncome(pi);
      setFinancialReserve(fr);
      setEditingFinance(false);
    } catch {
      alert("Erro ao salvar");
    }
  }

  const showingAll = filterMonth === null || filterYear === null;

  const filtered = expenses.filter((e) => {
    const [, m, y] = e.date.split("/").map(Number);
    const periodMatch = showingAll || (m - 1 === filterMonth && y === filterYear);
    return (
      periodMatch &&
      (filterTag === "Todas" || e.tag === filterTag) &&
      (filterSource === "Todas" || e.sourceType === filterSource)
    );
  });

  const totalMembers  = filtered.filter((e) => e.sourceType === "member").reduce((s, e) => s + e.amount, 0);
  const totalPension  = filtered.filter((e) => e.sourceType === "pension").reduce((s, e) => s + e.amount, 0);

  const totalReserveUsed = expenses.filter((e) => e.sourceType === "reserve").reduce((s, e) => s + e.amount, 0);
  const totalPensionUsed = expenses.filter((e) => e.sourceType === "pension").reduce((s, e) => s + e.amount, 0);

  function handleOpenCreate() { setEditingExpense(null); setModalOpen(true); }
  function handleOpenEdit(exp: Expense) { setEditingExpense(exp); setModalOpen(true); }
  function handleCloseModal() { setModalOpen(false); setEditingExpense(null); }

  function expenseToModalData(exp: Expense): ModalExpenseData {
    return {
      description: exp.description,
      amount: String(exp.amount),
      date: exp.date,
      tag: exp.tag,
      sourceType: exp.sourceType,
      sourceMemberId: exp.sourceMemberId,
    };
  }

  async function handleSave(data: ModalExpenseData) {
    if (!member?.familyId) return;
    const amount = parseFloat(data.amount.replace(",", "."));
    const sourceName = getSourceName(data.sourceType, data.sourceMemberId, familyMembers);
    const payload = {
      description: data.description,
      amount,
      date: data.date,
      tag: data.tag,
      sourceType: data.sourceType,
      sourceMemberId: data.sourceMemberId,
      familyId: member.familyId,
    };
    try {
      if (editingExpense) {
        await updateDoc(doc(db, "expenses", editingExpense.id), payload);
        setExpenses((prev) =>
          prev.map((e) => e.id === editingExpense.id ? { ...e, ...payload, sourceName } : e)
        );
      } else {
        const ref = await addDoc(collection(db, "expenses"), payload);
        setExpenses((prev) => [...prev, { id: ref.id, ...payload, sourceName }]);
      }
      handleCloseModal();
    } catch {
      alert("Erro ao salvar despesa");
    }
  }

  async function handleDelete() {
    if (!editingExpense) return;
    try {
      await deleteDoc(doc(db, "expenses", editingExpense.id));
      setExpenses((prev) => prev.filter((e) => e.id !== editingExpense.id));
      handleCloseModal();
    } catch {
      alert("Erro ao deletar despesa");
    }
  }

  const years = Array.from(
    new Set(expenses.map((e) => Number(e.date.split("/")[2])))
  ).sort((a, b) => b - a);
  if (!years.includes(now.getFullYear())) years.unshift(now.getFullYear());

  const reservePct = financialReserve > 0 ? Math.min((totalReserveUsed / financialReserve) * 100, 100) : 0;
  const reserveDanger = financialReserve > 0 && totalReserveUsed / financialReserve > 0.8;

  const pensionPct = pensionIncome > 0 ? Math.min((totalPensionUsed / pensionIncome) * 100, 100) : 0;
  const pensionDanger = pensionIncome > 0 && totalPensionUsed / pensionIncome > 0.9;

  const periodLabel = showingAll
    ? "todas as despesas"
    : `${MONTHS[filterMonth!].toLowerCase()} / ${filterYear}`;

  return (
    <main className={styles.page}>
      <div className={styles.pageHeader}>
        {member?.isAdmin ? (
          <button
            className={styles.configBtn}
            onClick={() => setEditingFinance((v) => !v)}
          >
            {editingFinance ? "Fechar configurações" : "Renda e reserva"}
          </button>
        ) : (
          <div />
        )}
      </div>

      {member?.isAdmin && editingFinance && (
        <div className={styles.financeForm}>
          <div className={styles.financeFields}>
            <div className={styles.financeField}>
              <label className={styles.financeLabel}>Renda da aposentadoria (R$)</label>
              <input
                className={styles.financeInput}
                value={pensionInput}
                onChange={(e) => setPensionInput(e.target.value)}
                placeholder="Ex: 800"
              />
            </div>
            <div className={styles.financeField}>
              <label className={styles.financeLabel}>Reserva financeira total (R$)</label>
              <input
                className={styles.financeInput}
                value={reserveInput}
                onChange={(e) => setReserveInput(e.target.value)}
                placeholder="Ex: 5000"
              />
            </div>
          </div>
          <div className={styles.financeActions}>
            <button className={styles.cancelBtn} onClick={() => setEditingFinance(false)}>Cancelar</button>
            <button className={styles.saveBtn} onClick={handleSaveFinance}>Salvar</button>
          </div>
        </div>
      )}

      <div className={styles.cards}>
        <div className={`${styles.summaryCard} ${styles.summaryCardFull}`}>
          <p className={styles.cardLabel}>Reserva financeira</p>
          <p className={styles.cardValue}>{fmt(totalReserveUsed)}</p>
          <p className={styles.cardSub}>gastos de {fmt(financialReserve)} no total</p>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${reserveDanger ? styles.progressDanger : ""}`}
              style={{ width: `${reservePct}%` }}
            />
          </div>
          <span className={styles.reserveNote}>Acumulado — não reinicia todo mês</span>
        </div>

        <div className={styles.summaryCard}>
          <p className={styles.cardLabel}>Membros</p>
          <p className={styles.cardValue}>{fmt(totalMembers)}</p>
          <p className={styles.cardSub}>em {periodLabel}</p>
        </div>

        <div className={styles.summaryCard}>
          <p className={styles.cardLabel}>Aposentadoria</p>
          <p className={styles.cardValue}>{fmt(totalPension)}</p>
          <p className={styles.cardSub}>de {fmt(pensionIncome)} · {periodLabel}</p>
          <div className={styles.progressBar}>
            <div
              className={`${styles.progressFill} ${pensionDanger ? styles.progressDanger : ""}`}
              style={{ width: `${pensionPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterPeriod}>
          <select
            className={styles.filterPeriodSelect}
            value={filterMonth ?? "all"}
            onChange={(e) => {
              const v = e.target.value;
              if (v === "all") { setFilterMonth(null); setFilterYear(null); }
              else { setFilterMonth(Number(v)); if (filterYear === null) setFilterYear(now.getFullYear()); }
            }}
          >
            <option value="all">Todas</option>
            {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>
          {!showingAll && (
            <>
              <span className={styles.filterPeriodSep}>/</span>
              <select
                className={styles.filterPeriodSelect}
                value={filterYear ?? now.getFullYear()}
                onChange={(e) => setFilterYear(Number(e.target.value))}
              >
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
        </div>

        <select
          className={styles.filterSelect}
          value={filterTag}
          onChange={(e) => setFilterTag(e.target.value as Tag | "Todas")}
        >
          <option value="Todas">Categoria</option>
          {TAGS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        <select
          className={styles.filterSelect}
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value as "Todas" | "pension" | "member" | "reserve")}
        >
          <option value="Todas">Fonte</option>
          <option value="pension">Aposentadoria</option>
          <option value="reserve">Reserva financeira</option>
          <option value="member">Membros</option>
        </select>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Despesas</h2>
          <button className={styles.addBtn} onClick={handleOpenCreate}>
            + Nova despesa
          </button>
        </div>
        <div className={styles.list}>
          {loading ? (
            <Loading />
          ) : filtered.length === 0 ? (
            <p className={styles.empty}>Nenhuma despesa encontrada</p>
          ) : (
            filtered.map((exp) => (
              <ExpenseItem
                key={exp.id}
                description={exp.description}
                amount={exp.amount}
                date={exp.date}
                tag={exp.tag}
                source={exp.sourceName}
                onEdit={() => handleOpenEdit(exp)}
              />
            ))
          )}
        </div>
      </div>

      <ModalExpense
        isOpen={modalOpen}
        initialData={editingExpense ? expenseToModalData(editingExpense) : undefined}
        familyMembers={familyMembers}
        onClose={handleCloseModal}
        onSave={handleSave}
        onDelete={editingExpense ? handleDelete : undefined}
      />
    </main>
  );
}