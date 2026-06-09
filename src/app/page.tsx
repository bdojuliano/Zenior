"use client"
import styles from "./page.module.css";
import Button from "./components/atoms/Button/Button";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className={styles.hero}>
      <section className={styles.left}>
        <div>
        <h2 className={styles.uppertittle}>—— Cuidado coloborativo</h2>  
        </div>
        <h1 className={styles.tittle}>Porque cuidar não precisa ser <span className={styles.highlight}>solitário</span></h1>
        <p className={styles.context}>Reúna sua família, organize tarefas, consultas, medicamentos e finanças 
          do cuidado do seu familiar idoso — tudo em um só lugar.</p>
          <div className={styles.button}>
            <Button onClick={() => router.push("/login")}>Entrar</Button>
            <Button onClick={() => router.push("/register")}>Cadastrar-se</Button> 
          </div>
      </section>
      <section className={styles.right}>
        <img className={styles.img} src="hero.svg" alt="Família" />
      </section>
    </div>
  );
}