"use client";

import styles from "./page.module.css";
import Field from "../components/atoms/Field/Field";
import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/service/firebase";
import Button from "../components/atoms/Button/Button";

export default function Register() {
  const router = useRouter();

  const [step, setStep] = useState(1);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [cellphone, setCellphone] = useState("");

  const [elderFirstName, setElderFirstName] = useState("");
  const [elderLastName, setElderLastName] = useState("");
  const [elderFamilyCode, setElderFamilyCode] = useState("");
  const [elderAddress, setElderAddress] = useState("");
  const [elderBirthDate, setElderBirthDate] = useState("");
  const [elderBloodType, setElderBloodType] = useState("");

  const joiningExisting = elderFamilyCode.trim().length > 0;

  function capitalize(value: string) {
    return value
      .trim().toLowerCase().split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function formatBirthDate(value: string) {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
  }

  function generateFamilyId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 })
      .map(() => chars[Math.floor(Math.random() * chars.length)])
      .join("");
  }

  async function createUniqueFamilyId() {
    while (true) {
      const familyId = generateFamilyId();
      const snap = await getDoc(doc(db, "family", familyId));
      if (!snap.exists()) return familyId;
    }
  }

  function nextStep() {
    if (!firstName || !lastName || !email || !password || !confirmPassword || !cellphone) {
      alert("Preencha todos os campos");
      return;
    }
    if (!email.includes("@")) { alert("Email inválido"); return; }
    if (password !== confirmPassword) { alert("Senhas diferentes"); return; }
    setStep(2);
  }

  async function register() {
    try {
      if (!joiningExisting) {
        if (!elderFirstName || !elderLastName || !elderBirthDate || !elderBloodType) {
          alert("Preencha todos os dados do idoso");
          return;
        }
      }

      const userCredential = await createUserWithEmailAndPassword(
        auth, email.trim().toLowerCase(), password
      );
      const user = userCredential.user;

      let familyId = elderFamilyCode.trim().toUpperCase();

      if (joiningExisting) {
        const familySnap = await getDoc(doc(db, "family", familyId));
        if (!familySnap.exists()) { alert("Código de família não encontrado."); return; }
      } else {
        familyId = await createUniqueFamilyId();
      }

      const batch = writeBatch(db);

      batch.set(doc(db, "member", user.uid), {
        firstName: capitalize(firstName),
        lastName: capitalize(lastName),
        email: email.trim().toLowerCase(),
        cellphone,
        familyId,
        isAdmin: !joiningExisting,
        isActive: true,
      });

      if (!joiningExisting) {
        batch.set(doc(db, "family", familyId), {
          elderFirstName: capitalize(elderFirstName),
          elderLastName: capitalize(elderLastName),
          elderAddress: capitalize(elderAddress),
          elderBirthDate,
          elderBloodType,
          familyId,
        });
      }

      await batch.commit();
      alert("Usuário criado com sucesso");
      router.push("/login");
    } catch (error) {
      console.error(error);
      alert("Erro ao cadastrar");
    }
  }

  return (
    <main className={styles.main}>
      <div className={`${styles.container} ${step === 2 ? styles.containerWide : ""}`}>

        {/* Indicador de steps */}
        <div className={styles.stepIndicator}>
          <div
            className={`${styles.step} ${step === 1 ? styles.stepActive : styles.stepDone} ${step === 2 ? styles.stepClickable : ""}`}
            onClick={() => step === 2 && setStep(1)}
            title={step === 2 ? "Voltar ao passo 1" : undefined}
          >
            <p className={styles.stepNumber}>1</p>
          </div>
          <p>——</p>
          <div className={`${styles.step} ${step === 2 ? styles.stepActive : styles.stepInactive}`}>
            <p className={styles.stepNumber}>2</p>
          </div>
        </div>

        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <h1 className={styles.title}>Criar conta</h1>
            <p className={styles.subtitle}>Preencha seus dados para começar</p>
            <div className={styles.form}>
              <div className={styles.name}>
                <Field
                  label="Nome *"
                  placeholder="João"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
                />
                <Field
                  label="Sobrenome *"
                  placeholder="Silva"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
                />
              </div>
              <Field
                label="Email *"
                placeholder="joao@email.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Field
                label="Celular *"
                placeholder="11 99999-9999"
                type="tel"
                value={cellphone}
                onChange={(e) => setCellphone(e.target.value)}
              />
              <Field
                label="Senha *"
                placeholder="••••••••"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Field
                label="Confirmar senha *"
                placeholder="••••••••"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Button onClick={nextStep}>Continuar</Button>
              <p className={styles.loginRedirect}>
                Já tem conta?{" "}
                <span className={styles.highlight} onClick={() => router.push("/login")}>
                  Fazer login
                </span>
              </p>
            </div>
          </>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <>
            <div className={styles.stepHeader}>
              <button className={styles.backBtn} onClick={() => setStep(1)}>← Voltar</button>
              <h1 className={styles.title}>Família</h1>
            </div>

            <div className={styles.familyChoice}>
              {/* Card: entrar em família existente */}
              <div className={styles.familyCard}>
                <h2>Já possui uma família?</h2>
                <p>Entre com o código de convite.</p>
                <Field
                  label="Código da família"
                  placeholder="ABC123"
                  value={elderFamilyCode}
                  onChange={(e) => setElderFamilyCode(e.target.value.toUpperCase())}
                />
              </div>

              <div className={styles.divider} />

              {/* Card: criar nova família */}
              <div className={styles.familyCard}>
                <h2>Ainda não possui uma família?</h2>
                <p>Crie uma nova e adicione os dados da pessoa cuidada.</p>

                {!joiningExisting && (
                  <>
                    <div className={styles.name}>
                      <Field
                        label="Nome *"
                        placeholder="Maria"
                        value={elderFirstName}
                        onChange={(e) => setElderFirstName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
                      />
                      <Field
                        label="Sobrenome *"
                        placeholder="Silva"
                        value={elderLastName}
                        onChange={(e) => setElderLastName(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
                      />
                    </div>
                    <Field
                      label="Endereço"
                      placeholder="Rua das Flores, 123"
                      value={elderAddress}
                      onChange={(e) => setElderAddress(e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1))}
                    />
                    <Field
                      label="Data de nascimento *"
                      placeholder="DD/MM/AAAA"
                      value={elderBirthDate}
                      onChange={(e) => setElderBirthDate(formatBirthDate(e.target.value))}
                    />
                    <div className={styles.selectContainer}>
                      <label>Tipo sanguíneo *</label>
                      <select
                        value={elderBloodType}
                        onChange={(e) => setElderBloodType(e.target.value)}
                        className={styles.select}
                      >
                        <option value="">Selecione</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Button onClick={register}>Criar conta</Button>
          </>
        )}
      </div>
    </main>
  );
}