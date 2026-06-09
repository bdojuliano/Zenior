import Avatar from "../../atoms/Avatar/Avatar";
import styles from "./FeedItem.module.css";

type FeedItemProps = {
  title: string;
  description: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    photoURL?: string;
  };
  createdAt: Date;
  onEdit: () => void;
};

export default function FeedItem({
  title, description,
  author: { firstName, lastName, photoURL },
  createdAt,
  onEdit,
}: FeedItemProps) {
  return (
    <div className={styles.container} onClick={onEdit} role="button" tabIndex={0}>
      <div className={styles.header}>
        <Avatar firstName={firstName} lastName={lastName} size={2.25} photoURL={photoURL} />
        <div className={styles.authorBlock}>
          <p className={styles.authorName}>{firstName} {lastName}</p>
          <p className={styles.date}>{createdAt.toLocaleDateString("pt-BR")}</p>
        </div>
      </div>

      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        <p className={styles.text}>{description}</p>
      </div>
    </div>
  );
}