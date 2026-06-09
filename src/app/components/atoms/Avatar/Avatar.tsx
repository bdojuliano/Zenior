"use client";

import styles from "./Avatar.module.css";
import { useAuth } from "@/contexts/AuthContext";

type AvatarProps = {
  firstName: string;
  lastName: string;
  size?: number;
  variant?: "default" | "header";
  photoURL?: string;
};

export default function Avatar({
  firstName,
  lastName,
  size = 3,
  variant = "default",
  photoURL,
}: AvatarProps) {
  // Opção B: se não veio photoURL como prop, tenta pegar do usuário logado
  const { member } = useAuth();
  const isSelf =
    member?.firstName === firstName && member?.lastName === lastName;
  const resolvedPhoto = photoURL ?? (isSelf ? member?.photoURL : undefined);

  const initials =
    firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase();

  if (resolvedPhoto) {
    return (
      <div
        className={styles.avatar}
        style={{ width: `${size}rem`, height: `${size}rem` }}
      >
        <img
          src={resolvedPhoto}
          alt={`${firstName} ${lastName}`}
          className={styles.photo}
        />
      </div>
    );
  }

  return (
    <div
      className={`${styles.avatar} ${styles[variant]}`}
      style={{
        width: `${size}rem`,
        height: `${size}rem`,
        fontSize: `${size * 0.45}rem`,
      }}
    >
      {initials}
    </div>
  );
}