import styles from "./MemberItem.module.css";
import Avatar from "../../atoms/Avatar/Avatar";

type MemberItemProps = {
  firstName: string;
  lastName: string;
  email: string;
  photoURL?: string;
  isAdmin: boolean;
  isActive: boolean;
  isSelf: boolean;
  canManage: boolean;
  onToggleActive: () => void;
  onMakeAdmin: () => void;
  onRemoveAdmin: () => void;
};

export default function MemberItem({
  firstName, lastName, email, photoURL,
  isAdmin, isActive, isSelf, canManage,
  onToggleActive, onMakeAdmin, onRemoveAdmin,
}: MemberItemProps) {
  return (
    <div className={`${styles.container} ${!isActive ? styles.inactive : ""}`}>
      <Avatar firstName={firstName} lastName={lastName} photoURL={photoURL} />

      <div className={styles.info}>
        <p className={styles.name}>
          {firstName} {lastName}
          {isAdmin && <span className={styles.adminBadge}>Admin</span>}
          {isSelf && <span className={styles.selfBadge}>Você</span>}
        </p>
        <p className={styles.email}>{email}</p>
        {!isActive && <p className={styles.inactiveLabel}>Desativado</p>}
      </div>

      {canManage && !isSelf && (
        <div className={styles.actions}>
          {isAdmin ? (
            <button className={styles.removeAdminBtn} onClick={onRemoveAdmin}>
              Remover admin
            </button>
          ) : (
            <button className={styles.adminBtn} onClick={onMakeAdmin}>
              Tornar admin
            </button>
          )}
          <button
            className={`${styles.toggleBtn} ${!isActive ? styles.activateBtn : styles.deactivateBtn}`}
            onClick={onToggleActive}
          >
            {isActive ? "Desativar" : "Reativar"}
          </button>
        </div>
      )}
    </div>
  );
}