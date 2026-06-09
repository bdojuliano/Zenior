"use client";

import styles from "./page.module.css";
import Button from "../components/atoms/Button/Button";
import Field from "../components/atoms/Field/Field";
import { useState } from "react";
import {signInWithEmailAndPassword,sendPasswordResetEmail} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/service/firebase";

export default function Login() {
  const router = useRouter();
  const [view, setView] = useState<"login" | "reset">("login");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [message, setMessage] = useState("");

  async function entrar() {
    try {
      setInvalidCredentials(false);

      await signInWithEmailAndPassword(auth,email,senha);
      router.push("/dashboard");
    } catch {
      setInvalidCredentials(true);
    }
  }

  async function resetPassword() {
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Email enviado");
    } catch {
      setMessage("Erro ao enviar email");
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {view === "login" ? (
          <>
            <span className={styles.tag}>—— Bem-vindo de volta</span>
            <h1 className={styles.title}>Entre na sua conta</h1>
            <section className={styles.fields}>
              <Field
                label="Email *"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />
              <Field
                label="Senha *"
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) =>
                  setSenha(e.target.value)
                }
              />
              <div className={styles.forgotRow}>
                {invalidCredentials && (
                  <span className={styles.invalid}>Credenciais inválidas</span>
                )}
                <button
                  type="button"
                  className={styles.forgotLink}
                  onClick={() => {
                    setMessage("");
                    setView("reset");
                  }}
                >
                  Esqueci minha senha
                </button>
              </div>
            </section>
            <Button onClick={entrar}>
              Entrar
            </Button>
            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span className={styles.dividerText}>
                ou
              </span>
              <div className={styles.dividerLine} />
            </div>

            <p className={styles.password}>
              Não tem conta?{" "}
              <span className={styles.highlight} onClick={() =>router.push("/register")}>
                Criar conta
              </span>
            </p>
          </>
        ) : (
          <>
            <div className={styles.resetTag}>
              <span className={styles.tag}>
                —— Recuperação de senha
              </span>
              <button
                type="button"
                className={styles.backButton}
                onClick={() => {
                  setMessage("");
                  setView("login");
                }}
              >
               Voltar
              </button>
            </div>
            <div className={styles.header}>
              <h1 className={styles.title}>
                Redefinir senha
              </h1>
            </div>

            <section className={styles.fields}>
              <Field
                label="Email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              {message && (
                <span className={styles.message}>{message}</span>
              )}
            </section>

            <Button onClick={resetPassword}>Enviar email</Button>
          </>
        )}
      </div>
    </main>
  );
}