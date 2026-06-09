"use client";

import styles from "./page.module.css";
import { useRouter } from "next/navigation";

export default function Restricted() {
  const router = useRouter();

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <p className={styles.icon}>🔒</p>
        <h1 className={styles.title}>Acesso restrito</h1>
        <p className={styles.description}>
          Sua conta foi desativada. Entre em contato com um administrador da família para reativar o acesso.
        </p>
        <button className={styles.backBtn} onClick={() => router.push("/login")}>
          Voltar ao login
        </button>
      </div>
    </main>
  );
}