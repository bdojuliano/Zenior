"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./Header.module.css";
import Avatar from "../../atoms/Avatar/Avatar";

export default function Header() {
  const pathname = usePathname();
  const { member, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const hiddenPages = ["/", "/restricted", "/login", "/register"];
  const showNav = !hiddenPages.includes(pathname);

  function closeMenu() { setMenuOpen(false); }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.logo}>Zênior</div>

        {showNav && !loading && member && (
          <>
            {/* Nav desktop — só os 3 links */}
            <nav className={styles.nav}>
              <Link href="/dashboard" className={pathname === "/dashboard" ? styles.active : ""}>
                Dashboard
              </Link>
              <Link href="/expenses" className={pathname === "/expenses" ? styles.active : ""}>
                Financeiro
              </Link>
              <Link href="/members" className={pathname === "/members" ? styles.active : ""}>
                Membros
              </Link>
            </nav>

            {/* Avatar sozinho à direita — desktop */}
            <Link href="/profile" className={styles.avatarLink}>
              <Avatar firstName={member.firstName} lastName={member.lastName} size={2.25} variant="header" />
            </Link>

            {/* Botão hamburguer — mobile */}
            <button
              className={`${styles.menuBtn} ${menuOpen ? styles.open : ""}`}
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
            >
              <span />
              <span />
              <span />
            </button>
          </>
        )}
      </header>

      {/* Drawer mobile */}
      {showNav && !loading && member && (
        <div className={`${styles.drawer} ${menuOpen ? styles.open : ""}`}>
          <div className={styles.drawerOverlay} onClick={closeMenu} />
          <div className={styles.drawerPanel}>
            {/* Links no topo */}
            <div className={styles.drawerNav}>
              <Link href="/dashboard" className={pathname === "/dashboard" ? styles.active : ""} onClick={closeMenu}>
                Dashboard
              </Link>
              <Link href="/expenses" className={pathname === "/expenses" ? styles.active : ""} onClick={closeMenu}>
                Financeiro
              </Link>
              <Link href="/members" className={pathname === "/members" ? styles.active : ""} onClick={closeMenu}>
                Membros
              </Link>
            </div>

            {/* Perfil no rodapé do drawer */}
            <Link
              href="/profile"
              className={`${styles.drawerProfile} ${pathname === "/profile" ? styles.active : ""}`}
              onClick={closeMenu}
            >
              <Avatar firstName={member.firstName} lastName={member.lastName} size={2.25} variant="header" />
              Meu perfil
            </Link>
          </div>
        </div>
      )}
    </>
  );
}